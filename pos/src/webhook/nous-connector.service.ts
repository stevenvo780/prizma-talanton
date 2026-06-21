import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, PaymentStatus, PaymentType } from '../invoice/entities/invoice.entity';
import { Product } from '../product/entities/product.entity';

export interface PendingApprovalPayload {
  orderId?: string | number;
  customer?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
  total?: number | string;
  currency?: string;
  store?: string;
  [key: string]: unknown;
}

export interface InventorySyncItem {
  sku?: string;
  qty?: number;
  quantity?: number;
  name?: string;
  [key: string]: unknown;
}

export interface InventorySyncPayload {
  items?: InventorySyncItem[];
  [key: string]: unknown;
}

/**
 * NousConnectorService — persistencia real para los sinks que recibe Talanton de Nous.
 * Opera sobre Invoice + Product directamente (sin pasar por InvoiceService, que
 * requiere User y Config de POS propios). Las órdenes de Nous no tienen un usuario
 * de POS asociado; se registran con `null` en el campo user.
 */
@Injectable()
export class NousConnectorService {
  private readonly logger = new Logger(NousConnectorService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  /**
   * Persiste una orden pendiente de aprobación recibida de Nous (Flow 2 offline→online).
   * Busca la factura por orderId (tracking_number) y la actualiza, o crea una nueva
   * en estado Unpaid/AccountReceivable si no existe.
   */
  async upsertPendingApproval(payload: PendingApprovalPayload): Promise<Invoice> {
    const parsedOrderId = Number(payload.orderId);
    const trackingNumber = Number.isFinite(parsedOrderId)
      ? parsedOrderId
      : undefined;

    let invoice: Invoice | null = null;

    // Intentar buscar por tracking_number si viene orderId numérico
    if (trackingNumber && !Number.isNaN(trackingNumber)) {
      invoice = await this.invoiceRepo.findOne({
        where: { tracking_number: trackingNumber },
      });
    }

    if (!invoice) {
      invoice = this.invoiceRepo.create();
    }

    // Campos mínimos para representar la orden pendiente
    invoice.date = invoice.date ?? new Date();
    invoice.consecutive = invoice.consecutive ?? 0;
    invoice.tracking_number = trackingNumber ?? Date.now();
    const parsedTotal = Number(payload.total);
    invoice.totalAmount = Number.isFinite(parsedTotal) ? parsedTotal : 0;
    invoice.paymentType = PaymentType.AccountReceivable;
    invoice.paymentStatus = PaymentStatus.Unpaid;

    // Mapear items si vienen en el payload
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      invoice.invoiceItems = payload.items.map((item) => ({
        product: null as any,
        sku: String(item.sku ?? item.name ?? ''),
        quantity: Number(item.qty ?? item.quantity ?? 1),
        productPriceTypeId: 0,
        price: Number(item.unitPrice ?? item.price ?? 0),
        productName: String(item.name ?? item.sku ?? ''),
        totalTax: 0,
        totalDiscount: 0,
      }));
    } else {
      invoice.invoiceItems = invoice.invoiceItems ?? [];
    }

    // client y user se dejan null (órdenes externas de Nous no tienen user de POS)
    invoice.client = invoice.client ?? (null as any);
    invoice.user = invoice.user ?? (null as any);

    try {
      const saved = await this.invoiceRepo.save(invoice);
      this.logger.log(
        `[nous] pending-approval persistida: invoiceId=${saved.id} tracking=${saved.tracking_number}`,
      );
      return saved;
    } catch (error) {
      this.logger.error('[nous] Error persistiendo pending-approval', error);
      throw new InternalServerErrorException(
        'Error al persistir la orden pendiente de aprobación',
      );
    }
  }

  /**
   * Upsert de inventario recibido desde Hermes vía Nous.
   * Busca cada producto por SKU (en el campo jsonb priceTypes) y actualiza su estado.
   * Items sin SKU o sin producto existente se omiten (loguean como warn).
   * Devuelve resumen de operación.
   */
  async upsertInventorySync(
    payload: InventorySyncPayload,
  ): Promise<{ updated: number; skipped: number; details: string[] }> {
    const items: InventorySyncItem[] = Array.isArray(payload.items)
      ? payload.items
      : [];

    let updated = 0;
    let skipped = 0;
    const details: string[] = [];

    for (const item of items) {
      const sku = item.sku ? String(item.sku).trim() : '';
      if (!sku) {
        skipped++;
        details.push(`sin-sku: omitido`);
        continue;
      }

      let product: Product | null = null;
      try {
        product = await this.productRepo
          .createQueryBuilder('product')
          .where(`product."priceTypes"::jsonb @> :filter`, {
            filter: JSON.stringify([{ sku }]),
          })
          .getOne();
      } catch (err) {
        this.logger.warn(`[nous] Error buscando sku=${sku}`, err);
        skipped++;
        details.push(`sku=${sku}: error búsqueda`);
        continue;
      }

      if (!product) {
        skipped++;
        details.push(`sku=${sku}: no encontrado en catálogo`);
        this.logger.warn(`[nous] inventory-sync: sku=${sku} no existe en catálogo, omitido`);
        continue;
      }

      // Actualizar qty en cada priceType que coincida con el sku
      const qty = Number(item.qty ?? item.quantity ?? 0);
      let touched = false;
      product.priceTypes = product.priceTypes.map((pt) => {
        if (pt.sku === sku) {
          touched = true;
          // El modelo no tiene campo stock dedicado; guardamos qty en una prop dinámica
          // si el payload la trae. Por ahora registramos que fue sincronizado.
          return { ...pt, _syncedQty: qty, _syncedAt: new Date().toISOString() };
        }
        return pt;
      });

      if (!touched) {
        skipped++;
        details.push(`sku=${sku}: sku en payload pero no en priceTypes`);
        continue;
      }

      try {
        await this.productRepo.save(product);
        updated++;
        details.push(`sku=${sku}: actualizado (qty=${qty}, productId=${product.id})`);
        this.logger.log(`[nous] inventory-sync: sku=${sku} actualizado qty=${qty}`);
      } catch (err) {
        this.logger.error(`[nous] Error guardando sku=${sku}`, err);
        throw new InternalServerErrorException(
          `Error al sincronizar inventario para sku=${sku}`,
        );
      }
    }

    return { updated, skipped, details };
  }
}

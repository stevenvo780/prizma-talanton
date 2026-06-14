import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DianInvoice,
  DianElectronicStatus,
  DianDocumentType,
} from './entities/dian-invoice.entity';
import {
  EmitDianInvoiceDto,
  EmitDianInvoiceFreeDto,
  EmitCreditNoteDto,
  ConfigureDianProviderDto,
} from './dto/dian-invoice.dto';
import {
  IDianProvider,
  DianProviderInvoiceInput,
  DianProviderCreditNoteInput,
  DianStampStatus,
} from './providers/dian-provider.interface';
import { AlegraProvider } from './providers/alegra/alegra.provider';
import { Invoice } from '../invoice/entities/invoice.entity';
import { User } from '../user/entities/user.entity';
import { Profile } from '../profile/entities/profile.entity';

@Injectable()
export class DianInvoiceService {
  private readonly logger = new Logger(DianInvoiceService.name);

  constructor(
    @InjectRepository(DianInvoice)
    private dianInvoiceRepository: Repository<DianInvoice>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  // ─── Obtener provider inicializado ───────────────────────────

  private async getProvider(userId: string): Promise<IDianProvider> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile?.dianConfig) {
      throw new BadRequestException(
        'No se han configurado las credenciales del proveedor de facturación electrónica. ' +
          'Use el endpoint POST /dian-invoice/configure para configurarlas.',
      );
    }

    const config = profile.dianConfig;

    if (config.providerName === 'alegra') {
      const provider = new AlegraProvider();
      provider.initialize({
        email: config.email,
        token: config.token,
        baseUrl: config.baseUrl,
      });
      return provider;
    }

    throw new BadRequestException(
      `Proveedor "${config.providerName}" no soportado. Proveedores disponibles: alegra`,
    );
  }

  // ─── Configurar Proveedor ────────────────────────────────────

  async configureProvider(dto: ConfigureDianProviderDto, user: User) {
    let profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (!profile) {
      profile = new Profile();
      profile.user = user;
    }

    profile.dianConfig = {
      providerName: dto.providerName,
      email: dto.email,
      token: dto.token,
    };

    await this.profileRepository.save(profile);

    // Validar credenciales
    const provider = await this.getProvider(user.id);
    const isValid = await provider.validateCredentials();

    if (!isValid) {
      // Revertir
      profile.dianConfig = null;
      await this.profileRepository.save(profile);
      throw new BadRequestException(
        'Las credenciales proporcionadas no son válidas. Verifique el email y token del proveedor.',
      );
    }

    return {
      message: 'Proveedor de facturación electrónica configurado correctamente',
      providerName: dto.providerName,
      valid: true,
    };
  }

  // ─── Emitir Factura Electrónica desde factura POS ────────────

  async emitFromInvoice(dto: EmitDianInvoiceDto, user: User) {
    const provider = await this.getProvider(user.id);

    // Cargar factura del POS
    const invoice = await this.invoiceRepository.findOne({
      where: { id: dto.invoiceId, user: { id: user.id } },
      relations: ['client'],
    });

    if (!invoice) {
      throw new NotFoundException(`Factura #${dto.invoiceId} no encontrada`);
    }

    // Verificar que no se haya emitido ya
    const existing = await this.dianInvoiceRepository.findOne({
      where: {
        invoice: { id: invoice.id },
        documentType: DianDocumentType.FACTURA_VENTA,
        dianStatus: DianElectronicStatus.STAMPED,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `La factura #${invoice.id} ya fue emitida electrónicamente. ` +
          `CUFE: ${existing.cufe}. Documento: ${existing.documentNumber}`,
      );
    }

    // Mapear datos de la factura POS al formato del proveedor
    const input: DianProviderInvoiceInput = {
      date: this.formatDate(invoice.date),
      client: {
        name: invoice.client?.name || 'Consumidor Final',
        surname: invoice.client?.surname,
        identification: invoice.client?.documentNumber || '222222222222',
        identificationType: invoice.client?.typeDocument || 'CC',
        email: invoice.client?.email,
        phone: invoice.client?.phone,
        address: invoice.client?.address,
      },
      items: invoice.invoiceItems.map((item) => ({
        name: item.productName || item.product?.name || 'Producto',
        price: item.price,
        quantity: item.quantity,
        discount: item.totalDiscount || 0,
        tax:
          item.totalTax && item.totalTax > 0
            ? [{ name: 'IVA', percentage: 19 }]
            : [],
        sku: item.sku,
      })),
      numberTemplateId: dto.numberTemplateId,
      paymentMethod: dto.paymentMethod || invoice.paymentType,
      paymentType:
        dto.paymentType || this.mapPosPaymentTypeToAlegra(invoice.paymentType),
      observations: dto.observations,
    };

    // Emitir factura electrónica
    const result = await provider.createInvoice(input);

    // Guardar registro
    const dianInvoice = new DianInvoice();
    dianInvoice.providerId = result.providerId;
    dianInvoice.providerName = result.providerName;
    dianInvoice.documentNumber = result.number;
    dianInvoice.prefix = result.prefix;
    dianInvoice.cufe = result.cufe;
    dianInvoice.documentType = DianDocumentType.FACTURA_VENTA;
    dianInvoice.dianStatus = this.mapStampToElectronicStatus(
      result.stampStatus,
    );
    dianInvoice.stampDate = result.stampDate
      ? new Date(result.stampDate)
      : null;
    dianInvoice.total = result.total;
    dianInvoice.subtotal = result.subtotal;
    dianInvoice.totalTax = result.totalTax;
    dianInvoice.pdfUrl = result.pdfUrl;
    dianInvoice.xmlUrl = result.xmlUrl;
    dianInvoice.qrUrl = result.qrUrl;
    dianInvoice.rawResponse = result.rawResponse;
    dianInvoice.invoice = invoice;
    dianInvoice.user = user;

    const saved = await this.dianInvoiceRepository.save(dianInvoice);

    this.logger.log(
      `Factura electrónica emitida: ${saved.documentNumber} | CUFE: ${saved.cufe}`,
    );

    return saved;
  }

  // ─── Emitir Factura Electrónica Libre ────────────────────────

  async emitFree(dto: EmitDianInvoiceFreeDto, user: User) {
    const provider = await this.getProvider(user.id);

    const input: DianProviderInvoiceInput = {
      date: dto.date,
      dueDate: dto.dueDate,
      client: dto.client,
      items: dto.items,
      numberTemplateId: dto.numberTemplateId,
      paymentMethod: dto.paymentMethod,
      paymentType: dto.paymentType,
      observations: dto.observations,
    };

    const result = await provider.createInvoice(input);

    const dianInvoice = new DianInvoice();
    dianInvoice.providerId = result.providerId;
    dianInvoice.providerName = result.providerName;
    dianInvoice.documentNumber = result.number;
    dianInvoice.prefix = result.prefix;
    dianInvoice.cufe = result.cufe;
    dianInvoice.documentType = DianDocumentType.FACTURA_VENTA;
    dianInvoice.dianStatus = this.mapStampToElectronicStatus(
      result.stampStatus,
    );
    dianInvoice.stampDate = result.stampDate
      ? new Date(result.stampDate)
      : null;
    dianInvoice.total = result.total;
    dianInvoice.subtotal = result.subtotal;
    dianInvoice.totalTax = result.totalTax;
    dianInvoice.pdfUrl = result.pdfUrl;
    dianInvoice.xmlUrl = result.xmlUrl;
    dianInvoice.qrUrl = result.qrUrl;
    dianInvoice.rawResponse = result.rawResponse;
    dianInvoice.user = user;

    return this.dianInvoiceRepository.save(dianInvoice);
  }

  // ─── Consultar Estado DIAN ───────────────────────────────────

  async checkStatus(dianInvoiceId: number, user: User) {
    const dianInvoice = await this.dianInvoiceRepository.findOne({
      where: { id: dianInvoiceId, user: { id: user.id } },
      relations: ['invoice'],
    });

    if (!dianInvoice) {
      throw new NotFoundException(
        `Documento electrónico #${dianInvoiceId} no encontrado`,
      );
    }

    // Si ya está timbrado, retornar sin consultar
    if (dianInvoice.dianStatus === DianElectronicStatus.STAMPED) {
      return dianInvoice;
    }

    // Consultar estado actualizado al proveedor
    const provider = await this.getProvider(user.id);
    const result = await provider.getInvoiceStatus(dianInvoice.providerId);

    // Actualizar registro
    dianInvoice.cufe = result.cufe || dianInvoice.cufe;
    dianInvoice.dianStatus = this.mapStampToElectronicStatus(
      result.stampStatus,
    );
    dianInvoice.stampDate = result.stampDate
      ? new Date(result.stampDate)
      : dianInvoice.stampDate;
    dianInvoice.pdfUrl = result.pdfUrl || dianInvoice.pdfUrl;
    dianInvoice.qrUrl = result.qrUrl || dianInvoice.qrUrl;

    return this.dianInvoiceRepository.save(dianInvoice);
  }

  // ─── Obtener PDF ─────────────────────────────────────────────

  async getPdf(dianInvoiceId: number, user: User) {
    const dianInvoice = await this.dianInvoiceRepository.findOne({
      where: { id: dianInvoiceId, user: { id: user.id } },
    });

    if (!dianInvoice) {
      throw new NotFoundException(
        `Documento electrónico #${dianInvoiceId} no encontrado`,
      );
    }

    if (dianInvoice.pdfUrl) {
      return { pdfUrl: dianInvoice.pdfUrl };
    }

    const provider = await this.getProvider(user.id);
    const pdfUrl = await provider.getInvoicePdf(dianInvoice.providerId);

    if (pdfUrl) {
      dianInvoice.pdfUrl = pdfUrl;
      await this.dianInvoiceRepository.save(dianInvoice);
    }

    return { pdfUrl };
  }

  // ─── Emitir Nota Crédito ─────────────────────────────────────

  async emitCreditNote(dto: EmitCreditNoteDto, user: User) {
    const provider = await this.getProvider(user.id);

    const originalDianInvoice = await this.dianInvoiceRepository.findOne({
      where: { id: dto.dianInvoiceId, user: { id: user.id } },
    });

    if (!originalDianInvoice) {
      throw new NotFoundException(
        `Documento electrónico #${dto.dianInvoiceId} no encontrado`,
      );
    }

    if (originalDianInvoice.dianStatus !== DianElectronicStatus.STAMPED) {
      throw new BadRequestException(
        'Solo se pueden emitir notas crédito sobre facturas timbradas ante la DIAN.',
      );
    }

    // Si no se envían items, obtener los de la factura original del proveedor
    let items = dto.items;
    if (!items || items.length === 0) {
      const originalResult = await provider.getInvoiceStatus(
        originalDianInvoice.providerId,
      );
      items =
        originalResult.rawResponse?.items?.map((item: any) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax: item.tax,
        })) || [];
    }

    const input: DianProviderCreditNoteInput = {
      invoiceProviderId: originalDianInvoice.providerId,
      reason: dto.reason,
      date: dto.date || this.formatDate(new Date()),
      items,
      observations: dto.observations,
    };

    const result = await provider.createCreditNote(input);

    const creditNote = new DianInvoice();
    creditNote.providerId = result.providerId;
    creditNote.providerName = originalDianInvoice.providerName;
    creditNote.documentNumber = result.number;
    creditNote.cufe = result.cufe;
    creditNote.documentType = DianDocumentType.NOTA_CREDITO;
    creditNote.dianStatus = this.mapStampToElectronicStatus(result.stampStatus);
    creditNote.total = result.total;
    creditNote.pdfUrl = result.pdfUrl;
    creditNote.xmlUrl = result.xmlUrl;
    creditNote.rawResponse = result.rawResponse;
    creditNote.originalDianInvoiceId = originalDianInvoice.id;
    creditNote.user = user;

    return this.dianInvoiceRepository.save(creditNote);
  }

  // ─── Listar Facturas Electrónicas ───────────────────────────

  async findAll(userId: string) {
    return this.dianInvoiceRepository.find({
      where: { user: { id: userId } },
      relations: ['invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: string) {
    return this.dianInvoiceRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['invoice'],
    });
  }

  // ─── Consultar Numeraciones ──────────────────────────────────

  async getNumberTemplates(user: User) {
    const provider = await this.getProvider(user.id);
    return provider.getNumberTemplates();
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Mapea el PaymentType del POS al paymentType de Alegra (CASH o CREDIT).
   * - GatewayPayment / CashOnDelivery → pago de contado (CASH)
   * - AccountReceivable / Fiar → venta a crédito (CREDIT)
   */
  private mapPosPaymentTypeToAlegra(posPaymentType: string): string {
    const creditTypes = ['AccountReceivable', 'Fiar'];
    return creditTypes.includes(posPaymentType) ? 'CREDIT' : 'CASH';
  }

  private mapStampToElectronicStatus(
    stampStatus: DianStampStatus,
  ): DianElectronicStatus {
    switch (stampStatus) {
      case DianStampStatus.STAMPED:
        return DianElectronicStatus.STAMPED;
      case DianStampStatus.REJECTED:
        return DianElectronicStatus.REJECTED;
      case DianStampStatus.PENDING:
        return DianElectronicStatus.PENDING;
      default:
        return DianElectronicStatus.NOT_SENT;
    }
  }
}

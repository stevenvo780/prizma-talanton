import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HubClient,
  EVENTS,
  validateEvent,
  EventEnvelopeSchema,
  type EventType,
} from 'prizma-contracts';

/**
 * Prizma integration hub for Talanton POS.
 *
 * Wraps the canonical `prizma-contracts` HubClient configured with
 * `source = "talanton"`. Per the SSOT matrix (ARCHITECTURE.md §4-5) Talanton
 * is the owner/emitter of the in-store sale event `venta_pos.creada`
 * (`EVENTS.POS_SALE_CREATED`), so the only first-class publish helper here is
 * `publishPosSaleCreated`. Other events (inventory sync, etc.) can be added as
 * the flows are wired.
 *
 * The underlying HubClient is fault-tolerant by design: a failed publish is
 * swallowed and never throws into business logic (connectors are optional).
 * Callers should still `await hub.publish*()` inside a try/catch or rely on the
 * client's built-in tolerance so the POS keeps working if the Hub is down.
 */
@Injectable()
export class PrizmaHubService {
  private readonly logger = new Logger(PrizmaHubService.name);
  private readonly client: HubClient;

  constructor(private readonly config: ConfigService) {
    const hubUrl =
      this.config.get<string>('NOUS_HUB_URL') ??
      'http://localhost:3007';
    const secret =
      this.config.get<string>('NOUS_HUB_SECRET') ??
      undefined;

    this.client = new HubClient({
      // 'talanton' is the new canonical source; prizma-contracts will add it
      // to the ServiceSource union in R1-contracts bump. Cast until then.
      source: 'talanton' as any,
      hubUrl,
      secret,
      // throwOnError stays false: a hub failure must never break a POS sale.
    });
  }

  /** Low-level passthrough to the canonical HubClient. Never throws. */
  async publish(
    eventType: EventType | string,
    data: Record<string, unknown>,
    opts?: { priority?: 'critical' | 'high' | 'normal' | 'low'; idempotencyKey?: string },
  ): Promise<boolean> {
    return this.client.publish(eventType, data, opts);
  }

  /**
   * Emit `venta_pos.creada` (EVENTS.POS_SALE_CREATED) for a POS invoice/sale.
   * Maps the local Invoice entity into the canonical POS_SALE_CREATED payload.
   * Returns true if the hub accepted the event, false otherwise (non-fatal).
   */
  async publishPosSaleCreated(invoice: any, user?: any): Promise<boolean> {
    const items = (invoice?.invoiceItems || []).map((item: any) => ({
      sku: item?.sku || item?.product?.sku || String(item?.product?.id ?? ''),
      name: item?.product?.name || item?.name || undefined,
      qty: Number.parseInt(item?.quantity, 10) || 1,
      unitPrice: Number.parseFloat(item?.unitPrice) || 0,
    }));

    const data = {
      saleId: String(invoice?.id ?? invoice?.tracking_number ?? ''),
      items,
      total: Number.parseFloat(invoice?.totalAmount) || 0,
      customer: invoice?.client
        ? {
            id: invoice.client.id != null ? String(invoice.client.id) : undefined,
            name: invoice.client.name || undefined,
            phone: invoice.client.phone || undefined,
            email: invoice.client.email || undefined,
          }
        : undefined,
      store: user?.storeId || undefined,
      delivery: Boolean(invoice?.delivery) || false,
    };

    // Validate against the canonical schema before sending (best-effort; we
    // still publish unknown/loose data because the ecosystem is open).
    const envelope = {
      eventId: 'pre-validate',
      eventType: EVENTS.POS_SALE_CREATED,
      timestamp: new Date().toISOString(),
      source: 'talanton' as any,
      data,
      priority: 'normal' as const,
    };
    const parsed = EventEnvelopeSchema.safeParse(envelope);
    if (parsed.success) {
      const check = validateEvent(parsed.data);
      if (!check.ok) {
        const reason = (check as { ok: false; error: string }).error;
        this.logger.warn(
          `POS_SALE_CREATED payload failed validation (publishing anyway): ${reason}`,
        );
      }
    }

    return this.publish(EVENTS.POS_SALE_CREATED, data, { priority: 'normal' });
  }
}

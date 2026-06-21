import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';
import {
  NousConnectorService,
  PendingApprovalPayload,
  InventorySyncPayload,
} from './nous-connector.service';

/**
 * Connector para Nous — endpoints que el event hub consume en Talanton.
 * Sin autenticación Firebase (validación HMAC delegada al gateway/Nous).
 */
@ApiTags('nous-connector')
@Controller()
export class NousConnectorController {
  private readonly logger = new Logger(NousConnectorController.name);

  constructor(private readonly nousService: NousConnectorService) {}

  /**
   * POST /orders/pending-approval
   * Recibe una orden pendiente de aprobación desde Nous (flow 2: offline→online).
   * Payload: { orderId, customer, total, items, currency?, store? }
   * Persiste la orden como Invoice en estado Unpaid/AccountReceivable.
   */
  @Post('orders/pending-approval')
  @ApiOperation({ summary: 'Recibir orden pendiente de aprobación (conector Nous)' })
  @ApiCreatedResponse({ description: 'Orden registrada como pendiente de aprobación' })
  async receivePendingApproval(@Body() payload: PendingApprovalPayload) {
    this.logger.log(
      `[nous] pending-approval recibido: orderId=${payload.orderId} total=${payload.total}`,
    );

    // Lanza InternalServerErrorException si la persistencia falla — nunca ACK falso.
    const invoice = await this.nousService.upsertPendingApproval(payload);

    return {
      success: true,
      message: 'Orden pendiente de aprobación registrada',
      invoiceId: invoice.id,
      orderId: payload.orderId ?? 'unknown',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /inventory/sync-from-hermes
   * Upsert del inventario recibido desde Hermes vía Nous.
   * Payload: { items: [{ sku, qty|quantity, name?, ... }] }
   * Lanza error real si algún item falla — nunca ACK falso.
   */
  @Post('inventory/sync-from-hermes')
  @ApiOperation({ summary: 'Recibir sincronización de inventario desde Hermes (conector Nous)' })
  @ApiCreatedResponse({ description: 'Inventario recibido y sincronizado' })
  async receiveInventorySync(@Body() payload: InventorySyncPayload) {
    const items = Array.isArray(payload.items) ? payload.items : [];
    this.logger.log(`[nous] inventory sync recibido: items=${items.length}`);

    // Lanza InternalServerErrorException si algún save falla — sin ACK falso.
    const result = await this.nousService.upsertInventorySync(payload);

    return {
      success: true,
      message: 'Sincronización de inventario completada',
      itemsReceived: items.length,
      itemsUpdated: result.updated,
      itemsSkipped: result.skipped,
      details: result.details,
      timestamp: new Date().toISOString(),
    };
  }
}

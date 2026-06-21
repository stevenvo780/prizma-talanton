import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { verifySignature } from 'prizma-contracts';
import { MercadoPagoService } from './mercadopago.service';

/**
 * Receptor de eventos de pago enviados por el Hub Central (Nous).
 *
 * El Hub verifica la firma `x-signature` de MP, agrupa los eventos por
 * `externalReference` y los entrega aquí con `x-prizma-event` y firma
 * `x-prizma-signature` (HMAC-SHA256 del payload con el secreto compartido).
 *
 * Ruta: POST /api/webhooks/payments
 *
 * Seguridad: este endpoint actúa sobre suscripciones de usuarios
 * (pago.aprobado activa planes), por lo que verifica la firma HMAC del Hub
 * con `verifySignature` (prizma-contracts) usando NOUS_HUB_SECRET. Sin esta
 * verificación, cualquiera podría forjar `pago.aprobado` y activar planes.
 *
 * Si el secreto NO está configurado en el entorno, el endpoint arranca en modo
 * degradado (acepta y solo advierte) para no romper el boot ni la integración
 * Hub→Talanton mientras se cablea el secreto — mismo patrón lazy que el gateway
 * de MP. En cuanto NOUS_HUB_SECRET está seteado, un POST sin firma válida → 401.
 *
 * Eventos manejados (eventType en body.eventType):
 *  - pago.aprobado
 *  - pago.rechazado
 *  - suscripcion.activada
 *  - suscripcion.cancelada
 */
@Controller('api/webhooks')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(private readonly mpService: MercadoPagoService) {}

  /** Secreto HMAC compartido con el Hub (canónico NOUS_HUB_SECRET). */
  private get hubSecret(): string | undefined {
    return process.env.NOUS_HUB_SECRET ?? undefined;
  }

  @Post('payments')
  async handleHubPaymentEvent(
    @Body() body: Record<string, any>,
    @Headers('x-prizma-signature') prizmaSignature?: string,
    @Headers('x-prizma-event') prizmaEvent?: string,
    @Headers('x-prizma-target') prizmaTarget?: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    // ── Verificación de firma HMAC del Hub ──────────────────────────────
    // El HubClient firma `env.data` y envía la firma en `x-prizma-signature`.
    // `body` ES ese `env.data`.
    const secret = this.hubSecret;
    const signature = prizmaSignature;
    if (secret) {
      if (!verifySignature(body, signature, secret)) {
        this.logger.warn(
          'Webhook payments: firma x-prizma-signature ausente o inválida — rechazado (401)',
        );
        throw new UnauthorizedException('firma inválida');
      }
    } else {
      this.logger.warn(
        'Webhook payments: NOUS_HUB_SECRET no configurado — firma NO verificada (modo degradado)',
      );
    }

    const eventType = (body?.eventType ?? prizmaEvent) as string | undefined;

    if (!eventType) {
      this.logger.warn(
        'Webhook payments recibido sin eventType — ignorado',
      );
      return { success: false, reason: 'eventType ausente' };
    }

    // Solo procesar eventos dirigidos a talanton (guard defensivo)
    if (prizmaTarget && prizmaTarget !== 'talanton') {
      this.logger.warn(
        `Webhook payments: x-prizma-target=${prizmaTarget} ignorado (esperado talanton)`,
      );
      return { success: false, reason: 'target no es talanton' };
    }

    this.logger.log(
      `Hub payment event: eventType=${eventType}` +
        ` idempotencyKey=${idempotencyKey ?? 'none'}` +
        ` ref=${body?.externalReference ?? 'none'}`,
    );

    try {
      const result = await this.mpService.handleHubPaymentEvent(
        eventType,
        body,
      );
      return { success: true, ...result };
    } catch (err: any) {
      this.logger.error(
        `Error procesando hub payment event ${eventType}: ${err?.message}`,
      );
      // Siempre 200 para que el Hub no reintente indefinidamente
      return { success: false, reason: err?.message ?? 'error interno' };
    }
  }
}

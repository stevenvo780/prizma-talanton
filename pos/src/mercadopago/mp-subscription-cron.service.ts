import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MercadoPagoService } from './mercadopago.service';

@Injectable()
export class MpSubscriptionCronService {
  private readonly logger = new Logger(MpSubscriptionCronService.name);

  constructor(private readonly mpService: MercadoPagoService) {}

  /**
   * Cron que se ejecuta todos los días a las 3:00 AM (hora del servidor)
   * para sincronizar el estado de las suscripciones activas con Mercado Pago.
   *
   * Nota: MP se encarga de los cobros recurrentes automáticamente.
   * Este cron solo sincroniza estados (canceladas, pausadas, etc.).
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleSubscriptionSync() {
    this.logger.log(
      '🔄 Iniciando sincronización de suscripciones con Mercado Pago...',
    );
    try {
      const result = await this.mpService.syncSubscriptions();
      this.logger.log(
        `✅ Sync completado: ${result.checked} verificadas, ${result.updated} actualizadas`,
      );
    } catch (error: any) {
      this.logger.error(
        '❌ Error en sincronización de suscripciones:',
        error?.message || error,
      );
    }
  }
}

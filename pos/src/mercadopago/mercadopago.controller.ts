import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import { CreateMpSubscriptionDto } from './dto/create-mp-subscription.dto';
import { Request, Response } from 'express';

@Controller('mercadopago')
export class MercadoPagoController {
  private readonly logger = new Logger(MercadoPagoController.name);

  constructor(private readonly mpService: MercadoPagoService) {}

  /**
   * POST /mercadopago/subscribe
   * Crea una suscripción recurrente en Mercado Pago.
   * Retorna el init_point (URL del checkout MP) al que debe redirigirse el usuario.
   */
  @Post('subscribe')
  @UseGuards(FirebaseAuthGuard)
  async subscribe(
    @Req() req: RequestWithUser,
    @Body() dto: CreateMpSubscriptionDto,
  ) {
    try {
      const result = await this.mpService.createSubscription({
        userId: req.user.id,
        email: req.user.email,
        planType: dto.planType,
        frequency: dto.frequency,
        cardTokenId: dto.cardTokenId,
      });

      return {
        success: true,
        data: result,
        message: 'Suscripción creada. Redirige al usuario al initPoint.',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Error procesando la suscripción',
        details: error.message || 'Error desconocido',
      });
    }
  }

  /**
   * POST /mercadopago/cancel-subscription
   * Cancela la suscripción activa del usuario.
   */
  @Post('cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  async cancelSubscription(@Req() req: RequestWithUser) {
    const result = await this.mpService.cancelSubscription(req.user.id);
    return {
      success: true,
      subscription: result,
      message: result
        ? 'Suscripción cancelada correctamente'
        : 'No se encontró suscripción activa',
    };
  }

  /**
   * GET /mercadopago/subscription-status
   * Obtiene el estado actual de la suscripción (local + MP).
   */
  @Get('subscription-status')
  @UseGuards(FirebaseAuthGuard)
  async getSubscriptionStatus(@Req() req: RequestWithUser) {
    const status = await this.mpService.getSubscriptionStatus(req.user.id);
    return {
      success: true,
      data: status,
    };
  }

  /**
   * POST /mercadopago/webhook
   * Recibe notificaciones de Mercado Pago (webhook).
   * Este endpoint NO tiene auth guard porque MP lo llama directamente.
   */
  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const payload = req.body;
      this.logger.log(`Webhook MP recibido: ${JSON.stringify(payload)}`);

      const result = await this.mpService.handleWebhook(payload);

      return res.status(HttpStatus.OK).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      this.logger.error('Error procesando webhook MP:', error.message);
      // Siempre retornar 200 a MP para evitar reintentos innecesarios
      return res.status(HttpStatus.OK).json({
        success: false,
        message: 'Error procesando webhook',
        details: error.message,
      });
    }
  }

  /**
   * POST /mercadopago/sync
   * Sincroniza estados de suscripciones con MP (puede llamarse manualmente o via cron).
   */
  @Post('sync')
  @UseGuards(FirebaseAuthGuard)
  async syncSubscriptions() {
    const result = await this.mpService.syncSubscriptions();
    return {
      success: true,
      data: result,
    };
  }
}

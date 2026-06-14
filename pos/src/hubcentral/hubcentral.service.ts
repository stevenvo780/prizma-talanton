import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface VentaPOSEvent {
  id: string;
  type: 'venta_pos.creada';
  source: 'sinergia';
  timestamp: Date;
  data: {
    ventaId: number;
    consecutive: number;
    tracking_number: string;
    totalAmount: number;
    paymentType: string;
    paymentStatus: string;
    date: Date;
    items: Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    client: {
      id?: number;
      name: string;
      email?: string;
      phone?: string;
    };
    user: {
      id: string;
      name: string;
    };
  };
  metadata: {
    userId: string;
    storeId: string;
    traceId: string;
  };
}

@Injectable()
export class HubCentralService {
  private hubCentralUrl: string;
  private apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.hubCentralUrl =
      this.configService.get<string>('HUB_CENTRAL_URL') ||
      'http://localhost:3007';
    this.apiKey =
      this.configService.get<string>('HUB_CENTRAL_API_KEY') ||
      'sinergia-secret-key';
  }

  /**
   * Envía evento de venta POS creada al Hub Central
   */
  async sendVentaPOSCreada(invoice: any, user: any): Promise<void> {
    try {
      const event: VentaPOSEvent = {
        id: this.generateEventId(),
        type: 'venta_pos.creada',
        source: 'sinergia',
        timestamp: new Date(),
        data: {
          ventaId: invoice.id,
          consecutive: invoice.consecutive,
          tracking_number: invoice.tracking_number,
          totalAmount: parseFloat(invoice.totalAmount),
          paymentType: invoice.paymentType,
          paymentStatus: invoice.paymentStatus,
          date: new Date(invoice.date),
          items:
            invoice.invoiceItems?.map((item) => ({
              productId: item.product?.id || 0,
              productName: item.product?.name || item.name || 'Producto',
              quantity: parseInt(item.quantity) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0,
              totalPrice: parseFloat(item.totalPrice) || 0,
            })) || [],
          client: {
            id: invoice.client?.id,
            name: invoice.client?.name || 'Cliente Anónimo',
            email: invoice.client?.email,
            phone: invoice.client?.phone,
          },
          user: {
            id: user.id,
            name: user.name || user.username || 'Usuario POS',
          },
        },
        metadata: {
          userId: user.id,
          storeId: user.storeId || 'store-default',
          traceId: this.generateTraceId(),
        },
      };

      // Crear firma HMAC-SHA256
      const payload = JSON.stringify(event);
      const signature = this.createHMACSignature(payload);

      // Enviar al Hub Central
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.hubCentralUrl}/api/v1/webhooks/venta-pos-creada`,
          event,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-sinergia-signature': `sha256=${signature}`,
              'x-api-key': this.apiKey,
            },
            timeout: 5000, // 5 segundos timeout
          },
        ),
      );

      console.log(
        `✅ Evento venta_pos.creada enviado al Hub Central: ${event.id}`,
      );
      console.log(
        `📋 Response: ${response.status} - ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      console.error(
        '❌ Error enviando evento venta_pos.creada al Hub Central:',
        {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        },
      );

      // No lanzar error para no interrumpir el flujo principal de venta
      // El sistema debe funcionar aunque el Hub Central no esté disponible
    }
  }

  /**
   * Crea firma HMAC-SHA256 para validación de seguridad
   */
  private createHMACSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.apiKey)
      .update(payload)
      .digest('hex');
  }

  /**
   * Genera ID único para el evento
   */
  private generateEventId(): string {
    return `SINERGIA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera trace ID único para trazabilidad
   */
  private generateTraceId(): string {
    return crypto.randomUUID();
  }

  /**
   * Valida la conectividad con Hub Central
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.hubCentralUrl}/api/v1/health`, {
          timeout: 3000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      console.error('Hub Central health check failed:', error.message);
      return false;
    }
  }
}

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface VentaPOSEvent {
  id: string;
  type: 'venta_pos.creada';
  source: 'talanton';
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
export class PrizmaHubLegacyService {
  private hubUrl: string;
  private apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.hubUrl =
      this.configService.get<string>('PRIZMA_NOUS_URL') ||
      'http://localhost:3007';
    this.apiKey =
      this.configService.get<string>('PRIZMA_NOUS_SECRET') ||
      'prizma-secret-key';
  }

  /**
   * Envía evento de venta POS creada al Hub (Nous) vía endpoint legacy.
   */
  async sendVentaPOSCreada(invoice: any, user: any): Promise<void> {
    try {
      const event: VentaPOSEvent = {
        id: this.generateEventId(),
        type: 'venta_pos.creada',
        source: 'talanton',
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

      const payload = JSON.stringify(event);
      const signature = this.createHMACSignature(payload);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.hubUrl}/api/v1/webhooks/venta-pos-creada`,
          event,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-prizma-signature': `sha256=${signature}`,
              'x-api-key': this.apiKey,
            },
            timeout: 5000,
          },
        ),
      );

      console.log(
        `[prizma] Evento venta_pos.creada enviado al Hub: ${event.id}`,
      );
      console.log(
        `[prizma] Response: ${response.status} - ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      console.error(
        '[prizma] Error enviando evento venta_pos.creada al Hub:',
        {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        },
      );
    }
  }

  private createHMACSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.apiKey)
      .update(payload)
      .digest('hex');
  }

  private generateEventId(): string {
    return `TALANTON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return crypto.randomUUID();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.hubUrl}/api/v1/health`, {
          timeout: 3000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      console.error('[prizma] Hub health check failed:', error.message);
      return false;
    }
  }
}
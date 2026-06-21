import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface BusinessEvent {
  id: string;
  type:
    | 'invoice.created'
    | 'invoice.updated'
    | 'payment.completed'
    | 'order.placed';
  source: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: {
    userId: string;
    traceId: string;
  };
}

export interface PluginResponse {
  success: boolean;
  data?: any;
  error?: string;
  nextEvents?: BusinessEvent[];
}

@Injectable()
export class EventBusService {
  private eventBusUrl: string;
  private pluginOrchestrationUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.eventBusUrl =
      this.configService.get<string>('EVENT_BUS_URL') ||
      'http://localhost:3100';
    this.pluginOrchestrationUrl =
      this.configService.get<string>('PLUGIN_ORCHESTRATION_URL') ||
      'http://localhost:3200';
  }

  async publishEvent(event: BusinessEvent): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.eventBusUrl}/events`, event, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.configService.get<string>('EVENT_BUS_API_KEY'),
          },
        }),
      );
      console.log(`Event published successfully: ${event.type} - ${event.id}`);
    } catch (error) {
      console.error(
        'Error publishing event:',
        error?.response?.data || error.message,
      );
      // Don't throw error to avoid breaking main flow
    }
  }

  async publishInvoiceCreated(invoice: any, userId: string): Promise<void> {
    const event: BusinessEvent = {
      id: this.generateEventId(),
      type: 'invoice.created',
      source: 'talanton',
      timestamp: new Date(),
      data: {
        invoice: {
          id: invoice.id,
          consecutive: invoice.consecutive,
          tracking_number: invoice.tracking_number,
          totalAmount: invoice.totalAmount,
          paymentType: invoice.paymentType,
          paymentStatus: invoice.paymentStatus,
          date: invoice.date,
          invoiceItems: invoice.invoiceItems,
          client: invoice.client,
        },
      },
      metadata: {
        userId,
        traceId: this.generateTraceId(),
      },
    };

    await this.publishEvent(event);
  }

  async publishInvoiceUpdated(invoice: any, userId: string): Promise<void> {
    const event: BusinessEvent = {
      id: this.generateEventId(),
      type: 'invoice.updated',
      source: 'talanton',
      timestamp: new Date(),
      data: {
        invoice: {
          id: invoice.id,
          consecutive: invoice.consecutive,
          tracking_number: invoice.tracking_number,
          totalAmount: invoice.totalAmount,
          paymentType: invoice.paymentType,
          paymentStatus: invoice.paymentStatus,
          date: invoice.date,
          invoiceItems: invoice.invoiceItems,
          client: invoice.client,
        },
      },
      metadata: {
        userId,
        traceId: this.generateTraceId(),
      },
    };

    await this.publishEvent(event);
  }

  async publishPaymentCompleted(invoice: any, userId: string): Promise<void> {
    const event: BusinessEvent = {
      id: this.generateEventId(),
      type: 'payment.completed',
      source: 'talanton',
      timestamp: new Date(),
      data: {
        invoice: {
          id: invoice.id,
          consecutive: invoice.consecutive,
          tracking_number: invoice.tracking_number,
          totalAmount: invoice.totalAmount,
          paymentType: invoice.paymentType,
          paymentStatus: invoice.paymentStatus,
          date: invoice.date,
          client: invoice.client,
        },
      },
      metadata: {
        userId,
        traceId: this.generateTraceId(),
      },
    };

    await this.publishEvent(event);
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

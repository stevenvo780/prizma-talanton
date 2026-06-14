import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Invoice } from '../invoice/entities/invoice.entity';

export enum GrafOrderStatusType {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELED = 'canceled',
}

@Injectable()
export class GrafService {
  private readonly logger = new Logger(GrafService.name);
  private readonly grafApiUrl =
    process.env.GRAF_API_URL || 'http://localhost:5001/api';

  constructor(private httpService: HttpService) {}

  async updateOrderStatusFromInvoice(
    invoice: Invoice,
    status: GrafOrderStatusType,
    authToken: string,
  ): Promise<any> {
    if (!authToken) {
      this.logger.warn('Graf no está habilitado para este usuario');
      return;
    }
    if (!invoice || !invoice.tracking_number) {
      this.logger.warn('Factura o tracking_number no válido');
      return;
    }
    const endpoint = `${this.grafApiUrl}/orders/${invoice.tracking_number}`;
    const data = { status };
    console.log(endpoint, data);
    try {
      const response = await firstValueFrom(
        this.httpService.patch(endpoint, data, {
          headers: {
            'x-api-key': authToken,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error al actualizar el estado de la orden en Graf:',
        error?.message || error,
      );
      throw error;
    }
  }
}

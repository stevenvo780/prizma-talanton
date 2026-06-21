import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Invoice } from '../invoice/entities/invoice.entity';

export enum HermesOrderStatusType {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELED = 'canceled',
}

@Injectable()
export class HermesService {
  private readonly logger = new Logger(HermesService.name);
  private readonly hermesApiUrl =
    process.env.GRAF_API_URL || 'http://localhost:5001/api';

  constructor(private httpService: HttpService) {}

  async updateOrderStatusFromInvoice(
    invoice: Invoice,
    status: HermesOrderStatusType,
    authToken: string,
  ): Promise<any> {
    if (!authToken) {
      this.logger.warn('Hermes no está habilitado para este usuario');
      return;
    }
    if (!invoice || !invoice.tracking_number) {
      this.logger.warn('Factura o tracking_number no válido');
      return;
    }
    const endpoint = `${this.hermesApiUrl}/orders/${invoice.tracking_number}`;
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
        'Error al actualizar el estado de la orden en Hermes:',
        error?.message || error,
      );
      throw error;
    }
  }
}

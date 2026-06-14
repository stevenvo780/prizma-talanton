import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { User } from '../user/entities/user.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MeraVueltaService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private configService: ConfigService,
  ) {}

  async createInvoiceFromInvoice(invoiceId: number) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['user', 'client'],
    });

    if (!invoice) {
      throw new HttpException('Pedido no encontrado', HttpStatus.NOT_FOUND);
    }

    const user = invoice.user;
    const config = await this.configService.get(user.id);
    if (!config?.pluginsConfig?.meravuelta?.enabled) {
      return;
    }

    const meraVueltaUrl =
      process.env.MERAVUELTA_API_URL || 'http://localhost:3006/api';
    const endpoint = `${meraVueltaUrl}/order`;
    try {
      const invoiceData = this.transformInvoiceToInvoiceData(invoice);
      const response = await axios.post(endpoint, invoiceData, {
        headers: {
          Authorization:
            user.profile.pluginsConfig.meravuelta.auth_token_meravuelta,
          'x-tenant-id': String(user.id),
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        'Error al crear el pedido en MeraVuelta:',
        error.response.status,
      );
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock response for MeraVuelta in development');
        return { orderId: `mock-${invoiceId}`, status: 'success' };
      }
      throw new HttpException(
        'Error communicating with MeraVuelta API',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  transformInvoiceToInvoiceData(invoice: Invoice) {
    const deliveryAddress = invoice.client?.address || '';
    const department = invoice.client.department || '';
    const city = invoice.client.city || '';
    const neighborhood = invoice.client.neighborhood || '';
    const residentialGroupName = invoice.client.residentialGroup || '';
    const houseNumberOrApartment = invoice.client.houseNumber || '';

    const deliveryPacket = invoice.invoiceItems
      .map((item) => {
        return `${item.quantity} x ${item.productName} (SKU: ${
          item.product.priceTypes.find((pt) => pt.sku)?.sku || 'N/A'
        })`;
      })
      .join(', ');

    let prefix = '57';

    switch (invoice.client?.city) {
      case 'Colombia':
        prefix = '57';
        break;
      case 'Ecuador':
        prefix = '593';
        break;
      case 'Peru':
        prefix = '51';
        break;
      case 'Mexico':
        prefix = '52';
        break;
      case 'Argentina':
        prefix = '54';
        break;
      case 'Chile':
        prefix = '56';
        break;
      case 'Uruguay':
        prefix = '598';
        break;
    }

    return {
      purchaseNumber: +invoice.tracking_number,
      email: invoice.client?.email || '',
      typeDocument: invoice.client?.typeDocument || '',
      documentNumber: invoice.client?.documentNumber || '',
      name: invoice.client?.name || '',
      lastName: invoice.client?.surname || '',
      prefix: prefix,
      clientPhone: invoice.client?.phone || '',
      paymentMethod: invoice?.paymentType || '',
      deliveryAddress,
      department,
      city,
      neighborhood,
      residentialGroupName,
      houseNumberOrApartment,
      deliveryPacket,
    };
  }
}
7;

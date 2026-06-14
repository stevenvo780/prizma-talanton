import { Injectable, Logger } from '@nestjs/common';
import { Invoice, PaymentType } from '../invoice/entities/invoice.entity';
import { Client } from '../client/entities/client.entity';
import { UserService } from '../user/user.service';
import { Client as MailjetClient } from 'node-mailjet';

@Injectable()
export class MailjetService {
  private readonly logger = new Logger(MailjetService.name);
  private mailjet: MailjetClient;

  constructor(private readonly userService: UserService) {
    this.mailjet = MailjetClient.apiConnect(
      process.env.MAILJET_API_KEY || '',
      process.env.MAILJET_API_SECRET || '',
    );
  }

  async sendInvoiceEmail(invoice: Invoice, client: Client): Promise<boolean> {
    try {
      if (!client.email) {
        this.logger.warn(`Cliente ${client.id} no tiene email configurado`);
        return false;
      }

      const userWithProfile = await this.userService.findMe(invoice.user.id);

      if (!userWithProfile?.profile) {
        this.logger.warn(
          `Usuario ${invoice.user.id} no tiene perfil configurado`,
        );
        return false;
      }

      const fromEmail = process.env.MAILJET_FROM_EMAIL || userWithProfile.email;
      const fromName =
        process.env.MAILJET_FROM_NAME ||
        userWithProfile.profile.companyName ||
        userWithProfile.name;

      const profile = userWithProfile.profile;

      const emailData = {
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName,
            },
            To: [
              {
                Email: client.email,
                Name: `${client.name} ${client.surname}`.trim(),
              },
            ],
            Subject: `Factura #${invoice.consecutive} - ${new Date(
              invoice.date,
            ).toLocaleDateString()}`,
            HTMLPart: this.generateInvoiceEmailTemplate(
              invoice,
              client,
              profile,
            ),
            TextPart: this.generateInvoiceEmailText(invoice, client, profile),
          },
        ],
      };
      const result = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request(emailData);
      if (result?.response?.status === 200) {
        this.logger.log(
          `Email enviado exitosamente al cliente ${client.email} para la factura ${invoice.consecutive}`,
        );
        return true;
      } else {
        this.logger.error(
          `Error enviando email: código ${result?.response?.status}`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error('Error enviando email de factura:', error);
      return false;
    }
  }

  private generateInvoiceEmailTemplate(
    invoice: Invoice,
    client: Client,
    profile: any,
  ): string {
    let paymentType = '';
    switch (invoice.paymentType) {
      case PaymentType.AccountReceivable:
        paymentType = 'Cuenta por Cobrar';
        break;
      case PaymentType.CashOnDelivery:
        paymentType = 'Pago Contra Entrega';
        break;
      case PaymentType.GatewayPayment:
        paymentType = 'Pago por Pasarela';
        break;
      case PaymentType.Fiar:
        paymentType = 'Fiar';
        break;
      default:
        paymentType = 'Desconocido';
    }
    const invoiceDate = new Date(invoice.date).toLocaleDateString('es-ES');
    const itemsList = invoice.invoiceItems
      .map((item) => {
        const totalPrice =
          item.price * item.quantity +
          (item.totalTax || 0) -
          (item.totalDiscount || 0);
        return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            ${item.productName || 'Producto'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">
            $${item.price.toLocaleString('es-ES')}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">
            $${totalPrice.toLocaleString('es-ES')}
          </td>
        </tr>
      `;
      })
      .join('');

    const razonSocial = profile.companyName || '';
    const nit = profile.nit || '';
    const dv = profile.dv ? `-${profile.dv}` : '';
    const direccion = profile.legalAddress || '';
    const regimen = profile.taxRegime || '';
    const telefono = profile.phone || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Factura #${invoice.consecutive}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }
          .header h1 { color: #4CAF50; margin: 0; }
          .info-section { margin-bottom: 20px; }
          .info-section h3 { color: #333; margin-bottom: 10px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
          .table td { padding: 8px; border-bottom: 1px solid #ddd; }
          .total-section { text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #4CAF50; }
          .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #333; margin: 0; margin-bottom: 10px;">${razonSocial}</h2>
            <p><strong>NIT:</strong> ${nit}${dv}</p>
            <p><strong>Dirección:</strong> ${direccion}</p>
            <p><strong>Régimen:</strong> ${regimen}</p>
            <p><strong>Teléfono:</strong> ${telefono}</p>
            <h1>FACTURA</h1>
            <p>Número: #${invoice.consecutive}</p>
            <p>Fecha: ${invoiceDate}</p>
            <p>Número de seguimiento: ${invoice.tracking_number}</p>
          </div>

          <div class="info-section">
            <h3>Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${client.name} ${client.surname}</p>
            <p><strong>Documento:</strong> ${client.documentNumber}</p>
            <p><strong>Email:</strong> ${client.email}</p>
            <p><strong>Teléfono:</strong> ${client.phone}</p>
            <p><strong>Dirección:</strong> ${client.address}</p>
          </div>

          <div class="info-section">
            <h3>Detalles de la Factura</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Precio Unitario</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <p class="total">Total: $${invoice.totalAmount.toLocaleString(
              'es-ES',
            )}</p>
            <p><strong>Estado del Pago:</strong> ${
              invoice.paymentStatus === 'Paid' ? 'Pagada' : 'No pago'
            }</p>
            <p><strong>Método de Pago:</strong> ${paymentType}</p>
          </div>

          <div class="footer">
            <p>Gracias por su compra</p>
            <p>Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateInvoiceEmailText(
    invoice: Invoice,
    client: Client,
    profile: any,
  ): string {
    const invoiceDate = new Date(invoice.date).toLocaleDateString('es-ES');
    const itemsList = invoice.invoiceItems
      .map((item) => {
        const totalPrice =
          item.price * item.quantity +
          (item.totalTax || 0) -
          (item.totalDiscount || 0);
        return `- ${item.productName || 'Producto'}: ${
          item.quantity
        } x $${item.price.toLocaleString(
          'es-ES',
        )} = $${totalPrice.toLocaleString('es-ES')}`;
      })
      .join('\n');

    const razonSocial = profile.companyName || '';
    const nit = profile.nit || '';
    const dv = profile.dv ? `-${profile.dv}` : '';
    const direccion = profile.legalAddress || '';
    const regimen = profile.taxRegime || '';
    const telefono = profile.phone || '';

    return `
${razonSocial}
NIT: ${nit}${dv}
Dirección: ${direccion}
Régimen: ${regimen}
Teléfono: ${telefono}
===========================================

FACTURA #${invoice.consecutive}
Fecha: ${invoiceDate}
Número de seguimiento: ${invoice.tracking_number}

INFORMACIÓN DEL CLIENTE
Nombre: ${client.name} ${client.surname}
Documento: ${client.documentNumber}
Email: ${client.email}
Teléfono: ${client.phone}
Dirección: ${client.address}

DETALLES DE LA FACTURA
${itemsList}

TOTAL: $${invoice.totalAmount.toLocaleString('es-ES')}
Estado del Pago: ${invoice.paymentStatus}
Método de Pago: ${invoice.paymentType}

Gracias por su compra.
Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.
    `;
  }
}

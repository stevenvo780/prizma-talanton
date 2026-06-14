import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  IDianProvider,
  DianProviderInvoiceInput,
  DianProviderInvoiceResult,
  DianProviderCreditNoteInput,
  DianProviderCreditNoteResult,
  DianProviderNumberTemplate,
  DianProviderItem,
  DianInvoiceStatus,
  DianStampStatus,
} from '../dian-provider.interface';
import {
  AlegraConfig,
  AlegraInvoiceRequest,
  AlegraInvoiceResponse,
  AlegraContactRequest,
  AlegraItemRequest,
  AlegraCreditNoteRequest,
  AlegraCreditNoteResponse,
  AlegraNumberTemplateResponse,
  AlegraIdentificationType,
  AlegraPaymentMethod,
} from './alegra.types';

@Injectable()
export class AlegraProvider implements IDianProvider {
  readonly providerName = 'alegra';
  private readonly logger = new Logger(AlegraProvider.name);
  private client: AxiosInstance;
  private config: AlegraConfig;

  /**
   * Inicializa el cliente HTTP con las credenciales de Alegra.
   * Se debe llamar antes de usar cualquier método.
   */
  initialize(config: AlegraConfig): void {
    this.config = config;
    const baseUrl = config.baseUrl || 'https://api.alegra.com/api/v1';
    const authToken = Buffer.from(`${config.email}:${config.token}`).toString(
      'base64',
    );

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  private ensureInitialized(): void {
    if (!this.client) {
      throw new BadRequestException(
        'AlegraProvider no está inicializado. Configure las credenciales de Alegra en el perfil.',
      );
    }
  }

  // ─── Crear Factura Electrónica ───────────────────────────────

  async createInvoice(
    input: DianProviderInvoiceInput,
  ): Promise<DianProviderInvoiceResult> {
    this.ensureInitialized();

    try {
      // 1. Buscar o crear contacto en Alegra
      const clientId = await this.findOrCreateContact(input.client);

      // 2. Crear o encontrar items en Alegra y mapear
      const items: AlegraItemRequest[] = [];
      for (const item of input.items) {
        const alegraItemId = await this.findOrCreateItem(item);
        items.push({
          id: alegraItemId,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax:
            item.tax?.map((t) => ({
              ...(t.id != null ? { id: t.id } : {}),
              name: t.name,
              percentage: t.percentage,
            })) || [],
          description: item.description || item.name,
          reference: item.sku,
        });
      }

      // 3. Construir body de la factura
      const invoiceBody: AlegraInvoiceRequest = {
        date: input.date,
        dueDate: input.dueDate || input.date,
        client: clientId,
        items,
        stamp: { generateStamp: true }, // ← Emitir ante DIAN automáticamente
        observations: input.observations,
        anotation: input.anotation,
      };

      if (input.numberTemplateId) {
        invoiceBody.numberTemplate = { id: input.numberTemplateId };
      }

      if (input.paymentMethod) {
        invoiceBody.paymentMethod = this.mapPaymentMethod(input.paymentMethod);
      }

      if (input.paymentType) {
        invoiceBody.paymentType = input.paymentType;
      }

      // 4. Crear factura en Alegra
      this.logger.log('Creando factura electrónica en Alegra...');
      const response = await this.client.post<AlegraInvoiceResponse>(
        '/invoices',
        invoiceBody,
      );

      const invoice = response.data;
      this.logger.log(
        `Factura creada en Alegra: ${
          invoice.numberTemplate?.fullNumber || invoice.number
        }`,
      );

      return this.mapInvoiceResponse(invoice);
    } catch (error: any) {
      // Caso especial: Alegra creó la factura pero falló el timbrado DIAN
      // (ej: empresa no configurada para FE, resolución vencida, etc.)
      const responseData = error?.response?.data;
      if (responseData?.invoice) {
        this.logger.warn(
          `Factura creada en Alegra (id: ${
            responseData.invoice.id
          }) pero sin timbrar: ${
            responseData.error?.message || 'Error de timbrado'
          }`,
        );
        const result = this.mapInvoiceResponse(responseData.invoice);
        result.stampStatus = DianStampStatus.NOT_SENT;
        result.rawResponse = responseData; // Incluir error y factura
        return result;
      }

      const errorDetails = responseData?.errors
        ? Object.entries(responseData.errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ')
        : '';
      const errorMsg = responseData?.message || error.message;
      this.logger.error('Error creando factura en Alegra', {
        message: errorMsg,
        details: errorDetails,
        data: responseData,
      });
      throw new BadRequestException(
        `Error Alegra: ${errorMsg}${
          errorDetails ? ` — Detalles: ${errorDetails}` : ''
        }`,
      );
    }
  }

  // ─── Consultar Estado ────────────────────────────────────────

  async getInvoiceStatus(
    providerId: string,
  ): Promise<DianProviderInvoiceResult> {
    this.ensureInitialized();

    try {
      const response = await this.client.get<AlegraInvoiceResponse>(
        `/invoices/${providerId}`,
      );
      return this.mapInvoiceResponse(response.data);
    } catch (error: any) {
      this.logger.error(
        'Error consultando factura en Alegra',
        error?.response?.data,
      );
      throw new BadRequestException(
        `Error Alegra: ${error?.response?.data?.message || error.message}`,
      );
    }
  }

  // ─── Obtener PDF ─────────────────────────────────────────────

  async getInvoicePdf(providerId: string): Promise<string> {
    this.ensureInitialized();

    try {
      const response = await this.client.get<AlegraInvoiceResponse>(
        `/invoices/${providerId}`,
      );
      return response.data.pdf || response.data.stamp?.pdfUrl || '';
    } catch (error: any) {
      this.logger.error(
        'Error obteniendo PDF de Alegra',
        error?.response?.data,
      );
      throw new BadRequestException(
        `Error Alegra: ${error?.response?.data?.message || error.message}`,
      );
    }
  }

  // ─── Crear Nota Crédito ──────────────────────────────────────

  async createCreditNote(
    input: DianProviderCreditNoteInput,
  ): Promise<DianProviderCreditNoteResult> {
    this.ensureInitialized();

    try {
      // Crear ítems en Alegra si no existen
      const alegraItems: AlegraItemRequest[] = [];
      for (const item of input.items) {
        const alegraItemId = await this.findOrCreateItem(item);
        alegraItems.push({
          id: alegraItemId,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax:
            item.tax?.map((t) => ({
              ...(t.id != null ? { id: t.id } : {}),
              name: t.name,
              percentage: t.percentage,
            })) || [],
          description: item.description || item.name,
        });
      }

      const body: AlegraCreditNoteRequest = {
        date: input.date,
        invoice: parseInt(input.invoiceProviderId, 10),
        reason: input.reason,
        items: alegraItems,
        observations: input.observations,
        stamp: { generateStamp: true },
      };

      this.logger.log('Creando nota crédito electrónica en Alegra...');
      const response = await this.client.post<AlegraCreditNoteResponse>(
        '/credit-notes',
        body,
      );

      const creditNote = response.data;
      this.logger.log(
        `Nota crédito creada: ${
          creditNote.numberTemplate?.fullNumber || creditNote.number
        }`,
      );

      return {
        providerId: String(creditNote.id),
        number:
          creditNote.numberTemplate?.fullNumber || String(creditNote.number),
        cufe: creditNote.stamp?.cufe,
        status: this.mapStatus(creditNote.status),
        stampStatus: this.mapStampStatus(creditNote.stamp?.status),
        total: creditNote.total,
        pdfUrl: creditNote.pdf || creditNote.stamp?.pdfUrl,
        xmlUrl: undefined,
        rawResponse: creditNote,
      };
    } catch (error: any) {
      this.logger.error(
        'Error creando nota crédito en Alegra',
        error?.response?.data,
      );
      throw new BadRequestException(
        `Error Alegra: ${error?.response?.data?.message || error.message}`,
      );
    }
  }

  // ─── Numeraciones de Facturación ─────────────────────────────

  async getNumberTemplates(): Promise<DianProviderNumberTemplate[]> {
    this.ensureInitialized();

    try {
      const response = await this.client.get<AlegraNumberTemplateResponse[]>(
        '/number-templates',
      );

      return response.data.map((template) => ({
        id: template.id,
        name: template.name,
        prefix: template.prefix,
        startNumber: template.minInvoiceNumber,
        endNumber: template.maxInvoiceNumber,
        currentNumber: template.nextInvoiceNumber,
        resolutionNumber: template.resolutionNumber,
        documentType: template.documentType,
        isDefault: template.isDefault,
        isElectronic: template.isElectronic,
      }));
    } catch (error: any) {
      this.logger.error(
        'Error consultando numeraciones en Alegra',
        error?.response?.data,
      );
      throw new BadRequestException(
        `Error Alegra: ${error?.response?.data?.message || error.message}`,
      );
    }
  }

  // ─── Validar Credenciales ────────────────────────────────────

  async validateCredentials(): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.client.get('/company');
      return true;
    } catch {
      return false;
    }
  }

  // ─── Buscar o crear ítem en Alegra ────────────────────────────

  private async findOrCreateItem(item: DianProviderItem): Promise<number> {
    try {
      // Buscar ítem por referencia/sku si existe
      if (item.sku) {
        const searchResponse = await this.client.get('/items', {
          params: { reference: item.sku },
        });
        const items = searchResponse.data;
        if (Array.isArray(items) && items.length > 0) {
          return items[0].id;
        }
      }

      // Buscar por nombre exacto
      const searchByName = await this.client.get('/items', {
        params: { name: item.name },
      });
      const foundItems = searchByName.data;
      if (Array.isArray(foundItems) && foundItems.length > 0) {
        const exact = foundItems.find((i: any) => i.name === item.name);
        if (exact) return exact.id;
      }

      // Crear el ítem en Alegra
      const createBody = {
        name: item.name,
        description: item.description || item.name,
        price: [{ price: item.price }],
        type: 'product',
        tax:
          item.tax?.map((t) => ({
            ...(t.id != null ? { id: t.id } : {}),
            name: t.name,
            percentage: t.percentage,
          })) || [],
        reference: item.sku || undefined,
      };

      const createResponse = await this.client.post('/items', createBody);
      this.logger.log(
        `Ítem creado en Alegra: ${createResponse.data.name} (id: ${createResponse.data.id})`,
      );
      return parseInt(createResponse.data.id, 10);
    } catch (error: any) {
      this.logger.error(
        'Error gestionando ítem en Alegra',
        error?.response?.data,
      );
      throw new BadRequestException(
        `Error creando ítem en Alegra: ${
          error?.response?.data?.message || error.message
        }`,
      );
    }
  }

  // ─── Buscar o crear contacto en Alegra ───────────────────────

  private async findOrCreateContact(
    contact: DianProviderInvoiceInput['client'],
  ): Promise<number> {
    try {
      // Buscar por número de identificación
      if (contact.identification) {
        const searchResponse = await this.client.get('/contacts', {
          params: {
            identification: contact.identification,
          },
        });

        const contacts = searchResponse.data;
        if (Array.isArray(contacts) && contacts.length > 0) {
          return contacts[0].id;
        }
      }

      // Construir nombre completo
      const fullName = contact.surname
        ? `${contact.name} ${contact.surname}`
        : contact.name;

      // Separar nombre en partes para nameObject (opcional, Alegra lo genera automáticamente)
      const nameParts = contact.name.trim().split(/\s+/);
      const firstName = nameParts[0] || contact.name;
      const lastName =
        contact.surname || nameParts.slice(1).join(' ') || firstName;

      // Si no existe, crear contacto — 'name' es el campo obligatorio en Alegra
      const alegraContact: AlegraContactRequest = {
        name: fullName,
        nameObject: {
          firstName,
          lastName,
        },
        identificationObject: {
          type: this.mapIdentificationType(contact.identificationType),
          number: contact.identification || '',
        },
        email: contact.email,
        phonePrimary: contact.phone,
        type: ['client'],
        kindOfPerson:
          contact.identificationType === 'NIT'
            ? 'LEGAL_ENTITY'
            : 'PERSON_ENTITY',
      };

      if (contact.address) {
        alegraContact.address = {
          address: contact.address,
          city: contact.city,
          department: contact.department,
        };
      }

      if (contact.regime) {
        alegraContact.regime = contact.regime;
      }

      const createResponse = await this.client.post('/contacts', alegraContact);
      return createResponse.data.id;
    } catch (error: any) {
      this.logger.error(
        'Error gestionando contacto en Alegra',
        error?.response?.data,
      );
      throw new BadRequestException(
        `Error creando contacto en Alegra: ${
          error?.response?.data?.message || error.message
        }`,
      );
    }
  }

  private mapInvoiceResponse(
    invoice: AlegraInvoiceResponse,
  ): DianProviderInvoiceResult {
    return {
      providerId: String(invoice.id),
      providerName: this.providerName,
      number: invoice.numberTemplate?.fullNumber || String(invoice.number),
      prefix: invoice.numberTemplate?.prefix,
      cufe: invoice.stamp?.cufe,
      status: this.mapStatus(invoice.status),
      stampStatus: this.mapStampStatus(invoice.stamp?.status),
      stampDate: invoice.stamp?.date,
      total: invoice.total,
      subtotal: invoice.subtotal,
      totalTax: invoice.total - (invoice.subtotal || 0),
      pdfUrl: invoice.pdf || invoice.stamp?.pdfUrl,
      xmlUrl: undefined,
      qrUrl: invoice.stamp?.qrImage,
      rawResponse: invoice,
    };
  }

  private mapStatus(status?: string): DianInvoiceStatus {
    switch (status) {
      case 'draft':
        return DianInvoiceStatus.DRAFT;
      case 'open':
        return DianInvoiceStatus.OPEN;
      case 'closed':
        return DianInvoiceStatus.CLOSED;
      case 'voided':
        return DianInvoiceStatus.VOIDED;
      default:
        return DianInvoiceStatus.DRAFT;
    }
  }

  private mapStampStatus(status?: string): DianStampStatus {
    switch (status) {
      case 'stamped':
        return DianStampStatus.STAMPED;
      case 'rejected':
        return DianStampStatus.REJECTED;
      case 'pending':
        return DianStampStatus.PENDING;
      default:
        return DianStampStatus.NOT_SENT;
    }
  }

  private mapPaymentMethod(method: string): string {
    const map: Record<string, string> = {
      cash: AlegraPaymentMethod.CASH,
      GatewayPayment: AlegraPaymentMethod.TRANSFER,
      CashOnDelivery: AlegraPaymentMethod.CASH,
      AccountReceivable: AlegraPaymentMethod.CREDIT,
      Fiar: AlegraPaymentMethod.CREDIT,
      debit_card: AlegraPaymentMethod.DEBIT_CARD,
      credit_card: AlegraPaymentMethod.CREDIT_CARD,
      transfer: AlegraPaymentMethod.TRANSFER,
    };
    return map[method] || AlegraPaymentMethod.CASH;
  }

  private mapIdentificationType(type: string): string {
    const map: Record<string, string> = {
      'Cédula de Ciudadanía': AlegraIdentificationType.CC,
      CC: AlegraIdentificationType.CC,
      'Número de Identificación Tributaria': AlegraIdentificationType.NIT,
      NIT: AlegraIdentificationType.NIT,
      'Tarjeta de Identidad': AlegraIdentificationType.TI,
      TI: AlegraIdentificationType.TI,
      CE: AlegraIdentificationType.CE,
      PP: AlegraIdentificationType.PP,
    };
    return map[type] || AlegraIdentificationType.CC;
  }
}

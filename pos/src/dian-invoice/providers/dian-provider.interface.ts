/**
 * Interfaz abstracta para proveedores de facturación electrónica DIAN Colombia.
 * Permite intercambiar proveedores (Alegra, Siigo, FacturAPI, etc.) sin cambiar la lógica de negocio.
 */

export enum DianDocumentType {
  FACTURA_VENTA = 'FACTURA_VENTA',
  NOTA_CREDITO = 'NOTA_CREDITO',
  NOTA_DEBITO = 'NOTA_DEBITO',
}

export enum DianInvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  VOIDED = 'voided',
}

export enum DianStampStatus {
  PENDING = 'pending',
  STAMPED = 'stamped',
  REJECTED = 'rejected',
  NOT_SENT = 'not_sent',
}

export interface DianProviderContact {
  name: string;
  surname?: string;
  identification: string;
  identificationType: string; // NIT, CC, CE, TI, PP, etc.
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  department?: string;
  regime?: string; // Responsable de IVA, No responsable de IVA
}

export interface DianProviderItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  discount?: number;
  tax?: {
    id?: number;
    name?: string;
    percentage?: number;
  }[];
  sku?: string;
}

export interface DianProviderInvoiceInput {
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  client: DianProviderContact;
  items: DianProviderItem[];
  numberTemplateId?: string;
  paymentMethod?: string;
  paymentType?: string; // cash, credit
  observations?: string;
  currency?: string;
  anotation?: string;
}

export interface DianProviderInvoiceResult {
  providerId: string;
  providerName: string;
  number: string;
  prefix?: string;
  cufe?: string;
  status: DianInvoiceStatus;
  stampStatus: DianStampStatus;
  stampDate?: string;
  total: number;
  subtotal?: number;
  totalTax?: number;
  pdfUrl?: string;
  xmlUrl?: string;
  qrUrl?: string;
  rawResponse?: any;
}

export interface DianProviderCreditNoteInput {
  invoiceProviderId: string;
  reason: string;
  date: string;
  items: DianProviderItem[];
  observations?: string;
}

export interface DianProviderCreditNoteResult {
  providerId: string;
  number: string;
  cufe?: string;
  status: DianInvoiceStatus;
  stampStatus: DianStampStatus;
  total: number;
  pdfUrl?: string;
  xmlUrl?: string;
  rawResponse?: any;
}

export interface DianProviderNumberTemplate {
  id: string;
  name?: string;
  prefix: string | null;
  startNumber: number | null;
  endNumber: number | null;
  currentNumber?: number;
  resolutionNumber?: string | null;
  documentType: string;
  isDefault?: boolean;
  isElectronic?: boolean;
}

export interface IDianProvider {
  readonly providerName: string;

  /** Crear factura electrónica y enviar a la DIAN */
  createInvoice(
    input: DianProviderInvoiceInput,
  ): Promise<DianProviderInvoiceResult>;

  /** Consultar estado de una factura */
  getInvoiceStatus(providerId: string): Promise<DianProviderInvoiceResult>;

  /** Obtener URL de PDF de la factura */
  getInvoicePdf(providerId: string): Promise<string>;

  /** Crear nota crédito electrónica */
  createCreditNote(
    input: DianProviderCreditNoteInput,
  ): Promise<DianProviderCreditNoteResult>;

  /** Consultar numeraciones de facturación configuradas */
  getNumberTemplates(): Promise<DianProviderNumberTemplate[]>;

  /** Verificar que las credenciales son válidas */
  validateCredentials(): Promise<boolean>;
}

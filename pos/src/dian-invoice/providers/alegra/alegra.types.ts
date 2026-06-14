/**
 * Tipos específicos de la API de Alegra para Colombia.
 * Ref: https://developer.alegra.com/reference
 */

// ─── Request Types ───────────────────────────────────────────

export interface AlegraContactRequest {
  /** Campo obligatorio: nombre completo del contacto */
  name: string;
  /** Opcional: Alegra lo auto-genera a partir de 'name', pero se puede enviar explícito */
  nameObject?: {
    firstName: string;
    secondName?: string;
    lastName: string;
    secondLastName?: string;
  };
  identification?: string;
  identificationObject?: {
    type: string; // NIT, CC, CE, TI, PP, DIE, NUIP, RC
    number: string;
    dv?: string; // Dígito de verificación (solo NIT)
  };
  email?: string;
  phonePrimary?: string;
  address?: {
    address?: string;
    city?: string;
    department?: string;
    country?: string;
  };
  type?: string[]; // ['client']
  kindOfPerson?: string; // PERSON_ENTITY, LEGAL_ENTITY
  regime?: string; // SIMPLIFIED_REGIME, COMMON_REGIME, NOT_RESPONSIBLE_FOR_IVA
  fiscalResponsibilities?: string[];
}

/** Para crear un ítem en inventario de Alegra antes de facturar */
export interface AlegraCreateItemRequest {
  name: string;
  price: { price: number }[];
  type?: string; // 'product' | 'service'
  tax?: AlegraItemTax[];
  reference?: string;
  description?: string;
}

/** Ítem dentro de una factura — requiere id de un ítem existente en Alegra */
export interface AlegraItemRequest {
  id: number;
  price?: number;
  quantity: number;
  discount?: number;
  tax?: AlegraItemTax[];
  description?: string;
  reference?: string;
}

export interface AlegraItemTax {
  id?: number;
  name?: string;
  percentage?: number;
  type?: string;
}

export interface AlegraInvoiceRequest {
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  client: number | AlegraContactRequest;
  items: AlegraItemRequest[];
  numberTemplate?: { id: string };
  stamp?: { generateStamp: boolean };
  paymentMethod?: string; // CASH, DEBIT_CARD, CREDIT_CARD, TRANSFER, etc.
  paymentType?: string; // CASH, CREDIT
  observations?: string;
  anotation?: string;
  currency?: { code: string };
  operationType?: string; // STANDARD, CREDIT_NOTE, DEBIT_NOTE, etc.
}

export interface AlegraCreditNoteRequest {
  date: string;
  invoice: number; // ID de la factura original
  reason?: string; // 1=Devolución, 2=Anulación, 3=Descuento, 4=Ajuste, 5=Otros
  items: AlegraItemRequest[];
  observations?: string;
  stamp?: { generateStamp: boolean };
}

// ─── Response Types ──────────────────────────────────────────

export interface AlegraStampResponse {
  status?: string; // 'stamped', 'rejected', 'pending'
  cufe?: string;
  date?: string;
  legalStatus?: string;
  warnings?: string[];
  errors?: string[];
  qrImage?: string;
  pdfUrl?: string;
}

export interface AlegraInvoiceResponse {
  id: number;
  date: string;
  dueDate: string;
  number: string;
  numberTemplate?: {
    id: number;
    prefix: string;
    number: number;
    fullNumber: string;
  };
  status: string; // 'draft', 'open', 'closed', 'voided'
  client: {
    id: number;
    name: string;
    identification: string;
    email: string;
  };
  items: {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    discount: number;
    tax: AlegraItemTax[];
    total: number;
  }[];
  total: number;
  subtotal: number;
  totalPaid: number;
  balance: number;
  stamp?: AlegraStampResponse;
  pdf?: string;
  observations?: string;
  anotation?: string;
}

export interface AlegraCreditNoteResponse {
  id: number;
  date: string;
  number: string;
  numberTemplate?: {
    id: number;
    prefix: string;
    number: number;
    fullNumber: string;
  };
  status: string;
  invoice: {
    id: number;
    number: string;
  };
  total: number;
  subtotal: number;
  stamp?: AlegraStampResponse;
  pdf?: string;
}

export interface AlegraNumberTemplateResponse {
  id: string;
  name: string;
  prefix: string | null;
  startDate: string | null;
  endDate: string | null;
  minInvoiceNumber: number | null;
  maxInvoiceNumber: number | null;
  nextInvoiceNumber: number;
  resolutionNumber?: string | null;
  documentType: string;
  isDefault: boolean;
  isElectronic: boolean;
  status: string;
  autoincrement: boolean;
  invoiceText?: string | null;
}

export interface AlegraErrorResponse {
  code: number;
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Config ──────────────────────────────────────────────────

export interface AlegraConfig {
  email: string;
  token: string;
  baseUrl?: string; // default: https://api.alegra.com/api/v1
}

// ─── Payment Methods DIAN Colombia ──────────────────────────

export enum AlegraPaymentMethod {
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  TRANSFER = 'TRANSFER',
  CREDIT = 'CREDIT',
  CHECK = 'CHECK',
  CONSIGNMENT = 'CONSIGNMENT',
  OTHER = 'OTHER',
}

// ─── Document Types Colombia ─────────────────────────────────

export enum AlegraIdentificationType {
  NIT = 'NIT',
  CC = 'CC',
  CE = 'CE',
  TI = 'TI',
  PP = 'PP',
  RC = 'RC',
  DIE = 'DIE',
  NUIP = 'NUIP',
}

// ─── Regímenes Colombia ──────────────────────────────────────

export enum AlegraRegime {
  SIMPLIFIED = 'SIMPLIFIED_REGIME',
  COMMON = 'COMMON_REGIME',
  NOT_RESPONSIBLE = 'NOT_RESPONSIBLE_FOR_IVA',
  SPECIAL = 'SPECIAL_REGIME',
  GRANDES_CONTRIBUYENTES = 'GRANDES_CONTRIBUYENTES',
}

// ─── Razones de Nota Crédito DIAN ────────────────────────────

export enum AlegraCreditNoteReason {
  DEVOLUCION = '1',
  ANULACION = '2',
  DESCUENTO = '3',
  AJUSTE_PRECIO = '4',
  OTROS = '5',
}

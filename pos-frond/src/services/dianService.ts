import api from '../utils/axios';

// ─── Tipos ─────────────────────────────────────────────────

export interface ConfigureDianProviderDto {
  providerName: string;
  email: string;
  token: string;
}

export interface DianConfigureResponse {
  message: string;
  providerName: string;
  valid: boolean;
}

export interface EmitDianInvoiceDto {
  invoiceId: number;
  numberTemplateId?: string;
}

export interface EmitDianInvoiceFreeDto {
  client: DianClientDto;
  items: DianItemDto[];
  taxes?: DianTaxDto[];
  observations?: string;
  numberTemplateId?: string;
  paymentMethod?: string;
}

export interface DianClientDto {
  name: string;
  identification: string;
  identificationType: string;
  email?: string;
  phone?: string;
  address?: string;
  regime?: string;
}

export interface DianItemDto {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  taxPercentage?: number;
  reference?: string;
}

export interface DianTaxDto {
  name: string;
  percentage: number;
}

export interface EmitCreditNoteDto {
  dianInvoiceId: number;
  reason: string;
}

export interface DianInvoiceRecord {
  id: number;
  providerId: string;
  providerName: string;
  documentNumber: string;
  prefix: string;
  cufe: string;
  documentType: 'FACTURA_VENTA' | 'NOTA_CREDITO';
  dianStatus: 'PENDING' | 'STAMPED' | 'REJECTED' | 'ERROR';
  stampDate: string;
  total: number;
  subtotal: number;
  totalTax: number;
  pdfUrl: string;
  xmlUrl: string;
  qrUrl: string;
  errorMessage: string;
  invoice?: { id: number };
  createdAt: string;
}

export interface NumberTemplate {
  id: string;
  name: string;
  prefix: string;
  nextNumber: number;
  startNumber: number;
  endNumber: number;
  startDate?: string;
  endDate?: string;
  resolutionNumber?: string;
  isDefault: boolean;
  isElectronic: boolean;
  documentType: string;
  status: string;
}

// ─── Servicio ──────────────────────────────────────────────

/**
 * Configura las credenciales del proveedor de facturación electrónica (Alegra).
 * Cada empresa debe tener su propia cuenta de Alegra con resolución DIAN.
 */
export const configureDianProvider = async (
  dto: ConfigureDianProviderDto,
): Promise<DianConfigureResponse> => {
  const response = await api.post('/dian-invoice/configure', dto);
  return response.data;
};

/**
 * Emite una factura electrónica a partir de una factura POS existente.
 */
export const emitDianInvoice = async (
  dto: EmitDianInvoiceDto,
): Promise<DianInvoiceRecord> => {
  const response = await api.post('/dian-invoice/emit', dto);
  return response.data;
};

/**
 * Emite una factura electrónica libre (sin factura POS previa).
 */
export const emitDianInvoiceFree = async (
  dto: EmitDianInvoiceFreeDto,
): Promise<DianInvoiceRecord> => {
  const response = await api.post('/dian-invoice/emit-free', dto);
  return response.data;
};

/**
 * Emite una nota crédito electrónica.
 */
export const emitCreditNote = async (
  dto: EmitCreditNoteDto,
): Promise<DianInvoiceRecord> => {
  const response = await api.post('/dian-invoice/credit-note', dto);
  return response.data;
};

/**
 * Consulta el estado de una factura electrónica en el proveedor.
 */
export const getDianInvoiceStatus = async (
  id: number,
): Promise<DianInvoiceRecord> => {
  const response = await api.get(`/dian-invoice/status/${id}`);
  return response.data;
};

/**
 * Obtiene la URL del PDF de una factura electrónica.
 */
export const getDianInvoicePdf = async (
  id: number,
): Promise<{ pdfUrl: string }> => {
  const response = await api.get(`/dian-invoice/pdf/${id}`);
  return response.data;
};

/**
 * Lista todas las facturas electrónicas del usuario.
 */
export const listDianInvoices = async (): Promise<DianInvoiceRecord[]> => {
  const response = await api.get('/dian-invoice');
  return response.data;
};

/**
 * Obtiene una factura electrónica por ID.
 */
export const getDianInvoice = async (
  id: number,
): Promise<DianInvoiceRecord> => {
  const response = await api.get(`/dian-invoice/${id}`);
  return response.data;
};

/**
 * Lista las numeraciones/resoluciones disponibles en el proveedor.
 */
export const getNumberTemplates = async (): Promise<NumberTemplate[]> => {
  const response = await api.get('/dian-invoice/number-templates/list');
  return response.data;
};

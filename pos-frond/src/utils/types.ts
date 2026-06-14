export interface AuthData {
  email: string;
  password: string;
}

export enum TypeDocuments {
  CC = 'CC',
  NIT = 'NIT',
}

export enum TypeDocument {
  CC = 'Cédula de Ciudadanía',
  NIT = 'Número de Identificación Tributaria',
  TI = 'Tarjeta de Identidad',
}

export interface ConfigPlugins {
  graf: {
    auth_token: string;
    enabled: boolean;
  };
  meravuelta: {
    auth_token: string;
    enabled: boolean;
  };
  fiar: {
    auth_token: string;
    enabled: boolean;
  };
}

export type Profile = {
  id: number;
  surname?: string;
  phone?: string;
  logo?: string;
  companyName?: string;
  nit?: string;
  dv?: string;
  legalAddress?: string;
  taxRegime?: string;
  pluginsConfig?: ConfigPlugins;
  user?: User;
};

export type User = {
  id: string;
  email: string;
  password?: string;
  name: string;
  apiKey: string;
  profile?: Profile;
};

export interface Client {
  id?: number;
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentNumber?: string;
  routeCode?: string;
  phoneCode?: string;
  typeDocument?: TypeDocument;
  department?: string;
  city?: string;
  neighborhood?: string;
  residentialGroup?: string;
  houseNumber?: string;
  invoices?: Invoice[];
  user?: User;
}

export interface SelectInterface {
  value: string | number,
  label: string,
}

export enum PaymentType {
  GatewayPayment = 'GatewayPayment',
  CashOnDelivery = 'CashOnDelivery',
  AccountReceivable = 'AccountReceivable',
  Fiar = 'Fiar',
}

export enum PaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
}

export interface Invoice {
  id: number;
  date: Date;
  tracking_number: string;
  totalAmount: number;
  client: Client;
  iva?: number,
  withholdingTax?: number,
  consecutive?: number,
  invoiceItems: {
    product: Product;
    sku: string;
    quantity: number;
    productPriceTypeId: number;
    price: number;
    productName: string;
    totalTax?: number;
    totalDiscount?: number;
  }[];
  user?: User;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
}

export interface Product {
  id: number;
  name: string;
  sortName: string;
  description: string;
  image?: string;
  state: boolean;
  priceTypes: ProductPriceType[];
  categories: Category[];
  user?: User;
}

export enum Operators {
  Percentage = '%',
  Subtraction = '-',
}

export interface Discounts {
  id: number;
  name: string;
  value: number;
  operator: Operators;
  user: User;
}

export interface ProductPriceType {
  id?: number;
  product?: Product;
  sku: string;
  category?: CategoryPricing;
  price?: number;
  discounts?: Discounts[];
  taxes?: Taxes[];
  user?: User;
}

export interface Taxes {
  id: number;
  name: string;
  value: number;
  operator: Operators;
  user: User;
}

export interface Category {
  id: number;
  name?: string;
  user?: User;
}

export interface CategoryPricing {
  id: number;
  name: string;
  user?: User;
}

export interface CashBox {
  id?: number;
  cashIn: number;
  cashOut: number;
  balance: number;
  name: string;
  user?: User;
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export interface Webhook {
  id: number;
  bounceRoute: string;
  targetUrl: string;
  httpMethod: HttpMethod;
  user: User;
}

export interface Config {
  iva: number;
  withholdingTax: number;
  initialConsecutive: number;
  finalConsecutive: number;
  currentConsecutive?: number;
  pluginsConfig: ConfigPlugins;
}

export interface RouteApi {
  method: string;
  path: string;
}

export interface ResponseData {
  token: string;
  user: User;
}



import * as classValidator from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ─── Items para factura electrónica ──────────────────────────

class DianTaxDto {
  @ApiPropertyOptional({ description: 'ID del impuesto en Alegra' })
  @classValidator.IsOptional()
  @classValidator.IsNumber()
  id?: number;

  @ApiPropertyOptional({ description: 'Nombre del impuesto', example: 'IVA' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Porcentaje del impuesto',
    example: 19,
  })
  @classValidator.IsOptional()
  @classValidator.IsNumber()
  percentage?: number;
}

class DianItemDto {
  @ApiProperty({ description: 'Nombre del producto/servicio' })
  @classValidator.IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del producto/servicio' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  description?: string;

  @ApiProperty({ description: 'Precio unitario' })
  @classValidator.IsNumber()
  price: number;

  @ApiProperty({ description: 'Cantidad' })
  @classValidator.IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Porcentaje de descuento' })
  @classValidator.IsOptional()
  @classValidator.IsNumber()
  discount?: number;

  @ApiPropertyOptional({
    description: 'Impuestos aplicables',
    type: [DianTaxDto],
  })
  @classValidator.IsOptional()
  @classValidator.IsArray()
  @classValidator.ValidateNested({ each: true })
  @Type(() => DianTaxDto)
  tax?: DianTaxDto[];

  @ApiPropertyOptional({ description: 'SKU del producto' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  sku?: string;
}

// ─── Cliente para factura electrónica ────────────────────────

class DianClientDto {
  @ApiProperty({ description: 'Nombre del cliente' })
  @classValidator.IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Apellido del cliente' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  surname?: string;

  @ApiProperty({
    description: 'Número de identificación',
    example: '900123456',
  })
  @classValidator.IsString()
  identification: string;

  @ApiProperty({
    description: 'Tipo de documento: CC, NIT, CE, TI, PP',
    example: 'CC',
  })
  @classValidator.IsString()
  identificationType: string;

  @ApiPropertyOptional({ description: 'Email del cliente' })
  @classValidator.IsOptional()
  @classValidator.IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono del cliente' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Dirección del cliente' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Ciudad' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Departamento' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Régimen tributario',
    example: 'NOT_RESPONSIBLE_FOR_IVA',
  })
  @classValidator.IsOptional()
  @classValidator.IsString()
  regime?: string;
}

// ─── DTO para emitir factura electrónica ─────────────────────

export class EmitDianInvoiceDto {
  @ApiProperty({
    description: 'ID de la factura del POS a facturar electrónicamente',
  })
  @classValidator.IsNumber()
  invoiceId: number;

  @ApiPropertyOptional({
    description: 'ID de la numeración/resolución a usar en Alegra',
  })
  @classValidator.IsOptional()
  @classValidator.IsString()
  numberTemplateId?: string;

  @ApiPropertyOptional({
    description: 'Método de pago: cash, debit_card, credit_card, transfer',
    example: 'cash',
  })
  @classValidator.IsOptional()
  @classValidator.IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Tipo de pago: CASH (contado), CREDIT (crédito)',
    example: 'CASH',
  })
  @classValidator.IsOptional()
  @classValidator.IsString()
  paymentType?: string;

  @ApiPropertyOptional({ description: 'Observaciones de la factura' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  observations?: string;
}

// ─── DTO para emitir factura libre (sin factura POS previa) ──

export class EmitDianInvoiceFreeDto {
  @ApiProperty({ description: 'Fecha de la factura (YYYY-MM-DD)' })
  @classValidator.IsString()
  date: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento (YYYY-MM-DD)' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  dueDate?: string;

  @ApiProperty({ description: 'Datos del cliente', type: DianClientDto })
  @classValidator.ValidateNested()
  @Type(() => DianClientDto)
  client: DianClientDto;

  @ApiProperty({
    description: 'Ítems de la factura',
    type: [DianItemDto],
  })
  @classValidator.IsArray()
  @classValidator.ValidateNested({ each: true })
  @Type(() => DianItemDto)
  items: DianItemDto[];

  @ApiPropertyOptional({
    description: 'ID de numeración/resolución en Alegra',
  })
  @classValidator.IsOptional()
  @classValidator.IsString()
  numberTemplateId?: string;

  @ApiPropertyOptional({ description: 'Método de pago' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Tipo de pago: CASH, CREDIT' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  paymentType?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  observations?: string;
}

// ─── DTO para nota crédito electrónica ───────────────────────

export class EmitCreditNoteDto {
  @ApiProperty({
    description: 'ID del DianInvoice (factura electrónica) a anular/ajustar',
  })
  @classValidator.IsNumber()
  dianInvoiceId: number;

  @ApiProperty({
    description:
      'Razón: 1=Devolución, 2=Anulación, 3=Descuento, 4=Ajuste precio, 5=Otros',
    example: '1',
  })
  @classValidator.IsString()
  reason: string;

  @ApiPropertyOptional({
    description:
      'Fecha de la nota crédito (YYYY-MM-DD). Si no se envía, se usa hoy.',
  })
  @classValidator.IsOptional()
  @classValidator.IsString()
  date?: string;

  @ApiPropertyOptional({
    description:
      'Ítems a incluir en la nota crédito. Si no se envían, se usa los de la factura original.',
    type: [DianItemDto],
  })
  @classValidator.IsOptional()
  @classValidator.IsArray()
  @classValidator.ValidateNested({ each: true })
  @Type(() => DianItemDto)
  items?: DianItemDto[];

  @ApiPropertyOptional({ description: 'Observaciones' })
  @classValidator.IsOptional()
  @classValidator.IsString()
  observations?: string;
}

// ─── DTO para configurar credenciales del proveedor ──────────

export class ConfigureDianProviderDto {
  @ApiProperty({
    description: 'Nombre del proveedor: alegra',
    example: 'alegra',
  })
  @classValidator.IsString()
  providerName: string;

  @ApiProperty({
    description: 'Email de la cuenta del proveedor (para Alegra)',
  })
  @classValidator.IsString()
  email: string;

  @ApiProperty({
    description: 'Token de API del proveedor',
  })
  @classValidator.IsString()
  token: string;
}

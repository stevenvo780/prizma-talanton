import * as classValidator from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Client } from '../../client/entities/client.entity';
import { PaymentType, PaymentStatus } from '../entities/invoice.entity';

class InvoiceItemDto {
  @classValidator.IsNumber()
  @classValidator.IsOptional()
  @ApiProperty({ description: 'The id of the product', type: Number })
  product: number;

  @classValidator.IsString()
  @classValidator.IsOptional()
  @ApiProperty({
    description: 'The sku of the product',
    type: String,
    required: false,
  })
  sku?: string;

  @classValidator.IsNumber()
  @ApiProperty({ description: 'The quantity of the product', type: Number })
  quantity: number;

  @classValidator.IsNumber()
  @ApiProperty({ description: 'The id of the product type', type: Number })
  productPriceTypeId: number;

  @classValidator.IsNumber()
  @ApiProperty({ description: 'The price of product', type: Number })
  price: number;

  @classValidator.IsString()
  @ApiProperty({ description: 'product name', type: String })
  productName: string;

  @classValidator.IsNumber()
  @ApiProperty({ description: 'withholding Rate', type: Number })
  totalTax: number;

  @classValidator.IsNumber()
  @ApiProperty({ description: 'withholding Rate', type: Number })
  totalDiscount: number;
}

export class CreateInvoiceDto {
  @classValidator.IsNumber()
  @ApiProperty({ description: 'The tracking_number', type: Number })
  tracking_number: number;

  @classValidator.ValidateNested()
  @Type(() => Client)
  @ApiProperty({ description: 'The client', type: Client })
  client: Client;

  @classValidator.IsArray()
  @classValidator.ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  @ApiProperty({
    description: 'The items of the invoice',
    type: InvoiceItemDto,
    isArray: true,
  })
  invoiceItems: InvoiceItemDto[];

  @classValidator.IsDate()
  @ApiProperty({ description: 'The date of the invoice', type: Date })
  date: Date;

  @classValidator.IsNumber()
  @ApiProperty({ description: 'The consecutive of the invoice', type: Number })
  consecutive: number;

  @classValidator.IsNumber()
  @ApiProperty({ description: 'The total amount of the invoice', type: Number })
  totalAmount: number;

  @classValidator.IsNumber()
  @ApiProperty({ description: 'The total IVA', type: Number })
  iva: number;

  @classValidator.IsNumber()
  @ApiProperty({
    description: 'The total amount of withholding tax',
    type: Number,
  })
  withholdingTax: number;

  @classValidator.IsEnum(PaymentType)
  @ApiProperty({
    description: 'The payment type of the invoice',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @classValidator.IsEnum(PaymentStatus)
  @ApiProperty({
    description: 'The payment status of the invoice',
    enum: PaymentStatus,
  })
  paymentStatus: PaymentStatus;
}

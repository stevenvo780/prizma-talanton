import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, PaymentStatus } from '../entities/invoice.entity';

export class FilterInvoiceDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Start date for filtering invoices' })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'End date for filtering invoices' })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Client name or document number' })
  clientSearch?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Client ID' })
  clientId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Start consecutive number' })
  consecutiveStart?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'End consecutive number' })
  consecutiveEnd?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Tracking number' })
  trackingNumber?: number;

  @IsOptional()
  @IsEnum(PaymentType)
  @ApiPropertyOptional({
    description: 'Payment type',
    enum: PaymentType,
  })
  paymentType?: PaymentType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
  })
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Minimum total amount' })
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Maximum total amount' })
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Sort field', default: 'id' })
  sortBy?: string = 'id';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Sort order (ASC/DESC)',
    default: 'DESC',
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

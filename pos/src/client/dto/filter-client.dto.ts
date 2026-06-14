import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeDocument } from '../entities/client.entity';

export class FilterClientDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by name, surname, email, phone or document',
  })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by department' })
  department?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by city' })
  city?: string;

  @IsOptional()
  @IsEnum(TypeDocument)
  @ApiPropertyOptional({
    description: 'Filter by document type',
    enum: TypeDocument,
  })
  typeDocument?: TypeDocument;

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

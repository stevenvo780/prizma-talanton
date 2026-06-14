import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchByCategoryDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'The id of the category', type: Number })
  categoryId?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The query by search product', type: String })
  name?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'The id of the price type', type: Number })
  priceTypeId?: number;
}

export class SearchByNameDto {
  @IsString()
  @ApiProperty({ description: 'The query by search product', type: String })
  query: string;
}

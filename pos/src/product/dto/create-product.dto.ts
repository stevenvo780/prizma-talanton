import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../category/entities/category.entity';
import { ProductPriceType } from '../../product/entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ description: 'The id of the product' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ description: 'The name of the product' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The sort name of the product' })
  @IsString()
  sortName: string;

  @ApiProperty({ description: 'The description of the product' })
  @IsString()
  description?: string;

  @ApiProperty({ description: 'The image of the product' })
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'The price types of the product',
  })
  @IsArray()
  @IsOptional()
  priceTypes?: ProductPriceType[];

  @ApiProperty({
    description: 'The categories of the product',
    type: () => [Category],
  })
  @IsArray()
  categories: Category[];

  @ApiProperty({ description: 'The enable or state product' })
  @IsString()
  state?: string;
}

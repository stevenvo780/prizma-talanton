import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryPricingDto {
  @IsString()
  @ApiProperty({
    description: 'The name of the category pricing',
    type: String,
  })
  name: string;
}

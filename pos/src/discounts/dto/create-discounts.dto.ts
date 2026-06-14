import { IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Operators } from '../entities/discounts.entity';

export class CreateDiscountsDto {
  @IsString()
  @ApiProperty({ description: 'The name of the discounts', type: String })
  name: string;

  @IsNumber()
  @ApiProperty({ description: 'The value of the discounts', type: Number })
  value = 100;

  @IsEnum(Operators)
  @ApiProperty({
    description: 'The operator of the discounts',
    enum: Operators,
    default: Operators.Percentage,
  })
  operator: Operators;
}

import { IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Operators } from '../entities/taxes.entity';

export class CreateTaxesDto {
  @IsString()
  @ApiProperty({ description: 'The name of the tax', type: String })
  name: string;

  @IsNumber()
  @ApiProperty({ description: 'The value of the tax', type: Number })
  value: number;

  @IsEnum(Operators)
  @ApiProperty({
    description: 'The operator of the tax',
    enum: Operators,
    default: Operators.Percentage,
  })
  operator: Operators;
}

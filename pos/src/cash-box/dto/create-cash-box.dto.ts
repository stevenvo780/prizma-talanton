import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class CreateCashBoxDto {
  @IsNumber()
  @ApiProperty({ description: 'The cash in of the cash box', type: Number })
  cashIn: number;

  @IsNumber()
  @ApiProperty({ description: 'The cash out of the cash box', type: Number })
  cashOut: number;

  @IsNumber()
  @ApiProperty({ description: 'The balance of the cash box', type: Number })
  balance: number;

  @IsOptional()
  @ApiProperty({
    description: 'The user of the cash box',
    type: () => User,
  })
  user: User;

  @IsOptional()
  @ApiProperty({
    description:
      'Nombre único de la caja (opcional). Permite buscar por nombre.',
    type: String,
  })
  name?: string;
}

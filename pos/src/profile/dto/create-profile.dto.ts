import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The phone number of the user',
    type: String,
    required: false,
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The company name',
    type: String,
    required: false,
  })
  companyName?: string;

  @IsString()
  @ApiProperty({ description: 'The user ID', type: String })
  userId: string;

  @IsString()
  @ApiProperty({
    description: 'Número de Identificación Tributaria (NIT)',
    type: String,
  })
  nit: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Dígito de verificación del NIT',
    type: String,
    required: false,
  })
  dv?: string;

  @IsString()
  @ApiProperty({
    description: 'Dirección legal para facturación',
    type: String,
  })
  legalAddress: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: 'Correo electrónico para envío de facturas',
    type: String,
    required: false,
  })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Régimen tributario (ej. Responsable IVA, Simplificado)',
    type: String,
    required: false,
  })
  taxRegime?: string;
}

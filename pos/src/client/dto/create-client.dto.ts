import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The name of the client',
    type: String,
    required: false,
  })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The surname of the client',
    type: String,
    required: false,
  })
  surname?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The email of the client',
    type: String,
    required: false,
  })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The phone number of the client',
    type: String,
    required: false,
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The address of the client',
    type: String,
    required: false,
  })
  address?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The document number of the client',
    type: String,
  })
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Route code of the client',
    type: String,
    required: false,
  })
  routeCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Departamento del cliente',
    type: String,
    required: false,
  })
  department?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Ciudad del cliente',
    type: String,
    required: false,
  })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Barrio del cliente',
    type: String,
    required: false,
  })
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Grupo residencial del cliente',
    type: String,
    required: false,
  })
  residentialGroup?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Número de casa o apartamento del cliente',
    type: String,
    required: false,
  })
  houseNumber?: string;
}

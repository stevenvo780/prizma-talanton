import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The unique identifier of the user',
    type: String,
  })
  id: string;

  @IsEmail()
  @ApiProperty({ description: 'The email of the user', type: String })
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The password of the user (handled by Firebase)',
    type: String,
    required: false,
  })
  password?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the user', type: String })
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The API key for external integrations',
    type: String,
  })
  apiKey?: string;
}

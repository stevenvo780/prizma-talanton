import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HttpMethod } from '../entities/webhook.entity';

export class CreateWebhookDto {
  @ApiProperty({ description: 'The bounce route of the webhook' })
  @IsString()
  bounceRoute: string;

  @ApiProperty({ description: 'The target URL of the webhook' })
  @IsString()
  targetUrl: string;

  @ApiProperty({
    description: 'The HTTP method of the webhook',
    enum: HttpMethod,
    default: HttpMethod.GET,
  })
  @IsEnum(HttpMethod)
  httpMethod: HttpMethod;
}

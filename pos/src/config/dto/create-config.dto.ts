import { IsNumber, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConfigPlugins } from '../entities/config.entity';

export class CreateConfigDto {
  @IsNumber()
  @ApiProperty({ description: 'The initial consecutive number', type: Number })
  initialConsecutive: number;

  @IsNumber()
  @ApiProperty({ description: 'The final consecutive number', type: Number })
  finalConsecutive: number;

  @IsNumber()
  @ApiProperty({ description: 'The current Consecutive number', type: Number })
  currentConsecutive?: number;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Plugin configurations',
    type: Object,
    required: false,
  })
  pluginsConfig?: ConfigPlugins;
}

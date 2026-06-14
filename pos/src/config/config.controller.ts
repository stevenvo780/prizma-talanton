import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @ApiOperation({ summary: 'Create a new billing configuration' })
  @ApiCreatedResponse({
    description: 'The billing configuration has been successfully created.',
  })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createConfigDto: CreateConfigDto,
  ) {
    return this.configService.config(createConfigDto, req.user);
  }

  @ApiOperation({ summary: 'Get billing configurations' })
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.configService.get(req.user.id);
  }
}

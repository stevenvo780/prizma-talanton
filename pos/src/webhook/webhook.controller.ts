import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiCreatedResponse({
    description: 'The webhook has been successfully created.',
  })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    return this.webhookService.create(createWebhookDto, req.user);
  }

  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiOkResponse({ description: 'Return all webhooks.' })
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.webhookService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get a webhook by ID' })
  @ApiOkResponse({ description: 'Return a webhook.' })
  @ApiNotFoundResponse({ description: 'Webhook not found.' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.webhookService.findOne(+id, req.user.id);
  }

  @ApiOperation({ summary: 'Update a webhook by ID' })
  @ApiOkResponse({ description: 'The webhook has been successfully updated.' })
  @ApiNotFoundResponse({ description: 'Webhook not found.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto) {
    return this.webhookService.update(+id, updateWebhookDto);
  }

  @ApiOperation({ summary: 'Delete a webhook by ID' })
  @ApiOkResponse({ description: 'The webhook has been successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Webhook not found.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webhookService.remove(+id);
  }
}

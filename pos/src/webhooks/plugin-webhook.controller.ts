import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { PluginWebhookService } from './plugin-webhook.service';
import { PluginResponse } from '../shared/event-bus.service';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';

@ApiTags('Plugin Webhooks')
@Controller('webhooks/plugins')
@UseGuards(ApiKeyAuthGuard)
export class PluginWebhookController {
  constructor(private pluginWebhookService: PluginWebhookService) {}

  @Post(':pluginId/response')
  @ApiOperation({ summary: 'Handle plugin response' })
  @ApiParam({ name: 'pluginId', description: 'Plugin identifier' })
  @ApiBody({
    description: 'Plugin response data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        error: { type: 'string' },
        nextEvents: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin response processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid plugin response' })
  @ApiResponse({ status: 404, description: 'Plugin not found' })
  async handlePluginResponse(
    @Param('pluginId') pluginId: string,
    @Body() response: PluginResponse,
    @Headers('x-trace-id') traceId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Received plugin response from ${pluginId}:`, response);

      await this.pluginWebhookService.processPluginResponse(
        pluginId,
        response,
        traceId,
      );

      return {
        success: true,
        message: 'Plugin response processed successfully',
      };
    } catch (error) {
      console.error(
        `Error processing plugin response from ${pluginId}:`,
        error,
      );
      throw new HttpException(
        error.message || 'Failed to process plugin response',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':pluginId/health')
  @ApiOperation({ summary: 'Handle plugin health check' })
  @ApiParam({ name: 'pluginId', description: 'Plugin identifier' })
  @ApiBody({
    description: 'Plugin health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string', format: 'date-time' },
        metadata: { type: 'object' },
      },
    },
  })
  async handlePluginHealth(
    @Param('pluginId') pluginId: string,
    @Body()
    healthData: {
      status: 'healthy' | 'unhealthy' | 'degraded';
      timestamp: string;
      metadata?: Record<string, any>;
    },
  ): Promise<{ success: boolean }> {
    try {
      await this.pluginWebhookService.updatePluginHealth(pluginId, healthData);
      return { success: true };
    } catch (error) {
      console.error(`Error updating plugin health for ${pluginId}:`, error);
      throw new HttpException(
        'Failed to update plugin health',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

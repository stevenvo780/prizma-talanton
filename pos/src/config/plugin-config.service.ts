import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface PluginConfiguration {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  settings?: Record<string, any>;
  endpoints?: {
    webhook?: string;
    api?: string;
    health?: string;
  };
}

@Injectable()
export class PluginConfigService {
  private pluginOrchestrationUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.pluginOrchestrationUrl =
      this.configService.get<string>('PLUGIN_ORCHESTRATION_URL') ||
      'http://localhost:3200';
  }

  async getPluginConfiguration(
    userId: string,
    pluginId: string,
  ): Promise<PluginConfiguration | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.pluginOrchestrationUrl}/users/${userId}/plugins/${pluginId}/config`,
          {
            headers: {
              'X-API-KEY': this.configService.get<string>(
                'PLUGIN_ORCHESTRATION_API_KEY',
              ),
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get plugin configuration for ${pluginId}:`,
        error,
      );
      return null;
    }
  }

  async getAllPluginConfigurations(
    userId: string,
  ): Promise<PluginConfiguration[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.pluginOrchestrationUrl}/users/${userId}/plugins/config`,
          {
            headers: {
              'X-API-KEY': this.configService.get<string>(
                'PLUGIN_ORCHESTRATION_API_KEY',
              ),
            },
          },
        ),
      );
      return response.data || [];
    } catch (error) {
      console.error('Failed to get all plugin configurations:', error);
      return [];
    }
  }

  async updatePluginConfiguration(
    userId: string,
    pluginId: string,
    config: Partial<PluginConfiguration>,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.pluginOrchestrationUrl}/users/${userId}/plugins/${pluginId}/config`,
          config,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': this.configService.get<string>(
                'PLUGIN_ORCHESTRATION_API_KEY',
              ),
            },
          },
        ),
      );
      return true;
    } catch (error) {
      console.error(
        `Failed to update plugin configuration for ${pluginId}:`,
        error,
      );
      return false;
    }
  }

  async isPluginEnabled(userId: string, pluginId: string): Promise<boolean> {
    const config = await this.getPluginConfiguration(userId, pluginId);
    return config?.enabled || false;
  }

  async getPluginApiKey(
    userId: string,
    pluginId: string,
  ): Promise<string | null> {
    const config = await this.getPluginConfiguration(userId, pluginId);
    return config?.apiKey || null;
  }

  // Fallback methods for backward compatibility with existing config
  async getPluginConfigFromLocal(userId: string): Promise<Record<string, any>> {
    // This method can be used as fallback when plugin orchestration service is unavailable
    // It should read from the existing config.entity.ts pluginsConfig field
    return {
      pistis: { enabled: false, auth_token: '' },
      talaria: { enabled: false, auth_token: '' },
      hermes: { enabled: false, auth_token: '' },
    };
  }

  async migrateLocalConfigToExternal(
    userId: string,
    localConfig: Record<string, any>,
  ): Promise<void> {
    // Helper method to migrate existing plugin configurations to external registry
    for (const [pluginId, config] of Object.entries(localConfig)) {
      if (config && typeof config === 'object') {
        const pluginConfig: Partial<PluginConfiguration> = {
          id: pluginId,
          name: pluginId,
          enabled: config.enabled || false,
          apiKey: config.auth_token || config.apiKey,
          settings: config,
        };

        await this.updatePluginConfiguration(userId, pluginId, pluginConfig);
      }
    }
  }
}

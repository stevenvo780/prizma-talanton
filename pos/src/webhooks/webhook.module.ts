import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PluginWebhookController } from './plugin-webhook.controller';
import { PluginWebhookService } from './plugin-webhook.service';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { Invoice } from '../invoice/entities/invoice.entity';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Invoice]),
    SharedModule,
    UserModule,
  ],
  controllers: [PluginWebhookController],
  providers: [PluginWebhookService],
  exports: [PluginWebhookService],
})
export class WebhookModule {}

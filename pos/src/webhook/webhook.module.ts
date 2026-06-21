import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Webhook } from './entities/webhook.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { NousConnectorController } from './nous-connector.controller';
import { NousConnectorService } from './nous-connector.service';
import { UserModule } from '../user/user.module';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, Invoice, Product]),
    UserModule,
  ],
  controllers: [WebhookController, NousConnectorController],
  providers: [WebhookService, NousConnectorService],
  exports: [WebhookService, NousConnectorService],
})
export class WebhookModule {}

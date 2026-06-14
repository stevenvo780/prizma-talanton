import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '../config/config.module';
import { CashBoxModule } from '../cash-box/cash-box.module';
import { Product } from '../product/entities/product.entity';
import { Client } from '../client/entities/client.entity';
import { MailjetModule } from '../mailjet/mailjet.module';
import { SharedModule } from '../shared/shared.module';
import { HubCentralModule } from '../hubcentral/hubcentral.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Client, Product]),
    UserModule,
    ConfigModule,
    CashBoxModule,
    MailjetModule,
    SharedModule,
    HubCentralModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}

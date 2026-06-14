import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DianInvoiceService } from './dian-invoice.service';
import { DianInvoiceController } from './dian-invoice.controller';
import { DianInvoice } from './entities/dian-invoice.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Profile } from '../profile/entities/profile.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DianInvoice, Invoice, Profile]),
    UserModule,
  ],
  controllers: [DianInvoiceController],
  providers: [DianInvoiceService],
  exports: [DianInvoiceService],
})
export class DianInvoiceModule {}

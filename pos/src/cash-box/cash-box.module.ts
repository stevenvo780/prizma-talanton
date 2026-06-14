import { Module } from '@nestjs/common';
import { CashBoxService } from './cash-box.service';
import { CashBoxController } from './cash-box.controller';
import { UserModule } from '../user/user.module';
import { CashBox } from './entities/cash-box.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CashBox]), UserModule],
  controllers: [CashBoxController],
  providers: [CashBoxService],
  exports: [CashBoxService],
})
export class CashBoxModule {}

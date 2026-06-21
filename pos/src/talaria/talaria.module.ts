import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TalariaService } from './talaria.service';
import { User } from 'src/user/entities/user.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([User, Invoice]),
    ConfigModule,
  ],
  providers: [TalariaService],
  exports: [TalariaService],
})
export class TalariaModule {}

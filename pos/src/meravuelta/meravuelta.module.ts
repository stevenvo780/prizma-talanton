import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeraVueltaService } from './meravuelta.service';
import { User } from 'src/user/entities/user.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([User, Invoice]),
    ConfigModule,
  ],
  providers: [MeraVueltaService],
  exports: [MeraVueltaService],
})
export class MeraVueltaModule {}

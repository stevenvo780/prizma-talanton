import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EventBusService } from './event-bus.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class SharedModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HermesService } from './hermes.service';

@Module({
  imports: [HttpModule],
  providers: [HermesService],
  exports: [HermesService],
})
export class HermesModule {}

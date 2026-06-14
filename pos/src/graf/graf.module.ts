import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GrafService } from './graf.service';

@Module({
  imports: [HttpModule],
  providers: [GrafService],
  exports: [GrafService],
})
export class GrafModule {}

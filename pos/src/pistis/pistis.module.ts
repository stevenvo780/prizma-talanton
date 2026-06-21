import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PistisService } from './pistis.service';

@Module({
  imports: [HttpModule],
  providers: [PistisService],
  exports: [PistisService],
})
export class PistisModule {}

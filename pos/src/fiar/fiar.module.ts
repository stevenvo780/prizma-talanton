import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FiarService } from './fiar.service';

@Module({
  imports: [HttpModule],
  providers: [FiarService],
  exports: [FiarService],
})
export class FiarModule {}

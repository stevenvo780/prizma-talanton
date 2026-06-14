import { Module } from '@nestjs/common';
import { MailjetService } from './mailjet.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [MailjetService],
  exports: [MailjetService],
})
export class MailjetModule {}

import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  imports: [],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

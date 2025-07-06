import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';
import { UserDigestPreference } from './entities/user-digest-preference.entity';
import { DigestLog } from './entities/digest-log.entity';
import { UserModule } from '../users/user.module';
import { SignalsModule } from '../signals/signals.module';
import { VoteModule } from '../voting/voting.module';
import { TokenModule } from '../token/token.module';
import { MailModule } from '../mail/mail.module';
import { WebhookModule } from '../web-hook/web-hook.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([UserDigestPreference, DigestLog]),
    UserModule,
    SignalsModule,
    VoteModule,
    SharedModule,
    TokenModule,
    MailModule,
    WebhookModule,
  ],
  controllers: [DigestController],
  providers: [DigestService],
  exports: [DigestService],
})
export class DigestModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';
import { UserDigestPreference } from './entities/user-digest-preference.entity';
import { DigestLog } from './entities/digest-log.entity';
import { UserModule } from '../user/user.module';
import { SignalModule } from '../signal/signal.module';
import { VoteModule } from '../vote/vote.module';
import { ReputationModule } from '../reputation/reputation.module';
import { TokenModule } from '../token/token.module';
import { MailModule } from '../mail/mail.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([UserDigestPreference, DigestLog]),
    UserModule,
    SignalModule,
    VoteModule,
    ReputationModule,
    TokenModule,
    MailModule,
    WebhookModule,
  ],
  controllers: [DigestController],
  providers: [DigestService],
  exports: [DigestService],
})
export class DigestModule {}
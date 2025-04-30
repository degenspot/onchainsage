import { Module } from '@nestjs/common';
import { SignalAuditController } from './signal-audit.controller';
import { SignalAuditService } from './provider/signal-audit.service';
import { SignalAudit } from './signalAudit.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SignalAudit])],
  controllers: [SignalAuditController],
  providers: [SignalAuditService]
})
export class SignalAuditModule {}
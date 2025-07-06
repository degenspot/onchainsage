// src/signals/signal-audit.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignalAudit } from '../signalAudit.entity';
import { CreateSignalAuditDto } from '../dto/createSignalAuditDto';

@Injectable()
export class SignalAuditService {
  constructor(
    @InjectRepository(SignalAudit)
    private readonly auditRepo: Repository<SignalAudit>,
  ) {}

  async create(dto: CreateSignalAuditDto) {
    const audit = this.auditRepo.create(dto);
    return this.auditRepo.save(audit);
  }

  async findOne(id: string) {
    const audit = await this.auditRepo.findOne({ where: { id } });
    if (!audit) throw new NotFoundException('Signal audit not found');
    return audit;
  }
}

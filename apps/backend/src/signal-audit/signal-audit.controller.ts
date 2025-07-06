// src/signals/signal-audit.controller.ts
import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SignalAuditService } from './provider/signal-audit.service';

@Controller('audit/signal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SignalAuditController {
  constructor(private readonly auditService: SignalAuditService) {}

  @Get(':id')
  async getSignalAudit(@Param('id') id: string, @Req() req) {
    const audit = await this.auditService.findOne(id);

    const isOwner = audit.owner.id === req.user.id;
    const isAdmin = req.user.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      return { message: 'Forbidden: You do not have access to this log' };
    }

    return {
      id: audit.id,
      model: `${audit.modelName} v${audit.modelVersion}`,
      prompt: audit.inputPrompt,
      confidenceScore: audit.confidenceScore,
      importantTokens: audit.importantTokens,
      createdAt: audit.createdAt,
    };
  }
}

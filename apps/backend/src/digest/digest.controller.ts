import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { DigestService } from './digest.service';
import { UpdateDigestPreferenceDto } from './dto/update-digest-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('user/preferences')
@UseGuards(JwtAuthGuard)
export class DigestController {
  constructor(private readonly digestService: DigestService) {}

  @Post('digest')
  async updateDigestPreferences(
    @Req() req: Request,
    @Body() updateDigestPreferenceDto: UpdateDigestPreferenceDto,
  ) {
    const userId = req.user['id'];
    return this.digestService.updateUserPreferences(userId, updateDigestPreferenceDto);
  }
}
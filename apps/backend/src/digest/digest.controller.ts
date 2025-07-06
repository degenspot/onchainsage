import { Controller, Post, Body, UseGuards, Req, Get, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DigestService } from './digest.service';
import { UpdateDigestPreferenceDto } from './dto/update-digest-preference.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Logger } from '@nestjs/common';

@Controller('digest')
export class DigestController {
  private readonly logger = new Logger(DigestController.name);

  constructor(private readonly digestService: DigestService) {}

  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(@Req() req, @Body() updateDigestPreferenceDto: UpdateDigestPreferenceDto) {
    const userId = (req as any).user?.id || null;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.digestService.updateUserPreferences(userId, updateDigestPreferenceDto);
  }

  @Get('generate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Generate a daily digest (Admin only)' })
  @ApiResponse({ status: 200, description: 'Digest generated successfully' })
  async generateDigest() {
    try {
      return await this.digestService.generateDailyDigest();
    } catch (error) {
      this.logger.error(`Failed to generate digest: ${error.message}`, error.stack);
      throw new HttpException('Failed to generate digest', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
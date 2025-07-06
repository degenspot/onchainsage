import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('suggested')
  @UseGuards(JwtAuthGuard)
  async getSuggestedTokens() {
    return this.tokenService.getSuggestedTokens();
  }

  @Get(':id')
  async getTokenById(@Param('id') id: string) {
    return this.tokenService.getTokenById(id);
  }
} 
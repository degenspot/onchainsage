import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  StarknetChallengeDto,
  StarknetVerifyDto,
  StarknetAuthResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('starknet/challenge')
  @HttpCode(HttpStatus.OK)
  async getChallenge(@Body() challengeDto: StarknetChallengeDto) {
    return this.authService.generateChallenge(challengeDto.walletAddress);
  }

  @Post('starknet/verify')
  @HttpCode(HttpStatus.OK)
  async verifySignature(
    @Body() verifyDto: StarknetVerifyDto,
  ): Promise<StarknetAuthResponseDto> {
    return this.authService.verifySignature(
      verifyDto.walletAddress,
      verifyDto.signature,
      verifyDto.message,
      verifyDto.metadata,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

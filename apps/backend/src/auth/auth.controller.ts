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
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  StarknetChallengeDto,
  StarknetVerifyDto,
  StarknetAuthResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Keep existing endpoints
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  // Add new endpoints for Starknet wallet authentication
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
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

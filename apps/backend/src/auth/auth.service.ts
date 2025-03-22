import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  StarknetAuthResponseDto,
} from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
import {
  verifyStarknetSignature,
  generateChallenge,
} from '../utils/starknetUtils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  register(registerDto: RegisterDto): Promise<RegisterDto> {
    return Promise.resolve({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  login(loginDto: LoginDto): Promise<AuthResponseDto> {
    return Promise.resolve({
      accessToken: 'access-token',
      user: {
        id: 1,
        username: loginDto.username,
      },
    });
  }

  // Add new methods for Starknet wallet authentication
  async generateChallenge(
    walletAddress: string,
  ): Promise<{ challenge: string }> {
    // Find or create user
    let user = await this.usersRepository.findOne({ where: { walletAddress } });

    if (!user) {
      user = this.usersRepository.create({
        walletAddress,
      });
    }

    // Generate a new challenge
    const challenge = generateChallenge();

    // Update user with new challenge
    user.lastChallenge = challenge;
    user.lastChallengeAt = new Date();
    await this.usersRepository.save(user);

    return { challenge };
  }

  async verifySignature(
    walletAddress: string,
    signature: string[],
    message: string,
  ): Promise<StarknetAuthResponseDto> {
    // Find user
    const user = await this.usersRepository.findOne({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify the signature
    const isValid = await verifyStarknetSignature(
      walletAddress,
      signature,
      message,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Update user login info
    user.lastLoginAt = new Date();
    user.isVerified = true;
    await this.usersRepository.save(user);

    // Generate JWT token
    const payload = {
      sub: user.id,
      walletAddress: user.walletAddress,
    };

    return new StarknetAuthResponseDto({
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
      },
    });
  }
}

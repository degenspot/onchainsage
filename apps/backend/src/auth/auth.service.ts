import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StarknetAuthResponseDto } from './dto/auth.dto';
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

  async generateChallenge(
    walletAddress: string,
  ): Promise<{ challenge: string }> {
    let user = await this.usersRepository.findOne({ where: { walletAddress } });

    if (!user) {
      user = this.usersRepository.create({
        walletAddress,
      });
    }

    const challenge = generateChallenge();
    user.lastChallenge = challenge;
    user.lastChallengeAt = new Date();
    await this.usersRepository.save(user);

    return { challenge };
  }

  async verifySignature(
    walletAddress: string,
    signature: string[],
    message: string,
    metadata?: {
      discordUsername?: string;
      telegramUsername?: string;
      email?: string;
    },
  ): Promise<StarknetAuthResponseDto> {
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

    // Update user metadata if provided
    if (metadata) {
      if (metadata.email) {
        user.email = metadata.email;
      }
      
      if (metadata.discordUsername || metadata.telegramUsername) {
        user.metadata = {
          ...user.metadata,
          discordUsername: metadata.discordUsername || user.metadata?.discordUsername,
          telegramUsername: metadata.telegramUsername || user.metadata?.telegramUsername,
        };
      }
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
        email: user.email,
        discordId: user.discordId,
        telegramId: user.telegramId,
        metadata: user.metadata,
      },
    });
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

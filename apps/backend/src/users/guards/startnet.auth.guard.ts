import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { verifyStarknetMessage } from '../utils/startnet';

@Injectable()
export class StarknetAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify the Starknet token and extract wallet address
      const { walletAddress, signature, message } = JSON.parse(
        Buffer.from(token, 'base64').toString(),
      );

      // Verify the signature using Starknet wallet
      const isValid = await verifyStarknetMessage(
        walletAddress,
        message,
        signature,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }

      // Find user by wallet address
      let user = await this.userRepository.findOne({
        where: { walletAddress },
      });

      // Create user if not exists
      if (!user) {
        user = new User();
        user.walletAddress = walletAddress;
        user = await this.userRepository.save(user);
      }

      // Attach user to request object
      request.user = user;

      return true;
    } catch (_error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}

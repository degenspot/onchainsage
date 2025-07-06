import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { verifyMessage } from 'ethers';

@Injectable()
export class WalletAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Verify wallet ownership via signature (if needed)
      if (request.headers['x-wallet-signature']) {
        const isValidSignature = await this.verifyWalletSignature(
          payload.walletAddress,
          request.headers['x-wallet-signature'],
          payload.nonce,
        );

        if (!isValidSignature) {
          throw new UnauthorizedException('Invalid wallet signature');
        }
      }

      // Add user to request
      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token or signature');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async verifyWalletSignature(
    walletAddress: string,
    signature: string,
    nonce: string,
  ): Promise<boolean> {
    try {
      // Message that was signed
      const message = `OnChain Sage Authentication\nNonce: ${nonce}`;

      // Recover the address from the signature
      const recoveredAddress = verifyMessage(message, signature);

      // Compare the recovered address with the wallet address
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch {
      return false;
    }
  }
}

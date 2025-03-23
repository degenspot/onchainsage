import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class StarknetAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Extract user_id from the token (mock implementation)
    const token = authHeader.split(' ')[1];
    const user_id = this.extractUserIdFromToken(token); // Replace with actual logic

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req['user_id'] = user_id; // Attach user_id to the request object
    next();
  }

  private extractUserIdFromToken(token: string): string | null {
    // Mock implementation: Replace with actual token decoding logic
    return token === 'valid-token' ? 'user-123' : null;
  }
}
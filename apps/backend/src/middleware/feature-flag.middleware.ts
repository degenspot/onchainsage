import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FeatureFlagsService } from '../config/feature-flags';

@Injectable()
export class FeatureFlagMiddleware implements NestMiddleware {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;
    
    // Check for signals endpoint
    if (path.startsWith('/signals') && !this.featureFlagsService.isEnabled('signals_enabled')) {
      return res.status(503).json({
        statusCode: 503,
        message: 'This feature is currently disabled',
      });
    }
    
    // Check for user preferences endpoint
    if (path.startsWith('/users/preferences') && !this.featureFlagsService.isEnabled('user_preferences_enabled')) {
      return res.status(503).json({
        statusCode: 503,
        message: 'This feature is currently disabled',
      });
    }
    
    next();
  }
}


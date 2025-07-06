import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeatureFlagsService {
  private flags: Record<string, boolean> = {};

  constructor(private configService: ConfigService) {
    // Load feature flags from environment or configuration
    this.flags['signals_enabled'] = this.configService.get<boolean>('FEATURE_SIGNALS_ENABLED', true);
    this.flags['user_preferences_enabled'] = this.configService.get<boolean>('FEATURE_USER_PREFERENCES_ENABLED', true);
    // Add more feature flags as needed
  }

  isEnabled(flag: string): boolean {
    return this.flags[flag] || false;
  }

  getAllFlags(): Record<string, boolean> {
    return { ...this.flags };
  }

  setFlag(flag: string, enabled: boolean): void {
    this.flags[flag] = enabled;
  }
} 
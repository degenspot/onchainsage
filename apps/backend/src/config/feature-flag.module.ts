import { Module } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flag';

@Module({
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagModule {} 
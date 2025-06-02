import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FeatureFlagsService } from '../config/feature-flags';

@Controller('admin/feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  getAllFlags() {
    return this.featureFlagsService.getAllFlags();
  }

  @Post(':flagName')
  async setFlag(
    @Param('flagName') flagName: string,
    @Body() body: { enabled: boolean },
  ) {
    await this.featureFlagsService.setFlag(flagName, body.enabled);
    return { success: true, flag: flagName, enabled: body.enabled };
  }
}
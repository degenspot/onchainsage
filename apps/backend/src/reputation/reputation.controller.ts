import { Controller, Get, Param } from '@nestjs/common';
import { ReputationService } from './reputation.service';

@Controller()
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('leaderboard')
  getLeaderboard() {
    return this.reputationService.getLeaderboard();
  }

  @Get('profile/:address')
  getProfile(@Param('address') address: string) {
    return this.reputationService.getProfile(address);
  }
}

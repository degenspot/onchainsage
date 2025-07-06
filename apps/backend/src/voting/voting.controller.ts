import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VoteService } from './vote.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('voting')
export class VotingController {
  constructor(private readonly voteService: VoteService) {}

  @Post(':signalId/vote')
  @UseGuards(JwtAuthGuard)
  async vote(
    @Param('signalId') signalId: string,
    @Body('voteType') voteType: 'upvote' | 'downvote',
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.voteService.castVote(userId, signalId, voteType);
  }
} 
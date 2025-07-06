import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VotingHistory } from './entities/voting-history.entity';

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(VotingHistory)
    private voteRepository: Repository<VotingHistory>,
  ) {}

  async castVote(
    userId: string,
    signalId: string,
    voteType: 'upvote' | 'downvote',
  ) {
    const vote = this.voteRepository.create({
      userId,
      signalId,
      voteType,
      createdAt: new Date(),
    });
    return this.voteRepository.save(vote);
  }

  // Placeholder for other vote-related methods
}

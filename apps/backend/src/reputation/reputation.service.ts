import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { ReputationAdjustment } from './entities/reputation-adjustment.entity';

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(Vote)
    private voteRepo: Repository<Vote>,
    @InjectRepository(ReputationAdjustment)
    private adjustRepo: Repository<ReputationAdjustment>,
  ) {}

  async calculateReputation(address: string): Promise<number> {
    const votes = await this.voteRepo.find({ where: { address } });
    const adjustments = await this.adjustRepo.find({ where: { address } });

    const totalStake = votes.reduce((sum, v) => sum + Number(v.stake), 0);
    const wins = votes.filter(v => v.voteResult).length;
    const accuracy = votes.length > 0 ? wins / votes.length : 0;
    const totalAdjustments = adjustments.reduce((sum, a) => sum + Number(a.adjustment), 0);

    return accuracy * totalStake + totalAdjustments;
  }

  async getLeaderboard(): Promise<{ address: string; reputation: number }[]> {
    const allAddresses = await this.voteRepo
      .createQueryBuilder('vote')
      .select('DISTINCT vote.address', 'address')
      .getRawMany();

    const scores = await Promise.all(
      allAddresses.map(async ({ address }) => ({
        address,
        reputation: await this.calculateReputation(address),
      })),
    );

    return scores
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 100);
  }

  async getProfile(address: string) {
    const votes = await this.voteRepo.find({ where: { address }, order: { timestamp: 'ASC' } });
    const totalVotes = votes.length;
    const wins = votes.filter(v => v.voteResult).length;
    const accuracy = totalVotes > 0 ? wins / totalVotes : 0;
    const stakeHistory = votes.map(v => ({
      stake: Number(v.stake),
      timestamp: v.timestamp,
    }));

    const reputation = await this.calculateReputation(address);

    return {
      address,
      reputation,
      votes: totalVotes,
      wins,
      accuracy,
      stakeHistory,
    };
  }
}

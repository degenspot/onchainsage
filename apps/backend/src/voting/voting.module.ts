import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotingController } from './voting.controller';
import { VoteService } from './vote.service';
import { VotingHistory } from './entities/voting-history.entity';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VotingHistory]),
    UserModule,
  ],
  controllers: [VotingController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {} 
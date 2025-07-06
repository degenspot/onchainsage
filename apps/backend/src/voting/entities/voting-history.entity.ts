import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('voting_history')
export class VotingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  signalId: string;

  @Column({ type: 'enum', enum: ['upvote', 'downvote'] })
  voteType: 'upvote' | 'downvote';

  @CreateDateColumn()
  createdAt: Date;
}

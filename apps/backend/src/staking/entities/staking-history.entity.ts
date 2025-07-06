import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('staking_history')
export class StakingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  tokenId: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: number;

  @Column()
  action: string;

  @CreateDateColumn()
  createdAt: Date;
}

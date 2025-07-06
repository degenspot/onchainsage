import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column({ type: 'boolean' })
  voteResult: boolean;

  @Column({ type: 'numeric' })
  stake: number;

  @CreateDateColumn()
  timestamp: Date;
}

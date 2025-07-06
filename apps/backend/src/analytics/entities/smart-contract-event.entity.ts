import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EventType {
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  SIGNAL = 'signal',
  VOTE = 'vote',
  SIGNAL_REGISTERED = 'signal_registered',
  VOTE_RESOLVED = 'vote_resolved',
  REPUTATION_CHANGED = 'reputation_changed',
  REWARD_CLAIMED = 'reward_claimed',
  SIGNAL_EXPIRED = 'signal_expired',
  SIGNAL_FLAGGED = 'signal_flagged',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  APPROVAL = 'approval',
  TRADE = 'trade',
  MINT = 'mint',
  BURN = 'burn',
}

@Entity('smart_contract_events')
export class SmartContractEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 42 })
  @Index()
  address: string;

  @Column({ type: 'varchar', length: 66 })
  @Index()
  transactionHash: string;

  @Column({ type: 'integer' })
  blockNumber: number;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @Column({ type: 'enum', enum: EventType })
  @Index()
  eventType: EventType;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  transactionHash: string;

  @Column()
  @Index()
  senderAddress: string;

  @Column()
  @Index()
  recipientAddress: string;

  @Column('decimal', { precision: 20, scale: 8 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['DEPOSIT', 'UPGRADE', 'CALL_FEE', 'TRANSFER', 'REFUND', 'BATCH'],
    default: 'TRANSFER',
  })
  @Index()
  type: 'DEPOSIT' | 'UPGRADE' | 'CALL_FEE' | 'TRANSFER' | 'REFUND' | 'BATCH';

  @Column({
    type: 'enum',
    enum: ['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  })
  @Index()
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';

  @Column({ nullable: true })
  reference: string | null;

  @Column({ nullable: true })
  refundTransactionHash: string | null;

  @Column({ nullable: true })
  scheduledPaymentId: string | null;

  @Column({ nullable: true })
  batchId: string | null;

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}

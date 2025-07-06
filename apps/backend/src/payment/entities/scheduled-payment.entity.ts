import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentPeriod } from '../dto/payment.dto';

@Entity()
export class ScheduledPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderAddress: string;

  @Column()
  recipientAddress: string;

  @Column('decimal', { precision: 20, scale: 8 })
  amount: number;

  @Column()
  scheduledDate: Date;

  @Column({ default: false })
  recurring: boolean;

  @Column({
    type: 'enum',
    enum: PaymentPeriod,
    nullable: true,
  })
  recurrencePeriod: PaymentPeriod | null;

  @Column({ nullable: true })
  recurrenceCount: number | null;

  @Column({ nullable: true })
  reference: string | null;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'FAILED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';

  @Column({ nullable: true })
  transactionHash: string | null;

  @Column({ nullable: true })
  lastExecutionDate: Date | null;

  @Column({ default: 0 })
  executionCount: number;

  @Column({ nullable: true })
  nextExecutionDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

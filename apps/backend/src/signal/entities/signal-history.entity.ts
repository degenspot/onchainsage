import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('signal_history')
export class SignalHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  signalId: string;

  @Column()
  action: string;

  @CreateDateColumn()
  createdAt: Date;
} 
// src/signals/entities/signal-audit.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity'; // adjust path as needed

@Entity('signal_audits')
export class SignalAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  inputPrompt: string;

  @Column()
  modelName: string;

  @Column()
  modelVersion: string;

  @Column('float')
  confidenceScore: number;

  @Column({ type: 'jsonb', nullable: true })
  importantTokens: any;

  @ManyToOne(() => User, (user) => user.signalAudits, { eager: true })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;
}

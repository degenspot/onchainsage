import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DigestType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

@Entity('digest_logs')
export class DigestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: DigestType,
  })
  type: DigestType;

  @Column({ type: 'timestamp' })
  sentAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}

// src/notification/entities/webhook-registration.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['userId'])
export class WebhookRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ default: 'POST' })
  method: string;

  @Column({ type: 'jsonb', default: {} })
  headers: Record<string, string>;

  @Column({ type: 'simple-array', default: '' })
  eventTypes: string[];

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ nullable: true })
  verificationExpiresAt: Date;

  @Column({ type: 'jsonb', default: {} })
  configuration: {
    retryStrategy?: {
      maxRetries: number;
      initialDelay: number;
      backoffMultiplier: number;
    };
    rateLimit?: {
      maxPerMinute: number;
    };
    secretKey?: string;
    timeout?: number;
  };

  @Column({ default: 0 })
  failureCount: number;

  @Column({ nullable: true })
  lastFailureAt: Date;

  @Column({ nullable: true })
  lastSuccessAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

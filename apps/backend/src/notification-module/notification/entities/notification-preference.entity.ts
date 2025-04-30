// src/notification/entities/notification-preference.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EventType } from '../../../analytics/entities/smart-contract-event.entity';

export enum NotificationChannel {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  IN_APP = 'in-app',
}

@Entity()
@Index(['userId', 'eventType'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  eventType: EventType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP],
  })
  channels: NotificationChannel[];

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailAddress: string;

  @Column({ type: 'varchar', nullable: true })
  webhookUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  webhookConfig: {
    headers?: Record<string, string>;
    retryStrategy?: {
      maxRetries: number;
      initialDelay: number;
      backoffMultiplier: number;
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

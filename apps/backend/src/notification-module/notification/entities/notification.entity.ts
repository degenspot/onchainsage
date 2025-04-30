// src/notification/entities/notification.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';
import { DeliveryRecord } from './delivery-record.entity';

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  IN_APP = 'in-app',
}

@Entity()
@Index(['userId', 'status'])
@Index(['createdAt'])
@Index(['priority'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP],
  })
  channels: NotificationChannel[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  lastRetryAt: Date;

  @ManyToOne(() => NotificationTemplate, { nullable: true })
  template: NotificationTemplate;

  @Column({ nullable: true })
  templateId: string;

  @OneToMany(() => DeliveryRecord, (record) => record.notification)
  deliveryRecords: DeliveryRecord[];

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
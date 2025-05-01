// src/notification/entities/delivery-record.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Notification, NotificationChannel } from './notification.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRY_SCHEDULED = 'retry_scheduled',
}

@Entity()
@Index(['notificationId', 'channel', 'status'])
export class DeliveryRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  notificationId: string;

  @ManyToOne(() => Notification, (notification) => notification.deliveryRecords)
  notification: Notification;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ nullable: true })
  externalId: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
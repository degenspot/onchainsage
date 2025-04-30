// src/notification/entities/notification-preference.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NotificationChannel } from './notification.entity';

@Entity()
@Index(['userId', 'eventType'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  eventType: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP],
  })
  channels: NotificationChannel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
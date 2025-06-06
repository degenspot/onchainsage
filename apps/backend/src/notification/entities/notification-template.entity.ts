// src/notification/entities/notification-template.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NotificationChannel } from './notification.entity';

@Entity()
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  eventType: string;

  @Column({ type: 'text' })
  titleTemplate: string;

  @Column({ type: 'text' })
  contentTemplate: string;

  @Column({ type: 'jsonb', nullable: true })
  channelSpecificTemplates: {
    [channel in NotificationChannel]?: {
      titleTemplate?: string;
      contentTemplate: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
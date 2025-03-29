// src/notifications/entities/user-notification-setting.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationChannel, SignalType } from '../dto/notification-preference.dto';

@Entity()
export class UserNotificationSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column('enum', { 
    enum: NotificationChannel, 
    array: true, 
    default: [NotificationChannel.EMAIL] 
  })
  preferredChannels: NotificationChannel[];

  @Column('enum', { 
    enum: SignalType, 
    array: true, 
    default: [SignalType.HIGH_CONFIDENCE] 
  })
  enabledSignalTypes: SignalType[];

  @Column({ default: true })
  isEnabled: boolean;
}
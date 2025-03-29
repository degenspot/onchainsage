
// src/notifications/services/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationChannel, SignalType, UpdateNotificationPreferencesDto } from '../dto/notification-preference.dto';
import { User } from '../../users/entities/user.entity';
import { WebSocketGateway } from '../websocket/websocket.getway';
import { MailerService } from '@nestjs-modules/mailer';
import { UserNotificationSetting } from '../entities/user-notificationsetting.entity';


@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(UserNotificationSetting)
    private notificationSettingsRepository: Repository<UserNotificationSetting>,
    private websocketGateway: WebSocketGateway,
    private mailService: MailerService
  ) {}

  async updateUserNotificationPreferences(
    user: User, 
    preferences: UpdateNotificationPreferencesDto
  ) {
    let setting = await this.notificationSettingsRepository.findOne({ 
      where: { user: { id: user.id } } 
    });

    if (!setting) {
      setting = new UserNotificationSetting();
      setting.user = user;
    }

    setting.enabledSignalTypes = preferences.enabledSignalTypes;
    setting.preferredChannels = preferences.preferredChannels;
    setting.isEnabled = preferences.isEnabled;

    return this.notificationSettingsRepository.save(setting);
  }

  async sendNotification(
    user: User, 
    signalType: SignalType, 
    message: string
  ) {
    const settings = await this.notificationSettingsRepository.findOne({
      where: { user: { id: user.id } }
    });

    if (!settings || !settings.isEnabled) return;

    if (settings.enabledSignalTypes.includes(signalType)) {
     
      }

      if (settings.preferredChannels.includes(NotificationChannel.EMAIL)) {
        await this.mailService.addTransporter(
          user.email, 
          signalType,      
        );
      }
    }
  }

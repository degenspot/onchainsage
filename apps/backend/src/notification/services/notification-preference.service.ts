import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from '../entities/notification-preference.entity';
import {
  UpdateNotificationPreferenceDto,
  BulkUpdateNotificationPreferencesDto,
} from '../dto/notification-preference.dto';
import { EventType } from '../../../analytics/entities/smart-contract-event.entity';

@Injectable()
export class NotificationPreferenceService {
  constructor(
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({ where: { userId } });
  }

  async getPreference(
    userId: string,
    eventType: EventType,
  ): Promise<NotificationPreference> {
    const preference = await this.preferenceRepository.findOne({
      where: { userId, eventType },
    });

    if (!preference) {
      throw new NotFoundException(
        `Preference not found for event type ${eventType}`,
      );
    }

    return preference;
  }

  async updatePreference(
    userId: string,
    eventType: EventType,
    updateDto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId, eventType },
    });

    if (!preference) {
      preference = this.preferenceRepository.create({
        userId,
        eventType,
      });
    }

    Object.assign(preference, updateDto);
    return this.preferenceRepository.save(preference);
  }

  async updatePreferences(
    userId: string,
    updateDto: BulkUpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference[]> {
    const results: NotificationPreference[] = [];

    for (const prefDto of updateDto.preferences) {
      let preference = await this.preferenceRepository.findOne({
        where: { userId, eventType: prefDto.eventType },
      });

      if (!preference) {
        preference = this.preferenceRepository.create({
          userId,
          eventType: prefDto.eventType,
        });
      }

      Object.assign(preference, prefDto);
      results.push(await this.preferenceRepository.save(preference));
    }

    return results;
  }

  async deletePreference(userId: string, eventType: EventType): Promise<void> {
    const preference = await this.getPreference(userId, eventType);
    await this.preferenceRepository.remove(preference);
  }

  async getUsersToNotify(eventType: EventType): Promise<string[]> {
    const preferences = await this.preferenceRepository.find({
      where: {
        eventType,
        enabled: true,
      },
      select: ['userId'],
    });

    return preferences.map((p) => p.userId);
  }
}

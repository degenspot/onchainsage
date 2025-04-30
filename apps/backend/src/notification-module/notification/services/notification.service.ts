// src/notification/services/notification.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification, NotificationStatus, NotificationPriority, NotificationChannel } from '../entities/notification.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationTemplateService } from './notification-template.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
    private eventEmitter: EventEmitter2,
    private queueService: NotificationQueueService,
    private templateService: NotificationTemplateService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto, currentUserId?: string): Promise<Notification> {
    // Check if the sender has permission to send to this user
    if (currentUserId && createNotificationDto.userId !== currentUserId) {
      // Here you would implement your authorization logic
      // For example, check if current user is admin or has specific permission
    }

    let notification: Notification;
    
    // If template is specified, use it to populate the notification
    if (createNotificationDto.templateId) {
      const template = await this.templateRepository.findOne({ 
        where: { id: createNotificationDto.templateId, active: true } 
      });
      
      if (!template) {
        throw new NotFoundException(`Template with id ${createNotificationDto.templateId} not found or inactive`);
      }
      
      const renderedContent = await this.templateService.renderTemplate(
        template, 
        createNotificationDto.templateData || {}
      );
      
      notification = this.notificationRepository.create({
        ...createNotificationDto,
        title: renderedContent.title,
        content: renderedContent.content,
        template: { id: template.id } as NotificationTemplate,
      });
    } else {
      notification = this.notificationRepository.create(createNotificationDto);
    }
    
    // Check user preferences
    const userPreferences = await this.preferenceRepository.findOne({
      where: { 
        userId: createNotificationDto.userId,
        eventType: createNotificationDto.templateId ? 
          (await this.templateRepository.findOne({ where: { id: createNotificationDto.templateId } }))?.eventType : 
          'direct', // For direct notifications without a template
      }
    });

    // If user has preferences and has disabled this notification type
    if (userPreferences && !userPreferences.enabled) {
      // Just save the notification but don't process it
      notification.status = NotificationStatus.DELIVERED; // Mark as delivered since we're not actually sending it
      return this.notificationRepository.save(notification);
    }

    // If user has channel preferences, use them instead of default channels
    if (userPreferences?.channels?.length) {
      notification.channels = userPreferences.channels;
    }

    // Save the notification first
    const savedNotification = await this.notificationRepository.save(notification);
    
    // Add to the notification queue for processing
    this.queueService.addToQueue(savedNotification);
    
    // Emit an event for this notification creation
    this.eventEmitter.emit('notification.created', savedNotification);
    
    return savedNotification;
  }

  async findAll(userId: string, paginationDto: PaginationDto): Promise<{ items: Notification[], total: number, page: number, limit: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationDto;
    
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return {
      items: notifications,
      total,
      page,
      limit,
    };
  }

  async findUnread(userId: string, paginationDto: PaginationDto): Promise<{ items: Notification[], total: number, page: number, limit: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationDto;
    
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId, read: false },
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return {
      items: notifications,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
      relations: ['template'],
    });
    
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found for this user`);
    }
    
    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    
    // Update notification properties
    Object.assign(notification, updateNotificationDto);
    
    return this.notificationRepository.save(notification);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    
    notification.read = true;
    
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true }
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    
    await this.notificationRepository.remove(notification);
  }

  async updatePreferences(preferencesDto: any[], userId: string): Promise<NotificationPreference[]> {
    const results: NotificationPreference[] = [];
    
    for (const prefDto of preferencesDto) {
      let preference = await this.preferenceRepository.findOne({
        where: { userId, eventType: prefDto.eventType }
      });
      
      if (!preference) {
        preference = this.preferenceRepository.create({
          userId,
          eventType: prefDto.eventType,
        });
      }
      
      // Update properties
      if (prefDto.hasOwnProperty('enabled')) {
        preference.enabled = prefDto.enabled;
      }
      
      if (prefDto.channels) {
        preference.channels = prefDto.channels;
      }
      
      results.push(await this.preferenceRepository.save(preference));
    }
    
    return results;
  }

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({ where: { userId } });
  }
  
  // Count unread notifications
  async countUnread(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false }
    });
  }
  
  // Create bulk notifications
  async createBulk(
    userIds: string[], 
    notificationData: Omit<CreateNotificationDto, 'userId'>
  ): Promise<void> {
    const notifications = userIds.map(userId => 
      this.notificationRepository.create({
        ...notificationData,
        userId,
      })
    );
    
    // Save all notifications
    await this.notificationRepository.save(notifications);
    
    // Add them to the queue
    for (const notification of notifications) {
      this.queueService.addToQueue(notification);
    }
  }

  // Get notification channels for a user and event type
  async getChannelsForUser(userId: string, eventType: string): Promise<NotificationChannel[]> {
    const preference = await this.preferenceRepository.findOne({
      where: { userId, eventType }
    });
    
    return preference?.channels || [NotificationChannel.IN_APP];
  }
}
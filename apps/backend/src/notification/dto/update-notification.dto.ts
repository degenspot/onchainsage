// src/notification/dto/update-notification.dto.ts
import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationPriority, NotificationChannel } from '../entities/notification.entity';

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Notification title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Notification content', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ 
    description: 'Notification priority',
    enum: NotificationPriority,
    required: false
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({ 
    description: 'Notification channels',
    type: [String],
    enum: NotificationChannel,
    required: false
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @ApiProperty({ 
    description: 'Additional metadata',
    required: false,
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Read status',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}

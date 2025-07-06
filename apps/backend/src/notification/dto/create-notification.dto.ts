// src/notification/dto/create-notification.dto.ts
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsObject,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationPriority,
  NotificationChannel,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID of the recipient user' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Notification title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Notification content' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({
    description: 'Notification channels',
    type: [String],
    enum: NotificationChannel,
    default: [NotificationChannel.IN_APP],
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
    type: 'object',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'ID of the template to use',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiProperty({
    description: 'Data to populate the template',
    required: false,
    type: 'object',
  })
  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;

  @ApiProperty({
    description: 'Date when the notification expires',
    required: false,
  })
  @IsDate()
  @IsOptional()
  expiresAt?: Date;

  @ApiProperty({
    description: 'If true, notification will be marked as read upon creation',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}

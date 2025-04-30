import { IsEnum, IsBoolean, IsArray, IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../../../analytics/entities/smart-contract-event.entity';
import { NotificationChannel } from '../entities/notification-preference.entity';

export class WebhookConfigDto {
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  retryStrategy?: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
  };
}

export class UpdateNotificationPreferenceDto {
  @IsEnum(EventType)
  eventType: EventType;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookConfigDto)
  webhookConfig?: WebhookConfigDto;
}

export class BulkUpdateNotificationPreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateNotificationPreferenceDto)
  preferences: UpdateNotificationPreferenceDto[];
} 
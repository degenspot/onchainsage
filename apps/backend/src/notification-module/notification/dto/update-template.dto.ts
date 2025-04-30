
// src/notification/dto/update-template.dto.ts
import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel } from '../entities/notification.entity';

export class UpdateTemplateDto {
  @ApiProperty({ description: 'Template name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Event type', required: false })
  @IsString()
  @IsOptional()
  eventType?: string;

  @ApiProperty({ description: 'Title template', required: false })
  @IsString()
  @IsOptional()
  titleTemplate?: string;

  @ApiProperty({ description: 'Content template', required: false })
  @IsString()
  @IsOptional()
  contentTemplate?: string;

  @ApiProperty({ 
    description: 'Channel-specific templates',
    required: false,
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  channelSpecificTemplates?: {
    [channel in NotificationChannel]?: {
      titleTemplate?: string;
      contentTemplate: string;
    };
  };

  @ApiProperty({ 
    description: 'Additional metadata',
    required: false,
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Whether the template is active',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

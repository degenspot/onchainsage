// src/notification/dto/create-template.dto.ts
import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel } from '../entities/notification.entity';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Event type' })
  @IsString()
  eventType: string;

  @ApiProperty({ description: 'Title template' })
  @IsString()
  titleTemplate: string;

  @ApiProperty({ description: 'Content template' })
  @IsString()
  contentTemplate: string;

  @ApiProperty({ 
    description: 'Channel-specific templates',
    required: false,
    type: 'object',
    example: {
      'email': {
        'titleTemplate': 'Email: {{title}}',
        'contentTemplate': '<h1>{{title}}</h1><p>{{content}}</p>'
      }
    }
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
    default: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
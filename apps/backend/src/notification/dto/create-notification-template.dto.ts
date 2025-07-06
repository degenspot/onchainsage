import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Placeholder enum for EventType
export enum EventType {
  CONTRACT_DEPLOYED = 'CONTRACT_DEPLOYED',
  TRANSFER = 'TRANSFER',
  TRADE = 'TRADE',
  // Add more event types as needed
}

export class CreateNotificationTemplateDto {
  @ApiProperty({ description: 'Name of the template' })
  @IsString()
  name: string;

  @ApiProperty({ enum: EventType, description: 'Type of event triggering the notification' })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({ description: 'Title template for the notification' })
  @IsString()
  titleTemplate: string;

  @ApiProperty({ description: 'Body template for the notification' })
  @IsString()
  bodyTemplate: string;

  @ApiProperty({ description: 'Channel for the notification', required: false })
  @IsString()
  @IsOptional()
  channel?: string;
} 
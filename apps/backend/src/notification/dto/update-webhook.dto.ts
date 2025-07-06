// src/notification/dto/update-webhook.dto.ts
import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  IsObject,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookConfigurationDto {
  @ApiProperty({ description: 'Timeout in seconds', required: false })
  @IsOptional()
  timeout?: number;

  @ApiProperty({ description: 'Retry attempts', required: false })
  @IsOptional()
  retryAttempts?: number;
}

export class UpdateWebhookDto {
  @ApiProperty({ description: 'Webhook name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Webhook URL', required: false })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiProperty({ description: 'HTTP method', required: false })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiProperty({ description: 'Custom headers', required: false })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({ description: 'Event types to listen for', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eventTypes?: string[];

  @ApiProperty({ description: 'Webhook configuration', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookConfigurationDto)
  configuration?: WebhookConfigurationDto;

  @ApiProperty({
    description: 'Whether the webhook is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

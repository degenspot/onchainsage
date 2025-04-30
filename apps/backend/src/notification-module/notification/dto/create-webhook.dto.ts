// src/notification/dto/create-webhook.dto.ts
import { IsString, IsOptional, IsUrl, IsArray, IsEnum, IsObject, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class RetryStrategyDto {
  @ApiProperty({ description: 'Maximum number of retries' })
  @IsNumber()
  maxRetries: number;

  @ApiProperty({ description: 'Initial delay in milliseconds' })
  @IsNumber()
  initialDelay: number;

  @ApiProperty({ description: 'Backoff multiplier' })
  @IsNumber()
  backoffMultiplier: number;
}

class RateLimitDto {
  @ApiProperty({ description: 'Maximum deliveries per minute' })
  @IsNumber()
  maxPerMinute: number;
}

class WebhookConfigurationDto {
  @ApiProperty({ description: 'Retry strategy', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryStrategyDto)
  retryStrategy?: RetryStrategyDto;

  @ApiProperty({ description: 'Rate limit', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => RateLimitDto)
  rateLimit?: RateLimitDto;

  @ApiProperty({ description: 'Secret key for webhook signature', required: false })
  @IsString()
  @IsOptional()
  secretKey?: string;

  @ApiProperty({ description: 'Request timeout in milliseconds', required: false })
  @IsNumber()
  @IsOptional()
  timeout?: number;
}

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Webhook URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'HTTP method', default: 'POST' })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiProperty({ description: 'Custom headers', required: false })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({ description: 'Event types to listen for' })
  @IsArray()
  @IsString({ each: true })
  eventTypes: string[];

  @ApiProperty({ description: 'Webhook configuration', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookConfigurationDto)
  configuration?: WebhookConfigurationDto;

  @ApiProperty({ description: 'Whether the webhook is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}


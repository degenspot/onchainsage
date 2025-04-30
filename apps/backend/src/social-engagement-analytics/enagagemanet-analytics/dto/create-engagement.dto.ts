// src/engagement-analytics/dto/create-engagement.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { EngagementType } from '../entities/engagement.entity';

export class CreateEngagementDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  contentId: string;

  @IsEnum(EngagementType)
  type: EngagementType;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
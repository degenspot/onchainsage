// src/social-engagement/dto/create-engagement.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { EngagementType } from '../../shared/enums/engagement-type.enum';
import { ContentType } from '../../shared/enums/content-type.enum';

export class CreateEngagementDto {
  @IsNotEmpty()
  @IsUUID()
  contentId: string;

  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType: ContentType;

  @IsNotEmpty()
  @IsEnum(EngagementType)
  type: EngagementType;

  @IsOptional()
  metadata?: Record<string, any>;
}

// src/social-engagement/dto/engagement-response.dto.ts
import { EngagementType } from '../../shared/enums/engagement-type.enum';
import { ContentType } from '../../shared/enums/content-type.enum';

export class EngagementResponseDto {
  id: string;
  userId: string;
  contentId: string;
  contentType: ContentType;
  type: EngagementType;
  createdAt: Date;
  updatedAt: Date;
  counters: {
    likes: number;
    dislikes: number;
  };
  metadata?: Record<string, any>;
}

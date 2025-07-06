// src/notifications/controllers/notification-preferences.controller.ts
import { Controller, Put, Body, Req, UseGuards } from '@nestjs/common';

import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  BulkUpdateNotificationPreferencesDto,
  UpdateNotificationPreferenceDto,
} from '../dto/notification-preference.dto';
import { Request } from 'express';

// Define interface for authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

@Controller('users/preferences')
export class NotificationPreferencesController {
  constructor(private notificationService: NotificationService) {}

  @Put('notifications')
  @UseGuards(JwtAuthGuard)
  async updateNotificationPreferences(
    @Req() req: AuthenticatedRequest,
    @Body() preferences: UpdateNotificationPreferenceDto,
  ) {
    // Wrap single preference in bulk update DTO
    const bulkUpdateDto: BulkUpdateNotificationPreferencesDto = {
      preferences: [preferences],
    };
    return this.notificationService.updatePreferences(
      bulkUpdateDto.preferences,
      req.user.id,
    );
  }
}

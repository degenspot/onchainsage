
// src/notifications/controllers/notification-preferences.controller.ts
import { 
    Controller, 
    Put, 
    Body, 
    Req, 
    UseGuards 
  } from '@nestjs/common';

import { NotificationService } from './providers/notification.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateNotificationPreferencesDto } from './dto/notification-preference.dto';
  
  @Controller('users/preferences')
  export class NotificationPreferencesController {
    constructor(
      private notificationService: NotificationService
    ) {}
  
    @Put('notifications')
    @UseGuards(JwtAuthGuard)
    async updateNotificationPreferences(
      @Req() req,
      @Body() preferences: UpdateNotificationPreferencesDto
    ) {
      return this.notificationService.updateUserNotificationPreferences(
        req.user, 
        preferences
      );
    }
  }
  
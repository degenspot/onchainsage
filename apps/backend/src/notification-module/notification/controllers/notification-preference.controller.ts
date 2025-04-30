import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { NotificationPreferenceService } from '../services/notification-preference.service';
import {
  UpdateNotificationPreferenceDto,
  BulkUpdateNotificationPreferencesDto,
} from '../dto/notification-preference.dto';
import { EventType } from '../../../analytics/entities/smart-contract-event.entity';

@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferenceController {
  constructor(
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  @Get()
  async getPreferences(@Req() req) {
    return this.preferenceService.getPreferences(req.user.id);
  }

  @Get(':eventType')
  async getPreference(@Req() req, @Param('eventType') eventType: EventType) {
    return this.preferenceService.getPreference(req.user.id, eventType);
  }

  @Put(':eventType')
  async updatePreference(
    @Req() req,
    @Param('eventType') eventType: EventType,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    return this.preferenceService.updatePreference(
      req.user.id,
      eventType,
      updateDto,
    );
  }

  @Put()
  async updatePreferences(
    @Req() req,
    @Body() updateDto: BulkUpdateNotificationPreferencesDto,
  ) {
    return this.preferenceService.updatePreferences(req.user.id, updateDto);
  }

  @Delete(':eventType')
  async deletePreference(@Req() req, @Param('eventType') eventType: EventType) {
    return this.preferenceService.deletePreference(req.user.id, eventType);
  }
}

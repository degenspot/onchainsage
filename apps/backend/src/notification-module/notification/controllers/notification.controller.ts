// src/notification/controllers/notification.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully.' })
  create(@Body() createNotificationDto: CreateNotificationDto, @Req() req: Request) {
    return this.notificationService.create(createNotificationDto, req.user['id']);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for a user' })
  @ApiResponse({ status: 200, description: 'Return all notifications.' })
  findAll(@Query() paginationDto: PaginationDto, @Req() req: Request) {
    return this.notificationService.findAll(req.user['id'], paginationDto);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications for a user' })
  @ApiResponse({ status: 200, description: 'Return unread notifications.' })
  findUnread(@Query() paginationDto: PaginationDto, @Req() req: Request) {
    return this.notificationService.findUnread(req.user['id'], paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by id' })
  @ApiResponse({ status: 200, description: 'Return the notification.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.notificationService.findOne(id, req.user['id']);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully.' })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Req() req: Request,
  ) {
    return this.notificationService.update(id, updateNotificationDto, req.user['id']);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  markAsRead(@Param('id') id: string, @Req() req: Request) {
    return this.notificationService.markAsRead(id, req.user['id']);
  }

  @Put('read/all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read.' })
  markAllAsRead(@Req() req: Request) {
    return this.notificationService.markAllAsRead(req.user['id']);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully.' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.notificationService.remove(id, req.user['id']);
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully.' })
  updatePreferences(@Body() preferencesDto: any, @Req() req: Request) {
    return this.notificationService.updatePreferences(preferencesDto, req.user['id']);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Return preferences.' })
  getPreferences(@Req() req: Request) {
    return this.notificationService.getPreferences(req.user['id']);
  }
}


import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import {
  DeliveryRecord,
  DeliveryStatus,
} from '../entities/delivery-record.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationStatus,
} from '../entities/notification.entity';
import { In } from 'typeorm';
import { NotificationAdminService } from '../services/notification-admin.service';
import { CreateNotificationTemplateDto } from '../dto/create-notification-template.dto';

// Local declarations removed to avoid conflicts with imports

@ApiTags('notifications-admin')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminNotificationController {
  private readonly logger = new Logger(AdminNotificationController.name);

  constructor(
    @InjectRepository(DeliveryRecord)
    private deliveryRecordRepository: Repository<DeliveryRecord>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly adminService: NotificationAdminService,
  ) {}

  @Get('failed')
  async getFailedNotifications(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: DeliveryStatus,
    @Query('channel') channel?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query = this.deliveryRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.notification', 'notification')
      .where('record.status = :status', { status: DeliveryStatus.FAILED });

    if (channel) {
      query.andWhere('record.channel = :channel', { channel });
    }

    if (startDate) {
      query.andWhere('record.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      query.andWhere('record.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const [records, total] = await query
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: records,
      total,
      page,
      limit,
    };
  }

  @Post('retry')
  async retryFailedNotifications(@Body() body: { ids: string[] }) {
    const records = await this.deliveryRecordRepository.find({
      where: { id: In(body.ids) },
      relations: ['notification'],
    });

    for (const record of records) {
      if (record.notification) {
        record.notification.status = NotificationStatus.PENDING;
        await this.notificationRepository.save(record.notification);
      }
    }

    return { message: 'Notifications queued for retry' };
  }

  @Get('stats')
  async getNotificationStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query = this.deliveryRecordRepository
      .createQueryBuilder('record')
      .select('record.channel', 'channel')
      .addSelect('record.status', 'status')
      .addSelect('COUNT(*)', 'count');

    if (startDate) {
      query.andWhere('record.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      query.andWhere('record.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const stats = await query
      .groupBy('record.channel')
      .addGroupBy('record.status')
      .getRawMany();

    return stats;
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a new notification template (Admin only)' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @Body() createTemplateDto: CreateNotificationTemplateDto,
  ) {
    try {
      return await this.adminService.createTemplate(createTemplateDto);
    } catch (error) {
      this.logger.error(
        `Failed to create template: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to create template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates (Admin only)' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getAllTemplates() {
    try {
      return await this.adminService.getAllTemplates();
    } catch (error) {
      this.logger.error(
        `Failed to get templates: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get templates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a notification template by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  async getTemplateById(@Param('id') id: string) {
    try {
      return await this.adminService.getTemplateById(id);
    } catch (error) {
      this.logger.error(
        `Failed to get template: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a notification template (Admin only)' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: CreateNotificationTemplateDto,
  ) {
    try {
      return await this.adminService.updateTemplate(id, updateTemplateDto);
    } catch (error) {
      this.logger.error(
        `Failed to update template: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to update template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a notification template (Admin only)' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Param('id') id: string) {
    try {
      return await this.adminService.deleteTemplate(id);
    } catch (error) {
      this.logger.error(
        `Failed to delete template: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to delete template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Send a broadcast notification (Admin only)' })
  @ApiResponse({ status: 201, description: 'Broadcast sent successfully' })
  async sendBroadcast(@Body() broadcastDto: any) {
    try {
      // Placeholder for broadcast logic
      return {
        message: 'Broadcast functionality not implemented yet',
        data: broadcastDto,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send broadcast: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to send broadcast',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

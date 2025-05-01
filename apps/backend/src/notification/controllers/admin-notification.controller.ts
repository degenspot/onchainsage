import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import {
  DeliveryRecord,
  DeliveryStatus,
} from '../entities/delivery-record.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { In } from 'typeorm';

@Controller('admin/notifications')
@UseGuards(AdminGuard)
export class AdminNotificationController {
  constructor(
    @InjectRepository(DeliveryRecord)
    private deliveryRecordRepository: Repository<DeliveryRecord>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
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
        record.notification.status = 'pending';
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
}

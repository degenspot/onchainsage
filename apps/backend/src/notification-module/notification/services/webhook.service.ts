// src/notification/services/webhook.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { WebhookRegistration } from '../entities/webhook-registration.entity';
import { DeliveryRecord, DeliveryStatus } from '../entities/delivery-record.entity';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { DeliveryTrackingService } from './delivery-tracking.service';

@Injectable()
export class WebhookService {
  private readonly rateLimiters = new Map<string, { lastExecution: number, currentCount: number }>();
  
  constructor(
    @InjectRepository(WebhookRegistration)
    private webhookRepository: Repository<WebhookRegistration>,
    @InjectRepository(DeliveryRecord)
    private deliveryRecordRepository: Repository<DeliveryRecord>,
    private eventEmitter: EventEmitter2,
    private httpService: HttpService,
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private deliveryTrackingService: DeliveryTrackingService,
  ) {
    // Initialize default event listeners
    this.setupGlobalEventListeners();
  }

  private setupGlobalEventListeners() {
    // We could add common event listeners here
    // For example, listening to user registration, content creation, etc.
  }

  async registerWebhook(createWebhookDto: CreateWebhookDto, userId: string): Promise<WebhookRegistration> {
    const webhook = this.webhookRepository.create({
      ...createWebhookDto,
      userId,
    });
    
    return this.webhookRepository.save(webhook);
  }

  async findAllWebhooks(userId: string): Promise<WebhookRegistration[]> {
    return this.webhookRepository.find({ where: { userId } });
  }

  async findWebhook(id: string, userId: string): Promise<WebhookRegistration> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, userId },
    });
    
    if (!webhook) {
      throw new NotFoundException(`Webhook with id ${id} not found for this user`);
    }
    
    return webhook;
  }

  async updateWebhook(id: string, updateWebhookDto: UpdateWebhookDto, userId: string): Promise<WebhookRegistration> {
    const webhook = await this.findWebhook(id, userId);
    
    // Update webhook properties
    Object.assign(webhook, updateWebhookDto);
    
    // If URL changed, reset verification
    if (updateWebhookDto.url && updateWebhookDto.url !== webhook.url) {
      webhook.verified = false;
    }
    
    return this.webhookRepository.save(webhook);
  }

  async removeWebhook(id: string, userId: string): Promise<void> {
    const webhook = await this.findWebhook(id, userId);
    
    await this.webhookRepository.remove(webhook);
  }

  async requestWebhookVerification(id: string, userId: string): Promise<{ message: string }> {
    const webhook = await this.findWebhook(id, userId);
    
    // Generate a verification token
    const token = uuidv4();
    webhook.verificationToken = token;
    
    // Set expiration (e.g., 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    webhook.verificationExpiresAt = expiresAt;
    
    await this.webhookRepository.save(webhook);
    
    // Send a verification request to the webhook
    try {
      const verificationUrl = `${this.configService.get('APP_URL')}/webhooks/verify/${token}`;
      
      await firstValueFrom(this.httpService.post(webhook.url, {
        event: 'webhook.verification',
        data: {
          verificationUrl,
          expiresAt: expiresAt.toISOString(),
        },
      }, {
        headers: {
          ...webhook.headers,
          'X-Webhook-Verification': 'true',
          'Content-Type': 'application/json',
        },
        timeout: webhook.configuration.timeout || 5000,
      }));
      
      return { message: 'Verification request sent successfully' };
    } catch (error) {
      return { message: `Failed to send verification request: ${error.message}` };
    }
  }

  async verifyWebhook(token: string): Promise<{ message: string }> {
    const webhook = await this.webhookRepository.findOne({
      where: { verificationToken: token },
    });
    
    if (!webhook) {
      throw new NotFoundException('Invalid verification token');
    }
    
    if (webhook.verificationExpiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }
    
    webhook.verified = true;
    webhook.verificationToken = null;
    webhook.verificationExpiresAt = null;
    
    await this.webhookRepository.save(webhook);
    
    return { message: 'Webhook verified successfully' };
  }

  async testWebhook(id: string, testData: any, userId: string): Promise<{ success: boolean, message: string }> {
    const webhook = await this.findWebhook(id, userId);
    
    try {
      const result = await this.deliverEvent(webhook, 'webhook.test', testData);
      return { 
        success: true, 
        message: `Test event delivered successfully. Status: ${result.status}, Response: ${result.response}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to deliver test event: ${error.message}` 
      };
    }
  }

  async getWebhookDeliveryHistory(
    id: string, 
    userId: string, 
    pagination: { page: number, limit: number }
  ): Promise<{ items: DeliveryRecord[], total: number, page: number, limit: number }> {
    const webhook = await this.findWebhook(id, userId);
    
    // This is a simplified implementation - in a real app, you would
    // track webhook deliveries separately from notification deliveries
    const [deliveries, total] = await this.deliveryRecordRepository.findAndCount({
      where: { 
        // We would need a way to link delivery records to webhooks
        // For now, this is just a placeholder query
      },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    
    return {
      items: deliveries,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  @OnEvent('*')
  async handleAllEvents(event: string, payload: any): Promise<void> {
    // Skip internal events
    if (event.startsWith('webhook.') || event.startsWith('notification.')) {
      return;
    }
    
    // Find all webhooks that are listening for this event
    const webhooks = await this.webhookRepository.find({
      where: {
        active: true,
        verified: true,
        eventTypes: [event], // This would need to be modified for typeorm to match array contains
      },
    });
    
    // Deliver the event to each webhook
    for (const webhook of webhooks) {
      this.deliverEventWithRetry(webhook, event, payload);
    }
  }

  private async deliverEventWithRetry(
    webhook: WebhookRegistration, 
    eventName: string, 
    payload: any
  ): Promise<void> {
    try {
      // Check rate limits first
      if (!this.checkRateLimit(webhook.id)) {
        // Schedule for later delivery
        const delayMs = 60000; // 1 minute
        setTimeout(() => {
          this.deliverEventWithRetry(webhook, eventName, payload);
        }, delayMs);
        return;
      }
      
      await this.deliverEvent(webhook, eventName, payload);
      
      // Update webhook stats
      webhook.lastSuccessAt = new Date();
      webhook.failureCount = 0;
      await this.webhookRepository.save(webhook);
      
    } catch (error) {
      // Update webhook stats
      webhook.failureCount += 1;
      webhook.lastFailureAt = new Date();
      await this.webhookRepository.save(webhook);
      
      // Check if we should retry
      const retryStrategy = webhook.configuration.retryStrategy || {
        maxRetries: 3,
        initialDelay: 30000, // 30 seconds
        backoffMultiplier: 2,
      };
      
      if (webhook.failureCount <= retryStrategy.maxRetries) {
        const delay = retryStrategy.initialDelay * Math.pow(retryStrategy.backoffMultiplier, webhook.failureCount - 1);
        
        // Schedule retry
        setTimeout(() => {
          this.deliverEventWithRetry(webhook, eventName, payload);
        }, delay);
      } else {
        // Log that we've exhausted retries
        console.error(`Exhausted retries for webhook ${webhook.id} for event ${eventName}`);
        
        // Emit a webhook failure event
        this.eventEmitter.emit('webhook.delivery.failed', {
          webhookId: webhook.id,
          eventName,
          error: error.message,
        });
      }
    }
  }

  private async deliverEvent(
    webhook: WebhookRegistration, 
    eventName: string, 
    payload: any
  ): Promise<{ status: number, response: any }> {
    const eventPayload = {
      id: uuidv4(),
      event: eventName,
      createdAt: new Date().toISOString(),
      data: payload,
    };
    
    // Add signature if secret is configured
    const headers = { ...webhook.headers, 'Content-Type': 'application/json' };
    
    if (webhook.configuration.secretKey) {
      const signature = this.generateSignature(eventPayload, webhook.configuration.secretKey);
      headers['X-Webhook-Signature'] = signature;
    }
    
    // Track delivery attempt
    const deliveryRecord = await this.deliveryTrackingService.trackDeliveryStart(
      null, // We need a proper way to track webhook deliveries
      'webhook' as any, // This would need to be adjusted for the actual schema
      webhook.id
    );
    
    try {
      // Make the HTTP request
      const method = webhook.method || 'POST';
      const timeout = webhook.configuration.timeout || 5000;
      
      let response;
      if (method === 'POST') {
        response = await firstValueFrom(this.httpService.post(webhook.url, eventPayload, { headers, timeout }));
      } else if (method === 'PUT') {
        response = await firstValueFrom(this.httpService.put(webhook.url, eventPayload, { headers, timeout }));
      } else {
        throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      // Track successful delivery
      await this.deliveryTrackingService.trackDeliverySuccess(
        deliveryRecord.id,
        response.data
      );
      
      return {
        status: response.status,
        response: response.data,
      };
    } catch (error) {
      // Track failed delivery
      await this.deliveryTrackingService.trackDeliveryFailure(
        deliveryRecord.id,
        error.message
      );
      
      throw error;
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  private checkRateLimit(webhookId: string): boolean {
    const now = Date.now();
    const rateLimiter = this.rateLimiters.get(webhookId) || { lastExecution: 0, currentCount: 0 };
    
    // Reset counter if it's been more than a minute
    if (now - rateLimiter.lastExecution > 60000) {
      rateLimiter.currentCount = 0;
      rateLimiter.lastExecution = now;
    }
    
    // Check if rate limit reached
    const webhook = this.webhookRepository.findOne({ where: { id: webhookId } });
    const maxPerMinute = webhook['configuration']?.rateLimit?.maxPerMinute || 60;
    
    if (rateLimiter.currentCount >= maxPerMinute) {
      return false;
    }
    
    // Increment counter
    rateLimiter.currentCount += 1;
    this.rateLimiters.set(webhookId, rateLimiter);
    
    return true;
  }
}
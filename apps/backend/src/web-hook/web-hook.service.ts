import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebHook } from './entities/web-hook.entity';
import { CreateWebHookDto } from './dto/create-web-hook.dto';
import { UpdateWebHookDto } from './dto/update-web-hook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebHook)
    private webhookRepository: Repository<WebHook>,
  ) {}

  async create(createWebhookDto: CreateWebHookDto) {
    const webhook = this.webhookRepository.create(createWebhookDto);
    return this.webhookRepository.save(webhook);
  }

  async findAll() {
    return this.webhookRepository.find();
  }

  async findOne(id: number) {
    return this.webhookRepository.findOne({ where: { id } });
  }

  async update(id: number, updateWebhookDto: UpdateWebHookDto) {
    await this.webhookRepository.update(id, updateWebhookDto);
    return this.webhookRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.webhookRepository.delete(id);
    return { message: `Webhook with ID ${id} has been removed` };
  }

  async sendWebhookNotification(url: string, payload: any): Promise<void> {
    try {
      await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      });
      
      this.logger.log(`Webhook notification sent to ${url}`);
    } catch (error) {
      this.logger.error(`Failed to send webhook notification to ${url}: ${error.message}`, error.stack);
      throw error;
    }
  }
}

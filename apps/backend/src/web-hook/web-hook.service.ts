import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

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

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';

@Injectable()
export class NotificationAdminService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
  ) {}

  async createTemplate(templateData: any): Promise<NotificationTemplate> {
    const template = this.templateRepository.create(templateData);
    const savedTemplate = await this.templateRepository.save(template);
    return Array.isArray(savedTemplate) ? savedTemplate[0] : savedTemplate;
  }

  async updateTemplate(id: string, updateData: any): Promise<NotificationTemplate | null> {
    await this.templateRepository.update(id, updateData);
    return await this.templateRepository.findOneBy({ id });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepository.delete(id);
  }

  async getAllTemplates(): Promise<NotificationTemplate[]> {
    return await this.templateRepository.find();
  }

  async getTemplateById(id: string): Promise<NotificationTemplate | null> {
    return await this.templateRepository.findOneBy({ id });
  }
} 
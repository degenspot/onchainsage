import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import * as Handlebars from 'handlebars';

@Injectable()
export class NotificationTemplateService {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
  ) {}

  async create(createTemplateDto: CreateTemplateDto): Promise<NotificationTemplate> {
    const template = this.templateRepository.create(createTemplateDto);
    return this.templateRepository.save(template);
  }

  async findAll(active?: boolean): Promise<NotificationTemplate[]> {
    if (typeof active === 'boolean') {
      return this.templateRepository.find({ where: { active } });
    }
    return this.templateRepository.find();
  }

  async findOne(id: string): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<NotificationTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, updateTemplateDto);
    this.templateCache.delete(id); // Clear cache when template is updated
    return this.templateRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    this.templateCache.delete(id);
    await this.templateRepository.remove(template);
  }

  async renderTemplate(
    template: NotificationTemplate,
    data: Record<string, any>,
  ): Promise<{ title: string; content: string }> {
    // Get or compile title template
    let titleTemplate = this.templateCache.get(`${template.id}_title`);
    if (!titleTemplate) {
      titleTemplate = Handlebars.compile(template.titleTemplate);
      this.templateCache.set(`${template.id}_title`, titleTemplate);
    }

    // Get or compile content template
    let contentTemplate = this.templateCache.get(`${template.id}_content`);
    if (!contentTemplate) {
      contentTemplate = Handlebars.compile(template.contentTemplate);
      this.templateCache.set(`${template.id}_content`, contentTemplate);
    }

    return {
      title: titleTemplate(data),
      content: contentTemplate(data),
    };
  }

  async previewTemplate(
    id: string,
    data: Record<string, any>,
  ): Promise<{ title: string; content: string }> {
    const template = await this.findOne(id);
    return this.renderTemplate(template, data);
  }
}
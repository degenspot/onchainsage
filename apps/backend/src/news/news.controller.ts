import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsItem } from './types';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async getNews(): Promise<NewsItem[]> {
    return this.newsService.getLatestNews();
  }

  // Keep the existing CRUD endpoints
  @Post()
  create(@Body() createNewsDto: NewsItem) {
    return this.newsService.create(createNewsDto);
  }

  @Get('all')
  findAll(): Promise<NewsItem[]> {
    return this.newsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<NewsItem> {
    return this.newsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNewsDto: NewsItem) {
    return this.newsService.update(+id, updateNewsDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsService.remove(+id);
  }
}
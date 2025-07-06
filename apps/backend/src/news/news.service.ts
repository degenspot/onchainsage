import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import * as Parser from 'rss-parser';
import { NewsItem } from './types';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly parser: Parser;
  private readonly RSS_FEED_URL = 'https://coindesk.com/';
  private readonly CACHE_KEY = 'latest_news';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.parser = new Parser();
  }

  async getLatestNews(): Promise<NewsItem[]> {
    try {
      // Try to get data from cache first
      const cachedNews = await this.cacheManager.get<NewsItem[]>(
        this.CACHE_KEY,
      );

      if (cachedNews) {
        this.logger.log('Returning news from cache');
        return cachedNews;
      }

      // If not in cache, fetch from RSS feed
      this.logger.log('Fetching fresh news from RSS feed');
      const feed = await this.parser.parseURL(this.RSS_FEED_URL);

      const newsItems: NewsItem[] = feed.items.slice(0, 5).map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
      }));

      // Store in cache
      await this.cacheManager.set(this.CACHE_KEY, newsItems, this.CACHE_TTL);
      return newsItems;
    } catch (error) {
      this.logger.error(`Failed to fetch news: ${error.message}`);
      throw new Error('Failed to fetch news');
    }
  }

  // Keep the existing methods for CRUD operations
  async create(createNewsDto: NewsItem): Promise<NewsItem> {
    // TODO: Implement actual creation logic
    return createNewsDto;
  }

  async findAll(): Promise<NewsItem[]> {
    // For now, just return the latest news
    return this.getLatestNews();
  }

  async findOne(id: number): Promise<NewsItem> {
    const allNews = await this.getLatestNews();
    const news = allNews[id];
    if (!news) {
      throw new Error(`News #${id} not found`);
    }
    return news;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: number, updateNewsDto: NewsItem): Promise<NewsItem> {
    // TODO: Implement actual update logic
    return updateNewsDto;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(id: number): Promise<void> {
    // TODO: Implement actual delete logic
  }
}

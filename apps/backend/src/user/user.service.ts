import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPreferences } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { Preferences } from 'src/redis/types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserPreferences)
    private readonly userPreferencesRepository: Repository<UserPreferences>,
    private readonly redisService: RedisService,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  public getPreferences = async (userId: string) => {
    const user_id = userId; // Extracted from middleware

    // Query the database for user preferences
    const preferences = await this.userPreferencesRepository.findOne({
      where: { user_id },
    });

    // Return preferences or an empty object
    return preferences?.preferences || {};
  };

  public cachePreference = async (userId: string) => {
    try {
      const preference = await this.getPreferences(userId);
      await this.redisService.setUserPreferences(
        userId,
        preference as Preferences,
      );
      return preference;
    } catch (err) {
      console.log('Failed to cache preference:', err);
      return null;
    }
  };

  public getCachedPreferences = async (userId: string) => {
    const cached = await this.redisService.getUserPreferences(userId);
    if (!cached) {
      const preference = await this.getPreferences(userId);
      await this.cachePreference(userId);
      return preference;
    }
    return cached;
  };

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

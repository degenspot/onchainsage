import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
  ) {}

  async findByWalletAddress(walletAddress: string): Promise<User> {
    return this.userRepository.findOne({ where: { walletAddress } });
  }

  async create(walletAddress: string): Promise<User> {
    const user = this.userRepository.create({ walletAddress });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  // Preferences related methods
  async getPreferences(userId: string): Promise<Record<string, any>> {
    const user = await this.findOne(userId);
    return user?.preferences || {};
  }

  async getCachedPreferences(userId: string): Promise<Record<string, any>> {
    const cacheKey = `user:${userId}:preferences`;
    const cachedData = await this.redisService.getAsync(cacheKey);
    
    if (!cachedData) {
      const preferences = await this.getPreferences(userId);
      await this.redisService.setAsync(cacheKey, JSON.stringify(preferences));
      return preferences;
    }
    
    return JSON.parse(cachedData);
  }

  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.preferences = { ...user.preferences, ...preferences };
    const updatedUser = await this.userRepository.save(user);
    
    // Update cache
    const cacheKey = `user:${userId}:preferences`;
    await this.redisService.setAsync(cacheKey, JSON.stringify(updatedUser.preferences));
    
    return updatedUser;
  }

  // Authentication related methods
  async setNonce(walletAddress: string, nonce: string): Promise<void> {
    const user = await this.findByWalletAddress(walletAddress);
    if (user) {
      user.nonce = nonce;
      await this.userRepository.save(user);
    }
  }

  async setSignature(walletAddress: string, signature: string): Promise<void> {
    const user = await this.findByWalletAddress(walletAddress);
    if (user) {
      user.signature = signature;
      await this.userRepository.save(user);
    }
  }
}

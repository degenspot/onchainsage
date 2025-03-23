import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferences } from './entities/user.entity';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferences, RedisService ])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

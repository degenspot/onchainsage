import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from 'src/redis/redis.service';
import { UserPreferences } from 'src/user/entities/user.entity';
import { UserController } from 'src/user/user.controller';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferences, RedisService])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

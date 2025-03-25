import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { GatewayModule } from '../gateways/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    GatewayModule
  ],
  controllers: [UserController],
  providers: [UserService, RedisService],
  exports: [UserService]
})
export class UserModule {}

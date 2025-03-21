import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { SignalsModule } from './signals/signals.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StarknetModule } from './starknet/starknet.module';
import databaseConfig from './config/database.config';
import { RedisModule } from './redis/redis.module';
import { RedisController } from './redis/redis.controller';
import { SignalGateway } from './gateways/signal.gateway';

const ENV = process.env.NODE_ENV;
console.log(ENV);

@Module({
  imports: [
    AuthModule,
    HealthModule,
    SignalsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ENV ? '.env' : `.env.development`,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig],
    }),
    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        blog: configService.get('database.blog'),
        synchronize: configService.get('database.synchronize'),
        autoLoadEntities: configService.get('database.autoload'),
      }),
    }),
    StarknetModule,
    RedisModule,
  ],
  controllers: [AppController, RedisController],
  providers: [AppService, SignalGateway],
})
export class AppModule {}

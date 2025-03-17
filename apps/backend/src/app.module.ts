import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { SignalsModule } from './signals/signals.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import {TypeOrmModule} from '@nestjs/typeorm'
import { StarknetModule } from './starknet/starknet.module';
import databaseConfig from './config/database.config';
import { RedisModule } from './redis/redis.module';
import { RedisController } from './redis/redis.controller';


const ENV = process.env.NODE_ENV;
console.log(ENV)

@Module({
  imports: [
    AuthModule,
    HealthModule,
    SignalsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV ? '.env' : `.env.development.example`,
      load: [appConfig, databaseConfig],
    }),
    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: +configService.get<string>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: String(configService.get<string>('DATABASE_PASSWORD') || ''),
        database: configService.get<string>('DATABASE_NAME'),
        synchronize: configService.get<boolean>('DATABASE_SYNC'),
        autoLoadEntities: configService.get<boolean>('DATABASE_LOAD'),
        ssl: false,
      }),
    }),
    StarknetModule,
    RedisModule,
  ],
  controllers: [AppController, RedisController],
  providers: [AppService],
})
export class AppModule {}

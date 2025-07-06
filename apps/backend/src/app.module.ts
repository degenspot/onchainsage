/* eslint-disable prettier/prettier */
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { SignalsModule } from './signals/signals.module';
import { TasksModule } from './tasks/tasks.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StarknetModule } from './starknet/starknet.module';
import databaseConfig from './config/database.config';
import { RedisModule } from './redis/redis.module';
import { RedisController } from './redis/redis.controller';
import { UserModule } from './users/user.module';
import { SignalGatewayModule } from './signal-gateway/signal-gateway.module';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { MailModule } from './mail/mail.module';
import { NewsModule } from './news/news.module';
import { ForumModule } from './forum_module/forum.module';
import { ReputationModule } from './reputation/reputation.module';
import { ForumReportModule } from './forum-report/forum-report.module';
import { AdminModule } from './admin/admin.module';
import { SignalAuditModule } from './signal-audit/signal-audit.module';
import { ExportModule } from './export/export.module';
import { DigestModule } from './digest/digest.module';
import { WebhookModule } from './web-hook/web-hook.module';
import { TemplatesModule } from './templates/templates.module';
import { FeatureFlagsService } from './config/feature-flags';
import { FeatureFlagMiddleware } from './middleware/feature-flag.middleware';
import { StatsModule } from './stats/stats.modules';
import { SharedModule } from './shared/shared.module';


const ENV = process.env.NODE_ENV || 'development';
console.log('Current environment:', ENV);

@Module({
  imports: [
    AuthModule,
    HealthModule,
    SignalsModule,
    TasksModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${ENV}`, '.env'],
      load: [appConfig, databaseConfig],
    }),
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
        synchronize: configService.get('database.synchronize'),
        autoLoadEntities: configService.get('database.autoload'),
      }),
    }),
    StarknetModule,
    RedisModule,
    UserModule,
    SignalGatewayModule,
    MailModule,
    NewsModule,
    ReputationModule,

    // Enable throttling with custom global settings
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    } as any),

    // Forum feature module
    ForumModule,
    ForumReportModule,
    AdminModule,
    SignalAuditModule,
    ExportModule,
    DigestModule,
    WebhookModule,
    TemplatesModule,
    StatsModule,
    SharedModule,
  ],
  controllers: [AppController, RedisController],
  providers: [
    AppService,
    FeatureFlagsService,
    // Apply throttling guard globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}
  configure(consumer: MiddlewareConsumer) {
    // consumer
    //   .apply(RateLimitMiddleware)
    //   .forRoutes('*');
    
    const featureFlagsService = new FeatureFlagsService(this.configService);
    const featureFlagMiddleware = new FeatureFlagMiddleware(featureFlagsService);
    consumer
      .apply((req, res, next) => featureFlagMiddleware.use(req, res, next))
      .forRoutes('signals', 'users/preferences');
  }
}


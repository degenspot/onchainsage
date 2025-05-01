import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './controllers/export.controller';
import { ExportService } from './services/export.service';
import { ExportHistory } from './entities/export-history.entity';
import { SignalHistory } from '../signal/entities/signal-history.entity';
import { VotingHistory } from '../voting/entities/voting-history.entity';
import { StakingHistory } from '../staking/entities/staking-history.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimitMiddleware } from '../common/middleware/rate-limit.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExportHistory,
      SignalHistory,
      VotingHistory,
      StakingHistory,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'export/signal-history', method: RequestMethod.GET },
        { path: 'export/voting-history', method: RequestMethod.GET },
        { path: 'export/staking-history', method: RequestMethod.GET },
      );
  }
}

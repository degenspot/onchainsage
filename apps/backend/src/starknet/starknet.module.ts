import { Module } from '@nestjs/common';
import { StarknetController } from './starknet.controller';
import { StarknetService } from './providers/starknet-provider.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [StarknetController],
  providers: [StarknetService],
})
export class StarknetModule {}

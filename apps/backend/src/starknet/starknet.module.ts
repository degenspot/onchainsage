import { Module } from '@nestjs/common';
import { StarknetController } from './starknet.controller';
import { StarknetService } from './providers/starknet-provider.service';
import { PrivateKeyProvider } from './providers/private-key';

@Module({
  controllers: [StarknetController],
  providers: [StarknetService, PrivateKeyProvider]
})
export class StarknetModule {}

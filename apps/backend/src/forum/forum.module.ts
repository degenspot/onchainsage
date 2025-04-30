import { Module } from '@nestjs/common';
import { ForumController } from './forum.controller';
import { StarknetService } from '../starknet/starknet.service';

@Module({
  controllers: [ForumController],
  providers: [StarknetService],
  exports: [StarknetService]
})
export class ForumModule {}
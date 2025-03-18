import { Body, Controller, Get, Post } from '@nestjs/common';
import { StarknetService } from './providers/starknet-provider.service';

@Controller('starknet')
export class StarknetController {
    constructor(
        private readonly starknetService: StarknetService,
    ) {}

  @Get('balance')
  public async getBalance() {
    return await this.starknetService.getContractState();
  }

  @Post('transfer')
  public async transferFunds(@Body() body: { amount: string }) {
    return await this.starknetService.sendTransaction(body.amount);
  }
}

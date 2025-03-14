import { Body, Controller, Get, Post } from '@nestjs/common';
import { StarknetService } from './providers/starknet-provider.service';
import { PrivateKeyProvider } from './providers/private-key';

@Controller('starknet')
export class StarknetController {
    constructor(
        private readonly starknetService: StarknetService,
        private readonly privateKeyProvider: PrivateKeyProvider,
    ) {}

  @Get('balance')
  public async getBalance() {
    return await this.starknetService.getContractState();
  }

  @Post('transfer')
  public async transferFunds(@Body() body: { amount: number }) {
    return await this.starknetService.sendTransaction(body.amount);
  }

  @Get('pkey')
  public getPrivateKey(){
    return this.privateKeyProvider.getKeys()
  }
}

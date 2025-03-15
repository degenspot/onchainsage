import { Injectable } from '@nestjs/common';
import { RpcProvider } from 'starknet';
import { Provider, Account, Contract, json } from 'starknet';
import * as fs from 'fs';

@Injectable()
export class StarknetService {
  private provider: Provider;
  private account: Account;
  private contract: Contract;

  constructor() {
    this.provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
    this.account = new Account(
      this.provider,
      'ACCOUNT_ADDRESS',
      process.env.PRIVATE_KEY,
    );

    const contractAbi = json.parse(
      fs.readFileSync('../.json', 'utf-8'),
    );
    this.contract = new Contract(
      contractAbi,
      'CONTRACT_ADDRESS',
      this.provider,
    );
  }

  async getContractState(): Promise<any> {
    console.log(
      'Starknet Provider Connected:',
      await this.provider.getChainId(),
    );

    return await this.contract.call('get_balance', []);
  }

  async sendTransaction(amount: number): Promise<string> {
    const response = await this.account.execute([
      {
        contractAddress: 'CONTRACT_ADDRESS',
        entrypoint: 'transfer',
        calldata: [amount],
      },
    ]);
    return response.transaction_hash;
  }
}

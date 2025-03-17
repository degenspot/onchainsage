import { Injectable } from '@nestjs/common';
import { RpcProvider, Account, Contract, json, ec } from 'starknet';
import * as fs from 'fs';
import * as path from 'node:path';


@Injectable()
export class StarknetService {
  private provider: RpcProvider;
  private account: Account;
  private contract: Contract;

  constructor() {
    this.provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });

    const privateKey = process.env.PRIVATE_KEY!;
    const contractAddress = process.env.CONTRACT_ADDRESS!;

    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error("Private key must be a valid hex string starting with '0x'.");
    }

    if (!contractAddress || !contractAddress.startsWith('0x')) {
      throw new Error("Contract address must be a valid Starknet address.");
    }

    // Key Conversion
    const starkKey = ec.starkCurve.getStarkKey(privateKey); 
    this.account = new Account(this.provider, contractAddress, privateKey);

    // Fix ABI File Path
    const abiPath = path.resolve(__dirname, '../../../../blockchain/contract_abi.json');
    console.log(abiPath)

    if (!fs.existsSync(abiPath)) {
      throw new Error(`ABI file not found at ${abiPath}`);
    }

    const contractAbi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));

    if (!contractAbi || !Array.isArray(contractAbi)) {
      throw new Error('Invalid ABI file: Make sure it is a valid array.');
    }

    this.contract = new Contract(contractAbi, contractAddress, this.provider);
  }

  async getContractState(): Promise<any> {
    console.log('Starknet Provider Connected:', await this.provider.getChainId());
    return await this.contract.call('get_balance', []);
  }

  async deposit(user: string, amount: string): Promise<string> {
    const response = await this.contract.invoke('deposit', [user, amount]);
    return response.transaction_hash;
  }

  async sendTransaction(amount: string): Promise<string> {
    const response = await this.account.execute([
      {
        contractAddress: process.env.CONTRACT_ADDRESS!,
        entrypoint: 'transfer',
        calldata: [amount.toString()], // Ensure calldata is a string
      },
    ]);
    return response.transaction_hash;
  }
}
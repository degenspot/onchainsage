/* eslint-disable prettier/prettier */
import { Provider, Contract } from 'starknet';

export class ContractLoader {
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  async load(address: string, abi: any): Promise<Contract> {
    return new Contract(abi, address, this.provider);
  }
}

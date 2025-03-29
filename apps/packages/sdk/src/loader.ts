import { Provider, Contract } from 'starknet';

export class ContractLoader {
  constructor(private provider: Provider) {}

  async load(address: string, compiledContract: any): Promise<Contract> {
    return new Contract(
      compiledContract.abi, 
      address, 
      this.provider
    );
  }
}
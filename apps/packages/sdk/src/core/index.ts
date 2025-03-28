import { Provider, Account } from 'starknet';
import { createConfig, NetworkConfig } from '../config';
import { ContractLoader } from '../loader';
import { ContractExecutor } from '../executor';

export class StarknetSDK {
  private provider: Provider;
  private account?: Account;
  private contractLoader: ContractLoader;
  private contractExecutor: ContractExecutor;

  constructor(config: Partial<NetworkConfig> = {}) {
    const networkConfig = createConfig(config);
    
    this.provider = new Provider({ 
      sequencer: { baseUrl: networkConfig.networkUrl } 
    });
    
    this.contractLoader = new ContractLoader(this.provider);
    this.contractExecutor = new ContractExecutor(this.provider);
  }

  initializeAccount(privateKey: string, publicKey: string) {
    this.account = new Account(
      this.provider, 
      publicKey, 
      privateKey
    );
    this.contractExecutor.setAccount(this.account);
  }

  async loadContract(address: string, compiledContract: any) {
    return this.contractLoader.load(address, compiledContract);
  }

  async executeContract(contract: any, method: string, args: any[]) {
    if (!this.account) {
      throw new Error('Account Not Initialized');
    }
    return this.contractExecutor.execute(contract, method, args);
  }
}
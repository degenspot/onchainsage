import { Provider, Account, Contract } from 'starknet';

export class ContractExecutor {
  private account?: Account;

  constructor(private provider: Provider) {}

  setAccount(account: Account) {
    this.account = account;
  }

  async execute(contract: Contract, method: string, args: any[]) {
    if (!this.account) {
      throw new Error('Account Not Initialized');
    }

    const transaction = await this.account.execute(
      contract.populate(method, args)
    );
    return transaction;
  }
}
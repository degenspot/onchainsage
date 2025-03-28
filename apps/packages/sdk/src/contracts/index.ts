export interface ContractInteractionOptions {
    gasLimit?: number;
    maxFee?: number;
  }
  
  export const createContractInteraction = (
    options: ContractInteractionOptions = {}
  ) => {
    const defaultOptions: ContractInteractionOptions = {
      gasLimit: 100000,
      maxFee: 1000000000000000
    };
  
    return { ...defaultOptions, ...options };
  };
export interface NetworkConfig {
    networkUrl: string;
    chainId: string;
    timeout?: number;
    retryAttempts?: number;
  }
  
  export const createConfig = (options: Partial<NetworkConfig> = {}): NetworkConfig => {
    const defaultConfig: NetworkConfig = {
      networkUrl: 'https://starknet-goerli.infura.io/v3/PROJECT_ID',
      chainId: 'SN_GOERLI',
      timeout: 10000,
      retryAttempts: 3
    };
  
    return { ...defaultConfig, ...options };
  };
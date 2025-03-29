'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connect, disconnect } from 'get-starknet';
import { AccountInterface, ProviderInterface } from 'starknet';

interface StarknetContextType {
  account: AccountInterface | null;
  provider: ProviderInterface | null;
  address: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isLoading: boolean;
}

const StarknetContext = createContext<StarknetContextType | undefined>(undefined);

export function StarknetProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [provider, setProvider] = useState<ProviderInterface | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      const starknet = await connect({
        modalMode: 'alwaysAsk',
        modalTheme: 'light',
      });
      
      if (!starknet) {
        throw new Error('Failed to connect to wallet');
      }

      const provider = starknet.provider;
      const connectedAccount = starknet.account;

      setProvider(provider);
      setAccount(connectedAccount);
      setAddress(connectedAccount.address);
      setIsConnected(true);
      
      localStorage.setItem('starknetWalletConnected', 'true');
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const silentConnectWallet = async () => {
    try {
      setIsLoading(true);
 
      const starknet = await connect({
        modalMode: 'neverAsk',
      });
      
      if (starknet?.account) {
        setProvider(starknet.provider);
        setAccount(starknet.account);
        setAddress(starknet.account.address);
        setIsConnected(true);
      } else {
        localStorage.removeItem('starknetWalletConnected');
      }
    } catch (error) {
      console.error('Error silently connecting to wallet:', error);
      localStorage.removeItem('starknetWalletConnected');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsLoading(true);
      await disconnect();
      
      setAccount(null);
      setProvider(null);
      setAddress(null);
      setIsConnected(false);
      
      localStorage.removeItem('starknetWalletConnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const checkConnection = async () => {
      const wasConnected = localStorage.getItem('starknetWalletConnected') === 'true';
      if (wasConnected) {
        await silentConnectWallet();
      }
    };
    
    checkConnection();
  }, []);

  return (
    <StarknetContext.Provider
      value={{
        account,
        provider,
        address,
        isConnected,
        connectWallet,
        disconnectWallet,
        isLoading,
      }}
    >
      {children}
    </StarknetContext.Provider>
  );
}

export function useStarknet() {
  const context = useContext(StarknetContext);
  if (context === undefined) {
    throw new Error('useStarknet must be used within a StarknetProvider');
  }
  return context;
}
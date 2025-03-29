import React from 'react';
import { useStarknet } from '@/context/StarknetContext';

const StarknetLogin: React.FC = () => {
  const { connectWallet, disconnectWallet, isConnected, address, isLoading } = useStarknet();

  return (
    <div className="starknet-login">      
      {isConnected ? (
        <div>
          <p>{address}</p>
          <button 
            onClick={disconnectWallet}
            disabled={isLoading}
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect Wallet'}
          </button>
        </div>
      ) : (
        <button 
          onClick={connectWallet}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default StarknetLogin;

import { Account, RpcProvider, ec, hash } from 'starknet';

export async function verifyStarknetMessage(
  walletAddress: string,
  message: string,
  signature: string[],
): Promise<boolean> {
  try {
    if (!walletAddress || !message || !signature || signature.length !== 2) {
      throw new Error(
        'Invalid parameters: walletAddress, message, or signature is missing.',
      );
    }

    // Use RpcProvider with correct configuration
    // const provider = new RpcProvider({ nodeUrl: 'https://starknet-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID' });
    const provider = new RpcProvider({
      nodeUrl:
        process.env.STARKNET_NODE_URL ||
        'https://starknet-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    });

    //Account instance (Verification does not require private key)
    const account = new Account(
      provider,
      walletAddress,
      ec.starkCurve.getPublicKey(walletAddress),
    );

    //Format the typed data properly
    const typedDataMessage = {
      domain: {
        name: 'The App Name',
        version: '1',
        chainId: 'SN_MAIN',
      },
      types: {
        StarkNetDomain: [
          { name: 'theName', type: 'felt' },
          { name: 'theVersion', type: 'felt' },
          { name: 'theChainId', type: 'felt' },
        ],
        Message: [{ name: 'Content', type: 'felt' }],
      },
      primaryType: 'Message',
      message: {
        content: hash.starknetKeccak(message),
      },
    };

    //Convert signature to correct type (string[])
    const starkSignature: string[] = [
      signature[0].toString(),
      signature[1].toString(),
    ];

    //Verify the signature
    return await account.verifyMessage(typedDataMessage, starkSignature);
  } catch (error) {
    console.error('Starknet verification error:', error);
    return false;
  }
}

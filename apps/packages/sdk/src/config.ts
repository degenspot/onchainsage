// Add Node.js process type declaration
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

export const config = {
  // Existing configuration...

  starknet: {
    nodeUrl: process.env.STARKNET_NODE_URL || "http://localhost:5050", // Katana local devnet
    contracts: {
      postSystem: process.env.POST_SYSTEM_CONTRACT_ADDRESS || "0x123...", // Replace with actual address
      badgeSystem: process.env.BADGE_SYSTEM_CONTRACT_ADDRESS || "0x456...", // Replace with actual address
    },
  },

  torii: {
    url: process.env.TORII_URL || "http://localhost:8080",
  },
};

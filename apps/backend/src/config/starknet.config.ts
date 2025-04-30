/* eslint-disable prettier/prettier */
export const config = {
  starknet: {
    nodeUrl: process.env.STARKNET_NODE_URL || 'http://localhost:5050',
    contracts: {
      postSystem: process.env.POST_SYSTEM_CONTRACT_ADDRESS || '0x0',
      badgeSystem: process.env.BADGE_SYSTEM_CONTRACT_ADDRESS || '0x0',
    },
  },
  torii: {
    url: process.env.TORII_URL || 'http://localhost:8080',
  },
};

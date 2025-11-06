import { http, createConfig } from 'wagmi';
import { localhost, baseSepolia } from 'viem/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Define localhost chain (Hardhat node)
export const localhostChain = {
  ...localhost,
  id: 31337, // Hardhat's default chain ID
};

export const config = createConfig({
  chains: [localhostChain, baseSepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [localhostChain.id]: http('http://127.0.0.1:8545'),
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/2q7pEh0Rl95d--3GHlEP3'),
  },
});

// Contract addresses for Base Sepolia
export const CONTRACT_ADDRESSES: Record<string, `0x${string}`> = {
  // Recipe System on Base Sepolia
  recipeSystem: '0xa606151dA41AE7C1Eef6c48949bEd4a8e6dd7a6c',
};

// Enum mappings from contracts
export const CropType = {
  WHEAT: 0,
  TOMATO: 1,
  STRAWBERRY: 2,
  CARROT: 3,
} as const;

export type CropType = typeof CropType[keyof typeof CropType];

export const AnimalType = {
  COW: 0,
  CHICKEN: 1,
} as const;

export type AnimalType = typeof AnimalType[keyof typeof AnimalType];

export const ProductType = {
  MILK: 0,
  EGG: 1,
} as const;

export type ProductType = typeof ProductType[keyof typeof ProductType];

export const CROP_EMOJIS = {
  [CropType.WHEAT]: '🌾',
  [CropType.TOMATO]: '🍅',
  [CropType.STRAWBERRY]: '🍓',
  [CropType.CARROT]: '🥕',
};

export const ANIMAL_EMOJIS = {
  [AnimalType.COW]: '🐄',
  [AnimalType.CHICKEN]: '🐔',
};

export const PRODUCT_EMOJIS = {
  [ProductType.MILK]: '🥛',
  [ProductType.EGG]: '🥚',
};

// Helper functions to get names
export const getCropTypeName = (type: number): string => {
  const names: Record<number, string> = {
    [CropType.WHEAT]: 'WHEAT',
    [CropType.TOMATO]: 'TOMATO',
    [CropType.STRAWBERRY]: 'STRAWBERRY',
    [CropType.CARROT]: 'CARROT',
  };
  return names[type] || 'UNKNOWN';
};

export const getAnimalTypeName = (type: number): string => {
  const names: Record<number, string> = {
    [AnimalType.COW]: 'COW',
    [AnimalType.CHICKEN]: 'CHICKEN',
  };
  return names[type] || 'UNKNOWN';
};

import { http, createConfig } from 'wagmi';
import { localhost } from 'viem/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Define localhost chain (Hardhat node)
export const localhostChain = {
  ...localhost,
  id: 31337, // Hardhat's default chain ID
};

export const config = createConfig({
  chains: [localhostChain],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [localhostChain.id]: http('http://127.0.0.1:8545'),
  },
});

// Contract addresses - deployed to localhost Hardhat node
export const CONTRACT_ADDRESSES: Record<string, `0x${string}`> = {
  gameToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  farmLand: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  animalFarm: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  restaurant: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
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

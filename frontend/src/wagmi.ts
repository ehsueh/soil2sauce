import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Soil2Sauce Farming Game',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [hardhat, sepolia],
  ssr: false,
});

// Contract addresses - update these after deployment
export const CONTRACT_ADDRESSES = {
  gameToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`,
  farmLand: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
  animalFarm: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,
  restaurant: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as `0x${string}`,
};

// Enum mappings from contracts
export enum CropType {
  WHEAT = 0,
  TOMATO = 1,
  STRAWBERRY = 2,
  CARROT = 3,
}

export enum AnimalType {
  COW = 0,
  CHICKEN = 1,
}

export enum ProductType {
  MILK = 0,
  EGG = 1,
}

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

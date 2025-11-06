// Contract addresses - network specific
const LOCALHOST_ADDRESSES: Record<string, `0x${string}`> = {
  ItemsERC1155: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  STOKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  PlantSystem: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  LivestockSystem: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  ShopSystem: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  GameRegistry: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
};

// Base Sepolia deployment addresses
const BASE_SEPOLIA_ADDRESSES: Record<string, `0x${string}`> = {
  ItemsERC1155: '0xae91c4763066415b8a938e81e30d7339c7dc9a97',
  STOKEN: '0x9f8358c9756c0e43929b158cc0a529a249a71815',
  PlantSystem: '0x83dac0f3da9d313e1158ca32c078ca23c05314ef',
  LivestockSystem: '0xe92394b18bde769107eac8728045df41c8f7ae3c',
  ShopSystem: '0x58279572233d1b81db79e7847ff45cc03a0c0507',
  GameRegistry: '0x5878710067d8152f8dfae74e054df3615a47199d',
  RecipeSystem: '0xa606151da41ae7c1eef6c48949bed4a8e6dd7a6c'
};

// Export function to get addresses based on chain
export function getContractAddresses(chainId?: number): Record<string, `0x${string}`> {
  if (chainId === 84532) {
    return BASE_SEPOLIA_ADDRESSES;
  }
  return LOCALHOST_ADDRESSES;
}

// Default export for Base Sepolia (since user is on Base Sepolia)
export const CONTRACT_ADDRESSES = BASE_SEPOLIA_ADDRESSES;

// Item ID mappings
export const ITEM_IDS = {
  SEEDS: {
    WHEAT: 1,
    TOMATO: 2,
    CORN: 3,
    LETTUCE: 4,
    CARROT: 5
  },
  CROPS: {
    WHEAT: 10,
    TOMATO: 11,
    CORN: 12,
    LETTUCE: 13,
    CARROT: 14
  },
  ANIMALS: {
    COW: 20,
    CHICKEN: 21,
    PIG: 22
  },
  PRODUCTS: {
    MILK: 30,
    EGG: 31,
    PORK: 32,
    CHEESE: 33,
    FEATHER: 34,
    BACON: 35
  }
} as const;

interface ItemMetadata {
  name: string;
  category: 'seed' | 'crop' | 'animal' | 'product';
  emoji: string;
  growthTime?: number;
  yield?: number;
  cooldown?: number;
  price?: string;
}

// Item metadata
export const ITEM_METADATA: Record<number, ItemMetadata> = {
  // Seeds
  1: { name: 'Wheat Seed', category: 'seed', emoji: '🌾', growthTime: 5, yield: 5 },
  2: { name: 'Tomato Seed', category: 'seed', emoji: '🍅', growthTime: 7, yield: 3 },
  3: { name: 'Corn Seed', category: 'seed', emoji: '🌽', growthTime: 10, yield: 4 },
  4: { name: 'Lettuce Seed', category: 'seed', emoji: '🥬', growthTime: 15, yield: 4 },
  5: { name: 'Carrot Seed', category: 'seed', emoji: '🥕', growthTime: 20, yield: 3 },

  // Crops
  10: { name: 'Wheat', category: 'crop', emoji: '🌾' },
  11: { name: 'Tomato', category: 'crop', emoji: '🍅' },
  12: { name: 'Corn', category: 'crop', emoji: '🌽' },
  13: { name: 'Lettuce', category: 'crop', emoji: '🥬' },
  14: { name: 'Carrot', category: 'crop', emoji: '🥕' },

  // Animals
  20: { name: 'Cow', category: 'animal', emoji: '🐮', cooldown: 60, price: '20' },
  21: { name: 'Chicken', category: 'animal', emoji: '🐔', cooldown: 60, price: '30' },
  22: { name: 'Pig', category: 'animal', emoji: '🐷', cooldown: 60, price: '40' },

  // Products
  30: { name: 'Milk', category: 'product', emoji: '🥛' },
  31: { name: 'Egg', category: 'product', emoji: '🥚' },
  32: { name: 'Pork', category: 'product', emoji: '🥩' },
  33: { name: 'Cheese', category: 'product', emoji: '🧀' },
  34: { name: 'Feather', category: 'product', emoji: '🪶' },
  35: { name: 'Bacon', category: 'product', emoji: '🥓' }
};

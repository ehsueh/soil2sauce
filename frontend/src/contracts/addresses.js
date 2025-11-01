// Contract addresses from local Anvil deployment
export const CONTRACT_ADDRESSES = {
  ItemsERC1155: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  STOKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  PlantSystem: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  LivestockSystem: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  ShopSystem: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  GameRegistry: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
};

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
};

// Item metadata
export const ITEM_METADATA = {
  // Seeds
  1: { name: 'Wheat Seed', category: 'seed', emoji: '🌾', growthTime: 24 * 3600, yield: 5 },
  2: { name: 'Tomato Seed', category: 'seed', emoji: '🍅', growthTime: 48 * 3600, yield: 3 },
  3: { name: 'Corn Seed', category: 'seed', emoji: '🌽', growthTime: 72 * 3600, yield: 4 },
  4: { name: 'Lettuce Seed', category: 'seed', emoji: '🥬', growthTime: 12 * 3600, yield: 4 },
  5: { name: 'Carrot Seed', category: 'seed', emoji: '🥕', growthTime: 36 * 3600, yield: 3 },

  // Crops
  10: { name: 'Wheat', category: 'crop', emoji: '🌾' },
  11: { name: 'Tomato', category: 'crop', emoji: '🍅' },
  12: { name: 'Corn', category: 'crop', emoji: '🌽' },
  13: { name: 'Lettuce', category: 'crop', emoji: '🥬' },
  14: { name: 'Carrot', category: 'crop', emoji: '🥕' },

  // Animals
  20: { name: 'Cow', category: 'animal', emoji: '🐮', cooldown: 12 * 3600, price: '500' },
  21: { name: 'Chicken', category: 'animal', emoji: '🐔', cooldown: 8 * 3600, price: '200' },
  22: { name: 'Pig', category: 'animal', emoji: '🐷', cooldown: 24 * 3600, price: '800' },

  // Products
  30: { name: 'Milk', category: 'product', emoji: '🥛' },
  31: { name: 'Egg', category: 'product', emoji: '🥚' },
  32: { name: 'Pork', category: 'product', emoji: '🥩' },
  33: { name: 'Cheese', category: 'product', emoji: '🧀' },
  34: { name: 'Feather', category: 'product', emoji: '🪶' },
  35: { name: 'Bacon', category: 'product', emoji: '🥓' }
};

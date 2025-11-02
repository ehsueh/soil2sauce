// Contract addresses from local Anvil deployment
export const CONTRACT_ADDRESSES = {
  ItemsERC1155: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
  STOKEN: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
  PlantSystem: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
  LivestockSystem: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed',
  ShopSystem: '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c',
  GameRegistry: '0xc6e7DF5E7b4f2A278906862b61205850344D4e7d'
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

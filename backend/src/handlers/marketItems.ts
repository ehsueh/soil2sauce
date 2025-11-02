import { Request, Response } from 'express';

interface CropData {
  name: string;
  processed: string[];
  growth_time: number; // in seconds
  yield: number; // how many seeds per harvest
}

interface NonCropItem {
  name: string;
  type: string;
  price: number;
  description: string;
}

interface MarketItemsResponse {
  date: string;
  crops: CropData[];
  non_crop_items: NonCropItem[];
}

// Base crops available in the game
const ALL_CROPS: Record<string, CropData> = {
  wheat: {
    name: 'Wheat',
    processed: ['Flour', 'Bread'],
    growth_time: 10,
    yield: 2
  },
  tomato: {
    name: 'Tomato',
    processed: ['Paste', 'Sauce'],
    growth_time: 15,
    yield: 2
  },
  strawberry: {
    name: 'Strawberry',
    processed: ['Jam', 'Juice'],
    growth_time: 12,
    yield: 2
  },
  carrot: {
    name: 'Carrot',
    processed: ['Juice', 'Diced'],
    growth_time: 8,
    yield: 2
  }
};

// Non-crop items (from animals and other sources)
const NON_CROP_ITEMS: Record<string, NonCropItem> = {
  milk: {
    name: 'Milk',
    type: 'Animal Product',
    price: 15,
    description: 'Fresh milk from cows'
  },
  egg: {
    name: 'Egg',
    type: 'Animal Product',
    price: 10,
    description: 'Fresh eggs from chickens'
  },
  butter: {
    name: 'Butter',
    type: 'Dairy Product',
    price: 25,
    description: 'Churned butter made from milk'
  },
  cheese: {
    name: 'Cheese',
    type: 'Dairy Product',
    price: 35,
    description: 'Aged cheese made from milk'
  },
  honey: {
    name: 'Honey',
    type: 'Specialty Item',
    price: 40,
    description: 'Pure honey from beehives'
  }
};

/**
 * Get market items based on the provided date
 * Returns available crops and non-crop items
 * In a real implementation, this could vary by season/date
 */
function getMarketItemsForDate(date: string): MarketItemsResponse {
  // Parse the date to determine season
  const dateObj = new Date(date);
  const month = dateObj.getMonth() + 1; // 1-12

  // Determine season (simple seasonal rotation)
  let availableCrops: CropData[] = [];

  // All crops are always available in this version
  // In a more complex game, you could restrict by season
  availableCrops = Object.values(ALL_CROPS);

  // Seasonal non-crop items
  let seasonalItems: NonCropItem[] = [];

  if (month >= 3 && month <= 5) {
    // Spring - more dairy products
    seasonalItems = [NON_CROP_ITEMS.milk, NON_CROP_ITEMS.butter, NON_CROP_ITEMS.egg];
  } else if (month >= 6 && month <= 8) {
    // Summer - honey season
    seasonalItems = [NON_CROP_ITEMS.honey, NON_CROP_ITEMS.egg, NON_CROP_ITEMS.milk];
  } else if (month >= 9 && month <= 11) {
    // Fall - cheese season
    seasonalItems = [NON_CROP_ITEMS.cheese, NON_CROP_ITEMS.milk, NON_CROP_ITEMS.butter];
  } else {
    // Winter - all items available but higher prices
    seasonalItems = Object.values(NON_CROP_ITEMS);
  }

  return {
    date,
    crops: availableCrops,
    non_crop_items: seasonalItems
  };
}

/**
 * Market Items Handler
 * Returns available crops and non-crop items for the given date
 * Query parameter: date (ISO format YYYY-MM-DD)
 */
export function marketItemsHandler(req: Request, res: Response) {
  try {
    const { date } = req.query;

    // Get current date if not provided
    let queryDate = date ? String(date) : new Date().toISOString().split('T')[0];

    // Validate date format
    if (!queryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Try to parse and reformat
      try {
        const parsed = new Date(queryDate);
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({
            error: 'Invalid date format',
            message: 'Please provide date in YYYY-MM-DD format'
          });
        }
        queryDate = parsed.toISOString().split('T')[0];
      } catch {
        return res.status(400).json({
          error: 'Invalid date format',
          message: 'Please provide date in YYYY-MM-DD format'
        });
      }
    }

    const marketItems = getMarketItemsForDate(queryDate);

    res.json({
      success: true,
      data: marketItems
    });
  } catch (error) {
    console.error('Market items error:', error);
    res.status(500).json({
      error: 'Failed to get market items',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

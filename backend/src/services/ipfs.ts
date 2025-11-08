import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY,
});

interface RecipeMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  ingredients: string;
  grade: number;
  revenueRate: number;
  critics: string;
  recipeId?: number;
}

/**
 * Upload recipe metadata to IPFS via Pinata
 * @param metadata Recipe metadata object
 * @returns IPFS URI (ipfs://...)
 */
export async function uploadMetadataToIPFS(metadata: RecipeMetadata): Promise<string> {
  try {
    if (!process.env.PINATA_JWT) {
      throw new Error('PINATA_JWT not configured');
    }

    const upload = await pinata.upload.public.json(metadata);

    // Return IPFS URI
    return `ipfs://${upload.cid}`;
  } catch (error) {
    console.error('Failed to upload to IPFS:', error);
    throw error;
  }
}

/**
 * Create standard NFT metadata for a recipe
 * @param dishDescription The name/description of the dish
 * @param ingredients List of ingredients
 * @param grade Recipe grade (1-100)
 * @param revenueRate Revenue rate
 * @param critics Critics feedback
 * @returns Metadata object ready for IPFS upload
 */
export function createRecipeMetadata(
  dishDescription: string,
  ingredients: string,
  grade: number,
  revenueRate: number,
  critics: string
): RecipeMetadata {
  return {
    name: dishDescription,
    description: `A recipe NFT from Soil2Sauce game. ${critics}`,
    attributes: [
      {
        trait_type: 'Grade',
        value: grade,
      },
      {
        trait_type: 'Revenue Rate',
        value: revenueRate,
      },
      {
        trait_type: 'Ingredients',
        value: ingredients,
      },
    ],
    ingredients,
    grade,
    revenueRate,
    critics,
  };
}

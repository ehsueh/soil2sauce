import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RecipeResearchRequest {
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
  }>;
}

interface RecipeResponse {
  name: string;
  description: string;
  difficulty_level: number;
  ingredient_rates: Record<string, number>;
  cooking_instructions: string;
}

/**
 * Recipe Research Handler
 * Takes a dish description and ingredients, uses Claude to generate a complete recipe
 * with difficulty level, ingredient rates, and cooking instructions
 */
export async function recipeResearchHandler(req: Request, res: Response) {
  try {
    const { description, ingredients }: RecipeResearchRequest = req.body;

    // Validate input
    if (!description || !ingredients || ingredients.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'description and ingredients array are required'
      });
    }

    // Build ingredients string for AI
    const ingredientsList = ingredients
      .map(ing => `- ${ing.name} (${ing.amount})`)
      .join('\n');

    // Create prompt for OpenAI
    const prompt = `You are a professional chef AI assistant helping players create recipes for a farming game called Soil2Sauce.

A player wants to create a new dish with the following description:
"${description}"

Available ingredients:
${ingredientsList}

Please analyze this dish and provide:
1. A catchy recipe name (2-4 words)
2. A refined description (1-2 sentences) of what makes this dish special
3. Difficulty level (1-10, where 1 is very simple and 10 is very complex)
4. Ingredient rates (how much of each ingredient is needed in the final recipe, as a ratio)
5. Step-by-step cooking instructions (3-5 clear steps)

Format your response EXACTLY as JSON with no additional text:
{
  "name": "Recipe Name",
  "description": "A delightful description of the dish",
  "difficulty_level": 5,
  "ingredient_rates": {
    "ingredient1": 2,
    "ingredient2": 1
  },
  "cooking_instructions": "Step 1: Do this. Step 2: Do that. Step 3: Combine and serve."
}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    // Extract response text
    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    const recipe: RecipeResponse = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!recipe.name || !recipe.description || !recipe.difficulty_level || !recipe.ingredient_rates || !recipe.cooking_instructions) {
      throw new Error('Invalid recipe response structure from OpenAI');
    }

    res.json({
      success: true,
      recipe: {
        name: recipe.name,
        description: recipe.description,
        difficulty_level: recipe.difficulty_level,
        ingredient_rates: recipe.ingredient_rates,
        cooking_instructions: recipe.cooking_instructions
      }
    });
  } catch (error) {
    console.error('Recipe research error:', error);
    res.status(500).json({
      error: 'Failed to research recipe',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

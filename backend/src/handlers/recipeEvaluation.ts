import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface RecipeEvaluationRequest {
  recipe: {
    name: string;
    description: string;
    ingredients: Array<{
      name: string;
      amount: string;
    }>;
  };
  instructions: string;
}

interface EvaluationResponse {
  grade: string; // F, D, C, B, A, S
  revenue_rate: number;
  critics: string;
}

/**
 * Recipe Evaluation Handler
 * Evaluates a complete recipe and provides a grade, revenue rate, and critical feedback
 */
export async function recipeEvaluationHandler(req: Request, res: Response) {
  try {
    const { recipe, instructions }: RecipeEvaluationRequest = req.body;

    // Validate input
    if (!recipe || !recipe.name || !recipe.description || !instructions) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'recipe (with name and description) and instructions are required'
      });
    }

    // Build ingredients string
    const ingredientsList = recipe.ingredients
      .map(ing => `- ${ing.name} (${ing.amount})`)
      .join('\n');

    // Create prompt for Claude
    const prompt = `You are a Michelin-starred head chef evaluating recipes for a farming game called Soil2Sauce.

Please evaluate this recipe:

**Recipe Name:** ${recipe.name}
**Description:** ${recipe.description}

**Ingredients:**
${ingredientsList}

**Cooking Instructions:**
${instructions}

Based on the complexity, ingredient quality pairing, technique, presentation potential, and market appeal, provide:

1. **Grade** (F, D, C, B, A, or S where S is exceptional):
   - F: Inedible or dangerously flawed
   - D: Poor execution or bad ingredient pairing
   - C: Average, lacks creativity
   - B: Good technique and interesting combination
   - A: Excellent, professional quality
   - S: Exceptional, innovative, restaurant-worthy

2. **Revenue Rate** (tokens per minute in the game, 1-100):
   - Consider market demand, complexity, ingredient costs, and prestige
   - Simple popular dishes: 5-15 tokens/min
   - Moderate difficulty: 15-40 tokens/min
   - Complex innovative dishes: 40-100 tokens/min

3. **Critics** (2-3 sentences of professional feedback):
   - What works well about this recipe
   - Areas for improvement
   - Market potential

Format your response EXACTLY as JSON with no additional text:
{
  "grade": "A",
  "revenue_rate": 35,
  "critics": "A well-balanced dish that showcases the ingredients beautifully. The cooking method is straightforward yet elegant, making it accessible to diners while maintaining quality. High potential for consistent demand."
}`;

    // Call Claude API
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract response text
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response as JSON');
    }

    const evaluation: EvaluationResponse = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!evaluation.grade || evaluation.revenue_rate === undefined || !evaluation.critics) {
      throw new Error('Invalid evaluation response structure from Claude');
    }

    // Validate grade
    const validGrades = ['F', 'D', 'C', 'B', 'A', 'S'];
    if (!validGrades.includes(evaluation.grade)) {
      throw new Error(`Invalid grade: ${evaluation.grade}`);
    }

    // Clamp revenue rate between 1 and 100
    const clampedRevenueRate = Math.max(1, Math.min(100, Math.round(evaluation.revenue_rate)));

    res.json({
      success: true,
      evaluation: {
        grade: evaluation.grade,
        revenue_rate: clampedRevenueRate,
        critics: evaluation.critics
      }
    });
  } catch (error) {
    console.error('Recipe evaluation error:', error);
    res.status(500).json({
      error: 'Failed to evaluate recipe',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

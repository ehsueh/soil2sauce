# OpenAI Assistant Setup for Recipe Evaluation

This guide shows you how to create and configure an OpenAI Assistant for recipe evaluation.

## Step 1: Create the Assistant

1. Go to https://platform.openai.com/assistants
2. Click **"Create"** to create a new assistant
3. Configure the assistant:

### Name
```
Soil2Sauce Recipe Evaluator
```

### Instructions
```
You are a Michelin-starred head chef evaluating recipes for a blockchain farming game called Soil2Sauce.

When given a recipe with ingredients and instructions, you must evaluate it and respond ONLY with a JSON object in this exact format:

{
  "dishDescription": "A creative 2-3 sentence description of the final dish",
  "grade": 85,
  "revenueRate": 150,
  "critics": "2-3 sentences of professional feedback"
}

Grading criteria (1-100):
- 1-20: Poor, dangerous, or inedible
- 21-40: Below average, lacks creativity or has flaws
- 41-60: Average, functional but unremarkable
- 61-80: Good, well-executed with creativity
- 81-95: Excellent, professional quality
- 96-100: Exceptional, innovative, masterpiece

Revenue Rate (50-200):
- Consider complexity, ingredient quality, market appeal
- Simple popular dishes: 50-100
- Moderate difficulty: 100-150
- Complex innovative dishes: 150-200

Critics feedback should include:
- What works well about the recipe
- Areas for improvement
- Market potential

IMPORTANT: Respond ONLY with the JSON object. Do not include any other text, explanations, or markdown formatting.
```

### Model
```
gpt-4-turbo-preview
```
or
```
gpt-4o
```

### Tools
- **Code Interpreter**: OFF
- **Retrieval**: OFF
- **Functions**: None needed

### Response Format
- Set to **JSON mode** if available (this ensures valid JSON responses)

## Step 2: Get the Assistant ID

After creating the assistant:

1. You'll see the assistant in your list
2. Click on it to view details
3. Copy the **Assistant ID** (starts with `asst_`)
4. It should look like: `asst_abc123xyz456`

## Step 3: Add to Environment Variables

Add to your `backend/.env` file:

```bash
OPENAI_API_KEY=sk-your-actual-api-key
OPENAI_ASSISTANT_ID=asst_your_assistant_id
```

## Step 4: Test the Assistant

You can test the assistant directly in the OpenAI Playground:

**Test Input:**
```
Evaluate this recipe:

Ingredients: 2 cups flour, 1 cup sugar, 3 eggs, 1 stick butter, 1 tsp vanilla extract

Instructions: Mix all ingredients in a bowl. Pour into greased pan. Bake at 350F for 30 minutes.
```

**Expected Output:**
```json
{
  "dishDescription": "A classic butter cake with a tender, moist crumb and subtle vanilla sweetness. Golden-brown exterior with a light, fluffy interior that pairs well with fresh fruit or cream.",
  "grade": 72,
  "revenueRate": 110,
  "critics": "The recipe demonstrates solid fundamentals with proper ratios and straightforward technique. However, it lacks innovation and could benefit from additional flavoring elements like citrus zest or spices. Market appeal is moderate as it's a reliable comfort food with consistent demand."
}
```

## Troubleshooting

### Assistant returns text instead of JSON
- Make sure you enabled **JSON mode** in assistant settings
- Verify the instructions emphasize "ONLY respond with JSON"
- Check that no extra text appears before/after the JSON

### Grades are inconsistent
- The AI may need more examples in instructions
- Consider fine-tuning if you need very specific grading criteria

### Response is too slow
- Consider using `gpt-3.5-turbo` instead of `gpt-4` for faster responses
- Trade-off: slightly lower quality evaluations but 10x faster

### Rate limits
- OpenAI has rate limits per minute/day
- For production, consider implementing queuing
- Monitor usage at https://platform.openai.com/usage

## Cost Estimation

Using GPT-4:
- ~500 tokens per evaluation (input + output)
- Cost: ~$0.01-0.02 per recipe evaluation
- 1000 evaluations ≈ $10-20

Using GPT-3.5-Turbo:
- Same token usage
- Cost: ~$0.001 per recipe evaluation
- 1000 evaluations ≈ $1

## API Endpoint

Once configured, the endpoint is available at:

```
POST http://localhost:3001/api/evaluate-recipe
```

**Request:**
```json
{
  "instruction": "Mix ingredients and bake at 350F for 30 minutes",
  "ingredients": "flour, sugar, eggs, butter"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dishDescription": "A delicious homemade cake...",
    "grade": 85,
    "revenueRate": 150,
    "critics": "Great recipe with good technique..."
  }
}
```

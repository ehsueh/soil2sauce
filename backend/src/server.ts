import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { recipeResearchHandler } from './handlers/recipeResearch.js';
import { recipeEvaluationHandler } from './handlers/recipeEvaluation.js';
import { marketItemsHandler } from './handlers/marketItems.js';
import { evaluateRecipeHandler } from './handlers/evaluateRecipe.js';
import { mintRecipeHandler } from './handlers/mintRecipe.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📨 ${req.method} ${req.path}`, {
    timestamp,
    ip: req.ip,
    userAgent: req.get('user-agent')?.substring(0, 100) + '...',
    contentType: req.get('content-type'),
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  console.log('💚 Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint to check request logging
app.post('/api/test', (req: Request, res: Response) => {
  console.log('🧪 Test endpoint called with body:', req.body);
  res.json({ 
    success: true, 
    message: 'Test endpoint working',
    receivedBody: req.body,
    timestamp: new Date().toISOString()
  });
});

// Recipe Research endpoint
// POST /api/recipes/research
// Body: { description: string, ingredients: {name, amount}[] }
// Response: { recipe: {name, description, difficulty_level, ingredient_rates, cooking_instructions} }
app.post('/api/recipes/research', recipeResearchHandler);

// Recipe Evaluation endpoint
// POST /api/recipes/evaluate
// Body: { recipe: {name, description, ingredients[]}, instructions: string }
// Response: { evaluation: {grade, revenue_rate, critics} }
app.post('/api/recipes/evaluate', recipeEvaluationHandler);

// Recipe Evaluation endpoint
// POST /api/evaluate-recipe
// Body: { instruction: string, ingredients: string, walletAddress: string }
// Response: { success: boolean, data: {dishDescription, grade, revenueRate, critics, metadataURI, hash, timestamp} }
app.post('/api/evaluate-recipe', (req: Request, res: Response) => {
  console.log('🔥 EVALUATE RECIPE ENDPOINT CALLED!');
  console.log('🔥 Request body keys:', Object.keys(req.body || {}));
  console.log('🔥 Full request body:', req.body);
  evaluateRecipeHandler(req, res);
});

// Mint Recipe NFT endpoint
// POST /api/mint-recipe
// Body: { recipeId, walletAddress, dishDescription, ingredients, grade, revenueRate, critics, metadataURI, hash, timestamp }
// Response: { success: boolean, recipeId: string, txHash: string }
app.post('/api/mint-recipe', (req: Request, res: Response) => {
  console.log('🔥 MINT RECIPE ENDPOINT CALLED!');
  console.log('🔥 Request body keys:', Object.keys(req.body || {}));
  console.log('🔥 RecipeId:', req.body?.recipeId);
  mintRecipeHandler(req, res);
});

// Market Items endpoint
// GET /api/market/items?date=2024-01-01
// Response: { items: [{crop: {name, processed[], growth_time, yield}}], non_crop_items: [{name, price}] }
app.get('/api/market/items', marketItemsHandler);

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌾 Soil2Sauce AI Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base: http://localhost:${PORT}/api`);
});

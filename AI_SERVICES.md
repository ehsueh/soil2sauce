# Soil2Sauce AI Services Specification

**Version:** 1.0
**Date:** October 31, 2025

---

## 1. Service Overview

**Technology Stack:**
- Node.js or Python (FastAPI recommended)
- OpenAI GPT-4 or Claude API for LLM
- Redis for caching and rate limiting
- PostgreSQL for logging and analytics
- JWT authentication for frontend requests

**Deployment:**
- Containerized (Docker)
- Hosted on cloud provider (AWS/GCP/Vercel)
- Auto-scaling based on request load
- 99.9% uptime SLA

---

## 2. API: Research Recipe

**Endpoint:** `POST /api/recipes/research`

**Purpose:** Generate recipe ideas based on selected ingredients using AI.

**Input Schema:**

```json
{
  "playerAddress": "0x1234...abcd",
  "ingredients": [
    { "itemId": 10, "name": "Wheat" },
    { "itemId": 11, "name": "Tomato" }
  ],
  "preferences": {
    "difficulty": "medium",
    "cuisine": "Italian"
  }
}
```

**Output Schema:**

```json
{
  "suggestions": [
    {
      "name": "Rustic Tomato Bread",
      "description": "A hearty Italian appetizer with roasted tomatoes on crusty wheat bread",
      "difficulty": 5,
      "estimatedRevenue": "30-50 STOKEN/day",
      "requiredIngredients": [
        { "itemId": 10, "name": "Wheat", "quantity": 5 },
        { "itemId": 11, "name": "Tomato", "quantity": 8 }
      ]
    },
    {
      "name": "Summer Tomato Wheat Salad",
      "description": "A light and refreshing wheat berry salad with fresh tomatoes",
      "difficulty": 3,
      "estimatedRevenue": "20-35 STOKEN/day",
      "requiredIngredients": [
        { "itemId": 10, "name": "Wheat", "quantity": 3 },
        { "itemId": 11, "name": "Tomato", "quantity": 6 }
      ]
    }
  ]
}
```

**LLM Prompt Template:**

```
You are a creative chef AI for the Soil2Sauce game. Generate 2-3 unique recipe ideas.

Available ingredients: {ingredientList}
Preferred difficulty: {difficulty}
Preferred cuisine: {cuisine}

For each recipe, provide:
1. Creative name
2. Appetizing 1-sentence description
3. Difficulty rating (1-10)
4. Estimated daily revenue potential (in STOKEN)
5. Exact ingredient quantities needed

Format as JSON array.
```

**Performance Targets:**
- Response time: < 3 seconds (p95)
- Success rate: > 99%
- Rate limit: 10 requests per minute per player

**Error Handling:**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Please wait 30 seconds before researching again",
    "retryAfter": 30
  }
}
```

---

## 3. API: Evaluate Recipe

**Endpoint:** `POST /api/recipes/evaluate`

**Purpose:** Grade a minted recipe and generate critic reviews, determining revenue potential.

**Input Schema:**

```json
{
  "recipeId": 42,
  "name": "Spicy Tomato Pasta",
  "description": "A fiery Italian classic...",
  "difficulty": 7,
  "ingredients": [
    { "itemId": 10, "name": "Wheat", "quantity": 5 },
    { "itemId": 11, "name": "Tomato", "quantity": 10 }
  ]
}
```

**Output Schema:**

```json
{
  "recipeId": 42,
  "grade": "A",
  "revenueRate": "55000000000000000000",
  "critics": [
    "Perfectly balanced heat and acidity!",
    "The handmade pasta elevates this dish.",
    "A masterful take on a classic."
  ],
  "evaluation": {
    "creativity": 8,
    "technique": 7,
    "presentation": 6,
    "overallScore": 85
  }
}
```

**Grading Algorithm:**

```
Base Score = difficulty * 10 (max 100)
Creativity Bonus = LLM evaluation (0-20)
Ingredient Synergy = LLM evaluation (0-20)
Total Score = Base + Creativity + Synergy

Grade Mapping:
S: 95-100 → 5 critics, revenueRate = difficulty * 12 STOKEN/day
A: 85-94  → 4 critics, revenueRate = difficulty * 10 STOKEN/day
B: 75-84  → 3 critics, revenueRate = difficulty * 8 STOKEN/day
C: 65-74  → 2 critics, revenueRate = difficulty * 6 STOKEN/day
D: 50-64  → 1 critic,  revenueRate = difficulty * 4 STOKEN/day
F: 0-49   → 0 critics, revenueRate = difficulty * 2 STOKEN/day
```

**LLM Prompt Template:**

```
You are a Michelin-star food critic evaluating a recipe for the Soil2Sauce game.

Recipe Name: {name}
Description: {description}
Difficulty: {difficulty}/10
Ingredients: {ingredientList}

Evaluate on:
1. Creativity (0-20): How unique and innovative is this recipe?
2. Ingredient Synergy (0-20): Do the ingredients complement each other?
3. Technique Complexity: Does difficulty match the recipe?

Provide:
- Creativity score
- Synergy score
- 0-5 critical reviews (1-2 sentences each, mix of praise and constructive feedback)

Format as JSON.
```

**Performance Targets:**
- Response time: < 5 seconds (p95)
- Success rate: > 99.5%
- Rate limit: 5 requests per minute per player

**Security Considerations:**
- Validate recipeId exists on-chain before evaluation
- Prevent re-evaluation spam (cooldown period)
- Log all evaluations for audit trail
- API key authentication for smart contract callback

**Callback Flow:**

```
1. Player mints recipe on-chain → RecipeCreated event
2. Frontend calls /api/recipes/evaluate
3. AI service evaluates recipe
4. AI service calls smart contract: RecipeSystem.evaluateRecipe()
   - Uses CONFIG_ADMIN_ROLE key
   - Updates grade, critics, revenueRate on-chain
5. Frontend polls or listens for RecipeEvaluated event
6. UI updates with new grade and revenue
```

---

## 4. API: List Market Items

**Endpoint:** `GET /api/marketplace/items`

**Purpose:** Aggregate marketplace listings with metadata for frontend display.

**Input (Query Params):**

```
?category=seeds
&sortBy=price_asc
&limit=50
&offset=0
```

**Output Schema:**

```json
{
  "items": [
    {
      "listingId": 7,
      "seller": "0x5678...efgh",
      "itemId": 1,
      "itemName": "Wheat Seed",
      "amount": 100,
      "pricePerUnit": "8000000000000000000",
      "totalPrice": "800000000000000000000",
      "listedAt": 1698787200
    }
  ],
  "total": 245,
  "hasMore": true
}
```

**Performance Targets:**
- Response time: < 500ms
- Cache duration: 10 seconds
- No rate limiting (public endpoint)

**Implementation:**
- Event indexer watches `ListingCreated`, `ListingPurchased`, `ListingCancelled`
- Postgres table with listing data + metadata
- REST API serves cached data
- Optional: The Graph protocol for decentralized indexing

---

## 5. Rate Limiting Strategy

**Per Endpoint Limits:**

| Endpoint | Limit | Window | Burst |
|----------|-------|--------|-------|
| /research | 10 req | 1 min | 3 |
| /evaluate | 5 req | 1 min | 2 |
| /marketplace | 100 req | 1 min | 20 |

**Implementation:**
- Redis-based sliding window counter
- Keyed by playerAddress (from JWT)
- 429 response on limit exceeded with `Retry-After` header

**Abuse Prevention:**
- IP-based rate limiting (backup)
- CAPTCHA on repeated failures
- Wallet signature verification for all authenticated endpoints

---

## 6. Caching Strategy

**Recipe Research:**
- Cache identical ingredient combinations for 1 hour
- Key: `research:{sortedIngredientIds}:{preferences}`

**Recipe Evaluation:**
- No caching (each recipe evaluated once)

**Marketplace:**
- Cache full item list for 10 seconds
- Invalidate on ListingCreated/Purchased/Cancelled events

---

## 7. Monitoring and Alerts

**Metrics:**
- Request count, latency (p50, p95, p99) per endpoint
- Error rate (4xx, 5xx)
- LLM API call success rate and latency
- Rate limit hits per player

**Alerts:**
- Error rate > 1% for 5 minutes
- p95 latency > 5 seconds
- LLM API down (fallback to cached responses?)

**Logging:**
- All requests logged with playerAddress, endpoint, response time
- LLM prompts and responses logged (for quality improvement)
- GDPR compliance: anonymize logs after 30 days

---

## 8. API Documentation

**OpenAPI Spec (Swagger):**

```yaml
openapi: 3.0.0
info:
  title: Soil2Sauce AI API
  version: 1.0.0
  description: AI services for recipe research and evaluation

servers:
  - url: https://api.soil2sauce.com/v1

paths:
  /recipes/research:
    post:
      summary: Research new recipe ideas
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ResearchRequest'
      responses:
        200:
          description: Recipe suggestions returned
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ResearchResponse'
        429:
          description: Rate limit exceeded

  /recipes/evaluate:
    post:
      summary: Evaluate a recipe and assign grade
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EvaluateRequest'
      responses:
        200:
          description: Recipe evaluation complete
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EvaluateResponse'

components:
  schemas:
    ResearchRequest:
      type: object
      required:
        - playerAddress
        - ingredients
      properties:
        playerAddress:
          type: string
        ingredients:
          type: array
          items:
            $ref: '#/components/schemas/Ingredient'
        preferences:
          type: object
          properties:
            difficulty:
              type: string
            cuisine:
              type: string

    Ingredient:
      type: object
      properties:
        itemId:
          type: integer
        name:
          type: string
```

**Interactive Docs:**
- Swagger UI hosted at `/api/docs`
- Example requests and responses
- Authentication guide (JWT)

---

## 9. Security Considerations

**Authentication:**
- All endpoints require JWT token with player address claim
- Token signed by frontend after wallet signature verification
- Token expiry: 24 hours

**Authorization:**
- Players can only research/evaluate their own recipes
- CONFIG_ADMIN_ROLE required for contract callback operations

**Input Validation:**
- Sanitize all user inputs to prevent injection attacks
- Validate itemIds against known token IDs
- Limit string lengths (name max 100 chars, description max 500 chars)

**Content Moderation:**
- Filter offensive language in AI responses
- Manual review queue for flagged content
- Abuse reporting mechanism

**API Key Management:**
- LLM API keys stored in secure vault (AWS Secrets Manager)
- Rotate keys quarterly
- Monitor API usage for anomalies

---

## 10. Development and Testing

**Local Development:**
```bash
# Start Redis
docker run -d -p 6379:6379 redis

# Start Postgres
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Start service
npm run dev
```

**Environment Variables:**
```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://localhost:5432/soil2sauce
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
CONTRACT_ADMIN_KEY=0x...
RPC_URL=https://...
```

**Testing:**
```bash
# Unit tests
npm test

# Integration tests with mock LLM
npm run test:integration

# Load testing
npm run test:load
```

**Mock LLM Responses:**
For testing without API costs, use mock responses:
```javascript
const mockResearchResponse = {
  suggestions: [
    {
      name: "Test Recipe",
      description: "A test recipe for unit testing",
      difficulty: 5,
      estimatedRevenue: "30-50 STOKEN/day",
      requiredIngredients: [...]
    }
  ]
};
```

---

## 11. Deployment

**Container Image:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Docker Compose (Local):**
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/soil2sauce
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: soil2sauce

  redis:
    image: redis:7-alpine
```

**Production Deployment:**
- Deploy to AWS ECS, Google Cloud Run, or similar
- Auto-scaling: min 2 instances, max 10
- Health check endpoint: `GET /health`
- Load balancer with SSL termination

---

## 12. Maintenance and Support

**Monitoring Dashboard:**
- Request volume by endpoint
- Error rate trends
- LLM API cost tracking
- Player activity heatmap

**Incident Response:**
1. Alert triggered (high error rate, slow responses)
2. Check logs for errors
3. Verify LLM API status
4. Scale instances if needed
5. Rollback if recent deployment caused issue
6. Post incident report

**Regular Maintenance:**
- Weekly: Review logs for errors and abuse
- Monthly: Update dependencies
- Quarterly: Rotate API keys
- Annual: Performance optimization review

# Recipe AgentKit Integration Plan

## Overview

This document outlines the implementation plan for integrating Base AgentKit into the Soil2Sauce farming game to enable AI-powered recipe evaluation. The system allows users to submit recipes on-chain, which are then evaluated by an off-chain AI agent using ChatGPT, with results finalized back on-chain as recipe NFTs.

## Architecture

```
User (Frontend)
    ↓ (submits recipe)
RecipeSystem Contract (Base)
    ↓ (emits RecipeRequested event)
AgentKit Service (Off-chain)
    ↓ (calls evaluation API)
Backend AI Service
    ↓ (ChatGPT evaluation)
AgentKit Service
    ↓ (calls finalizeRecipe)
RecipeSystem Contract
    ↓ (emits RecipeFinalized event)
Frontend (Event listener)
    ↓ (auto-updates UI)
User sees evaluated recipe NFT
```

---

## Phase 1: Smart Contract Development

### 1.1 RecipeSystem Contract (`src/RecipeSystem.sol`)

**Purpose**: Manage recipe submission and AI-evaluated NFT minting

**Key Components**:

#### Recipe Struct
```solidity
struct Recipe {
    uint256 recipeId;
    address chef;
    string instruction;
    string ingredients;
    // Evaluation results (populated after grading)
    string dishDescription;
    uint8 grade; // 1-100
    uint256 revenueRate;
    string critics;
    bool evaluated;
    uint256 timestamp;
}
```

#### Access Control
- Inherit from `ERC721` and `AccessControl`
- Define `GRADER_ROLE` for agent authorization
- Only GRADER_ROLE can call `finalizeRecipe()`

#### State Variables
- `mapping(uint256 => Recipe) public recipes`
- `mapping(uint256 => bool) public processingLock` - Prevent double grading
- `uint256 private _nextRecipeId` - Counter for recipe IDs

#### Functions

**requestRecipe()**
- Parameters: `instruction`, `ingredients`
- Returns: `recipeId`
- Creates new Recipe with `evaluated = false`
- Emits `RecipeRequested` event
- Anyone can call

**finalizeRecipe()**
- Parameters: `recipeId`, `dishDescription`, `grade`, `revenueRate`, `critics`
- Requires: `GRADER_ROLE`
- Validates:
  - Recipe exists and not already evaluated
  - Not locked for processing
  - Grade is between 1-100
- Sets `processingLock[recipeId] = true`
- Updates recipe with evaluation data
- Mints NFT to chef using `_safeMint()`
- Emits `RecipeFinalized` event

**View Functions**
- `getRecipe(recipeId)` - Returns full Recipe struct
- `getRecipesByChef(address)` - Returns array of recipe IDs
- `isProcessing(recipeId)` - Returns lock status
- `getTotalRecipes()` - Returns count

#### Events
```solidity
event RecipeRequested(
    uint256 indexed recipeId,
    address indexed chef,
    string instruction,
    string ingredients,
    uint256 timestamp
);

event RecipeFinalized(
    uint256 indexed recipeId,
    address indexed chef,
    string dishDescription,
    uint8 grade,
    uint256 revenueRate,
    string critics
);
```

### 1.2 Update Deployment Script

**File**: `script/Deploy.s.sol`

Add to deployment:
1. Deploy RecipeSystem contract
2. Grant GRADER_ROLE to agent wallet (from env: `AGENT_WALLET_ADDRESS`)
3. Log contract address
4. Export address to JSON for frontend and agent

---

## Phase 2: Backend API Enhancement

### 2.1 Recipe Evaluation Endpoint

**File**: `backend/src/handlers/evaluateRecipe.ts`

**Endpoint**: `POST /api/evaluate-recipe`

**Request Body**:
```json
{
  "instruction": "string",
  "ingredients": "string"
}
```

**Processing Flow**:
1. Validate input (non-empty strings)
2. Construct ChatGPT prompt:
   ```
   You are a culinary expert. Evaluate this recipe:

   Ingredients: {ingredients}
   Instructions: {instruction}

   Provide:
   1. A creative dish description (2-3 sentences)
   2. A grade from 1-100 based on creativity, technique, and feasibility
   3. An estimated revenue rate (multiplier, e.g., 150 means 1.5x base)
   4. Constructive critics/feedback (2-3 sentences)

   Respond in JSON format:
   {
     "dishDescription": "...",
     "grade": 85,
     "revenueRate": 150,
     "critics": "..."
   }
   ```
3. Call OpenAI API with configured model
4. Parse and validate response
5. Return structured data

**Response Body**:
```json
{
  "success": true,
  "data": {
    "dishDescription": "string",
    "grade": 85,
    "revenueRate": 150,
    "critics": "string"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

**Error Handling**:
- 400: Invalid input
- 500: OpenAI API error
- 503: Service temporarily unavailable
- Log all errors with request context

### 2.2 Environment Configuration

**File**: `backend/.env`

Add variables:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
ENABLE_RECIPE_EVALUATION=true
```

---

## Phase 3: AgentKit Service

### 3.1 Directory Structure

Create `agentkit/` directory:
```
agentkit/
├── src/
│   ├── agent.ts              # Main service entry point
│   ├── config.ts             # Configuration management
│   ├── eventProcessor.ts     # Event processing logic
│   ├── storage.ts            # Persistent storage
│   ├── logger.ts             # Structured logging
│   └── types.ts              # TypeScript types
├── data/
│   └── processed.json        # Local event database (gitignored)
├── logs/
│   └── agent.log             # Log files (gitignored)
├── .env.example
├── .env                      # (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

### 3.2 Dependencies

**File**: `agentkit/package.json`

```json
{
  "name": "soil2sauce-agentkit",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/agent.ts",
    "start": "tsx src/agent.ts",
    "build": "tsc"
  },
  "dependencies": {
    "viem": "^2.38.0",
    "@coinbase/coinbase-sdk": "^0.5.0",
    "dotenv": "^16.4.0",
    "axios": "^1.6.0",
    "winston": "^3.11.0",
    "lowdb": "^7.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

### 3.3 Configuration Management

**File**: `agentkit/src/config.ts`

Load and validate environment variables:

```typescript
interface Config {
  // Blockchain
  baseRpcUrl: string;
  baseChainId: number;
  recipeContractAddress: `0x${string}`;
  agentPrivateKey: `0x${string}`;

  // Backend
  backendApiUrl: string;

  // Processing
  maxRetryAttempts: number;
  retryDelayMs: number;
  pollIntervalMs: number;

  // Storage
  dbPath: string;

  // Logging
  logLevel: string;
  logPath: string;
}
```

**Environment Variables**:
- `BASE_RPC_URL` - Base network RPC (required)
- `BASE_CHAIN_ID` - Chain ID (default: 8453 for mainnet)
- `RECIPE_CONTRACT_ADDRESS` - Deployed contract address (required)
- `AGENT_PRIVATE_KEY` - Private key with GRADER_ROLE (required)
- `BACKEND_API_URL` - AI service endpoint (required)
- `MAX_RETRY_ATTEMPTS` - Retry limit (default: 3)
- `RETRY_DELAY_MS` - Base retry delay (default: 5000)
- `POLL_INTERVAL_MS` - Event polling interval (default: 15000)
- `DB_PATH` - Processed events database (default: ./data/processed.json)
- `LOG_LEVEL` - Logging level (default: info)
- `LOG_PATH` - Log file path (default: ./logs/agent.log)

Validation:
- Check all required vars are present
- Validate address format (0x...)
- Validate private key format
- Ensure RPC URL is accessible
- Test backend API connectivity on startup

### 3.4 Event Processor

**File**: `agentkit/src/eventProcessor.ts`

**Class**: `EventProcessor`

**Constructor Dependencies**:
- Contract client (viem)
- Backend API client (axios)
- Storage layer
- Logger
- Config

**Methods**:

**processRecipeRequest(event)**
1. Extract event data: `recipeId`, `chef`, `instruction`, `ingredients`
2. Log event details
3. Check if already processed (local DB)
4. Check if processing locked (contract call)
5. If new:
   - Call backend API
   - Handle response/errors
   - Retry on failure (with exponential backoff)
   - Call `finalizeRecipe()` on contract
   - Wait for transaction confirmation
   - Log transaction hash
   - Mark as processed in local DB
6. Return processing result

**callBackendAPI(instruction, ingredients)**
- POST to `${backendApiUrl}/api/evaluate-recipe`
- Timeout: 30 seconds
- Parse JSON response
- Validate response structure
- Return evaluation data or throw error

**finalizeOnChain(recipeId, evaluation)**
- Prepare contract call data
- Estimate gas
- Submit transaction with agent's private key
- Wait for confirmation (up to 5 minutes)
- Handle transaction errors (insufficient gas, revert, etc.)
- Return transaction hash

**Retry Logic**:
- Max attempts from config
- Exponential backoff: `delay * (2 ^ attemptNumber)`
- Categorize errors:
  - Transient (network, timeout) → retry
  - Permanent (invalid data, already processed) → skip
  - Unknown → retry with caution

**Error Handling**:
- Log all errors with full context
- Differentiate API errors vs blockchain errors
- Track error counts for alerting
- Never crash the service on single event failure

### 3.5 Main Agent Service

**File**: `agentkit/src/agent.ts`

**Class**: `RecipeAgent`

**Initialization**:
1. Load configuration
2. Setup logger (winston with file + console transport)
3. Initialize storage layer
4. Create viem public client (Base RPC)
5. Create wallet client (with private key)
6. Load RecipeSystem contract ABI
7. Verify agent has GRADER_ROLE (contract call)
8. Initialize event processor
9. Set up graceful shutdown handlers

**Event Watching Strategy**:

Option A: WebSocket Subscription (Real-time)
```typescript
const unwatchEvents = contractClient.watchEvent({
  event: RecipeRequestedEvent,
  onLogs: async (logs) => {
    for (const log of logs) {
      await eventProcessor.processRecipeRequest(log);
    }
  },
  onError: (error) => {
    logger.error('Event watch error', error);
    handleReconnection();
  }
});
```

Option B: Polling (More Reliable)
```typescript
async function pollEvents() {
  const latestBlock = await client.getBlockNumber();
  const fromBlock = lastProcessedBlock + 1;

  const events = await client.getContractEvents({
    address: recipeContractAddress,
    abi: RecipeSystemABI,
    eventName: 'RecipeRequested',
    fromBlock,
    toBlock: latestBlock
  });

  for (const event of events) {
    await eventProcessor.processRecipeRequest(event);
  }

  lastProcessedBlock = latestBlock;
  storage.saveLastBlock(latestBlock);
}

setInterval(pollEvents, config.pollIntervalMs);
```

**Reconnection Logic**:
- Track connection state
- On disconnect:
  - Log disconnect reason and time
  - Increment reconnection attempt counter
  - Wait with exponential backoff (cap at 5 minutes)
  - Attempt reconnection
  - Resume from last processed block
  - Reset counter on success
- Alert if disconnected > 5 minutes

**Graceful Shutdown**:
```typescript
process.on('SIGTERM', async () => {
  logger.info('Shutdown signal received');
  isShuttingDown = true;

  // Stop accepting new events
  unwatchEvents();

  // Wait for in-flight processing to complete (max 30s)
  await waitForInFlightJobs(30000);

  // Save current state
  await storage.flush();

  // Close connections
  await client.destroy();

  logger.info('Shutdown complete');
  process.exit(0);
});
```

**Health Monitoring**:
- Expose health check endpoint (simple HTTP server on :3001)
- Metrics:
  - Events processed (total, success, failure)
  - Average processing time
  - Last event timestamp
  - Current block number
  - Agent uptime
  - Error rate (last hour)

### 3.6 Storage Layer

**File**: `agentkit/src/storage.ts`

**Database**: lowdb (JSON file database)

**Schema**:
```typescript
interface Database {
  processed: {
    recipeId: number;
    txHash: string;
    processedAt: number; // Unix timestamp
    blockNumber: number;
  }[];
  metadata: {
    lastProcessedBlock: number;
    lastHealthCheck: number;
  };
}
```

**Methods**:

**isProcessed(recipeId: number): boolean**
- Check if recipeId exists in processed array

**markProcessed(recipeId, txHash, blockNumber)**
- Add entry to processed array
- Update lastProcessedBlock
- Persist to disk immediately

**getProcessedCount(): number**
- Return length of processed array

**getLastProcessedBlock(): number**
- Return metadata.lastProcessedBlock

**getProcessedRecipes(): number[]**
- Return array of processed recipe IDs

**cleanup()**
- Remove entries older than 30 days (configurable)
- Compact database file

### 3.7 Logging

**File**: `agentkit/src/logger.ts`

**Winston Configuration**:
```typescript
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // File transport (all logs)
    new winston.transports.File({
      filename: config.logPath,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Console transport (development)
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

**Log Levels**:
- `error`: Failures, exceptions, critical issues
- `warn`: Retries, unexpected states
- `info`: Event processing, transactions, state changes
- `debug`: Detailed execution flow, API calls

**Standard Log Entries**:
```typescript
// Event received
logger.info('Recipe request received', {
  recipeId,
  chef,
  instruction: instruction.substring(0, 50),
  timestamp: event.timestamp
});

// API call
logger.debug('Calling evaluation API', {
  recipeId,
  endpoint: backendApiUrl
});

// Transaction submitted
logger.info('Transaction submitted', {
  recipeId,
  txHash,
  gasUsed
});

// Error
logger.error('Failed to process recipe', {
  recipeId,
  error: error.message,
  stack: error.stack,
  attempt: retryAttempt
});
```

---

## Phase 4: Frontend Integration

### 4.1 Recipe Creator Component

**File**: `frontend/src/components/RecipeCreator.jsx`

**Features**:
- Form with:
  - Instruction textarea (required, min 50 chars)
  - Ingredients input (required, comma-separated or multi-line)
  - Submit button (disabled if form invalid or wallet not connected)
- Loading state during transaction
- Success message with recipe ID
- Error handling with user-friendly messages
- Transaction confirmation toast

**State Management**:
- Use wagmi `useWriteContract` hook
- React Query for mutation

**Validation**:
- Client-side: non-empty, minimum length
- Show character count
- Preview formatted data

### 4.2 Recipe List Component

**File**: `frontend/src/components/RecipeList.jsx`

**Features**:
- Display user's recipes in grid/list
- Each recipe card shows:
  - Recipe ID
  - Submission timestamp
  - Status badge (Pending/Evaluated)
  - For evaluated:
    - Grade (visual stars or progress bar)
    - Dish description
    - Critics feedback
    - NFT image/badge
  - For pending:
    - "Evaluation in progress" message
    - Estimated time (if available)
- Pagination for large lists
- Filter by status
- Sort by date/grade

**Data Fetching**:
- Use React Query with `useRecipes` hook
- Cache with 30s stale time
- Auto-refetch on window focus

### 4.3 Recipe Detail Component

**File**: `frontend/src/components/RecipeDetail.jsx`

**Features**:
- Full recipe display
- Evaluation metrics (if evaluated):
  - Grade breakdown
  - Revenue rate multiplier
  - Full critics report
- Social sharing buttons
- NFT metadata (token ID, mint date)

### 4.4 Event-Driven Cache Invalidation

**File**: `frontend/src/contexts/EventProvider.jsx`

**Enhancement**:

Add RecipeFinalized event listener:
```typescript
// Subscribe to RecipeFinalized events
const unwatchRecipeFinalized = contractClient.watchContractEvent({
  address: CONTRACT_ADDRESSES.RecipeSystem,
  abi: RecipeSystemABI,
  eventName: 'RecipeFinalized',
  onLogs: (logs) => {
    for (const log of logs) {
      const { recipeId, chef } = log.args;

      // Invalidate queries
      queryClient.invalidateQueries(['recipe', recipeId]);
      queryClient.invalidateQueries(['recipes', chef]);
      queryClient.invalidateQueries(['recipeNFTs', chef]);

      // Optional: Show toast notification
      toast.success(`Recipe #${recipeId} has been evaluated!`);
    }
  }
});
```

**Query Keys**:
- `['recipe', recipeId]` - Individual recipe
- `['recipes', address]` - User's recipe list
- `['recipeNFTs', address]` - User's recipe NFTs
- `['recipePending', address]` - Pending evaluations count

**Benefits**:
- Zero refresh needed
- Real-time updates
- Optimistic UI updates possible
- Better UX

### 4.5 Contract Integration

**File**: `frontend/src/contracts/addresses.js`

Add:
```javascript
export const CONTRACT_ADDRESSES = {
  // ... existing contracts
  RecipeSystem: '0x...' // From deployment
};
```

**File**: `frontend/src/contracts/RecipeSystem.json`

Export contract ABI (generated during deployment)

### 4.6 Custom Hooks

**File**: `frontend/src/hooks/useRecipes.ts`

**useSubmitRecipe()**
```typescript
function useSubmitRecipe() {
  const { writeContract } = useWriteContract();

  return useMutation({
    mutationFn: async ({ instruction, ingredients }) => {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.RecipeSystem,
        abi: RecipeSystemABI,
        functionName: 'requestRecipe',
        args: [instruction, ingredients]
      });
      return hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes']);
    }
  });
}
```

**useRecipes(address)**
```typescript
function useRecipes(address: string) {
  return useQuery({
    queryKey: ['recipes', address],
    queryFn: async () => {
      const recipeIds = await readContract({
        address: CONTRACT_ADDRESSES.RecipeSystem,
        abi: RecipeSystemABI,
        functionName: 'getRecipesByChef',
        args: [address]
      });

      const recipes = await Promise.all(
        recipeIds.map(id =>
          readContract({
            address: CONTRACT_ADDRESSES.RecipeSystem,
            abi: RecipeSystemABI,
            functionName: 'getRecipe',
            args: [id]
          })
        )
      );

      return recipes;
    },
    enabled: !!address,
    staleTime: 30000
  });
}
```

**useRecipe(recipeId)**
```typescript
function useRecipe(recipeId: number) {
  return useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      const recipe = await readContract({
        address: CONTRACT_ADDRESSES.RecipeSystem,
        abi: RecipeSystemABI,
        functionName: 'getRecipe',
        args: [recipeId]
      });
      return recipe;
    },
    enabled: recipeId > 0,
    staleTime: 30000
  });
}
```

---

## Phase 5: Deployment & Configuration

### 5.1 Contract Deployment

**Testnet (Base Sepolia)**:
1. Add Base Sepolia RPC to `foundry.toml`
2. Update deployment script with Base Sepolia chain ID
3. Deploy: `forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast`
4. Verify: `forge verify-contract <address> RecipeSystem --chain base-sepolia`
5. Grant GRADER_ROLE to test agent wallet
6. Test end-to-end flow

**Mainnet (Base)**:
1. Audit contract code
2. Test thoroughly on testnet
3. Prepare production agent wallet (fund with ETH for gas)
4. Deploy: `forge script script/Deploy.s.sol --rpc-url base --broadcast`
5. Verify: `forge verify-contract <address> RecipeSystem --chain base`
6. Grant GRADER_ROLE to production agent wallet
7. Monitor initial transactions closely

### 5.2 Backend Deployment

**Platform Options**:
- Railway (recommended for simplicity)
- Render
- Fly.io
- AWS ECS
- Google Cloud Run

**Steps**:
1. Create Dockerfile for Node.js service
2. Set up CI/CD pipeline (GitHub Actions)
3. Configure environment variables in platform
4. Enable health checks
5. Set up logging (CloudWatch, Datadog)
6. Configure auto-scaling (if needed)
7. Set up monitoring alerts

**Environment Variables** (Production):
```
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=<production-key>
OPENAI_MODEL=gpt-4
CORS_ORIGIN=https://soil2sauce.com
ENABLE_RECIPE_EVALUATION=true
```

### 5.3 Agent Service Deployment

**Docker Setup**:

Create `agentkit/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "dist/agent.js"]
```

Create `agentkit/docker-compose.yml`:
```yaml
version: '3.8'
services:
  agent:
    build: .
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Deployment Options**:

**Option A: VPS with Docker Compose**
1. Provision VPS (2GB RAM, 1 vCPU sufficient)
2. Install Docker & Docker Compose
3. Clone repository
4. Copy `.env.production` to `.env`
5. Run: `docker-compose up -d`
6. Set up log rotation
7. Configure monitoring (Uptime Robot, Datadog)

**Option B: Kubernetes**
1. Create Kubernetes deployment manifest
2. Create ConfigMap for non-sensitive config
3. Create Secret for sensitive data
4. Set replica count to 1 (ensure single instance)
5. Deploy to cluster
6. Set up liveness and readiness probes

**Option C: Cloud Service (Railway/Render)**
1. Connect GitHub repository
2. Detect Dockerfile automatically
3. Set environment variables
4. Enable persistent disk for data directory
5. Configure health checks
6. Deploy

**Monitoring**:
- Set up Sentry for error tracking
- Use Datadog/New Relic for metrics
- Configure alerts:
  - Agent down > 5 minutes
  - Transaction failures > 3 consecutive
  - High error rate
  - Low balance alert (< 0.1 ETH)

### 5.4 Environment Configuration Files

**agentkit/.env.example**:
```bash
# Blockchain Configuration
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
BASE_CHAIN_ID=8453
RECIPE_CONTRACT_ADDRESS=0x...
AGENT_PRIVATE_KEY=0x...

# Backend API
BACKEND_API_URL=https://api.soil2sauce.com

# Processing Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000
POLL_INTERVAL_MS=15000

# Storage
DB_PATH=./data/processed.json

# Logging
LOG_LEVEL=info
LOG_PATH=./logs/agent.log

# Optional: Monitoring
SENTRY_DSN=
DATADOG_API_KEY=
```

**frontend/.env.example** (additions):
```bash
# ... existing vars
VITE_RECIPE_CONTRACT_ADDRESS=0x...
VITE_ENABLE_RECIPES=true
```

**backend/.env.example** (additions):
```bash
# ... existing vars
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
ENABLE_RECIPE_EVALUATION=true
```

### 5.5 Security Checklist

- [ ] Agent private key stored securely (env vars, never committed)
- [ ] Backend API uses rate limiting
- [ ] CORS properly configured for frontend domain
- [ ] RPC endpoint uses authentication (Alchemy/Infura API key)
- [ ] Contract verified on BaseScan
- [ ] GRADER_ROLE only granted to agent wallet
- [ ] Input validation on all endpoints
- [ ] Secrets rotation procedure documented
- [ ] Backup of processed events database
- [ ] Monitoring and alerting configured
- [ ] Emergency shutdown procedure documented

---

## Phase 6: Testing Strategy

### 6.1 Contract Testing

**File**: `test/RecipeSystem.t.sol`

**Test Cases**:
1. **requestRecipe()**:
   - ✓ Creates recipe with correct data
   - ✓ Emits RecipeRequested event
   - ✓ Increments recipe ID
   - ✓ Reverts on empty instruction
   - ✓ Reverts on empty ingredients

2. **finalizeRecipe()**:
   - ✓ Requires GRADER_ROLE
   - ✓ Updates recipe data correctly
   - ✓ Mints NFT to chef
   - ✓ Emits RecipeFinalized event
   - ✓ Reverts if already evaluated
   - ✓ Reverts if processing locked
   - ✓ Reverts on invalid grade (0 or > 100)
   - ✓ Sets processingLock correctly

3. **Access Control**:
   - ✓ Only GRADER_ROLE can finalize
   - ✓ Non-grader cannot finalize
   - ✓ Admin can grant/revoke GRADER_ROLE

4. **View Functions**:
   - ✓ getRecipe returns correct data
   - ✓ getRecipesByChef filters correctly
   - ✓ isProcessing returns correct lock status

**Run Tests**:
```bash
forge test -vvv
forge coverage
```

### 6.2 Backend Testing

**File**: `backend/src/handlers/__tests__/evaluateRecipe.test.ts`

**Test Cases**:
1. ✓ Valid recipe returns evaluation
2. ✓ Invalid input returns 400
3. ✓ OpenAI API error returns 500
4. ✓ Malformed response handled gracefully
5. ✓ Grade bounds enforced (1-100)
6. ✓ Timeout after 30 seconds

**Mock OpenAI API** for tests

**Run Tests**:
```bash
cd backend
npm test
```

### 6.3 Agent Integration Testing

**Manual Test Flow**:
1. Deploy contracts to Base Sepolia
2. Start backend service locally
3. Start agent service locally
4. Submit recipe via frontend/script
5. Verify:
   - Agent detects RecipeRequested event
   - Agent calls backend API
   - Agent submits finalizeRecipe transaction
   - Transaction confirms
   - RecipeFinalized event emitted
   - Recipe marked evaluated in contract
   - NFT minted to chef
   - Local database updated
   - Logs show complete flow

**Automated Test Script**:
```bash
# test/agent-integration.sh
# 1. Start local Anvil
# 2. Deploy contracts
# 3. Start mock backend
# 4. Start agent
# 5. Submit test recipe
# 6. Wait and verify
# 7. Check all assertions
```

### 6.4 Error Scenario Testing

**Test Cases**:
1. **Backend API Down**:
   - Agent retries with exponential backoff
   - Logs error appropriately
   - Eventually succeeds when backend recovers

2. **Insufficient Gas**:
   - Transaction fails
   - Agent logs error
   - Does not mark as processed
   - Retries with higher gas estimate

3. **RPC Disconnection**:
   - Agent detects disconnect
   - Attempts reconnection
   - Resumes from last block
   - No duplicate processing

4. **Double Grading Attempt**:
   - Second attempt reverts
   - Agent skips already-processed recipe
   - No duplicate NFT minted

5. **Contract Revert**:
   - Agent handles revert gracefully
   - Logs revert reason
   - Does not retry if permanent error

### 6.5 Load Testing

**Scenario**: 100 recipes submitted within 1 minute

**Test**:
1. Submit 100 `requestRecipe` transactions rapidly
2. Monitor agent performance:
   - All events detected
   - No missed events
   - Processing time per recipe
   - Memory usage
   - Error rate
3. Verify all 100 recipes eventually evaluated
4. Check no duplicates

**Tools**:
- k6 for load generation
- Prometheus for metrics collection
- Grafana for visualization

---

## Phase 7: Monitoring & Operations

### 7.1 Logging Strategy

**Agent Logs**:
- Timestamp (ISO 8601)
- Log level
- Component (agent, processor, storage)
- Message
- Context (recipeId, txHash, error details)

**Example Log Entries**:
```json
{
  "timestamp": "2025-01-03T10:30:45.123Z",
  "level": "info",
  "component": "agent",
  "message": "Recipe request received",
  "recipeId": 42,
  "chef": "0x...",
  "blockNumber": 1234567
}

{
  "timestamp": "2025-01-03T10:30:50.456Z",
  "level": "info",
  "component": "processor",
  "message": "Transaction confirmed",
  "recipeId": 42,
  "txHash": "0x...",
  "gasUsed": 150000,
  "blockNumber": 1234568
}

{
  "timestamp": "2025-01-03T10:31:00.789Z",
  "level": "error",
  "component": "processor",
  "message": "API call failed",
  "recipeId": 43,
  "error": "Timeout after 30s",
  "attempt": 1,
  "maxAttempts": 3
}
```

**Log Aggregation**:
- Use ELK Stack, Datadog, or CloudWatch
- Set up log streaming from container
- Create dashboards for common queries
- Set retention policy (30 days)

### 7.2 Metrics Collection

**Key Metrics**:

**Performance**:
- Recipes processed per hour
- Average processing time (end-to-end)
- API response time (p50, p95, p99)
- Transaction confirmation time

**Reliability**:
- Success rate (%)
- Error rate (%)
- Retry rate
- Agent uptime (%)

**Cost**:
- Gas used per transaction
- Average gas price
- Total ETH spent per day

**Business**:
- Total recipes evaluated
- Average grade
- Unique users

**Implementation**:
```typescript
// Prometheus metrics
const recipesProcessed = new Counter({
  name: 'recipes_processed_total',
  help: 'Total recipes processed'
});

const processingDuration = new Histogram({
  name: 'recipe_processing_duration_seconds',
  help: 'Recipe processing duration'
});

const apiCallDuration = new Histogram({
  name: 'api_call_duration_seconds',
  help: 'Backend API call duration'
});
```

**Dashboard**:
- Create Grafana dashboard
- Include all key metrics
- Add error log panel
- Set up auto-refresh

### 7.3 Alerting

**Critical Alerts** (Page immediately):
- Agent down > 5 minutes
- Transaction failures > 5 consecutive
- Agent wallet balance < 0.05 ETH
- Error rate > 50% (last 10 minutes)
- RPC endpoint unreachable > 2 minutes

**Warning Alerts** (Notify, no page):
- Processing time > 2 minutes (p95)
- Retry rate > 20%
- Gas price > threshold
- Backend API slow (> 10s response time)
- Disk usage > 80%

**Alert Channels**:
- PagerDuty (critical)
- Slack (warnings)
- Email (daily summaries)

**Alert Configuration** (example):
```yaml
alerts:
  - name: AgentDown
    condition: up{job="recipe-agent"} == 0
    duration: 5m
    severity: critical
    message: "Recipe agent is down"

  - name: HighErrorRate
    condition: rate(errors_total[10m]) > 0.5
    severity: critical
    message: "Error rate above 50%"

  - name: LowBalance
    condition: wallet_balance_eth < 0.05
    severity: critical
    message: "Agent wallet low on ETH"
```

### 7.4 Operational Procedures

**Daily Operations**:
- Review dashboard for anomalies
- Check error logs
- Verify agent is processing events
- Monitor wallet balance

**Weekly Operations**:
- Review metrics trends
- Analyze error patterns
- Check for optimization opportunities
- Backup processed events database
- Review and cleanup old logs

**Monthly Operations**:
- Review and optimize gas usage
- Update dependencies
- Conduct security review
- Generate performance report
- Plan improvements

**Incident Response**:
1. Receive alert
2. Check dashboard and logs
3. Identify root cause
4. Apply fix (restart, code deploy, config change)
5. Verify resolution
6. Document in incident log
7. Conduct post-mortem if critical

**Emergency Procedures**:
- **Agent Wallet Compromised**: Immediately revoke GRADER_ROLE, deploy new wallet
- **Backend API Compromised**: Take offline, investigate, redeploy
- **Contract Bug**: Pause contract (if pausable), assess impact, deploy fix
- **High Gas Costs**: Temporarily pause agent, investigate, adjust gas settings

---

## Phase 8: Documentation

### 8.1 Technical Documentation

**File**: `docs/architecture.md`
- System architecture diagram
- Component interaction flows
- Technology stack
- Design decisions and rationale

**File**: `docs/contracts.md`
- RecipeSystem contract documentation
- Function descriptions
- Event descriptions
- Access control model

**File**: `docs/agent-setup.md`
- Agent service architecture
- Configuration guide
- Deployment instructions
- Troubleshooting guide

**File**: `docs/api.md`
- Backend API endpoints
- Request/response formats
- Error codes
- Authentication (if added)

### 8.2 User Documentation

**File**: `docs/user-guide.md`

**Sections**:
1. **Introduction to Recipes**
   - What are recipe NFTs?
   - How evaluation works
   - Benefits of creating recipes

2. **Creating a Recipe**
   - Step-by-step guide with screenshots
   - Tips for writing good recipes
   - What to expect after submission

3. **Understanding Your Grade**
   - How grading works
   - What affects your grade
   - Revenue rate explained

4. **Recipe NFTs**
   - What makes them valuable
   - How to trade/sell
   - Viewing on OpenSea

### 8.3 Operator Documentation

**File**: `docs/operations.md`

**Sections**:
1. **Deployment Guide**
   - Prerequisites
   - Step-by-step deployment
   - Configuration reference
   - Verification steps

2. **Monitoring Guide**
   - Key metrics to watch
   - Dashboard walkthrough
   - Interpreting logs
   - Common issues

3. **Troubleshooting**
   - Agent not processing events
   - Transaction failures
   - Backend API errors
   - RPC connection issues

4. **Maintenance Tasks**
   - Daily/weekly/monthly checklists
   - Log rotation
   - Database cleanup
   - Dependency updates

5. **Emergency Procedures**
   - Incident response
   - Wallet compromise
   - Contract issues
   - Rollback procedures

**File**: `docs/runbook.md`
- Quick reference for common operations
- Command cheat sheet
- Contact information
- Escalation procedures

---

## Phase 9: Future Enhancements

### 9.1 Advanced Features

**Multi-Model Evaluation**:
- Use multiple AI models (GPT-4, Claude, Gemini)
- Aggregate scores
- Provide diverse feedback

**Recipe Marketplace**:
- Trade recipe NFTs
- Royalty system for creators
- Leaderboard by grade

**Recipe Challenges**:
- Time-limited themed challenges
- Special rewards for top recipes
- Community voting

**Recipe Remixing**:
- Fork existing recipes
- Attribution system
- Derivative NFTs

### 9.2 Technical Improvements

**Performance**:
- Batch finalization (multiple recipes per transaction)
- Layer 2 optimization
- Caching layer for frequently accessed data

**Scalability**:
- Multi-agent setup for load distribution
- Sharding by recipe type
- Event indexing service (The Graph)

**Reliability**:
- Redundant agents (active-passive)
- Multi-region deployment
- Failover mechanism

**Security**:
- Implement API authentication between agent and backend
- Add request signing
- Rate limiting per user
- Content moderation

---

## Success Criteria

### Phase 1-3 (Core Implementation)
- ✅ Contract deployed and verified on Base
- ✅ Backend API evaluates recipes using ChatGPT
- ✅ Agent successfully processes events end-to-end
- ✅ Unit tests pass with >80% coverage
- ✅ Integration test completes successfully

### Phase 4-5 (Frontend & Deployment)
- ✅ Users can submit recipes via UI
- ✅ UI displays evaluated recipes with grades
- ✅ Event-driven updates work without refresh
- ✅ All services deployed to production
- ✅ Monitoring and alerting configured

### Phase 6-7 (Testing & Operations)
- ✅ Agent processes events within 60 seconds (p95)
- ✅ Zero duplicate gradings in testing
- ✅ Agent maintains 99.9% uptime for 7 days
- ✅ Failed transactions successfully retry
- ✅ All operational procedures documented

### Production Readiness
- ✅ 100+ test recipes processed successfully
- ✅ Load test: 100 concurrent recipes handled
- ✅ Error rate < 1%
- ✅ Average processing time < 45 seconds
- ✅ Gas costs optimized (< $2 per finalization)
- ✅ Security audit passed
- ✅ Documentation complete

---

## Timeline Estimate

**Week 1**: Contracts + Backend
- Days 1-2: RecipeSystem contract development
- Days 3-4: Contract testing and deployment scripts
- Days 5-7: Backend API endpoint development and testing

**Week 2**: AgentKit Service
- Days 1-3: Agent service core functionality
- Days 4-5: Event processing and retry logic
- Days 6-7: Integration testing and debugging

**Week 3**: Frontend + Integration
- Days 1-3: React components and hooks
- Days 4-5: Event-driven updates
- Day 6: End-to-end integration testing
- Day 7: Bug fixes and polish

**Week 4**: Deployment + Operations
- Days 1-2: Testnet deployment and testing
- Days 3-4: Production deployment
- Days 5-6: Monitoring setup and documentation
- Day 7: Final testing and launch

**Total**: ~4 weeks for MVP, +1 week buffer for unforeseen issues

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OpenAI API downtime | High | Medium | Implement retry logic, consider fallback model |
| Agent wallet compromised | Critical | Low | Use secure key management, monitor for unusual activity |
| RPC rate limiting | Medium | Medium | Use multiple RPC providers, implement backoff |
| High gas costs | Medium | Medium | Monitor gas prices, implement gas optimization |
| Contract bug | Critical | Low | Thorough testing, security audit, test on testnet first |
| Double grading bug | High | Low | Multiple safeguards (contract lock, local DB, checks) |
| Agent crashes | Medium | Medium | Auto-restart, health checks, monitoring |
| Blockchain reorg | Low | Low | Wait for block confirmations (3+ blocks) |

---

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating Base AgentKit with the Soil2Sauce farming game to enable AI-powered recipe evaluation. The system is designed with production-readiness in mind, incorporating proper error handling, monitoring, security, and operational procedures.

Key strengths of this design:
- **Robust**: Multiple safeguards against duplicate processing
- **Scalable**: Can handle high volume of recipes
- **Reliable**: Auto-reconnection and retry mechanisms
- **Observable**: Comprehensive logging and monitoring
- **Maintainable**: Clean code structure and documentation
- **Secure**: Proper access control and key management

The estimated timeline of 4-5 weeks is realistic for a team of 2-3 developers, with potential for acceleration if components are developed in parallel.

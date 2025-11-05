# Testing Guide for Recipe AgentKit System

This guide walks you through testing the complete Recipe AgentKit implementation.

## Prerequisites

Before testing, ensure you have:

1. ✅ **OpenAI API Key** - From https://platform.openai.com/api-keys
2. ✅ **OpenAI Assistant ID** - Follow `backend/OPENAI_ASSISTANT_SETUP.md`
3. ✅ **Base RPC URL** - From Alchemy or Infura (for Base network)
4. ✅ **Test wallet with private key** - For agent service
5. ✅ **ETH on Base** - For gas (testnet or mainnet)

## Test 1: Smart Contracts ✅ PASSED

```bash
# Run all RecipeSystem tests
forge test --match-contract RecipeSystemTest -vv
```

**Expected**: All 26 tests should pass

**Status**: ✅ Verified - All tests passing

## Test 2: Backend API

### 2.1 Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your keys:
# OPENAI_API_KEY=sk-...
# OPENAI_ASSISTANT_ID=asst-...
```

### 2.2 Start Backend Server

```bash
npm run dev
```

**Expected Output:**
```
🌾 Soil2Sauce AI Service running on port 3001
📍 Health check: http://localhost:3001/health
📚 API Base: http://localhost:3001/api
```

### 2.3 Test Health Endpoint

In a new terminal:

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-04T..."
}
```

### 2.4 Test Recipe Evaluation Endpoint

```bash
curl -X POST http://localhost:3001/api/evaluate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Mix all ingredients in a bowl. Pour into greased pan. Bake at 350F for 30 minutes until golden brown.",
    "ingredients": "2 cups flour, 1 cup sugar, 3 eggs, 1 stick butter, 1 tsp vanilla extract, 1 tsp baking powder"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "dishDescription": "A classic butter cake with a tender, moist crumb...",
    "grade": 75,
    "revenueRate": 120,
    "critics": "The recipe demonstrates solid fundamentals..."
  }
}
```

**If you get an error:**
- Check OpenAI API key is valid
- Verify Assistant ID is correct
- Check backend logs for details

## Test 3: Deploy Contracts

### 3.1 Setup Environment

```bash
# In project root
cp .env.example .env

# Edit .env and add:
# PRIVATE_KEY=0x... (your deployer wallet private key)
# BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
# AGENT_WALLET_ADDRESS=0x... (the wallet that will run the agent)
```

### 3.2 Deploy to Base Sepolia (Testnet)

```bash
# Deploy contracts
forge script script/Deploy.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify

# Save the RecipeSystem contract address from output
# Should see: RecipeSystem: 0x...
```

### 3.3 Verify Deployment

```bash
# Check RecipeSystem was deployed
cast code <RECIPE_SYSTEM_ADDRESS> --rpc-url base-sepolia

# Verify agent has GRADER_ROLE
cast call <RECIPE_SYSTEM_ADDRESS> \
  "hasRole(bytes32,address)" \
  $(cast keccak "GRADER_ROLE") \
  <AGENT_WALLET_ADDRESS> \
  --rpc-url base-sepolia
```

**Expected**: Should return `true` (0x0000...0001)

## Test 4: AgentKit Service

### 4.1 Setup AgentKit

```bash
cd agentkit

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add:
# BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
# BASE_CHAIN_ID=84532  # Base Sepolia
# RECIPE_CONTRACT_ADDRESS=0x...  (from deploy step)
# AGENT_PRIVATE_KEY=0x...  (wallet with GRADER_ROLE)
# BACKEND_API_URL=http://localhost:3001
```

### 4.2 Fund Agent Wallet

The agent wallet needs ETH for gas:

```bash
# Get your agent address
cast wallet address --private-key $AGENT_PRIVATE_KEY

# Send 0.01 ETH to it (Base Sepolia testnet)
# Use a faucet: https://www.alchemy.com/faucets/base-sepolia
```

### 4.3 Start Agent

Make sure backend is running first!

```bash
# In agentkit directory
npm run dev
```

**Expected Output:**
```
🤖 Soil2Sauce Recipe Agent starting...
Initializing Recipe Agent
Wallet configured { address: '0x...' }
Storage initialized
Agent starting { lastProcessedBlock: 0, pollInterval: 15000 }
Polling for events { fromBlock: ..., toBlock: ... }
```

## Test 5: End-to-End Flow

Now test the complete flow from contract → agent → backend → contract:

### 5.1 Submit a Recipe On-Chain

In a new terminal:

```bash
# Submit recipe using cast
cast send <RECIPE_SYSTEM_ADDRESS> \
  "requestRecipe(string,string)" \
  "Mix flour, sugar, eggs in bowl. Bake at 350F for 30 minutes" \
  "2 cups flour, 1 cup sugar, 3 eggs, 1 stick butter" \
  --rpc-url base-sepolia \
  --private-key <YOUR_WALLET_PRIVATE_KEY>
```

### 5.2 Watch Agent Logs

In the agent terminal, you should see:

```
Found 1 recipe request events
Recipe request received { recipeId: 1, chef: '0x...', ... }
Calling evaluation API
Evaluation received from API { recipeId: 1, grade: 85, revenueRate: 150 }
Transaction submitted { recipeId: 1, txHash: '0x...' }
Transaction confirmed { recipeId: 1, blockNumber: ..., gasUsed: ... }
Recipe processing complete { recipeId: 1 }
```

### 5.3 Verify Recipe Was Finalized

```bash
# Check if recipe was evaluated
cast call <RECIPE_SYSTEM_ADDRESS> \
  "getRecipe(uint256)" \
  1 \
  --rpc-url base-sepolia

# Check if NFT was minted
cast call <RECIPE_SYSTEM_ADDRESS> \
  "ownerOf(uint256)" \
  1 \
  --rpc-url base-sepolia
```

**Expected**: Recipe should show evaluated=true and NFT should be owned by the chef

### 5.4 Check Local Database

```bash
cat agentkit/data/processed.json
```

**Expected**: Should show recipe 1 as processed

## Troubleshooting

### Backend Issues

**"OPENAI_ASSISTANT_ID not set"**
- Create assistant following `backend/OPENAI_ASSISTANT_SETUP.md`
- Add ID to `backend/.env`

**"Assistant run failed"**
- Check OpenAI dashboard for assistant status
- Verify assistant instructions are correct
- Check API key permissions

### Agent Issues

**"Agent wallet not reachable"**
- Verify BASE_RPC_URL is correct
- Check Alchemy/Infura dashboard for rate limits

**"Transaction failed"**
- Ensure agent wallet has ETH for gas
- Verify agent has GRADER_ROLE
- Check if recipe already processed

**"Backend API not reachable"**
- Make sure backend server is running
- Verify BACKEND_API_URL in agent .env
- Check firewall/network settings

### Contract Issues

**"Recipe already evaluated"**
- Each recipe can only be evaluated once
- Submit a new recipe to test again

**"Grade must be between 1 and 100"**
- Backend returned invalid grade
- Check OpenAI assistant output
- May need to update assistant instructions

## Success Criteria

✅ All 26 contract tests pass
✅ Backend health check responds
✅ Backend evaluates recipe and returns valid JSON
✅ Contracts deploy successfully
✅ Agent wallet has GRADER_ROLE
✅ Agent starts and polls for events
✅ Recipe submission triggers agent processing
✅ Agent calls backend API
✅ Agent submits transaction on-chain
✅ Recipe is marked as evaluated
✅ NFT is minted to chef
✅ Local database tracks processed recipe

## Performance Benchmarks

**Expected Timing:**
- Recipe submission: ~2-5 seconds
- Agent detects event: 0-15 seconds (poll interval)
- Backend evaluation: 5-10 seconds (OpenAI)
- Transaction submission: 2-5 seconds
- Transaction confirmation: 2-5 seconds
- **Total: ~15-45 seconds** from submission to finalization

## Next Steps

Once all tests pass:

1. Deploy to Base mainnet
2. Implement frontend components
3. Add monitoring and alerts
4. Set up production infrastructure
5. Test with real users

## Support

If you encounter issues:

1. Check logs in `agentkit/logs/agent.log`
2. Review backend console output
3. Check OpenAI dashboard for assistant runs
4. Verify all environment variables are set correctly
5. Ensure all services are running

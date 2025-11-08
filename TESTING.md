# Testing Guide for Recipe System

This guide walks you through testing the complete Recipe system implementation.

## Prerequisites

Before testing, ensure you have:

1. ✅ **OpenAI API Key** - From https://platform.openai.com/api-keys
2. ✅ **OpenAI Assistant ID** - Follow `backend/OPENAI_ASSISTANT_SETUP.md`
3. ✅ **Base RPC URL** - From Alchemy or Infura (for Base network)
4. ✅ **Test wallet with private key** - For backend service
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
# AGENT_WALLET_ADDRESS=0x... (the wallet that the backend service uses)
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

# Verify backend wallet has GRADER_ROLE
cast call <RECIPE_SYSTEM_ADDRESS> \
  "hasRole(bytes32,address)" \
  $(cast keccak "GRADER_ROLE") \
  <AGENT_WALLET_ADDRESS> \
  --rpc-url base-sepolia
```

**Expected**: Should return `true` (0x0000...0001)

## Test 4: Frontend Integration

### 4.1 Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Check if frontend has environment configuration
cat .env.example  # If exists, use it as reference
```

### 4.2 Configure Wallet Connection

Ensure MetaMask is installed and configured:

1. Install MetaMask browser extension
2. Add Base Sepolia network (ChainID: 84532)
3. Get testnet ETH from faucet: https://www.alchemy.com/faucets/base-sepolia

### 4.3 Start Frontend

Make sure backend is running first!

```bash
# In frontend directory
npm run dev
```

**Expected Output:**
```
Local:   http://localhost:5173/
Network: use --host to expose
```

Open http://localhost:5173 in your browser and test wallet connection.

## Test 5: End-to-End Flow

Test the complete flow from contract → backend → contract:

### 5.1 Submit a Recipe via Frontend

1. Start the frontend development server:
```bash
cd frontend
npm run dev
```

2. Open http://localhost:5173 and navigate to recipe submission

3. Fill out recipe form and submit

### 5.2 Watch Backend Logs

In the backend terminal, you should see:

```
Recipe evaluation request received { description: '...', ingredients: '...' }
OpenAI Assistant API called
Evaluation completed { grade: 85, revenueRate: 150 }
Requesting recipe on blockchain
Recipe requested on-chain { txHash: '0x...' }
Minting NFT for recipe { recipeId: 1 }
NFT minted successfully { tokenId: 1, owner: '0x...' }
```

### 5.3 Verify Recipe in Frontend

The frontend should show:
- Recipe evaluation results
- Blockchain transaction hash
- NFT token ID and ownership information

### 5.4 Verify Contract State

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

## Troubleshooting

### Backend Issues

**"OPENAI_ASSISTANT_ID not set"**
- Create assistant following `backend/OPENAI_ASSISTANT_SETUP.md`
- Add ID to `backend/.env`

**"Assistant run failed"**
- Check OpenAI dashboard for assistant status
- Verify assistant instructions are correct
- Check API key permissions

### Frontend Issues

**"Wallet connection failed"**
- Ensure MetaMask is installed and configured
- Switch to Base Sepolia network
- Check wallet has ETH for gas fees

**"Transaction failed"**
- Verify wallet has sufficient ETH for gas
- Check contract addresses are correct
- Ensure Base Sepolia network is selected

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
✅ Frontend connects to wallet successfully
✅ Recipe submission via frontend works
✅ Backend processes recipe evaluation
✅ Backend submits blockchain transactions
✅ Recipe is marked as evaluated
✅ NFT is minted to chef
✅ Frontend displays results correctly

## Performance Benchmarks

**Expected Timing:**
- Frontend recipe submission: ~2-5 seconds
- Backend AI evaluation: 5-10 seconds (OpenAI)
- Blockchain recipe request: 2-5 seconds
- Transaction confirmation: 2-5 seconds
- NFT minting: 2-5 seconds
- **Total: ~15-35 seconds** from submission to NFT minting

## Next Steps

Once all tests pass:

1. Deploy to Base mainnet
2. Implement frontend components
3. Add monitoring and alerts
4. Set up production infrastructure
5. Test with real users

## Support

If you encounter issues:

1. Review backend console output for detailed logs
2. Check browser console for frontend errors
3. Check OpenAI dashboard for assistant runs
4. Verify all environment variables are set correctly
5. Ensure backend and frontend services are running

# Environment Variables Setup Guide - Base Sepolia Testnet

This guide walks you through getting all the values you need for the 3 `.env` files.

## 🎯 Quick Checklist

- [ ] Get Alchemy API key (for RPC)
- [ ] Create/fund deployer wallet
- [ ] Create/fund agent wallet
- [ ] Get OpenAI API key
- [ ] Create OpenAI Assistant
- [ ] Deploy contracts
- [ ] Update RECIPE_CONTRACT_ADDRESS

---

## Step 1: Get Alchemy RPC URL (for Base Sepolia)

### 1.1 Sign up for Alchemy (Free)
1. Go to https://dashboard.alchemy.com/
2. Click "Sign Up" and create account
3. Verify your email

### 1.2 Create a New App
1. Click "Create new app"
2. Fill in:
   - **Name**: "Soil2Sauce Base Sepolia"
   - **Chain**: Base
   - **Network**: Base Sepolia (Testnet)
3. Click "Create app"

### 1.3 Get Your RPC URL
1. Click on your app
2. Click "API Key" button
3. Copy the **HTTPS** endpoint
4. It looks like: `https://base-sepolia.g.alchemy.com/v2/abc123xyz456`

### 1.4 Update Both Files
Paste this URL into:
- ✅ `.env` → `BASE_RPC_URL`
- ✅ `agentkit/.env` → `BASE_RPC_URL`

---

## Step 2: Create Deployer Wallet

You need a wallet to deploy contracts.

### Option A: Use Existing Wallet
If you have MetaMask or another wallet:
1. Export your private key
   - **MetaMask**: Account Details → Export Private Key
   - **⚠️ WARNING**: Never share this key or commit to git!
2. Copy the private key (starts with `0x`)

### Option B: Create New Wallet
Using cast (comes with Foundry):
```bash
cast wallet new
```

This outputs:
```
Address: 0xabc...
Private key: 0x123...
```

### 2.1 Fund Deployer Wallet
1. Copy your wallet address (0x...)
2. Go to https://www.alchemy.com/faucets/base-sepolia
3. Connect wallet or paste address
4. Request 0.5 Sepolia ETH
5. Wait ~30 seconds

### 2.2 Verify You Have Funds
```bash
cast balance YOUR_ADDRESS --rpc-url https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
```

Should show: `500000000000000000` (0.5 ETH in wei)

### 2.3 Update Root .env
Paste private key into:
- ✅ `.env` → `PRIVATE_KEY`

---

## Step 3: Create Agent Wallet

This is a **separate wallet** that will run the agent service.

### 3.1 Create New Wallet
```bash
cast wallet new
```

Save both:
- **Address** (0x...) - for deployment
- **Private key** (0x...) - for agent

### 3.2 Fund Agent Wallet
1. Use faucet: https://www.alchemy.com/faucets/base-sepolia
2. Request 0.1 Sepolia ETH (enough for ~100 recipe evaluations)

### 3.3 Update Files
- ✅ `.env` → `AGENT_WALLET_ADDRESS` = agent's **address** (0x...)
- ✅ `agentkit/.env` → `AGENT_PRIVATE_KEY` = agent's **private key** (0x...)

---

## Step 4: Get OpenAI API Key

### 4.1 Sign Up for OpenAI
1. Go to https://platform.openai.com/signup
2. Create account and verify email
3. Add payment method (required for API access)
   - First $5 is usually free credit

### 4.2 Create API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it: "Soil2Sauce Recipe Agent"
4. Copy the key (starts with `sk-`)
   - **⚠️ You can only see this ONCE!** Save it now!

### 4.3 Update Backend .env
- ✅ `backend/.env` → `OPENAI_API_KEY` = `sk-...`

---

## Step 5: Create OpenAI Assistant

### 5.1 Go to Assistants Page
1. Visit https://platform.openai.com/assistants
2. Click "Create" button

### 5.2 Configure Assistant

**Name**:
```
Soil2Sauce Recipe Evaluator
```

**Instructions** (copy/paste this exactly):
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

**Model**:
```
gpt-4o
```
(or `gpt-4-turbo-preview` if gpt-4o not available)

**Tools**:
- Leave all OFF (no Code Interpreter, no Retrieval, no Functions)

**Response format**:
- If available, set to "JSON" mode

### 5.3 Save and Get Assistant ID
1. Click "Save"
2. Copy the **Assistant ID** from the top
   - Looks like: `asst_abc123xyz456`

### 5.4 Test the Assistant (Optional but Recommended)
1. In the Playground, send test message:
```
Evaluate this recipe:

Ingredients: 2 cups flour, 1 cup sugar, 3 eggs, 1 stick butter

Instructions: Mix all ingredients. Bake at 350F for 30 minutes.
```

2. Should respond with valid JSON like:
```json
{
  "dishDescription": "A classic butter cake with...",
  "grade": 72,
  "revenueRate": 110,
  "critics": "The recipe demonstrates..."
}
```

### 5.5 Update Backend .env
- ✅ `backend/.env` → `OPENAI_ASSISTANT_ID` = `asst-...`

---

## Step 6: Deploy Contracts

### 6.1 Verify Root .env is Complete
Check `.env` has:
- ✅ `PRIVATE_KEY` (your deployer wallet)
- ✅ `BASE_RPC_URL` (Alchemy URL)
- ✅ `AGENT_WALLET_ADDRESS` (agent's public address)

### 6.2 Deploy
```bash
forge script script/Deploy.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify \
  -vvvv
```

### 6.3 Save Contract Address
Look for this in the output:
```
RecipeSystem deployed at: 0xABC123...
```

Copy that address!

### 6.4 Update AgentKit .env
- ✅ `agentkit/.env` → `RECIPE_CONTRACT_ADDRESS` = `0xABC123...`

---

## Step 7: Verify Everything

### 7.1 Check Root `.env`
```bash
cat .env
```
Should have:
- ✅ PRIVATE_KEY (64 hex chars after 0x)
- ✅ BASE_RPC_URL (https://base-sepolia.g.alchemy.com...)
- ✅ AGENT_WALLET_ADDRESS (0x + 40 hex chars)

### 7.2 Check Backend `.env`
```bash
cat backend/.env
```
Should have:
- ✅ OPENAI_API_KEY (sk-...)
- ✅ OPENAI_ASSISTANT_ID (asst_...)

### 7.3 Check AgentKit `.env`
```bash
cat agentkit/.env
```
Should have:
- ✅ BASE_RPC_URL (same as root)
- ✅ BASE_CHAIN_ID=84532
- ✅ RECIPE_CONTRACT_ADDRESS (0x... from deployment)
- ✅ AGENT_PRIVATE_KEY (0x + 64 hex chars)
- ✅ BACKEND_API_URL=http://localhost:3001

---

## ✅ Final Checklist

Before testing, verify:

- [ ] Deployer wallet has Sepolia ETH
- [ ] Agent wallet has Sepolia ETH
- [ ] Alchemy RPC URL works in both .env files
- [ ] OpenAI API key is valid
- [ ] OpenAI Assistant ID is correct
- [ ] Contracts are deployed
- [ ] Agent wallet has GRADER_ROLE (automatic during deployment)
- [ ] RECIPE_CONTRACT_ADDRESS is filled in agentkit/.env

---

## 🚀 You're Ready!

Now follow the **TESTING.md** guide starting from **Test 2** (Backend API).

---

## 🆘 Troubleshooting

### "insufficient funds for gas"
- Fund your wallet at https://www.alchemy.com/faucets/base-sepolia

### "invalid API key"
- Regenerate at https://platform.openai.com/api-keys
- Make sure no extra spaces in .env file

### "assistant not found"
- Copy Assistant ID from https://platform.openai.com/assistants
- Make sure you're copying the ID, not the name

### "RPC URL not responding"
- Check Alchemy dashboard for rate limits
- Verify URL is HTTPS not WSS
- Make sure you copied the full URL including `/v2/...`

### Need Help?
1. Check all values are filled in (no placeholders)
2. Remove any quotes around values in .env files
3. Verify no extra spaces before/after = sign
4. Make sure files are named exactly `.env` (not `.env.txt`)

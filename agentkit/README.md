# Soil2Sauce AgentKit

Off-chain agent service for processing recipe evaluation requests from the RecipeSystem smart contract.

## Overview

This service monitors the RecipeSystem contract for `RecipeRequested` events, sends the recipe data to the backend AI service for evaluation, and submits the results back on-chain by calling `finalizeRecipe()`.

## Architecture

```
RecipeSystem Contract (Base)
    ↓ (emits RecipeRequested event)
AgentKit Service (This)
    ↓ (calls evaluation API)
Backend AI Service
    ↓ (returns evaluation)
AgentKit Service
    ↓ (calls finalizeRecipe)
RecipeSystem Contract
```

## Setup

### 1. Install Dependencies

```bash
cd agentkit
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `BASE_RPC_URL` - Base network RPC endpoint (get from Alchemy or Infura)
- `RECIPE_CONTRACT_ADDRESS` - Deployed RecipeSystem contract address
- `AGENT_PRIVATE_KEY` - Private key of agent wallet (must have GRADER_ROLE)
- `BACKEND_API_URL` - Backend AI service URL

### 3. Grant GRADER_ROLE

The agent wallet must have the `GRADER_ROLE` on the RecipeSystem contract. This is automatically done during deployment if `AGENT_WALLET_ADDRESS` is set.

To manually grant the role:

```solidity
// As contract admin
recipeSystem.grantRole(GRADER_ROLE, agentWalletAddress);
```

### 4. Fund the Agent Wallet

The agent wallet needs ETH on Base to pay for gas when calling `finalizeRecipe()`.

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## How It Works

1. **Event Polling**: Every 15 seconds (configurable), the agent polls the RecipeSystem contract for new `RecipeRequested` events

2. **Duplicate Check**: Before processing, checks:
   - Local database to see if already processed
   - Contract's `processingLock` to avoid race conditions

3. **Backend API Call**: Sends recipe data to `/api/evaluate-recipe` endpoint

4. **On-Chain Submission**: Calls `finalizeRecipe()` with evaluation results

5. **Confirmation**: Waits for transaction confirmation (up to 5 minutes)

6. **Database Update**: Marks recipe as processed in local database

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_RPC_URL` | - | Base network RPC endpoint (required) |
| `BASE_CHAIN_ID` | 8453 | Base mainnet chain ID |
| `RECIPE_CONTRACT_ADDRESS` | - | RecipeSystem contract address (required) |
| `AGENT_PRIVATE_KEY` | - | Agent wallet private key (required) |
| `BACKEND_API_URL` | - | Backend AI service URL (required) |
| `MAX_RETRY_ATTEMPTS` | 3 | Max retry attempts on failure |
| `RETRY_DELAY_MS` | 5000 | Delay between retries (ms) |
| `POLL_INTERVAL_MS` | 15000 | Event polling interval (ms) |
| `DB_PATH` | ./data/processed.json | Persistent storage path |
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `LOG_PATH` | ./logs/agent.log | Log file path |

## Monitoring

### Logs

Logs are written to both console and file (`./logs/agent.log`).

Key log events:
- `Recipe request received` - New event detected
- `Evaluation received from API` - AI evaluation completed
- `Transaction submitted` - On-chain transaction sent
- `Transaction confirmed` - Transaction mined
- `Recipe processing complete` - Full cycle complete

### Database

The agent maintains a local database (`./data/processed.json`) tracking:
- Processed recipe IDs
- Transaction hashes
- Block numbers
- Processing timestamps

This prevents duplicate processing and enables recovery after restarts.

## Error Handling

The agent handles various error scenarios:

- **Backend API Down**: Retries with exponential backoff
- **RPC Connection Issues**: Continues polling with retry delay
- **Insufficient Gas**: Logs error and skips (manual intervention needed)
- **Contract Revert**: Logs revert reason and skips
- **Already Processed**: Skips silently

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "dist/agent.js"]
```

### Docker Compose

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
```

### Cloud Services

The agent can be deployed to:
- Railway
- Render
- Fly.io
- AWS ECS
- Google Cloud Run
- Any VPS with Docker

## Security

- **Never commit `.env` file** - Contains private keys
- **Rotate agent wallet** - If compromised, revoke GRADER_ROLE and deploy new wallet
- **Monitor wallet balance** - Set up alerts for low balance
- **Rate limiting** - Backend API should implement rate limiting
- **Input validation** - All inputs are validated before processing

## Troubleshooting

### Agent not processing events

1. Check logs for errors
2. Verify RPC endpoint is accessible
3. Confirm contract address is correct
4. Ensure agent has GRADER_ROLE
5. Check agent wallet has sufficient ETH for gas

### Transaction failures

1. Check gas prices (might need to increase buffer)
2. Verify agent wallet has ETH
3. Check if recipe already processed
4. Review contract logs for revert reasons

### Backend API errors

1. Verify backend is running
2. Check `BACKEND_API_URL` is correct
3. Review backend logs
4. Test API endpoint manually with curl

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

Output will be in `dist/` directory.

### Type Checking

```bash
npx tsc --noEmit
```

## License

MIT

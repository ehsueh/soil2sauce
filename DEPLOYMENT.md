# Deploying Soil2Sauce to Sepolia Testnet

## Prerequisites

1. **MetaMask wallet** with Sepolia testnet configured
2. **Sepolia ETH** - Get free test ETH from:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
3. **RPC URL** - Get a free API key from:
   - Alchemy: https://www.alchemy.com/
   - Infura: https://infura.io/

## Step 1: Configure Hardhat Variables

Set your Sepolia RPC URL:
```bash
npx hardhat vars set SEPOLIA_RPC_URL
# Enter: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

Set your private key (from MetaMask):
```bash
npx hardhat vars set SEPOLIA_PRIVATE_KEY
# Enter: 0xYOUR_PRIVATE_KEY_HERE
```

**⚠️ WARNING:** Never commit your private key to git! The vars are stored securely in Hardhat's configuration.

## Step 2: Deploy Contracts to Sepolia

```bash
npx hardhat ignition deploy ignition/modules/Soil2SauceModule.ts --network sepolia
```

This will deploy all four contracts:
- GameToken (GCOIN)
- FarmLand
- AnimalFarm
- Restaurant

Save the deployed contract addresses from the output.

## Step 3: Update Frontend Configuration

After deployment, update the contract addresses in `frontend/src/wagmi.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  gameToken: '0xYOUR_GAMETOKEN_ADDRESS' as `0x${string}`,
  farmLand: '0xYOUR_FARMLAND_ADDRESS' as `0x${string}`,
  animalFarm: '0xYOUR_ANIMALFARM_ADDRESS' as `0x${string}`,
  restaurant: '0xYOUR_RESTAURANT_ADDRESS' as `0x${string}`,
};
```

## Step 4: Run the Frontend

```bash
cd frontend
npm run dev
```

## Step 5: Connect MetaMask

1. Open the app at http://localhost:5173
2. Click "Connect with MetaMask"
3. Make sure MetaMask is on Sepolia network
4. Approve the connection

## Step 6: Initialize Your Farm

1. Click "Start Farming" to initialize your farm with 9 plots and 5 wheat seeds
2. Start planting, harvesting, and playing!

## Verify Deployment on Etherscan

Check your deployed contracts on Sepolia Etherscan:
- https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

## Troubleshooting

### "Insufficient funds" error
- Make sure you have Sepolia ETH in your wallet
- Get more from the faucets listed above

### "Network not supported"
- Make sure MetaMask is connected to Sepolia testnet
- Network ID should be 11155111

### Transaction fails
- Check you have enough Sepolia ETH for gas fees
- Verify contract addresses are correct in wagmi.ts

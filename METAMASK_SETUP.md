# Setting Up MetaMask with Local Hardhat Node

Follow these steps to connect MetaMask to your local Hardhat blockchain:

## Step 1: Add Localhost Network to MetaMask

1. Open MetaMask extension
2. Click on the network dropdown (top left, currently showing "Sepolia" or another network)
3. Click "Add network" or "Add a network manually"
4. Enter the following details:

   - **Network Name:** Localhost 8545
   - **New RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH

5. Click "Save"

## Step 2: Import a Hardhat Test Account

Hardhat provides test accounts with 10,000 ETH each. Import one to MetaMask:

1. In MetaMask, click on your account icon (top right)
2. Select "Import Account"
3. Select "Private Key" as import type
4. Paste one of these Hardhat test account private keys:

   **Account #0 (Recommended):**
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
   Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

   **Account #1 (Alternative):**
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
   Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

5. Click "Import"

## Step 3: Switch to Localhost Network

1. In MetaMask, click the network dropdown
2. Select "Localhost 8545"
3. You should see 10,000 ETH in your balance

## Step 4: Connect to the Game

1. Make sure the Hardhat node is running:
   ```bash
   npx hardhat node
   ```

2. Make sure contracts are deployed (if not already):
   ```bash
   npx hardhat ignition deploy ignition/modules/Soil2SauceModule.ts --network localhost
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

4. Open http://localhost:5173
5. Click "Connect with MetaMask"
6. Select the imported Hardhat account
7. Click "Connect"

## Step 5: Start Playing!

1. Click "Start Farming" to initialize your farm
2. You'll get 9 plots and 5 wheat seeds
3. Start planting, harvesting, and enjoying the game!

## Troubleshooting

### "Nonce too high" error
This happens when you restart the Hardhat node but MetaMask still has the old transaction history.

**Solution:**
1. In MetaMask, click on your account icon
2. Go to "Settings" > "Advanced"
3. Click "Clear activity tab data"
4. Refresh the page

### "Network not supported" or "Chain ID mismatch"
Make sure:
- Hardhat node is running (`npx hardhat node`)
- MetaMask is connected to "Localhost 8545" network
- Chain ID is set to 31337

### Contracts not responding
Make sure contracts are deployed:
```bash
npx hardhat ignition deploy ignition/modules/Soil2SauceModule.ts --network localhost
```

### Transaction stuck
If a transaction is pending forever:
1. Try resetting your MetaMask account (Settings > Advanced > Reset Account)
2. Make sure the Hardhat node is running
3. Refresh the page

## Important Notes

⚠️ **NEVER use these private keys on mainnet or with real ETH!** These are publicly known test keys.

⚠️ **Data resets**: When you restart the Hardhat node, all blockchain data is lost. You'll need to:
- Redeploy contracts
- Clear MetaMask activity data
- Reinitialize your farm in the game

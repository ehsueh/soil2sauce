# Soil2Sauce Deployment Scripts

This directory contains deployment scripts for the Soil2Sauce smart contracts.

## Files

- **`DeployNew.s.sol`** - Main deployment script with improved organization
- **`DeployWithVerification.s.sol`** - Deployment script that generates verification commands
- **`deploy-contracts.sh`** - Bash script for easy deployment with options
- **`Deploy.s.sol`** - Original deployment script (legacy)

## Quick Start

### 1. Set Environment Variables

```bash
export PRIVATE_KEY="your_private_key_here"
export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
export AGENT_WALLET_ADDRESS="0x..." # Optional, for GRADER_ROLE on RecipeSystem
```

### 2. Deploy Contracts

#### Option A: Simple Deployment
```bash
./deploy-contracts.sh
```

#### Option B: Deploy with Automatic Verification
```bash
./deploy-contracts.sh --verify
```

#### Option C: Deploy and Generate Manual Verification Commands
```bash
./deploy-contracts.sh --with-verification-commands
```

### 3. Manual Deployment (Foundry)

#### Basic Deployment
```bash
forge script script/DeployNew.s.sol:DeployNewScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

#### Deployment with Verification
```bash
forge script script/DeployNew.s.sol:DeployNewScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify
```

## Contract Architecture

The deployment script deploys contracts in the following order:

### Phase 1: Core Token Contracts
1. **ItemsERC1155** - Multi-token contract for game items
2. **STOKEN** - Game currency token

### Phase 2: Game System Contracts
3. **PlantSystem** - Handles farming and plant mechanics
4. **LivestockSystem** - Manages animals and livestock
5. **ShopSystem** - In-game marketplace
6. **GameRegistry** - Central registry and coordination
7. **RecipeSystem** - AI recipe evaluation (ERC721 NFTs)

### Phase 3: Role Configuration
- Sets up MINTER_ROLE permissions between contracts
- Grants GRADER_ROLE to agent wallet (if provided)

### Phase 4: System Linking
- Links PlantSystem to GameRegistry
- Sets starter STOKEN amount (10 tokens)

## Contract Addresses (Base Sepolia)

After deployment, save your contract addresses:

```
ItemsERC1155:    0x...
STOKEN:          0x...
PlantSystem:     0x...
LivestockSystem: 0x...
ShopSystem:      0x...
GameRegistry:    0x...
RecipeSystem:    0x...
```

## Verification

### Automatic Verification
Use the `--verify` flag during deployment to automatically verify contracts.

### Manual Verification
If automatic verification fails, use individual commands:

```bash
# Example for ItemsERC1155
forge verify-contract 0x... src/ItemsERC1155.sol:ItemsERC1155 --chain 84532

# Example for contracts with constructor args
forge verify-contract 0x... src/PlantSystem.sol:PlantSystem --chain 84532 \
  --constructor-args $(cast abi-encode "constructor(address,address)" 0x... 0x...)
```

## Troubleshooting

### Build Errors
```bash
# Clean and rebuild
forge clean
forge build --force
```

### Environment Issues
```bash
# Check your environment variables
echo $PRIVATE_KEY
echo $BASE_SEPOLIA_RPC_URL
echo $AGENT_WALLET_ADDRESS
```

### Network Issues
- Ensure your RPC URL is correct for Base Sepolia
- Check that your wallet has sufficient ETH for gas fees
- Verify the chain ID is 84532 for Base Sepolia

## Security Notes

- Never commit your private key to version control
- Use environment variables or `.env` files (add to `.gitignore`)
- Consider using hardware wallets for mainnet deployments
- Test on testnet before mainnet deployment

## Support

For issues or questions:
1. Check the deployment logs in `broadcast/` directory
2. Verify your environment setup
3. Ensure all dependencies are installed (`forge install`)
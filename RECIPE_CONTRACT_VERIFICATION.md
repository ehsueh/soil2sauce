# 🔍 RecipeSystem Contract Verification Guide

## Contract Details
- **Address**: `0xA5d01289948Efe9E8c9a9B9D04C73C280De35ee1`
- **Network**: Base Sepolia (Chain ID: 84532)
- **Contract**: `src/RecipeSystem.sol:RecipeSystem`
- **Compiler**: Solidity 0.8.24

## Prerequisites

1. **Get BaseScan API Key**:
   ```bash
   # Visit: https://basescan.org/apis
   # Sign up and create an API key
   export BASESCAN_API_KEY="your_api_key_here"
   ```

2. **Verify Foundry Setup**:
   ```bash
   forge --version
   # Should show Foundry installation
   ```

## Verification Methods

### Method 1: Using the Helper Script (Recommended)
```bash
./verify-recipe-contract.sh
```

### Method 2: Manual Verification Command
```bash
forge verify-contract \
  --chain-id 84532 \
  --watch \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  0xA5d01289948Efe9E8c9a9B9D04C73C280De35ee1 \
  src/RecipeSystem.sol:RecipeSystem
```

### Method 3: Using Foundry Script
```bash
forge script script/VerifyRecipeSystem.s.sol --rpc-url base-sepolia
```

## Expected Results

✅ **Success**: Contract source code will be verified and published on BaseScan  
🔗 **View at**: https://sepolia.basescan.org/address/0xA5d01289948Efe9E8c9a9B9D04C73C280De35ee1#code

## Contract Features Verified

The RecipeSystem contract includes:

- **ERC721 NFT**: Recipe NFTs with metadata URIs
- **Access Control**: GRADER_ROLE for AI evaluation system
- **Recipe Management**: Request, evaluate, and finalize recipes
- **AI Integration**: Structured for backend AI service integration
- **IPFS Metadata**: Support for decentralized metadata storage

## Troubleshooting

**Common Issues**:
1. **API Key Missing**: Set `BASESCAN_API_KEY` environment variable
2. **Network Issues**: Ensure Base Sepolia RPC is accessible
3. **Compilation Errors**: Run `forge build --force` to check for issues
4. **Wrong Address**: Verify contract address matches deployment

**Debug Steps**:
```bash
# 1. Check contract exists on-chain
cast code 0xA5d01289948Efe9E8c9a9B9D04C73C280De35ee1 --rpc-url base-sepolia

# 2. Verify compilation
forge build --force

# 3. Check API key
echo $BASESCAN_API_KEY
```
#!/bin/bash

# Verification script for RecipeSystem contract on Base Sepolia
# Usage: ./verify-recipe-contract.sh

set -e

# Contract details
CONTRACT_ADDRESS="0xA5d01289948Efe9E8c9a9B9D04C73C280De35ee1"
CONTRACT_NAME="src/RecipeSystem.sol:RecipeSystem"
CHAIN_ID="84532"
VERIFIER_URL="https://api-sepolia.basescan.org/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 RecipeSystem Contract Verification${NC}"
echo "=================================================="
echo -e "Contract Address: ${YELLOW}$CONTRACT_ADDRESS${NC}"
echo -e "Network: ${YELLOW}Base Sepolia (Chain ID: $CHAIN_ID)${NC}"
echo -e "Contract: ${YELLOW}$CONTRACT_NAME${NC}"
echo ""

# Check if BASESCAN_API_KEY is set
if [ -z "$BASESCAN_API_KEY" ]; then
    echo -e "${RED}❌ Error: BASESCAN_API_KEY environment variable not set${NC}"
    echo ""
    echo "To get an API key:"
    echo "1. Go to https://basescan.org/apis"
    echo "2. Sign up/login and create an API key"
    echo "3. Export it: export BASESCAN_API_KEY=\"your_api_key_here\""
    echo ""
    exit 1
fi

echo -e "${BLUE}🔧 Checking contract compilation...${NC}"
forge build --force

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contract compiled successfully${NC}"
echo ""

echo -e "${BLUE}🚀 Starting contract verification...${NC}"
echo ""

# Run forge verify-contract command
forge verify-contract \
    --chain-id $CHAIN_ID \
    --watch \
    --etherscan-api-key $BASESCAN_API_KEY \
    --verifier-url $VERIFIER_URL \
    $CONTRACT_ADDRESS \
    $CONTRACT_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Contract verification completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}🔗 View verified contract at:${NC}"
    echo -e "${YELLOW}https://sepolia.basescan.org/address/$CONTRACT_ADDRESS#code${NC}"
    echo ""
    echo -e "${BLUE}📋 Contract Details:${NC}"
    echo -e "• Contract Name: ${YELLOW}Soil2Sauce Recipe${NC}"
    echo -e "• Symbol: ${YELLOW}S2SRECIPE${NC}"
    echo -e "• Type: ${YELLOW}ERC721 NFT with Access Control${NC}"
    echo -e "• Features: ${YELLOW}AI Recipe Evaluation & NFT Minting${NC}"
else
    echo ""
    echo -e "${RED}❌ Contract verification failed${NC}"
    echo ""
    echo -e "${YELLOW}💡 Common solutions:${NC}"
    echo "• Make sure the contract source code matches exactly"
    echo "• Check that the compiler version is correct (0.8.24)"
    echo "• Verify the contract address is correct"
    echo "• Ensure Base Sepolia network is accessible"
    echo ""
    exit 1
fi
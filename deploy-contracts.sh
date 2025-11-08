#!/bin/bash

# Soil2Sauce Contract Deployment Script
# This script deploys the contracts with optional verification

set -e  # Exit on any error

echo "🚀 Soil2Sauce Contract Deployment"
echo "=================================="

# Check if required environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    exit 1
fi

if [ -z "$BASE_SEPOLIA_RPC_URL" ]; then
    echo "❌ Error: BASE_SEPOLIA_RPC_URL environment variable is not set"
    exit 1
fi

# Set default values
VERIFY_FLAG=""
SCRIPT_NAME="DeployNew"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verify)
            VERIFY_FLAG="--verify"
            echo "✅ Verification enabled"
            shift
            ;;
        --with-verification-commands)
            SCRIPT_NAME="DeployWithVerification"
            echo "✅ Will generate verification commands"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --verify                     Verify contracts automatically during deployment"
            echo "  --with-verification-commands Generate manual verification commands after deployment"
            echo "  --help                       Show this help message"
            echo ""
            echo "Environment Variables Required:"
            echo "  PRIVATE_KEY                  Your wallet private key"
            echo "  BASE_SEPOLIA_RPC_URL        Base Sepolia RPC URL"
            echo "  AGENT_WALLET_ADDRESS        (Optional) Agent wallet for GRADER_ROLE"
            echo ""
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "📋 Configuration:"
echo "  Script: ${SCRIPT_NAME}.s.sol"
echo "  Network: Base Sepolia"
echo "  Verify: $([ -n "$VERIFY_FLAG" ] && echo "Yes" || echo "No")"
echo "  Agent Wallet: ${AGENT_WALLET_ADDRESS:-"Not set"}"
echo ""

# Build contracts first
echo "🔨 Building contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Deploy contracts
echo "🚀 Deploying contracts..."
DEPLOY_CMD="forge script script/${SCRIPT_NAME}.s.sol:${SCRIPT_NAME}Script --rpc-url \$BASE_SEPOLIA_RPC_URL --broadcast $VERIFY_FLAG"

echo "Running: $DEPLOY_CMD"
echo ""

eval $DEPLOY_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📁 Check the broadcast/ directory for deployment artifacts"
    echo "💾 Save the contract addresses from the deployment output"
    
    if [ -z "$VERIFY_FLAG" ]; then
        echo ""
        echo "💡 To verify contracts later, run:"
        echo "   ./deploy-contracts.sh --with-verification-commands"
    fi
else
    echo ""
    echo "❌ Deployment failed"
    exit 1
fi
#!/bin/bash

# OnChain Sage Dojo - Testnet Deployment Script
set -e

echo "🚀 Starting Testnet Deployment for OnChain Sage Dojo..."

# Load environment variables
if [ -f ".env.testnet" ]; then
    export $(cat .env.testnet | xargs)
    echo "✅ Loaded testnet environment variables"
else
    echo "❌ .env.testnet file not found!"
    exit 1
fi

# Validate required environment variables
if [ -z "$STARKNET_RPC_URL" ] || [ -z "$ACCOUNT_ADDRESS" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Required environment variables missing!"
    echo "Please ensure STARKNET_RPC_URL, ACCOUNT_ADDRESS, and PRIVATE_KEY are set in .env.testnet"
    exit 1
fi

echo "🔧 Building contracts..."
sozo build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🌐 Deploying to StarkNet Testnet..."
sozo migrate --name testnet --rpc-url $STARKNET_RPC_URL

if [ $? -eq 0 ]; then
    echo "✅ Testnet deployment successful!"
    echo "📝 Deployment details saved to manifest files"
    
    # Save deployment info
    echo "Deployment completed at: $(date)" >> deployment/testnet-deployments.log
    echo "RPC URL: $STARKNET_RPC_URL" >> deployment/testnet-deployments.log
    echo "Account: $ACCOUNT_ADDRESS" >> deployment/testnet-deployments.log
    echo "---" >> deployment/testnet-deployments.log
else
    echo "❌ Testnet deployment failed!"
    exit 1
fi

echo "🎉 Testnet deployment completed successfully!" 
#!/bin/bash

# OnChain Sage Dojo - Mainnet Deployment Script
set -e

echo "🚀 Starting Mainnet Deployment for OnChain Sage Dojo..."
echo "⚠️  WARNING: This will deploy to MAINNET!"

# Confirmation prompt
read -p "Are you sure you want to deploy to mainnet? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Load environment variables
if [ -f ".env.mainnet" ]; then
    export $(cat .env.mainnet | xargs)
    echo "✅ Loaded mainnet environment variables"
else
    echo "❌ .env.mainnet file not found!"
    exit 1
fi

# Validate required environment variables
if [ -z "$STARKNET_RPC_URL" ] || [ -z "$ACCOUNT_ADDRESS" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Required environment variables missing!"
    echo "Please ensure STARKNET_RPC_URL, ACCOUNT_ADDRESS, and PRIVATE_KEY are set in .env.mainnet"
    exit 1
fi

# Additional mainnet checks
echo "🔍 Performing mainnet pre-deployment checks..."

# Check if this is actually mainnet
if [[ ! "$STARKNET_RPC_URL" == *"mainnet"* ]]; then
    echo "❌ RPC URL does not appear to be mainnet!"
    echo "Current RPC: $STARKNET_RPC_URL"
    exit 1
fi

# Run tests before deployment
echo "🧪 Running tests before mainnet deployment..."
sozo test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Cannot deploy to mainnet."
    exit 1
fi

echo "🔧 Building contracts..."
sozo build --release

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Final confirmation
read -p "Final confirmation: Deploy to MAINNET now? (yes/no): " final_confirm
if [ "$final_confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🌐 Deploying to StarkNet Mainnet..."
sozo migrate --name mainnet --rpc-url $STARKNET_RPC_URL

if [ $? -eq 0 ]; then
    echo "✅ Mainnet deployment successful!"
    echo "📝 Deployment details saved to manifest files"
    
    # Save deployment info
    echo "Deployment completed at: $(date)" >> deployment/mainnet-deployments.log
    echo "RPC URL: $STARKNET_RPC_URL" >> deployment/mainnet-deployments.log
    echo "Account: $ACCOUNT_ADDRESS" >> deployment/mainnet-deployments.log
    echo "---" >> deployment/mainnet-deployments.log
    
    echo "🎊 MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "🔐 Please backup your deployment artifacts and keys!"
else
    echo "❌ Mainnet deployment failed!"
    exit 1
fi 
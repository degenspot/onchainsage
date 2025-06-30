#!/bin/bash

# OnChain Sage Dojo - Code Formatting and Linting Script
set -e

echo "🎨 Starting code formatting and linting for OnChain Sage Dojo..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Format Cairo code with Scarb
echo "📝 Formatting Cairo code..."
if command_exists scarb; then
    find src -name "*.cairo" -exec scarb fmt {} \;
    echo "✅ Cairo code formatted with Scarb"
else
    echo "❌ Scarb not found! Please install Scarb."
    exit 1
fi

# Check formatting
echo "🔍 Checking code formatting..."
if find src -name "*.cairo" -exec scarb fmt --check {} \; ; then
    echo "✅ All files are properly formatted"
else
    echo "❌ Some files need formatting. Run 'scarb fmt' to fix."
    exit 1
fi

# Lint with Dojo build
echo "🔧 Running linting checks..."
if command_exists sozo; then
    sozo build
    echo "✅ Linting passed"
else
    echo "❌ Sozo not found! Please install Dojo."
    exit 1
fi

# Additional Cairo linting (if available)
if command_exists cairo-lint; then
    echo "🔍 Running additional Cairo linting..."
    find src -name "*.cairo" -exec cairo-lint {} \;
    echo "✅ Additional linting completed"
fi

echo "🎉 Code formatting and linting completed successfully!"
echo "📋 Summary:"
echo "   - Code formatting: ✅ Passed"
echo "   - Linting checks: ✅ Passed"
echo "   - Build verification: ✅ Passed" 
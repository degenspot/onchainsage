#!/bin/bash

# OnChain Sage Dojo - Testing Script
set -e

echo "🧪 Starting OnChain Sage Dojo Test Suite..."

# Function to display test results
display_results() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2 tests passed!"
    else
        echo "❌ $2 tests failed!"
        exit 1
    fi
}

# Run Dojo tests
echo "🏗️  Running Dojo tests..."
sozo test
display_results $? "Dojo"

# Run Starknet Foundry tests (if any)
if [ -d "tests_foundry" ]; then
    echo "⚡ Running Starknet Foundry tests..."
    snforge test
    display_results $? "Starknet Foundry"
else
    echo "ℹ️  No Starknet Foundry tests found (tests_foundry directory missing)"
fi

# Run coverage analysis
echo "📊 Generating test coverage..."
if command -v snforge &> /dev/null; then
    snforge test --coverage
    echo "✅ Coverage report generated in coverage/ directory"
fi

# Build verification
echo "🔧 Verifying build after tests..."
sozo build
display_results $? "Build verification"

echo "🎉 All tests completed successfully!"
echo "📋 Test Summary:"
echo "   - Dojo tests: ✅ Passed"
if [ -d "tests_foundry" ]; then
    echo "   - Foundry tests: ✅ Passed"
fi
echo "   - Build verification: ✅ Passed"
echo "   - Coverage report: 📊 Generated" 
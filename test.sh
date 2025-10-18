#!/bin/bash

# Test script for soroban-trace
# Usage: ./test.sh [TX_HASH]

set -e

echo "Testing soroban-trace..."
echo "================================"

# Test 1: Help commands
echo ""
echo "Test 1: CLI Help"
echo "----------------"
node dist/cli.js --help

echo ""
echo "Test 2: Command Help (tx)"
echo "-------------------------"
node dist/cli.js tx --help

echo ""
echo "Test 3: Command Help (file)"
echo "---------------------------"
node dist/cli.js file --help

# Test 4: Sample file
echo ""
echo "Test 4: Trace from sample file"
echo "-------------------------------"
if [ -f "examples/sample-transaction.json" ]; then
    node dist/cli.js file examples/sample-transaction.json
else
    echo "Sample file not found, skipping"
fi

# Test 5: Real transaction (if provided)
echo ""
echo "Test 5: Real transaction trace"
echo "-------------------------------"
if [ -n "$1" ]; then
    TX_HASH=$1
    echo "Using provided hash: $TX_HASH"
    echo ""
    echo "Basic trace:"
    node dist/cli.js tx "$TX_HASH" --network testnet
    echo ""
    echo "Verbose trace:"
    node dist/cli.js tx "$TX_HASH" --network testnet --verbose
    echo ""
    echo "JSON export:"
    node dist/cli.js tx "$TX_HASH" --network testnet --json | head -20
    echo "... (truncated)"
elif [ -n "$TEST_TX_HASH" ]; then
    echo "Using TEST_TX_HASH from environment: $TEST_TX_HASH"
    echo ""
    node dist/cli.js tx "$TEST_TX_HASH" --network testnet --verbose
else
    echo "No transaction hash provided"
    echo "   Usage: ./test.sh <TX_HASH>"
    echo "   Or set: TEST_TX_HASH=<hash> ./test.sh"
fi

echo ""
echo "================================"
echo "All tests complete!"
echo ""
echo "Next steps:"
echo "  1. Get a real testnet transaction hash"
echo "  2. Run: ./test.sh <TX_HASH>"
echo "  3. Check the output!"


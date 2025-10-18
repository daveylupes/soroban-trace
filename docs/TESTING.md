# Testing Guide

Complete guide for testing soroban-trace with real Soroban transactions.

## Quick Start

### Option 1: Use the Working Test Account 

We found a working account with Soroban transactions:

```bash
# Test with verified Soroban transaction
npm start -- tx d3bb417530b528e776c146580bcd93269cd86fa09d74e8c18cd7f7b0e9deab0b -n testnet
```

**Account:** `GDWGHZYUYKLT2N2I7VTRD4HKZYYM5SDQS2MSVYN2CDBZQHG4DINBY7UK` (testnet)

### Option 2: Deploy Your Own Contract

See [`deploy-test-contract.md`](./deploy-test-contract.md) for a complete guide to deploying your own test contract.

## Finding Test Transactions

### From Stellar Explorers

1. **Stellar Expert**
   - Visit: https://stellar.expert/explorer/testnet
   - Filter for "Invoke Host Function" operations

2. **StellarChain**
   - Visit: https://testnet.stellarchain.io/transactions
   - Look for Soroban contract invocations

### From Your Own Contracts

When you invoke a contract:

```bash
stellar contract invoke --id <CONTRACT_ID> --network testnet -- function_name
```

The output includes the transaction hash. Copy it and trace:

```bash
npm start -- tx <TX_HASH> --network testnet --verbose
```

## Test Commands

```bash
# Basic test
npm start -- tx <TX_HASH> --network testnet

# Verbose output
npm start -- tx <TX_HASH> --network testnet --verbose

# JSON export
npm start -- tx <TX_HASH> --network testnet --json

# From file
npm start -- file examples/sample-transaction.json

# All CLI options
npm start -- --help
```

## Running Automated Tests

```bash
# Install test dependencies
npm install --save-dev jest @types/jest ts-jest

# Run unit tests
npm test

# Run integration tests
TEST_TX_HASH=<YOUR_TX_HASH> npm run test:integration

# With coverage
npm run test:coverage
```

## Test Cases to Cover

-  Successful transactions
-  Failed transactions with errors
-  Transactions with events
-  Transactions without events
-  Complex multi-contract calls
-  Different networks (testnet, futurenet, mainnet)
-  JSON export
-  Verbose mode
-  Color vs no-color output

## Troubleshooting

**Transaction not found?**
- Verify the hash is correct
- Check you're using the right network
- Wait a few seconds if just submitted

**No Soroban operations found?**
- Transaction might not be a contract invocation
- Look for "invoke_host_function" operation type

**Parse errors?**
- Check if using latest SDK version
- Try with `--verbose` for more details

For more help, see [KNOWN_ISSUES.md](./known-issues.md).


#  Quick Start Guide

Get started with `soroban-trace` in 5 minutes!

## Installation

### Option 1: From npm (after publishing)

```bash
npm install -g soroban-trace
```

### Option 2: Local Development

```bash
# Clone
git clone https://github.com/daveylupes/soroban-trace.git
cd soroban-trace

# Install and build
npm install
npm run build

# Test
npm start -- --help
```

## Basic Usage

### Trace a Transaction

```bash
# Using verified test transaction
soroban-trace tx d3bb417530b528e776c146580bcd93269cd86fa09d74e8c18cd7f7b0e9deab0b --network testnet

# Or use your own transaction hash
soroban-trace tx <YOUR_TX_HASH> --network testnet
```

### Options

```bash
# Verbose mode (more details)
soroban-trace tx <TX_HASH> --verbose

# JSON export
soroban-trace tx <TX_HASH> --json > trace.json

# Different network
soroban-trace tx <TX_HASH> --network futurenet

# Custom RPC
soroban-trace tx <TX_HASH> --rpc-url https://custom-rpc.com

# From file
soroban-trace file ./transaction.json
```

## Example Workflow

### 1. Deploy a Test Contract

```bash
# Quick deploy (full guide in docs/deploy-test-contract.md)
stellar contract deploy --wasm mycontract.wasm --network testnet --source test-account

# Invoke it
stellar contract invoke --id <CONTRACT_ID> --network testnet --source test-account -- function_name
```

### 2. Trace the Transaction

```bash
# Copy the transaction hash from invoke output
soroban-trace tx <TX_HASH> --network testnet --verbose
```

### 3. Analyze the Output

Look for:
-  Function calls
-  Events emitted
-  Storage changes
-  Return values
-  Errors (if any)

## Programmatic Usage

```typescript
import { SorobanTrace } from 'soroban-trace';

const tracer = new SorobanTrace({ network: 'testnet' });
const result = await tracer.traceTransaction(txHash);
console.log(result);
```

## Next Steps

-  Read the [full documentation](README.md)
-  See [testing guide](docs/TESTING.md)
-  Check [architecture](docs/ARCHITECTURE.md)
-  Learn [how to contribute](docs/CONTRIBUTING.md)

## Common Issues

**Transaction not found?**
- Verify the hash is correct
- Check the network (`--network testnet`)

**No operations shown?**
- Make sure it's a Soroban transaction (not a regular payment)
- Look for `invoke_host_function` operation type

**Network error?**
- Check internet connection
- Try different RPC: `--rpc-url <URL>`

For more help, see [docs/known-issues.md](docs/known-issues.md)

---

**Happy tracing! **

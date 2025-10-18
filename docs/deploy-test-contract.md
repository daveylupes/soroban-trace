# Deploy Your Own Test Contract

Complete guide to deploying a Soroban contract and generating test transactions.

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Stellar CLI
cargo install --locked stellar-cli --features opt
```

## Quick Deploy (5 minutes)

### 1. Create Test Account

```bash
# Generate account
stellar keys generate test-account --network testnet

# Fund from friendbot
curl "https://friendbot.stellar.org?addr=$(stellar keys address test-account)"
```

### 2. Create Simple Contract

```bash
mkdir hello-soroban && cd hello-soroban

# Create Cargo.toml
cat > Cargo.toml << 'EOF'
[package]
name = "hello-soroban"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = "22.0.0"

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true
EOF

# Create contract
mkdir -p src
cat > src/lib.rs << 'EOF'
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    pub fn hello(env: Env, name: Symbol) -> Symbol {
        env.events().publish((symbol_short!("hello"),), name);
        symbol_short!("success")
    }
}
EOF
```

### 3. Build and Deploy

```bash
# Build
stellar contract build

# Deploy
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/hello_soroban.wasm \
  --network testnet \
  --source test-account)

echo "Contract ID: $CONTRACT_ID"
```

### 4. Invoke and Trace

```bash
# Invoke (capture transaction hash)
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  --source test-account \
  -- hello --name world

# Copy the transaction hash from output, then trace:
cd ../soroban-trace
npm start -- tx <TX_HASH> --network testnet --verbose
```

## Using Stellar Examples

```bash
# Clone examples
git clone https://github.com/stellar/soroban-examples
cd soroban-examples/hello_world

# Build and deploy
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/hello_world.wasm \
  --network testnet \
  --source test-account

# Invoke
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source test-account \
  -- hello --to friend
```

## Expected Output

After tracing, you should see:

```
┌──────────────────────────────────────────────────────────────────────┐
│ Transaction: abc123...                                               │
│ Ledger: 918000                                                       │
│ Time: 2025-10-07T00:00:00Z                                           │
│ Status: SUCCESS                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ OPERATIONS:                                                          │
│   1. CALL: invoke()                                                  │
│      ◆ EVENT: hello                                                  │
│        Data: world                                                   │
│      → success                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Next Steps

- Create contracts with more complex logic
- Test error cases
- Try multi-contract interactions
- Experiment with different Soroban features

This gives you full control over test transactions and helps you understand both Soroban and soroban-trace!


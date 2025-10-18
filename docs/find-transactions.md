# Finding Soroban Transactions

Guide to finding real Soroban transactions for testing.

##  Verified Working Account

**Account:** `GDWGHZYUYKLT2N2I7VTRD4HKZYYM5SDQS2MSVYN2CDBZQHG4DINBY7UK` (testnet)

This account has 10+ Soroban transactions you can test with:

```bash
# Test transaction (verified working)
npm start -- tx d3bb417530b528e776c146580bcd93269cd86fa09d74e8c18cd7f7b0e9deab0b -n testnet
```

## Explorers & Tools

### 1. Stellar Expert
- **URL:** https://stellar.expert/explorer/testnet
- **What to do:** Filter for "Invoke Host Function" operations
- Copy transaction hashes

### 2. Soroban Explorer
- **URL:** https://www.sorobanexp.com/
- **What to do:** Browse transactions, look for "Contract Invocation" type

### 3. StellarChain
- **URL:** https://testnet.stellarchain.io/transactions
- **What to do:** Look for contract operations

## What to Look For

###  Soroban Transactions
- Operation type: `invoke_host_function`
- Contract ID present
- Events emitted
- Soroban-specific operations

###  Not Soroban
- `payment` operations
- `create_account` operations
- Regular Stellar transactions

## Using the CLI to Find Transactions

```bash
# Get recent transactions from an account
curl -s "https://horizon-testnet.stellar.org/accounts/<ACCOUNT>/transactions?order=desc&limit=10" | jq -r '._embedded.records[] | .hash'

# Check if transaction is Soroban
curl -s "https://horizon-testnet.stellar.org/transactions/<TX_HASH>/operations" | jq '._embedded.records[] | select(.type == "invoke_host_function")'
```

## Helper Script

Use the included script:

```bash
node scripts/find-test-transactions.js
```

This searches recent testnet transactions for Soroban activity.

## Best Approach

**Deploy your own contract!**

See [`deploy-test-contract.md`](./deploy-test-contract.md) for a complete guide.

Benefits:
-  Guaranteed Soroban transactions
-  Control over what events are emitted
-  Can test different scenarios
-  Learn how contracts work

## Community Sources

### Stellar Discord
- **URL:** https://discord.gg/stellar
- **Channel:** #soroban
- Ask for test transaction hashes

### Stellar Reddit
- **URL:** https://reddit.com/r/Stellar
- Look for posts about Soroban

Ready to find transactions? Start with the verified account or deploy your own! 


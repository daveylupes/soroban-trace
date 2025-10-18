# User Flow Documentation

Complete guide to using soroban-trace from installation to debugging.

## Overview

soroban-trace helps developers understand what happens during Soroban smart contract execution by tracing transactions and visualizing their results.

## User Journey

### 1. Discovery & Installation

**User needs:** Debug a failed Soroban contract transaction

```bash
# Install globally from npm
npm install -g soroban-trace
```

**Time:** 30 seconds

---

### 2. Getting a Transaction Hash

**Scenario A: From your own contract**
```bash
# Deploy and invoke your contract
stellar contract invoke --id CONTRACT_ID --network testnet -- function_name

# Output includes transaction hash:
# Transaction hash: f98057d80eb10a4e86d144d84ae3a9492660f3ab34a58cfc42bb0223cf70d4bb
```

**Scenario B: From explorer**
- Visit Stellar Expert (stellar.expert/explorer/testnet)
- Find a contract invocation transaction
- Copy the transaction hash

**Scenario C: From an error log**
- Contract fails in production
- Error log contains transaction hash
- Use hash to debug

---

### 3. Tracing the Transaction

**Basic trace:**
```bash
soroban-trace tx f98057d80eb10a4e86d144d84ae3a9492660f3ab34a58cfc42bb0223cf70d4bb --network testnet
```

**Output:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Transaction: f98057d80eb10a4e86d144d84ae3a9492660f3ab34a58cfc42...   │
│ Ledger: 927224                                                       │
│ Time: 1759833552                                                     │
│ Status: SUCCESS                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ OPERATIONS:                                                          │
│   1. CALL: invoke()                                                  │
│      Contract: CA5H267AGVLPV2GWNULUM2ZB4T4TJBTRUY6GIDZDAWNKOQS3ZJ7Y2ZZC│
│      ERROR: Operation failed                                         │
└──────────────────────────────────────────────────────────────────────┘
```

**Time:** 2-3 seconds

---

### 4. Understanding the Results

**Key information shown:**
- Transaction hash (for reference)
- Ledger number (when it was included)
- Timestamp (exact time)
- Transaction status (SUCCESS/FAILED)
- Contract address (what was called)
- Operation result (success or error)
- Events emitted (if any)
- Storage changes (if any)

---

### 5. Debugging Workflow

**Case 1: Transaction SUCCESS, Operation FAILED**
```
Status: SUCCESS
ERROR: Operation failed
```
**Meaning:** Transaction was accepted on-chain, but contract logic failed
**Action:** Check contract code - authorization, validation, state issues

**Case 2: Transaction FAILED**
```
Status: FAILED
Error: Insufficient balance
```
**Meaning:** Transaction itself was rejected
**Action:** Check account balance, network issues, fees

**Case 3: Transaction SUCCESS, No Errors**
```
Status: SUCCESS
OPERATIONS:
  1. CALL: transfer(from, to, 1000)
     EVENT: Transfer
     → success
```
**Meaning:** Everything worked perfectly
**Action:** Review events and storage changes to verify expected behavior

---

### 6. Advanced Usage

**Verbose mode (more details):**
```bash
soroban-trace tx HASH --network testnet --verbose
```

**JSON export (for scripts/automation):**
```bash
soroban-trace tx HASH --network testnet --json > trace.json
```

**From saved file:**
```bash
soroban-trace file transaction.json
```

**Custom RPC endpoint:**
```bash
soroban-trace tx HASH --rpc-url https://custom-rpc.com
```

---

### 7. Common Use Cases

#### Use Case 1: Failed Authorization
```
ERROR: Operation failed
```
**Solution:** Check if correct account/signer was used

#### Use Case 2: Missing Events
```
Note: This transaction has no Soroban events
```
**Solution:** Verify contract is emitting events correctly

#### Use Case 3: Multi-Contract Calls
```
OPERATIONS:
  1. CALL: token.transfer()
     → 2. CALL: staking.stake()
        → 3. CALL: reward.update()
```
**Solution:** See entire call chain and where it failed

#### Use Case 4: Gas Issues
```
ERROR: Out of instructions
```
**Solution:** Optimize contract code or increase budget

---

### 8. Integration into Development Workflow

**During Development:**
```bash
# 1. Write contract
# 2. Deploy to testnet
stellar contract deploy --wasm contract.wasm --network testnet

# 3. Test function
stellar contract invoke --id CONTRACT_ID --network testnet -- test_func

# 4. If it fails, trace it
soroban-trace tx HASH --network testnet --verbose

# 5. Fix issues
# 6. Repeat
```

**In CI/CD:**
```bash
# Run tests and capture transaction hashes
TX_HASH=$(run_test_and_capture_hash)

# Trace for detailed logs
soroban-trace tx $TX_HASH --json > logs/trace-$TX_HASH.json
```

**In Production Monitoring:**
```bash
# Watch for failed transactions
watch -n 10 'soroban-trace tx LATEST_TX --network mainnet'
```

---

## User Personas

### Persona 1: Smart Contract Developer
**Goal:** Debug failed contract calls
**Frequency:** Daily during development
**Primary use:** `soroban-trace tx HASH --verbose`

### Persona 2: DevOps Engineer
**Goal:** Monitor production contracts
**Frequency:** Continuous monitoring
**Primary use:** `soroban-trace tx HASH --json | send-to-logs`

### Persona 3: Auditor
**Goal:** Analyze contract behavior
**Frequency:** During audits
**Primary use:** Historical transaction analysis

### Persona 4: Student/Learner
**Goal:** Understand Soroban contracts
**Frequency:** While learning
**Primary use:** Trace example transactions

---

## Success Metrics

**Time saved:**
- Before: 15-30 minutes debugging blind
- After: 2-3 minutes with clear trace

**Questions answered:**
- Did my transaction succeed?
- What events were emitted?
- Which contract calls failed?
- Where in the call chain did it break?
- What data was stored?

**Developer satisfaction:**
- Clear, actionable information
- No need to parse raw XDR
- Immediate feedback

---

## Flow Diagram

```
Start
  ↓
User has transaction hash
  ↓
Run: soroban-trace tx HASH
  ↓
Tool fetches from RPC/Horizon
  ↓
Tool parses XDR data
  ↓
Tool formats output
  ↓
User sees structured trace
  ↓
User identifies issue
  ↓
User fixes contract code
  ↓
Success!
```

---

## Next Steps After Tracing

1. **If operation failed:**
   - Review contract code at failure point
   - Check input parameters
   - Verify contract state
   - Test locally with same inputs

2. **If transaction failed:**
   - Check account balance
   - Verify network connectivity
   - Confirm correct network (testnet/mainnet)
   - Review transaction fees

3. **If everything succeeded:**
   - Verify expected events were emitted
   - Check storage changes are correct
   - Document successful pattern
   - Move to next feature

---

This user flow ensures developers can quickly debug and understand their Soroban contracts with minimal friction.


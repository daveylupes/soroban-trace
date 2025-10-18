# Understanding Transaction Results

Deep dive into what soroban-trace shows you and what it means.

## Two Levels of Success/Failure

Soroban transactions have **two distinct levels** where things can succeed or fail:

1. **Transaction Level** - Did the network accept the transaction?
2. **Operation Level** - Did the contract execution succeed?

### Why This Matters

Understanding this distinction is crucial for debugging. Your transaction can be included in the ledger (SUCCESS) while your contract operation fails (ERROR).

---

## The Four Possible Outcomes

### 1. Transaction SUCCESS + Operation SUCCESS

**What it looks like:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Transaction: abc123...                                               │
│ Ledger: 927224                                                       │
│ Status: SUCCESS                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ OPERATIONS:                                                          │
│   1. CALL: transfer(from, to, 1000)                                  │
│      EVENT: Transfer                                                 │
│      Data: { from: alice, to: bob, amount: 1000 }                    │
│      → success                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**What it means:**
- Transaction was accepted by the network
- Contract code executed successfully
- Events were emitted as expected
- State changes were applied

**What you did right:**
- Correct parameters
- Valid authorization
- Sufficient balance/resources
- Contract logic worked as intended

**Next steps:**
- Verify events are correct
- Check storage changes
- Move to production confidently

---

### 2. Transaction SUCCESS + Operation FAILED

**What it looks like:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Transaction: f98057d80eb10a4e86d144d84ae3a9492660f3ab34a58cfc42...   │
│ Ledger: 927224                                                       │
│ Status: SUCCESS                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ OPERATIONS:                                                          │
│   1. CALL: invoke()                                                  │
│      Contract: CA5H267AGVLPV2GWNULUM2ZB4T4TJBTRUY6GIDZDAWNKOQS3ZJ7Y2ZZC│
│      ERROR: Operation failed                                         │
└──────────────────────────────────────────────────────────────────────┘
```

**What it means:**
- Transaction WAS included in the ledger
- Fees WERE paid
- Network accepted the transaction structure
- BUT the contract execution failed
- State changes were NOT applied
- Events were NOT emitted

**Common causes:**

1. **Authorization Failure:**
```rust
// Contract code
require_auth(&user); // Failed - wrong signer
```

2. **Invalid Parameters:**
```rust
// Contract expects positive amount
if amount <= 0 {
    panic!("Invalid amount"); // Operation fails here
}
```

3. **Contract State Issues:**
```rust
// Contract not initialized
let config = storage.get(&CONFIG_KEY)
    .expect("Not initialized"); // Panics if not set
```

4. **Business Logic Rejection:**
```rust
// Insufficient balance
if balance < amount {
    panic!("Insufficient funds"); // Fails here
}
```

5. **Cross-Contract Call Failure:**
```rust
// Called contract fails
let result = token.transfer(&from, &to, &amount);
// If token.transfer fails, this operation fails
```

**Next steps:**
1. Review contract code at the call point
2. Check input parameters
3. Verify contract initialization
4. Test with correct authorization
5. Add better error messages to contract

**Real-world example:**

```rust
// Before: Generic failure
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    require_auth(&from);
    // ... transfer logic
}

// After: Specific error
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    require_auth(&from);  // "Authorization failed"
    
    if amount <= 0 {
        panic!("Amount must be positive");  // Clear error
    }
    
    let balance = get_balance(&env, &from);
    if balance < amount {
        panic!("Insufficient balance");  // Clear error
    }
    
    // ... transfer logic
}
```

---

### 3. Transaction FAILED

**What it looks like:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Transaction: def456...                                               │
│ Status: FAILED                                                       │
│ Error: tx_insufficient_balance                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**What it means:**
- Transaction was NOT included in the ledger
- Network rejected it before execution
- No fees were paid
- Contract code never ran

**Common causes:**

1. **Insufficient Balance:**
```
Error: tx_insufficient_balance
```
Account doesn't have enough XLM for fees

2. **Invalid Signature:**
```
Error: tx_bad_auth
```
Wrong signer or invalid signature

3. **Sequence Number Mismatch:**
```
Error: tx_bad_seq
```
Transaction sequence is incorrect

4. **Network Issues:**
```
Error: timeout
```
RPC/Horizon not reachable

5. **Invalid Transaction Structure:**
```
Error: tx_malformed
```
Transaction is not properly formatted

**Next steps:**
1. Check account balance
2. Verify correct signer
3. Confirm network connectivity
4. Review transaction construction

---

### 4. Transaction SUCCESS + No Operations

**What it looks like:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Transaction: xyz789...                                               │
│ Status: SUCCESS                                                      │
│ Note: This transaction has no Soroban events                         │
└──────────────────────────────────────────────────────────────────────┘
```

**What it means:**
- Transaction succeeded
- But no events were emitted
- Possibly a simple contract call
- Or contract doesn't emit events

**Common scenarios:**

1. **View/Read-Only Function:**
```rust
// Just returns data, doesn't modify state
pub fn get_balance(env: Env, account: Address) -> i128 {
    storage.get(&account).unwrap_or(0)
}
```

2. **Silent Operation:**
```rust
// Updates state but doesn't emit events
pub fn set_config(env: Env, config: Config) {
    storage.set(&CONFIG_KEY, &config);
    // No event emitted
}
```

**Next steps:**
- Verify this is expected behavior
- Consider adding events for better traceability
- Check storage changes if needed

---

## Real Transaction Examples

### Example 1: Successful Token Transfer

**Transaction:** `d3bb417530b528e776c146580bcd93269cd86fa09d74e8c18cd7f7b0e9deab0b`

```
Status: SUCCESS
OPERATIONS:
  1. CALL: transfer(alice, bob, 1000)
     EVENT: Transfer
       topics: ["transfer", "alice", "bob"]
       data: { amount: 1000 }
     WRITE: balance[alice] = 5000
     WRITE: balance[bob] = 1000
     → success
```

**Analysis:**
- Transfer executed successfully
- Event emitted for indexing
- Both balances updated
- Everything as expected

---

### Example 2: Failed Authorization

**Transaction:** `f98057d80eb10a4e86d144d84ae3a9492660f3ab34a58cfc42bb0223cf70d4bb`

```
Status: SUCCESS
OPERATIONS:
  1. CALL: transfer(alice, bob, 1000)
     ERROR: Operation failed
```

**Analysis:**
- Transaction included in ledger
- But operation failed
- Likely: wrong signer used
- Action: Check authorization in contract

---

### Example 3: Contract Not Initialized

```
Status: SUCCESS
OPERATIONS:
  1. CALL: get_config()
     ERROR: Operation failed
```

**Contract code:**
```rust
pub fn get_config(env: Env) -> Config {
    storage.get(&CONFIG_KEY)
        .expect("Contract not initialized") // Panics here
}
```

**Analysis:**
- Contract wasn't initialized first
- Need to call `initialize()` before use
- Common mistake with new deployments

---

### Example 4: Insufficient Balance

```
Status: SUCCESS
OPERATIONS:
  1. CALL: transfer(alice, bob, 10000)
     ERROR: Operation failed
```

**Contract code:**
```rust
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    let balance = get_balance(&env, &from); // balance = 1000
    
    if balance < amount {  // 1000 < 10000
        panic!("Insufficient balance"); // Fails here
    }
    
    // ... rest of code never executes
}
```

**Analysis:**
- Business logic correctly rejected
- Contract working as designed
- User needs to transfer less or add funds

---

## Debugging Checklist

### When Operation Fails

- [ ] Check contract is initialized
- [ ] Verify correct signer/authorization
- [ ] Validate input parameters
- [ ] Check account/contract balances
- [ ] Review business logic constraints
- [ ] Test locally with same inputs
- [ ] Add logging/events for debugging
- [ ] Check cross-contract call chain

### When Transaction Fails

- [ ] Verify account has sufficient balance
- [ ] Check sequence number
- [ ] Confirm correct network (testnet/mainnet)
- [ ] Verify signature is correct
- [ ] Check network connectivity
- [ ] Review transaction construction

---

## Best Practices

### 1. Add Descriptive Events

**Bad:**
```rust
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    // ... logic
    // No events
}
```

**Good:**
```rust
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    // ... logic
    
    env.events().publish(
        (symbol_short!("transfer"), from.clone(), to.clone()),
        amount
    );
}
```

### 2. Use Specific Error Messages

**Bad:**
```rust
panic!("Error");
```

**Good:**
```rust
panic!("Insufficient balance: has {}, needs {}", balance, amount);
```

### 3. Initialize Contracts Properly

```rust
pub fn initialize(env: Env, admin: Address) {
    if storage.has(&INITIALIZED_KEY) {
        panic!("Already initialized");
    }
    
    storage.set(&ADMIN_KEY, &admin);
    storage.set(&INITIALIZED_KEY, &true);
}
```

### 4. Validate Early

```rust
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    // Validate first
    require_auth(&from);
    
    if amount <= 0 {
        panic!("Amount must be positive");
    }
    
    // Then execute
    // ... transfer logic
}
```

---

## Summary

| Status | Meaning | Fee Paid? | State Changed? | Action |
|--------|---------|-----------|----------------|--------|
| TX: SUCCESS<br>OP: SUCCESS | Perfect | Yes | Yes | Deploy to prod |
| TX: SUCCESS<br>OP: FAILED | Contract rejected | Yes | No | Fix contract code |
| TX: FAILED | Network rejected | No | No | Fix transaction |
| TX: SUCCESS<br>No events | Silent success | Yes | Maybe | Add events |

Understanding these distinctions helps you debug faster and build more robust Soroban contracts.


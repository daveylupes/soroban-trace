# Known Issues

Current limitations and workarounds for soroban-trace.

## Missing Contract Names

**Issue:** Functions show as generic names like `invoke` instead of actual contract function names.

**Cause:** The tool doesn't yet parse WASM metadata to extract function names and ABIs.

**Current Behavior:**
- Shows operation index
- Shows raw parameters (decoded when possible)
- Shows events and return values

**Future Enhancement:** Planned for Phase 2 - WASM metadata extraction

---

## Large Transactions

**Issue:** Very large transactions with many operations may be slow to parse or display.

**Workaround:**
- Use `--json` flag to export and analyze with external tools
- Use `--no-colors` for faster terminal output
- Pipe to a file: `soroban-trace tx <HASH> > output.txt`

**Future Enhancement:** Pagination and filtering options

---

## Network Timeouts

**Issue:** RPC or Horizon requests may timeout or fail.

**Symptoms:**
```
Error: Network error: timeout of 5000ms exceeded
```

**Solutions:**
1. Check your internet connection
2. Try a different RPC endpoint: `--rpc-url https://alternative-rpc.com`
3. Use Horizon fallback (automatically attempted)
4. Retry the request

---

## Regular vs Soroban Transactions

**Issue:** Not all transactions are Soroban transactions.

**Symptoms:**
- Empty output with no operations
- "No operations found" message

**Cause:** The transaction might be:
- A regular Stellar payment
- An account operation
- A non-Soroban transaction

**Solution:** Look for transactions with `invoke_host_function` operation type.

Verify on Stellar Expert or check operations:
```bash
curl -s "https://horizon-testnet.stellar.org/transactions/<TX_HASH>/operations" | jq '._embedded.records[] | .type'
```

---

## Reporting Issues

If you encounter an issue:

1. **Check version:**
   ```bash
   npm list soroban-trace
   ```

2. **Try verbose output:**
   ```bash
   soroban-trace tx <TX_HASH> --network testnet --verbose
   ```

3. **Export debug info:**
   ```bash
   soroban-trace tx <TX_HASH> --json > debug.json
   ```

4. **Report on GitHub** with:
   - Error message
   - Transaction hash (if public)
   - Environment (OS, Node version)
   - Command used

---

## Compatibility

###  Supported
- Stellar Protocol 20+
- Soroban contracts
- Testnet, Futurenet, Mainnet
- Node.js 18+
- Linux, macOS, Windows

###  Limited Support
- Very large transactions (may be slow)
- Custom XDR formats (may not parse correctly)

###  Not Yet Supported
- WASM metadata extraction
- Live tracing during tests
- Historical bulk analysis
- Contract ABI integration

These are planned for future releases!

---

**Last Updated:** October 7, 2025


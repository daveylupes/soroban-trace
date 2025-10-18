# Tests for soroban-trace

## Running Tests

### Install Test Dependencies

```bash
npm install --save-dev jest @types/jest ts-jest
```

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- parser.test.ts
```

### Run Integration Tests

```bash
npm run test:integration
```

### Run with Coverage

```bash
npm run test:coverage
```

## Test Structure

- `parser.test.ts` - Unit tests for transaction parsing
- `formatter.test.ts` - Unit tests for output formatting
- `rpc-client.test.ts` - Unit tests for RPC client
- `integration.test.ts` - End-to-end integration tests

## Testing with Real Transactions

To test with real Soroban transactions:

1. Deploy a test contract (see `../docs/deploy-test-contract.md`)
2. Get a transaction hash
3. Run integration tests:

```bash
TEST_TX_HASH=your_tx_hash_here npm run test:integration
```

## Writing New Tests

### Unit Tests

```typescript
describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

```typescript
describe('Integration: Feature', () => {
  it('should work end-to-end', async () => {
    const tracer = new SorobanTrace({ network: 'testnet' });
    const result = await tracer.traceTransaction(txHash);
    expect(result).toContain('SUCCESS');
  });
});
```

## Mocking

For tests that require external services (RPC, Horizon), use mocks:

```typescript
jest.mock('../src/rpc-client');
```

## Test Coverage Goals

- **Parser:** >80% coverage
- **Formatter:** >80% coverage
- **RPC Client:** >70% coverage (network calls are hard to test)
- **Integration:** Key workflows covered

## CI/CD

Tests run automatically on:
- Pull requests
- Commits to main
- Before publishing to npm

## Future Improvements

- [ ] Add more edge case tests
- [ ] Add performance benchmarks
- [ ] Add E2E tests with real contracts
- [ ] Add visual regression tests for output


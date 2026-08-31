/**
 * Integration tests for soroban-trace
 *
 * Tests end-to-end functionality against the bundled sample transaction.
 *
 * Run with: npm run test:integration
 */

import { SorobanTrace } from '../src/index';

describe('Integration Tests', () => {
  let tracer: SorobanTrace;

  beforeEach(() => {
    tracer = new SorobanTrace({ network: 'testnet' });
  });

  describe('End-to-end tracing', () => {
    it('should trace from the bundled sample file', async () => {
      const result = await tracer.traceFromFile('./examples/sample-transaction.json', {
        json: false,
        verbose: true,
        colors: false,
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('transfer');
      expect(result).toContain('RESOURCE USAGE');
      expect(result).toContain('CPU instructions');
    });

    it('should emit valid JSON with decoded call data', async () => {
      const result = await tracer.traceFromFile('./examples/sample-transaction.json', {
        json: true,
        colors: false,
      });

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(parsed.operations[0].functionName).toBe('transfer');
      expect(parsed.operations[0].parameters).toHaveLength(3);
      expect(parsed.gas.cpuInstructions).toBeGreaterThan(0);
      // BigInt values must be serialized as strings, not crash JSON.stringify.
      expect(typeof parsed.gas.totalResourceFeeStroops).toBe('string');
    });

    it('should reject invalid file paths', async () => {
      await expect(tracer.traceFromFile('./nonexistent.json')).rejects.toThrow();
    });

    it.skip('should trace real testnet transaction', async () => {
      const TX_HASH = process.env.TEST_TX_HASH;
      if (!TX_HASH) return;

      const result = await tracer.traceTransaction(TX_HASH, {
        verbose: true,
        colors: false,
      });
      expect(result).toContain(TX_HASH);
    });
  });
});

/**
 * Integration tests for soroban-trace
 * 
 * Tests end-to-end functionality with real testnet data
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
    it('should trace from file', () => {
      const result = tracer.traceFromFile('./examples/sample-transaction.json', {
        json: false,
        verbose: false,
        colors: false,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle invalid file paths', () => {
      expect(() => {
        tracer.traceFromFile('./nonexistent.json');
      }).toThrow();
    });

    // Note: This test requires a real transaction hash
    it.skip('should trace real testnet transaction', async () => {
      const TX_HASH = process.env.TEST_TX_HASH;
      
      if (!TX_HASH) {
        console.log('Skipping: Set TEST_TX_HASH environment variable to run this test');
        return;
      }

      const result = await tracer.traceTransaction(TX_HASH, {
        json: false,
        verbose: true,
        colors: false,
      });

      expect(result).toBeDefined();
      expect(result).toContain(TX_HASH);
    });
  });
});


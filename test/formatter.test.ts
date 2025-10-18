/**
 * Formatter tests for soroban-trace
 * 
 * Run with: npm test
 */

import { TraceFormatter } from '../src/formatter';
import { TransactionTrace, TraceEvent } from '../src/types';

describe('TraceFormatter', () => {
  let formatter: TraceFormatter;

  beforeEach(() => {
    formatter = new TraceFormatter({ json: false, verbose: false, colors: false });
  });

  describe('format', () => {
    it('should format a simple transaction', () => {
      const trace: TransactionTrace = {
        transactionHash: 'abc123',
        success: true,
        ledger: 12345,
        createdAt: '2025-10-07T00:00:00Z',
        operations: [],
        events: [],
      };

      const result = formatter.format(trace);

      expect(result).toContain('abc123');
      expect(result).toContain('SUCCESS');
      expect(result).toContain('12345');
    });

    it('should format failed transactions', () => {
      const trace: TransactionTrace = {
        transactionHash: 'failed123',
        success: false,
        errorMessage: 'Contract error',
        operations: [],
        events: [],
      };

      const result = formatter.format(trace);

      expect(result).toContain('failed123');
      expect(result).toContain('FAILED');
      expect(result).toContain('Contract error');
    });

    it('should format events', () => {
      const event: TraceEvent = {
        type: 'event',
        topics: ['transfer'],
        data: { from: 'alice', to: 'bob', amount: 1000 },
      };

      const trace: TransactionTrace = {
        transactionHash: 'event-tx',
        success: true,
        operations: [],
        events: [event],
      };

      const result = formatter.format(trace);

      expect(result).toContain('EVENT');
      expect(result).toContain('transfer');
    });
  });

  describe('JSON format', () => {
    it('should export valid JSON', () => {
      const jsonFormatter = new TraceFormatter({ json: true, verbose: false, colors: false });
      
      const trace: TransactionTrace = {
        transactionHash: 'json-test',
        success: true,
        operations: [],
        events: [],
      };

      const result = jsonFormatter.format(trace);
      const parsed = JSON.parse(result);

      expect(parsed.transactionHash).toBe('json-test');
      expect(parsed.success).toBe(true);
    });
  });
});


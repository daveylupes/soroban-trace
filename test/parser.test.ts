/**
 * Parser tests for soroban-trace
 * 
 * Run with: npm test
 */

import { SorobanParser } from '../src/parser';
import { TransactionTrace } from '../src/types';

describe('SorobanParser', () => {
  let parser: SorobanParser;

  beforeEach(() => {
    parser = new SorobanParser();
  });

  describe('parseTransaction', () => {
    it('should parse a valid transaction', () => {
      const mockTxData = {
        hash: 'test-hash-123',
        successful: true,
        ledger: 12345,
        created_at: '2025-10-07T00:00:00Z',
      };

      const trace = parser.parseTransaction(mockTxData);

      expect(trace.transactionHash).toBe('test-hash-123');
      expect(trace.success).toBe(true);
      expect(trace.ledger).toBe(12345);
    });

    it('should handle failed transactions', () => {
      const mockTxData = {
        hash: 'failed-hash-456',
        successful: false,
        ledger: 12346,
      };

      const trace = parser.parseTransaction(mockTxData);

      expect(trace.transactionHash).toBe('failed-hash-456');
      expect(trace.success).toBe(false);
    });

    it('should extract operations from transaction result', () => {
      // TODO: Add test with mock XDR data
      expect(true).toBe(true);
    });

    it('should extract events from transaction meta', () => {
      // TODO: Add test with mock XDR data
      expect(true).toBe(true);
    });
  });

  describe('decodeScVal', () => {
    it('should decode simple ScVal types', () => {
      // TODO: Add tests for ScVal decoding
      expect(true).toBe(true);
    });
  });
});


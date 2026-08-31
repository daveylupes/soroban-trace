/**
 * Parser tests for soroban-trace
 *
 * Run with: npm test
 */

import * as fs from 'fs';
import * as path from 'path';
import { SorobanParser } from '../src/parser';

const fixture = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8'));

describe('SorobanParser', () => {
  let parser: SorobanParser;

  beforeEach(() => {
    parser = new SorobanParser();
  });

  describe('parseTransaction', () => {
    it('should parse a valid transaction', () => {
      const trace = parser.parseTransaction({
        hash: 'test-hash-123',
        successful: true,
        ledger: 12345,
        created_at: '2025-10-07T00:00:00Z',
      });

      expect(trace.transactionHash).toBe('test-hash-123');
      expect(trace.success).toBe(true);
      expect(trace.ledger).toBe(12345);
    });

    it('should handle failed transactions', () => {
      const trace = parser.parseTransaction({
        hash: 'failed-hash-456',
        successful: false,
        ledger: 12346,
      });

      expect(trace.transactionHash).toBe('failed-hash-456');
      expect(trace.success).toBe(false);
    });

    it('should not throw on unrecognized payloads', () => {
      const trace = parser.parseTransaction({ hash: 'x', foo: 'bar' });
      expect(trace.operations).toEqual([]);
      expect(trace.events).toEqual([]);
    });

    it('should extract operations from the envelope XDR', () => {
      const trace = parser.parseTransaction(fixture('invoke-transfer.json'));
      expect(trace.operations).toHaveLength(1);
      expect(trace.operations[0].functionName).toBe('transfer');
      expect(trace.operations[0].contractId).toMatch(/^C[A-Z2-7]{55}$/);
    });

    it('should extract events from the transaction meta XDR', () => {
      const trace = parser.parseTransaction(fixture('invoke-transfer.json'));
      expect(trace.events).toHaveLength(1);
      expect(trace.events[0].topics[0]).toBe('transfer');
    });

    it('should accept the snake_case (Horizon) XDR field names', () => {
      const camel = fixture('invoke-transfer.json');
      const snake = {
        hash: camel.hash,
        envelope_xdr: camel.envelopeXdr,
        result_xdr: camel.resultXdr,
        result_meta_xdr: camel.resultMetaXdr,
      };
      const trace = parser.parseTransaction(snake);
      expect(trace.operations[0].functionName).toBe('transfer');
      expect(trace.gas?.cpuInstructions).toBe(3214876);
    });
  });

  describe('decodeScVal (via decoded parameters)', () => {
    it('decodes address and i128 ScVals to native values', () => {
      const trace = parser.parseTransaction(fixture('invoke-transfer.json'));
      const [from, to, amount] = trace.operations[0].parameters;
      expect(from).toMatch(/^G[A-Z2-7]{55}$/);
      expect(to).toMatch(/^G[A-Z2-7]{55}$/);
      expect(amount.toString()).toBe('2500000');
    });
  });
});

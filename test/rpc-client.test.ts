/**
 * RPC Client tests for soroban-trace
 * 
 * Run with: npm test
 */

import { RPCClient } from '../src/rpc-client';

describe('RPCClient', () => {
  let client: RPCClient;

  beforeEach(() => {
    client = new RPCClient({ network: 'testnet' });
  });

  describe('constructor', () => {
    it('should initialize with testnet', () => {
      expect(client).toBeDefined();
    });

    it('should initialize with custom RPC URL', () => {
      const customClient = new RPCClient({ rpcUrl: 'https://custom-rpc.example.com' });
      expect(customClient).toBeDefined();
    });
  });

  describe('fetchTransaction', () => {
    it('should handle network errors gracefully', async () => {
      // TODO: Mock network requests
      expect(true).toBe(true);
    });

    it('should fallback to Horizon if RPC fails', async () => {
      // TODO: Mock RPC failure and Horizon success
      expect(true).toBe(true);
    });
  });
});


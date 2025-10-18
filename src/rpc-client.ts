/**
 * RPC client for fetching Soroban transaction data
 */

import axios from 'axios';
import { ParseOptions } from './types';

export class RPCClient {
  private rpcUrl: string;

  constructor(options: ParseOptions = {}) {
    this.rpcUrl = this.getRPCUrl(options);
  }

  private getRPCUrl(options: ParseOptions): string {
    if (options.rpcUrl) {
      return options.rpcUrl;
    }

    switch (options.network) {
      case 'mainnet':
        return 'https://mainnet.sorobanrpc.com';
      case 'testnet':
        return 'https://soroban-testnet.stellar.org';
      case 'futurenet':
        return 'https://rpc-futurenet.stellar.org';
      default:
        return 'https://soroban-testnet.stellar.org';
    }
  }

  /**
   * Fetch transaction by hash from Soroban RPC
   */
  async getTransaction(txHash: string): Promise<any> {
    try {
      const response = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: {
          hash: txHash,
        },
      });

      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch transaction from Horizon (fallback)
   */
  async getTransactionFromHorizon(txHash: string, horizonUrl?: string): Promise<any> {
    const url = horizonUrl || this.getHorizonUrl();
    
    try {
      const response = await axios.get(`${url}/transactions/${txHash}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Transaction not found: ${txHash}`);
        }
        throw new Error(`Horizon error: ${error.message}`);
      }
      throw error;
    }
  }

  private getHorizonUrl(): string {
    // Default to testnet Horizon
    return 'https://horizon-testnet.stellar.org';
  }

  /**
   * Try to fetch from RPC first, fallback to Horizon
   */
  async fetchTransaction(txHash: string): Promise<any> {
    try {
      // Try RPC first
      const rpcResult = await this.getTransaction(txHash);
      return rpcResult;
    } catch (rpcError) {
      console.warn('RPC fetch failed, trying Horizon...', rpcError);
      
      try {
        // Fallback to Horizon
        const horizonResult = await this.getTransactionFromHorizon(txHash);
        return horizonResult;
      } catch (horizonError) {
        throw new Error(
          `Failed to fetch transaction from both RPC and Horizon.\n` +
          `RPC: ${rpcError}\n` +
          `Horizon: ${horizonError}`
        );
      }
    }
  }
}


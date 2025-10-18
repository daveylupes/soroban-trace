/**
 * Type definitions for Soroban transaction tracing
 */

export interface TraceEvent {
  type: 'event';
  contractId?: string;
  topics: string[];
  data: any;
}

export interface TraceCall {
  type: 'call';
  contractId: string;
  functionName: string;
  parameters: any[];
  returnValue?: any;
  events: TraceEvent[];
  storageWrites: StorageWrite[];
  storageReads: StorageRead[];
  nestedCalls: TraceCall[];
  error?: string;
}

export interface StorageWrite {
  key: string;
  value: any;
  keyDecoded?: string;
  valueDecoded?: string;
}

export interface StorageRead {
  key: string;
  keyDecoded?: string;
}

export interface TransactionTrace {
  transactionHash: string;
  success: boolean;
  ledger?: number;
  createdAt?: string;
  operations: TraceCall[];
  events: TraceEvent[];
  errorMessage?: string;
}

export interface ParseOptions {
  network?: 'testnet' | 'futurenet' | 'mainnet' | 'custom';
  rpcUrl?: string;
  decodeWasm?: boolean;
}

export interface FormatOptions {
  json?: boolean;
  verbose?: boolean;
  colors?: boolean;
}


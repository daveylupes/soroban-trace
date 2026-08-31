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
  type: 'call' | 'create' | 'upload';
  contractId: string;
  functionName: string;
  parameters: any[];
  returnValue?: any;
  events: TraceEvent[];
  storageWrites: StorageWrite[];
  storageReads: StorageRead[];
  nestedCalls: TraceCall[];
  error?: string;
  /** Set on 'create'/'upload' operations: the WASM hash the contract runs. */
  wasmHash?: string;
}

/**
 * Soroban resource usage and fee breakdown for a transaction.
 * Instruction counts and footprint come from the envelope's sorobanData;
 * the charged-fee fields come from the transaction meta (ext v1).
 * All fee amounts are stroops (1 XLM = 10,000,000 stroops), kept as
 * strings because they can exceed Number.MAX_SAFE_INTEGER.
 */
export interface GasAnalytics {
  cpuInstructions?: number;
  diskReadBytes?: number;
  writeBytes?: number;
  readonlyFootprintEntries?: number;
  readwriteFootprintEntries?: number;
  /** Max resource fee the submitter authorized (envelope sorobanData). */
  declaredResourceFeeStroops?: string;
  nonRefundableFeeStroops?: string;
  refundableFeeStroops?: string;
  rentFeeStroops?: string;
  totalResourceFeeStroops?: string;
  /** feeCharged - totalResourceFee, i.e. the inclusion (bid) fee. */
  inclusionFeeStroops?: string;
  totalFeeChargedStroops?: string;
}

export interface WasmFunctionSpec {
  name: string;
  inputs: { name: string; type: string }[];
  outputs: string[];
  doc?: string;
}

/**
 * Contract interface + build metadata extracted from a WASM module's
 * custom sections (contractspecv0 / contractmetav0 / contractenvmetav0).
 * Only populated when the traced transaction itself uploads WASM.
 */
export interface WasmMetadata {
  wasmHash?: string;
  wasmSize: number;
  functions: WasmFunctionSpec[];
  /** contractmetav0 key/value pairs, e.g. rsver, rssdkver. */
  meta: Record<string, string>;
  envInterfaceVersion?: string;
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
  gas?: GasAnalytics;
  wasmMetadata?: WasmMetadata;
  /**
   * Internal: raw WASM bytes captured from an uploadContractWasm host
   * function, awaiting async metadata extraction. Deleted before output.
   */
  _pendingWasm?: Buffer;
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


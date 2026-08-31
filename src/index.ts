/**
 * Main entry point for soroban-trace library
 */

export { SorobanParser } from './parser';
export { TraceFormatter } from './formatter';
export { RPCClient } from './rpc-client';
export { extractWasmMetadata } from './wasm-metadata';
export * from './types';

import { SorobanParser } from './parser';
import { TraceFormatter } from './formatter';
import { RPCClient } from './rpc-client';
import { extractWasmMetadata } from './wasm-metadata';
import { ParseOptions, FormatOptions, TransactionTrace } from './types';
import * as fs from 'fs';

/**
 * High-level API for tracing transactions
 */
export class SorobanTrace {
  private parser: SorobanParser;
  private rpcClient: RPCClient;

  constructor(options: ParseOptions = {}) {
    this.parser = new SorobanParser();
    this.rpcClient = new RPCClient(options);
  }

  /**
   * Trace a transaction by hash
   */
  async traceTransaction(txHash: string, formatOptions?: FormatOptions): Promise<string> {
    // Fetch transaction data
    const txData = await this.rpcClient.fetchTransaction(txHash);

    // Parse the transaction
    const trace = this.parser.parseTransaction(txData);
    await this.enrichWasmMetadata(trace);

    // Format the output
    const formatter = new TraceFormatter(formatOptions);
    return formatter.format(trace);
  }

  /**
   * Trace a transaction from a JSON file
   */
  async traceFromFile(filePath: string, formatOptions?: FormatOptions): Promise<string> {
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const txData = JSON.parse(fileContent);

    // Parse the transaction
    const trace = this.parser.parseTransaction(txData);
    await this.enrichWasmMetadata(trace);

    // Format the output
    const formatter = new TraceFormatter(formatOptions);
    return formatter.format(trace);
  }

  /**
   * Trace from raw transaction data
   */
  async traceFromData(txData: any, formatOptions?: FormatOptions): Promise<string> {
    // Parse the transaction
    const trace = this.parser.parseTransaction(txData);
    await this.enrichWasmMetadata(trace);

    // Format the output
    const formatter = new TraceFormatter(formatOptions);
    return formatter.format(trace);
  }

  /**
   * If the transaction uploaded WASM, decode its embedded spec/metadata.
   * Kept out of the (synchronous) parser because WebAssembly.compile is async.
   */
  private async enrichWasmMetadata(trace: TransactionTrace): Promise<void> {
    if (trace._pendingWasm) {
      try {
        trace.wasmMetadata = await extractWasmMetadata(trace._pendingWasm);
      } catch (error) {
        console.error('Error extracting WASM metadata:', error);
      }
      delete trace._pendingWasm;
    }
  }
}


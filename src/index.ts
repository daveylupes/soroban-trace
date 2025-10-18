/**
 * Main entry point for soroban-trace library
 */

export { SorobanParser } from './parser';
export { TraceFormatter } from './formatter';
export { RPCClient } from './rpc-client';
export * from './types';

import { SorobanParser } from './parser';
import { TraceFormatter } from './formatter';
import { RPCClient } from './rpc-client';
import { ParseOptions, FormatOptions } from './types';
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
    
    // Format the output
    const formatter = new TraceFormatter(formatOptions);
    return formatter.format(trace);
  }

  /**
   * Trace a transaction from a JSON file
   */
  traceFromFile(filePath: string, formatOptions?: FormatOptions): string {
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const txData = JSON.parse(fileContent);
    
    // Parse the transaction
    const trace = this.parser.parseTransaction(txData);
    
    // Format the output
    const formatter = new TraceFormatter(formatOptions);
    return formatter.format(trace);
  }

  /**
   * Trace from raw transaction data
   */
  traceFromData(txData: any, formatOptions?: FormatOptions): string {
    // Parse the transaction
    const trace = this.parser.parseTransaction(txData);
    
    // Format the output
    const formatter = new TraceFormatter(formatOptions);
    return formatter.format(trace);
  }
}


/**
 * Formatter for displaying transaction traces
 */

import chalk from 'chalk';
import {
  TransactionTrace,
  TraceCall,
  TraceEvent,
  FormatOptions,
  GasAnalytics,
  WasmMetadata,
} from './types';

const STROOPS_PER_XLM = 10_000_000;

function stroopsToXlm(stroops?: string): string {
  if (!stroops) return '-';
  try {
    const value = BigInt(stroops);
    const whole = value / BigInt(STROOPS_PER_XLM);
    const frac = (value % BigInt(STROOPS_PER_XLM)).toString().padStart(7, '0');
    return `${whole}.${frac} XLM`;
  } catch {
    return stroops;
  }
}

export class TraceFormatter {
  private options: FormatOptions;

  constructor(options: FormatOptions = {}) {
    this.options = {
      colors: true,
      verbose: false,
      ...options,
    };
  }

  /**
   * Format a transaction trace for display
   */
  format(trace: TransactionTrace): string {
    if (this.options.json) {
      // scValToNative yields BigInt for i128/u64/etc., which JSON.stringify
      // cannot serialize - render those as decimal strings.
      const { _pendingWasm, ...clean } = trace;
      void _pendingWasm;
      return JSON.stringify(
        clean,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
    }

    return this.formatCLI(trace);
  }

  private formatCLI(trace: TransactionTrace): string {
    const lines: string[] = [];
    const c = this.options.colors ? chalk : this.noColors();

    // Header
    lines.push(c.bold('┌' + '─'.repeat(70) + '┐'));
    lines.push(c.bold(`│ Transaction: ${c.cyan(trace.transactionHash.slice(0, 50))}${trace.transactionHash.length > 50 ? '...' : ''}`.padEnd(71) + '│'));
    
    if (trace.ledger) {
      lines.push(c.bold(`│ Ledger: ${c.yellow(trace.ledger.toString())}`.padEnd(71) + '│'));
    }
    
    if (trace.createdAt) {
      lines.push(c.bold(`│ Time: ${c.gray(trace.createdAt)}`.padEnd(71) + '│'));
    }

    lines.push(c.bold(`│ Status: ${trace.success ? c.green('SUCCESS') : c.red('FAILED')}`.padEnd(71) + '│'));
    lines.push(c.bold('├' + '─'.repeat(70) + '┤'));

    // Error message if present
    if (trace.errorMessage) {
      lines.push(c.bold(`│ ${c.red('ERROR:')} ${trace.errorMessage}`.padEnd(71) + '│'));
      lines.push(c.bold('├' + '─'.repeat(70) + '┤'));
    }

    // Operations
    if (trace.operations.length > 0) {
      lines.push(c.bold(`│ ${c.magenta('OPERATIONS:')}`.padEnd(71) + '│'));
      trace.operations.forEach((op, index) => {
        lines.push(...this.formatOperation(op, index, 1, c));
      });
    }

    // Top-level events
    if (trace.events.length > 0) {
      lines.push(c.bold('├' + '─'.repeat(70) + '┤'));
      lines.push(c.bold(`│ ${c.magenta('EVENTS:')}`.padEnd(71) + '│'));
      trace.events.forEach((event, index) => {
        lines.push(...this.formatEvent(event, index, 1, c));
      });
    }

    // Resource usage / fees
    if (trace.gas) {
      lines.push(c.bold('├' + '─'.repeat(70) + '┤'));
      lines.push(...this.formatGas(trace.gas, c));
    }

    // Uploaded contract WASM spec + build metadata
    if (trace.wasmMetadata) {
      lines.push(c.bold('├' + '─'.repeat(70) + '┤'));
      lines.push(...this.formatWasmMetadata(trace.wasmMetadata, c));
    }

    // Footer
    lines.push(c.bold('└' + '─'.repeat(70) + '┘'));

    return lines.join('\n');
  }

  private formatOperation(
    op: TraceCall, 
    index: number, 
    depth: number, 
    c: any
  ): string[] {
    const lines: string[] = [];
    const indent = '  '.repeat(depth);
    const prefix = '│ ' + indent;

    // Function call
    const params = this.formatParameters(op.parameters);
    const label =
      op.type === 'create' ? 'CREATE:' : op.type === 'upload' ? 'UPLOAD:' : 'CALL:';
    lines.push(`${prefix}${c.bold(`${index + 1}.`)} ${c.cyan(label)} ${c.yellow(op.functionName)}${params}`.padEnd(71) + '│');

    if (op.contractId && op.contractId !== `operation_${index}` &&
        (this.options.verbose || op.type === 'call')) {
      lines.push(`${prefix}   ${c.gray('Contract:')} ${op.contractId}`.padEnd(71) + '│');
    }

    if (op.wasmHash) {
      lines.push(`${prefix}   ${c.gray('WASM hash:')} ${op.wasmHash}`.padEnd(71) + '│');
    }

    // Events
    op.events.forEach((event, i) => {
      lines.push(...this.formatEvent(event, i, depth + 1, c));
    });

    // Storage writes
    op.storageWrites.forEach((write) => {
      const key = write.keyDecoded || this.truncate(String(write.key), 20);
      const value = write.valueDecoded || this.truncate(String(write.value), 30);
      lines.push(`${prefix}   ${c.green('WRITE:')} ${key} = ${value}`.padEnd(71) + '│');
    });

    // Storage reads (verbose only)
    if (this.options.verbose) {
      op.storageReads.forEach((read) => {
        const key = read.keyDecoded || this.truncate(String(read.key), 20);
        lines.push(`${prefix}   ${c.blue('READ:')} ${key}`.padEnd(71) + '│');
      });
    }

    // Nested calls
    op.nestedCalls.forEach((nested, i) => {
      lines.push(...this.formatOperation(nested, i, depth + 1, c));
    });

    // Return value
    if (op.returnValue !== undefined) {
      const returnStr = this.formatValue(op.returnValue);
      lines.push(`${prefix}   ${c.green('→')} ${returnStr}`.padEnd(71) + '│');
    }

    // Error
    if (op.error) {
      lines.push(`${prefix}   ${c.red('ERROR:')} ${op.error}`.padEnd(71) + '│');
    }

    return lines;
  }

  private formatEvent(
    event: TraceEvent, 
    index: number, 
    depth: number, 
    c: any
  ): string[] {
    const lines: string[] = [];
    const indent = '  '.repeat(depth);
    const prefix = '│ ' + indent;

    // Event header
    const eventName = event.topics[0] || 'Event';
    lines.push(`${prefix}${c.bold('◆')} ${c.magenta('EVENT:')} ${eventName}`.padEnd(71) + '│');

    // Contract ID (verbose)
    if (this.options.verbose && event.contractId) {
      lines.push(`${prefix}  ${c.gray('Contract:')} ${event.contractId}`.padEnd(71) + '│');
    }

    // Topics (verbose)
    if (this.options.verbose && event.topics.length > 1) {
      event.topics.slice(1).forEach((topic, i) => {
        lines.push(`${prefix}  ${c.gray(`Topic ${i}:`)} ${this.formatValue(topic)}`.padEnd(71) + '│');
      });
    }

    // Data
    if (event.data) {
      const dataStr = this.formatValue(event.data);
      lines.push(`${prefix}  ${c.gray('Data:')} ${dataStr}`.padEnd(71) + '│');
    }

    return lines;
  }

  private formatGas(gas: GasAnalytics, c: any): string[] {
    const lines: string[] = [];
    const row = (label: string, value: string | number | undefined) => {
      if (value === undefined || value === null || value === '') return;
      lines.push(`│   ${c.gray(label.padEnd(22))} ${value}`.padEnd(71) + '│');
    };

    lines.push(c.bold(`│ ${c.magenta('RESOURCE USAGE:')}`.padEnd(71) + '│'));
    row('CPU instructions', gas.cpuInstructions?.toLocaleString());
    row('Disk read bytes', gas.diskReadBytes?.toLocaleString());
    row('Write bytes', gas.writeBytes?.toLocaleString());
    row(
      'Footprint entries',
      gas.readonlyFootprintEntries !== undefined ||
        gas.readwriteFootprintEntries !== undefined
        ? `${gas.readonlyFootprintEntries ?? 0} read-only, ${gas.readwriteFootprintEntries ?? 0} read-write`
        : undefined
    );

    const fee = (stroops?: string) =>
      stroops === undefined ? undefined : stroopsToXlm(stroops);
    row('Resource fee', fee(gas.totalResourceFeeStroops));
    if (this.options.verbose) {
      row('  non-refundable', fee(gas.nonRefundableFeeStroops));
      row('  refundable', fee(gas.refundableFeeStroops));
      row('  rent', fee(gas.rentFeeStroops));
      row('  declared max', fee(gas.declaredResourceFeeStroops));
    }
    row('Inclusion fee', fee(gas.inclusionFeeStroops));
    row('Total fee charged', fee(gas.totalFeeChargedStroops));

    return lines;
  }

  private formatWasmMetadata(meta: WasmMetadata, c: any): string[] {
    const lines: string[] = [];
    lines.push(c.bold(`│ ${c.magenta('CONTRACT WASM:')}`.padEnd(71) + '│'));
    lines.push(`│   ${c.gray('Size:')} ${meta.wasmSize.toLocaleString()} bytes`.padEnd(71) + '│');
    if (meta.wasmHash) {
      lines.push(`│   ${c.gray('Hash:')} ${meta.wasmHash}`.padEnd(71) + '│');
    }
    if (meta.envInterfaceVersion) {
      lines.push(`│   ${c.gray('Host interface:')} ${meta.envInterfaceVersion}`.padEnd(71) + '│');
    }

    const metaKeys = Object.keys(meta.meta);
    if (metaKeys.length > 0) {
      lines.push(`│   ${c.gray('Build metadata:')}`.padEnd(71) + '│');
      metaKeys.forEach((key) => {
        lines.push(`│     ${key} = ${meta.meta[key]}`.padEnd(71) + '│');
      });
    }

    if (meta.functions.length > 0) {
      lines.push(`│   ${c.gray('Functions:')} (${meta.functions.length})`.padEnd(71) + '│');
      meta.functions.forEach((fn) => {
        const args = fn.inputs.map((i) => `${i.name}: ${i.type}`).join(', ');
        const ret = fn.outputs.length > 0 ? ` -> ${fn.outputs.join(', ')}` : '';
        lines.push(`│     ${c.yellow(fn.name)}(${args})${ret}`.padEnd(71) + '│');
      });
    }

    return lines;
  }

  private formatParameters(params: any[]): string {
    if (!params || params.length === 0) return '()';
    
    const formatted = params.map(p => this.formatValue(p)).join(', ');
    return `(${this.truncate(formatted, 40)})`;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return 'null';
    
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    
    if (Array.isArray(value)) {
      return '[' + value.map(v => this.formatValue(v)).join(', ') + ']';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  }

  private noColors() {
    // Return a no-op chalk-like object
    const identity = (str: string) => str;
    return new Proxy({} as any, {
      get: () => identity,
    });
  }
}


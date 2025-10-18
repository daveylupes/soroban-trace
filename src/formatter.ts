/**
 * Formatter for displaying transaction traces
 */

import chalk from 'chalk';
import { TransactionTrace, TraceCall, TraceEvent, FormatOptions } from './types';

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
      return JSON.stringify(trace, null, 2);
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
    lines.push(`${prefix}${c.bold(`${index + 1}.`)} ${c.cyan('CALL:')} ${c.yellow(op.functionName)}${params}`.padEnd(71) + '│');
    
    if (this.options.verbose && op.contractId) {
      lines.push(`${prefix}   ${c.gray('Contract:')} ${op.contractId}`.padEnd(71) + '│');
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


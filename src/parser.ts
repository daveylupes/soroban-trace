/**
 * Parser for Soroban transaction data
 */

import { 
  xdr, 
  scValToNative, 
  Address 
} from '@stellar/stellar-sdk';
import { 
  TransactionTrace, 
  TraceCall, 
  TraceEvent, 
  StorageWrite, 
  StorageRead 
} from './types';

export class SorobanParser {
  /**
   * Parse a transaction result from Horizon or RPC
   */
  parseTransaction(txData: any): TransactionTrace {
    const trace: TransactionTrace = {
      transactionHash: txData.hash || txData.id || txData.txHash || 'unknown',
      success: this.isSuccessful(txData),
      operations: [],
      events: [],
    };

    // Extract ledger and timestamp if available
    if (txData.ledger) {
      trace.ledger = txData.ledger;
    }
    if (txData.created_at || txData.createdAt) {
      trace.createdAt = txData.created_at || txData.createdAt;
    }

    try {
      // Parse from Horizon format
      if (txData.result_xdr || txData.result) {
        this.parseFromHorizon(txData, trace);
      }
      // Parse from RPC format (check for envelope XDR as well)
      else if (txData.resultXdr || txData.resultMetaXdr || txData.envelopeXdr) {
        this.parseFromRPC(txData, trace);
      }
      // New RPC format with direct events
      else if (txData.events !== undefined) {
        if (Array.isArray(txData.events) && txData.events.length > 0) {
          console.log(`Found ${txData.events.length} events`);
          this.parseDirectRPCFormat(txData, trace);
        } else {
          // Events is present but empty or not an array
          console.log('Note: This transaction has no Soroban events (it may not be a contract invocation)');
        }
      }
      // Direct XDR provided
      else if (txData.xdr) {
        this.parseXDR(txData.xdr, trace);
      } else {
        // Log what we received to help debug
        console.log('Transaction data keys:', Object.keys(txData));
        console.log('Unable to parse transaction data - no recognized format found');
      }
    } catch (error) {
      trace.success = false;
      trace.errorMessage = error instanceof Error ? error.message : String(error);
    }

    return trace;
  }

  private isSuccessful(txData: any): boolean {
    if (typeof txData.successful === 'boolean') return txData.successful;
    if (txData.status === 'SUCCESS') return true;
    if (txData.status === 'FAILED') return false;
    return true; // default optimistic
  }

  private parseFromHorizon(txData: any, trace: TransactionTrace): void {
    // Parse result XDR
    const resultXdr = txData.result_xdr || txData.result;
    if (resultXdr) {
      try {
        const txResult = xdr.TransactionResult.fromXDR(resultXdr, 'base64');
        
        // Extract operation results
        if (txResult.result()?.results()) {
          const opResults = txResult.result().results();
          opResults.forEach((opResult: any, index: number) => {
            const call = this.parseOperationResult(opResult, index);
            if (call) {
              trace.operations.push(call);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing result XDR:', error);
      }
    }

    // Parse meta XDR for events and storage changes
    const metaXdr = txData.result_meta_xdr || txData.resultMetaXdr;
    if (metaXdr) {
      try {
        const txMeta = xdr.TransactionMeta.fromXDR(metaXdr, 'base64');
        this.parseTransactionMeta(txMeta, trace);
      } catch (error) {
        console.error('Error parsing meta XDR:', error);
      }
    }
  }

  private parseFromRPC(txData: any, trace: TransactionTrace): void {
    // Similar to Horizon but with RPC-specific structure
    const resultXdr = txData.resultXdr;
    const metaXdr = txData.resultMetaXdr;

    if (resultXdr) {
      try {
        const txResult = xdr.TransactionResult.fromXDR(resultXdr, 'base64');
        if (txResult.result()?.results()) {
          const opResults = txResult.result().results();
          opResults.forEach((opResult: any, index: number) => {
            const call = this.parseOperationResult(opResult, index);
            if (call) {
              trace.operations.push(call);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing result XDR:', error);
        trace.errorMessage = `Failed to parse transaction result: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    if (metaXdr) {
      try {
        const txMeta = xdr.TransactionMeta.fromXDR(metaXdr, 'base64');
        this.parseTransactionMeta(txMeta, trace);
      } catch (error) {
        console.error('Error parsing meta XDR:', error);
        // Don't set error message here - partial parsing is okay
        // We might have already extracted some useful info
      }
    }
  }

  private parseXDR(xdrString: string, trace: TransactionTrace): void {
    // Generic XDR parsing
    try {
      const txResult = xdr.TransactionResult.fromXDR(xdrString, 'base64');
      if (txResult.result()?.results()) {
        const opResults = txResult.result().results();
        opResults.forEach((opResult: any, index: number) => {
          const call = this.parseOperationResult(opResult, index);
          if (call) {
            trace.operations.push(call);
          }
        });
      }
    } catch (error) {
      trace.errorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  private parseOperationResult(opResult: any, index: number): TraceCall | null {
    try {
      // Check if this is an InvokeHostFunction operation
      if (opResult.tr && opResult.tr().switch()?.name === 'invokeHostFunction') {
        const invokeResult = opResult.tr().invokeHostFunctionResult();
        
        const call: TraceCall = {
          type: 'call',
          contractId: `operation_${index}`,
          functionName: 'invoke',
          parameters: [],
          events: [],
          storageWrites: [],
          storageReads: [],
          nestedCalls: [],
        };

        // Parse return value
        if (invokeResult && invokeResult.switch()?.name === 'success') {
          const returnValue = invokeResult.success();
          call.returnValue = this.decodeScVal(returnValue);
        } else {
          call.error = 'Operation failed';
        }

        return call;
      }
    } catch (error) {
      console.error('Error parsing operation result:', error);
    }
    
    return null;
  }

  private parseTransactionMeta(txMeta: any, trace: TransactionTrace): void {
    try {
      const metaVersion = txMeta.switch();
      
      // Handle different meta versions
      // v4 is the latest (Protocol 22+)
      // v3 is Soroban-enabled
      if (metaVersion === 4) {
        // v4 - Latest version (Protocol 22+)
        const v4Meta = txMeta.v4();
        
        // Parse Soroban-specific metadata
        const sorobanMeta = v4Meta?.sorobanMeta?.();
        if (sorobanMeta) {
          // Parse events
          const events = sorobanMeta.events?.() || [];
          this.parseEvents(events, trace);
          
          // Parse return value if present
          const returnValue = sorobanMeta.returnValue?.();
          if (returnValue && trace.operations.length > 0) {
            trace.operations[0].returnValue = this.decodeScVal(returnValue);
          }
          
          // Parse diagnostic events if present
          const diagnosticEvents = sorobanMeta.diagnosticEvents?.() || [];
          if (diagnosticEvents.length > 0) {
            this.parseEvents(diagnosticEvents, trace);
          }
        }
        
        // Parse operations metadata if available
        // Note: v4 structure might be different
        try {
          const txProcessing = v4Meta?.txProcessing?.() || [];
          txProcessing.forEach((processing: any) => {
            // Extract operation-level details if available
            const opMeta = processing.opMeta?.();
            if (opMeta) {
              this.parseOperationMeta(opMeta, trace);
            }
          });
        } catch (e) {
          // v4 structure is still being finalized
          console.debug('Could not parse v4 operations metadata');
        }
      } else if (metaVersion === 3) {
        // v3 - Soroban-enabled version
        const v3Meta = txMeta.v3();
        
        // Parse Soroban-specific metadata
        const sorobanMeta = v3Meta?.sorobanMeta?.();
        if (sorobanMeta) {
          // Parse events
          const events = sorobanMeta.events?.() || [];
          this.parseEvents(events, trace);
          
          // Parse return value if present
          const returnValue = sorobanMeta.returnValue?.();
          if (returnValue && trace.operations.length > 0) {
            trace.operations[0].returnValue = this.decodeScVal(returnValue);
          }
        }
        
        // Parse operations metadata
        const operations = v3Meta?.operations?.() || [];
        operations.forEach((op: any) => {
          this.parseOperationMeta(op, trace);
        });
      } else if (metaVersion === 2) {
        // v2 - older format
        const operations = txMeta.v2()?.operations() || [];
        operations.forEach((op: any) => {
          this.parseOperationMeta(op, trace);
        });
      } else if (metaVersion === 1) {
        // v1 - oldest format
        const operations = txMeta.v1()?.operations() || [];
        operations.forEach((op: any) => {
          this.parseOperationMeta(op, trace);
        });
      } else {
        // Unknown version
        console.warn(`Unknown TransactionMeta version: ${metaVersion}`);
      }
    } catch (error) {
      console.error('Error parsing transaction meta:', error);
      // Don't fail completely - we might have partial data
    }
  }

  private parseEvents(events: any[], trace: TransactionTrace): void {
    events.forEach((event: any) => {
      try {
        const contractEvent: TraceEvent = {
          type: 'event',
          topics: [],
          data: null,
        };

        // Extract contract ID if present
        if (event.contractId) {
          contractEvent.contractId = event.contractId().toString('hex');
        }

        // Parse topics
        if (event.topics) {
          const topics = event.topics();
          contractEvent.topics = topics.map((topic: any) => this.decodeScVal(topic));
        }

        // Parse body/data
        if (event.body) {
          const body = event.body();
          if (body.switch()?.name === 'v0') {
            contractEvent.data = this.decodeScVal(body.v0()?.data());
          }
        } else if (event.data) {
          contractEvent.data = this.decodeScVal(event.data());
        }

        trace.events.push(contractEvent);
      } catch (error) {
        console.error('Error parsing event:', error);
      }
    });
  }

  private parseOperationMeta(opMeta: any, trace: TransactionTrace): void {
    try {
      const changes = opMeta.changes?.() || [];
      
      changes.forEach((change: any) => {
        // Parse storage changes, events, etc.
        if (change.switch()?.name === 'ledgerEntryState') {
          // Handle storage reads/writes
        }
      });
    } catch (error) {
      console.error('Error parsing operation meta:', error);
    }
  }

  private parseDirectRPCFormat(txData: any, trace: TransactionTrace): void {
    try {
      // This is the newer RPC format where events are directly in the response
      const events = txData.events || [];
      
      events.forEach((eventStr: string) => {
        try {
          // Events are base64-encoded ContractEvent XDR
          const contractEventXdr = xdr.ContractEvent.fromXDR(eventStr, 'base64');
          
          const contractEvent: TraceEvent = {
            type: 'event',
            topics: [],
            data: null,
          };

          // Extract contract ID if present
          try {
            const contractId = (contractEventXdr as any).contractId();
            if (contractId) {
              contractEvent.contractId = contractId.toString('hex');
            }
          } catch (e) {
            // Contract ID might not be present
          }

          // Parse event body
          const body = (contractEventXdr as any).body();
          if (body && body.v0) {
            const v0 = body.v0();
            
            // Parse topics
            const topics = v0.topics() || [];
            contractEvent.topics = topics.map((topic: any) => this.decodeScVal(topic));
            
            // Parse data
            const data = v0.data();
            if (data) {
              contractEvent.data = this.decodeScVal(data);
            }
          }

          trace.events.push(contractEvent);
        } catch (eventError) {
          console.error('Error parsing individual event:', eventError);
        }
      });

      // Create a generic operation to show that the contract was invoked
      if (events.length > 0) {
        const call: TraceCall = {
          type: 'call',
          contractId: 'contract_invocation',
          functionName: 'invoke',
          parameters: [],
          events: [],
          storageWrites: [],
          storageReads: [],
          nestedCalls: [],
          returnValue: 'success',
        };
        
        trace.operations.push(call);
      }
    } catch (error) {
      console.error('Error parsing direct RPC format:', error);
    }
  }

  private decodeScVal(scVal: any): any {
    if (!scVal) return null;
    
    try {
      // Use Stellar SDK's native conversion
      return scValToNative(scVal);
    } catch (error) {
      // Fallback: return string representation
      try {
        return scVal.toString();
      } catch {
        return '<unable to decode>';
      }
    }
  }

  /**
   * Decode a contract address from bytes
   */
  private decodeAddress(bytes: Buffer): string {
    try {
      return Address.fromScAddress(
        xdr.ScAddress.fromXDR(bytes)
      ).toString();
    } catch {
      return bytes.toString('hex');
    }
  }
}


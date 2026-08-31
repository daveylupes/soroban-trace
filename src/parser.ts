/**
 * Parser for Soroban transaction data
 */

import {
  xdr,
  scValToNative,
  Address,
  StrKey
} from '@stellar/stellar-sdk';
import {
  TransactionTrace,
  TraceCall,
  TraceEvent,
  GasAnalytics
} from './types';

/** Coerce an XDR Int64/Uint64/number-ish value to a decimal string. */
function bigIntString(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  try {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'number') return Math.trunc(value).toString();
    // xdr Hyper/UnsignedHyper and similar expose toBigInt()/toString()
    if (typeof value.toBigInt === 'function') return value.toBigInt().toString();
    if (typeof value.toString === 'function') return value.toString();
  } catch {
    /* fall through */
  }
  return undefined;
}

/** Coerce an XDR Uint32/number to a plain number. */
function toNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  try {
    if (typeof value.toBigInt === 'function') return Number(value.toBigInt());
    const n = Number(value.toString());
    return Number.isNaN(n) ? undefined : n;
  } catch {
    return undefined;
  }
}

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

    // Normalize the XDR fields across Horizon (snake_case) and RPC (camelCase).
    const envelopeXdr = txData.envelopeXdr || txData.envelope_xdr;
    const resultXdr = txData.resultXdr || txData.result_xdr || txData.result;
    const metaXdr = txData.resultMetaXdr || txData.result_meta_xdr;

    try {
      // 1. Envelope: real contract IDs, function names, decoded args, and the
      //    declared Soroban resources / resource-fee ceiling.
      if (envelopeXdr) {
        this.parseEnvelope(envelopeXdr, trace);
      }

      // 2. Result XDR: per-operation success/failure and the total fee charged.
      if (resultXdr) {
        this.parseResultXdr(resultXdr, trace);
      }

      // 3. Meta XDR: events, return values, and the charged resource-fee breakdown.
      if (metaXdr) {
        this.parseMetaXdr(metaXdr, trace);
      }

      // 4. Newer RPC shape: base64 ContractEvent XDR strings directly on the response.
      if (!metaXdr && Array.isArray(txData.events) && txData.events.length > 0) {
        console.log(`Found ${txData.events.length} events`);
        this.parseDirectRPCFormat(txData, trace);
      }

      // 5. A bare XDR blob with no known wrapper.
      if (!envelopeXdr && !resultXdr && !metaXdr && txData.xdr) {
        this.parseXDR(txData.xdr, trace);
      }

      // 6. Nothing recognized.
      if (
        !envelopeXdr &&
        !resultXdr &&
        !metaXdr &&
        !txData.xdr &&
        !Array.isArray(txData.events)
      ) {
        console.log('Transaction data keys:', Object.keys(txData));
        console.log('Unable to parse transaction data - no recognized format found');
      }

      this.finalizeGas(trace);
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

  /**
   * Decode the transaction envelope: real contract IDs, invoked function
   * names, decoded arguments, the nested-call tree (from auth entries), and
   * the declared Soroban resources / resource-fee ceiling.
   */
  private parseEnvelope(envelopeXdr: string, trace: TransactionTrace): void {
    let tx: any;
    try {
      const env = xdr.TransactionEnvelope.fromXDR(envelopeXdr, 'base64');
      switch (env.switch().name) {
        case 'envelopeTypeTxV0':
          tx = env.v0().tx();
          break;
        case 'envelopeTypeTx':
          tx = env.v1().tx();
          break;
        case 'envelopeTypeTxFeeBump':
          // Unwrap the fee-bump wrapper to the inner v1 transaction.
          tx = env.feeBump().tx().innerTx().v1().tx();
          break;
        default:
          return;
      }
    } catch (error) {
      console.error('Error parsing envelope XDR:', error);
      return;
    }

    const operations: any[] = tx.operations?.() || [];
    operations.forEach((op: any, index: number) => {
      try {
        const body = op.body();
        if (body.switch().name !== 'invokeHostFunction') return;

        const invokeOp = body.invokeHostFunctionOp();
        const call = this.parseHostFunction(invokeOp.hostFunction(), index, trace);
        if (!call) return;

        // Nested calls come from the authorized-invocation tree.
        const auth: any[] = invokeOp.auth?.() || [];
        auth.forEach((entry: any) => {
          const nested = this.parseAuthorizedInvocation(entry.rootInvocation());
          if (nested) call.nestedCalls.push(nested);
        });

        trace.operations[index] = call;
      } catch (error) {
        console.error('Error parsing envelope operation:', error);
      }
    });

    // Declared Soroban resources live in the transaction ext (sorobanData).
    try {
      const ext = tx.ext?.();
      if (ext && ext.switch() === 1) {
        const sorobanData = ext.sorobanData();
        const resources = sorobanData.resources();
        const footprint = resources.footprint();
        const gas: GasAnalytics = trace.gas || {};
        gas.cpuInstructions = toNumber(resources.instructions());
        gas.diskReadBytes = toNumber(resources.diskReadBytes());
        gas.writeBytes = toNumber(resources.writeBytes());
        gas.readonlyFootprintEntries = footprint.readOnly()?.length ?? 0;
        gas.readwriteFootprintEntries = footprint.readWrite()?.length ?? 0;
        gas.declaredResourceFeeStroops = bigIntString(sorobanData.resourceFee());
        trace.gas = gas;
      }
    } catch (error) {
      console.error('Error parsing Soroban transaction data:', error);
    }
  }

  private parseHostFunction(
    hf: any,
    index: number,
    trace: TransactionTrace
  ): TraceCall | null {
    const base: TraceCall = {
      type: 'call',
      contractId: `operation_${index}`,
      functionName: 'invoke',
      parameters: [],
      events: [],
      storageWrites: [],
      storageReads: [],
      nestedCalls: [],
    };

    switch (hf.switch().name) {
      case 'hostFunctionTypeInvokeContract': {
        const ic = hf.invokeContract();
        base.type = 'call';
        base.contractId = this.scAddressToString(ic.contractAddress());
        base.functionName = ic.functionName().toString();
        base.parameters = (ic.args() || []).map((a: any) => this.decodeScVal(a));
        return base;
      }
      case 'hostFunctionTypeCreateContract':
      case 'hostFunctionTypeCreateContractV2': {
        const args =
          hf.switch().name === 'hostFunctionTypeCreateContractV2'
            ? hf.createContractV2()
            : hf.createContract();
        base.type = 'create';
        base.functionName = 'create_contract';
        base.wasmHash = this.executableWasmHash(args.executable());
        if (typeof args.constructorArgs === 'function') {
          base.parameters = (args.constructorArgs() || []).map((a: any) =>
            this.decodeScVal(a)
          );
        }
        return base;
      }
      case 'hostFunctionTypeUploadContractWasm': {
        const wasm: Buffer = hf.wasm();
        base.type = 'upload';
        base.functionName = 'upload_wasm';
        trace._pendingWasm = wasm;
        return base;
      }
      default:
        return base;
    }
  }

  /** Recursively turn a SorobanAuthorizedInvocation into a TraceCall tree. */
  private parseAuthorizedInvocation(invocation: any): TraceCall | null {
    if (!invocation) return null;
    try {
      const fn = invocation.function();
      const call: TraceCall = {
        type: 'call',
        contractId: 'unknown',
        functionName: 'invoke',
        parameters: [],
        events: [],
        storageWrites: [],
        storageReads: [],
        nestedCalls: [],
      };

      switch (fn.switch().name) {
        case 'sorobanAuthorizedFunctionTypeContractFn': {
          const cf = fn.contractFn();
          call.contractId = this.scAddressToString(cf.contractAddress());
          call.functionName = cf.functionName().toString();
          call.parameters = (cf.args() || []).map((a: any) => this.decodeScVal(a));
          break;
        }
        case 'sorobanAuthorizedFunctionTypeCreateContractHostFn':
        case 'sorobanAuthorizedFunctionTypeCreateContractV2HostFn':
          call.type = 'create';
          call.functionName = 'create_contract';
          break;
      }

      const subs: any[] = invocation.subInvocations?.() || [];
      subs.forEach((sub: any) => {
        const child = this.parseAuthorizedInvocation(sub);
        if (child) call.nestedCalls.push(child);
      });

      return call;
    } catch (error) {
      console.error('Error parsing authorized invocation:', error);
      return null;
    }
  }

  private parseResultXdr(resultXdr: string, trace: TransactionTrace): void {
    try {
      const txResult = xdr.TransactionResult.fromXDR(resultXdr, 'base64');

      const feeCharged = bigIntString(txResult.feeCharged());
      if (feeCharged) {
        trace.gas = trace.gas || {};
        trace.gas.totalFeeChargedStroops = feeCharged;
      }

      const inner = txResult.result();
      if (inner?.switch()?.name && inner.switch().name.startsWith('txFailed')) {
        trace.success = false;
      }

      const opResults = inner?.results?.();
      if (Array.isArray(opResults)) {
        opResults.forEach((opResult: any, index: number) => {
          const parsed = this.parseOperationResult(opResult, index);
          if (!parsed) return;
          const existing = trace.operations[index];
          if (existing) {
            if (parsed.error) existing.error = parsed.error;
            if (parsed.returnValue !== undefined && existing.returnValue === undefined) {
              existing.returnValue = parsed.returnValue;
            }
          } else {
            trace.operations[index] = parsed;
          }
        });
      }
    } catch (error) {
      console.error('Error parsing result XDR:', error);
    }
  }

  private parseMetaXdr(metaXdr: string, trace: TransactionTrace): void {
    try {
      const txMeta = xdr.TransactionMeta.fromXDR(metaXdr, 'base64');
      this.parseTransactionMeta(txMeta, trace);
    } catch (error) {
      console.error('Error parsing meta XDR:', error);
      // Partial parsing is fine - we may already have useful data.
    }
  }

  /** Fill in derived gas fields once every source has been parsed. */
  private finalizeGas(trace: TransactionTrace): void {
    const gas = trace.gas;
    if (!gas) return;

    const nonRefundable = gas.nonRefundableFeeStroops
      ? BigInt(gas.nonRefundableFeeStroops)
      : undefined;
    const refundable = gas.refundableFeeStroops
      ? BigInt(gas.refundableFeeStroops)
      : undefined;
    if (nonRefundable !== undefined || refundable !== undefined) {
      gas.totalResourceFeeStroops = (
        (nonRefundable ?? 0n) + (refundable ?? 0n)
      ).toString();
    }

    if (gas.totalFeeChargedStroops && gas.totalResourceFeeStroops) {
      const inclusion =
        BigInt(gas.totalFeeChargedStroops) - BigInt(gas.totalResourceFeeStroops);
      gas.inclusionFeeStroops = inclusion.toString();
    }
  }

  private scAddressToString(scAddress: any): string {
    try {
      return Address.fromScAddress(scAddress).toString();
    } catch {
      try {
        return scAddress.toString();
      } catch {
        return 'unknown';
      }
    }
  }

  private executableWasmHash(executable: any): string | undefined {
    try {
      if (executable.switch().name === 'contractExecutableWasm') {
        return executable.wasmHash().toString('hex');
      }
    } catch {
      /* not a wasm executable */
    }
    return undefined;
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

        // The success arm is `invokeHostFunctionSuccess`, and its payload is a
        // SHA-256 hash of the return value, not the value itself - the decoded
        // return value comes from the transaction meta (sorobanMeta.returnValue).
        // Older code both checked for the wrong arm name (`success`) and tried
        // to ScVal-decode the hash.
        const armName = invokeResult?.switch()?.name;
        if (armName && armName !== 'invokeHostFunctionSuccess' && armName !== 'success') {
          call.error = `Operation failed: ${armName}`;
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

          this.parseSorobanMetaFees(sorobanMeta, trace);
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

          this.parseSorobanMetaFees(sorobanMeta, trace);
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

  /**
   * Extract the charged resource-fee breakdown from SorobanTransactionMeta
   * ext v1 (present on Protocol 20+ Soroban transactions).
   */
  private parseSorobanMetaFees(sorobanMeta: any, trace: TransactionTrace): void {
    try {
      const ext = sorobanMeta.ext?.();
      if (!ext || ext.switch() !== 1) return;
      const v1 = ext.v1();
      const gas: GasAnalytics = trace.gas || {};
      gas.nonRefundableFeeStroops = bigIntString(
        v1.totalNonRefundableResourceFeeCharged()
      );
      gas.refundableFeeStroops = bigIntString(
        v1.totalRefundableResourceFeeCharged()
      );
      gas.rentFeeStroops = bigIntString(v1.rentFeeCharged());
      trace.gas = gas;
    } catch (error) {
      console.error('Error parsing Soroban meta fees:', error);
    }
  }

  private parseEvents(events: any[], trace: TransactionTrace): void {
    events.forEach((raw: any) => {
      try {
        // DiagnosticEvent wraps a ContractEvent in an `event` field.
        const event =
          raw && typeof raw.event === 'function' && typeof raw.body !== 'function'
            ? raw.event()
            : raw;

        const contractEvent: TraceEvent = {
          type: 'event',
          topics: [],
          data: null,
        };

        // Contract ID (32-byte hash -> C... strkey).
        try {
          const cid = event.contractId?.();
          if (cid) {
            contractEvent.contractId = StrKey.encodeContract(cid);
          }
        } catch {
          /* optional */
        }

        // ContractEvent body is a numeric union whose only arm is v0.
        let v0: any;
        try {
          v0 = event.body?.().v0?.();
        } catch {
          v0 = undefined;
        }

        if (v0) {
          contractEvent.topics = (v0.topics?.() || []).map((t: any) =>
            this.decodeScVal(t)
          );
          contractEvent.data = this.decodeScVal(v0.data?.());
        } else if (typeof event.topics === 'function') {
          contractEvent.topics = (event.topics() || []).map((t: any) =>
            this.decodeScVal(t)
          );
          if (typeof event.data === 'function') {
            contractEvent.data = this.decodeScVal(event.data());
          }
        }

        trace.events.push(contractEvent);
      } catch (error) {
        console.error('Error parsing event:', error);
      }
    });
  }

  private parseOperationMeta(opMeta: any, _trace: TransactionTrace): void {
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


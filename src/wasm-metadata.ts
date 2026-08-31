/**
 * Extracts a contract's interface (spec) and build metadata from the custom
 * sections of a compiled Soroban WASM module.
 *
 * Soroban embeds three custom sections in the `.wasm`:
 *   - `contractspecv0`     - a stream of XDR `ScSpecEntry` (functions, UDTs)
 *   - `contractmetav0`     - a stream of XDR `ScMetaEntry` key/value pairs
 *   - `contractenvmetav0`  - a stream of XDR `ScEnvMetaEntry` (host interface version)
 *
 * This is only invoked when the traced transaction itself uploads WASM
 * (an `uploadContractWasm` host function), so the raw bytes are already
 * in hand and no network round-trip is needed.
 */

import { xdr, cereal, hash } from '@stellar/stellar-sdk';
import { WasmMetadata, WasmFunctionSpec } from './types';

/**
 * Minimal ambient typing for the parts of the `WebAssembly` global we use.
 * The full type lives in TypeScript's DOM lib, which this Node-only project
 * deliberately does not include.
 */
declare const WebAssembly: {
  compile(bytes: Buffer | Uint8Array | ArrayBuffer): Promise<WasmModule>;
  Module: {
    customSections(module: WasmModule, sectionName: string): ArrayBuffer[];
  };
};
type WasmModule = object;

const SPEC_SECTION = 'contractspecv0';
const META_SECTION = 'contractmetav0';
const ENV_META_SECTION = 'contractenvmetav0';

export async function extractWasmMetadata(wasm: Buffer): Promise<WasmMetadata> {
  const result: WasmMetadata = {
    wasmSize: wasm.length,
    functions: [],
    meta: {},
  };

  try {
    result.wasmHash = hash(wasm).toString('hex');
  } catch {
    /* hashing is best-effort */
  }

  let module: WasmModule;
  try {
    module = await WebAssembly.compile(wasm);
  } catch (error) {
    console.error('Could not compile WASM for metadata extraction:', error);
    return result;
  }

  result.functions = readSpecFunctions(customSections(module, SPEC_SECTION));
  result.meta = readMeta(customSections(module, META_SECTION));
  result.envInterfaceVersion = readEnvInterfaceVersion(
    customSections(module, ENV_META_SECTION)
  );

  return result;
}

function customSections(module: WasmModule, name: string): Buffer {
  const parts = WebAssembly.Module.customSections(module, name).map(
    (s: ArrayBuffer) => Buffer.from(s)
  );
  return parts.length > 0 ? Buffer.concat(parts) : Buffer.alloc(0);
}

function readStream<T>(buffer: Buffer, read: (r: any) => T): T[] {
  if (buffer.length === 0) return [];
  const entries: T[] = [];
  try {
    const reader = new cereal.XdrReader(buffer);
    while (!reader.eof) {
      entries.push(read(reader));
    }
  } catch (error) {
    console.error('Error decoding WASM custom section stream:', error);
  }
  return entries;
}

function readSpecFunctions(buffer: Buffer): WasmFunctionSpec[] {
  const entries = readStream(buffer, (r) => xdr.ScSpecEntry.read(r));
  const functions: WasmFunctionSpec[] = [];

  for (const entry of entries) {
    try {
      if (entry.switch().name !== 'scSpecEntryFunctionV0') continue;
      const fn = entry.functionV0();
      functions.push({
        name: fn.name().toString(),
        doc: bufToString(fn.doc()) || undefined,
        inputs: (fn.inputs() || []).map((input: any) => ({
          name: input.name().toString(),
          type: scSpecTypeToString(input.type()),
        })),
        outputs: (fn.outputs() || []).map((out: any) => scSpecTypeToString(out)),
      });
    } catch (error) {
      console.error('Error decoding contract spec function:', error);
    }
  }

  return functions;
}

function readMeta(buffer: Buffer): Record<string, string> {
  const entries = readStream(buffer, (r) => xdr.ScMetaEntry.read(r));
  const meta: Record<string, string> = {};

  for (const entry of entries) {
    try {
      if (entry.switch().name !== 'scMetaV0') continue;
      const v0 = entry.v0();
      meta[v0.key().toString()] = v0.val().toString();
    } catch (error) {
      console.error('Error decoding contract meta entry:', error);
    }
  }

  return meta;
}

function readEnvInterfaceVersion(buffer: Buffer): string | undefined {
  const entries = readStream(buffer, (r) => xdr.ScEnvMetaEntry.read(r));
  for (const entry of entries) {
    try {
      if (entry.switch().name !== 'scEnvMetaKindInterfaceVersion') continue;
      const version = entry.interfaceVersion();
      // Newer XDR: { protocol, preRelease }; older: a raw u64.
      if (version && typeof version.protocol === 'function') {
        const protocol = Number(version.protocol());
        const pre = Number(version.preRelease?.() ?? 0);
        return pre ? `${protocol} (pre-release ${pre})` : String(protocol);
      }
      return String(version?.toString?.() ?? version);
    } catch (error) {
      console.error('Error decoding env meta entry:', error);
    }
  }
  return undefined;
}

/** Render an `xdr.ScSpecTypeDef` as a short, human-readable type label. */
export function scSpecTypeToString(def: any): string {
  let name: string;
  try {
    name = def.switch().name;
  } catch {
    return 'unknown';
  }

  const primitive = name.replace(/^scSpecType/, '');
  const short = primitive.charAt(0).toLowerCase() + primitive.slice(1);

  try {
    switch (name) {
      case 'scSpecTypeOption':
        return `option<${scSpecTypeToString(def.option().valueType())}>`;
      case 'scSpecTypeVec':
        return `vec<${scSpecTypeToString(def.vec().elementType())}>`;
      case 'scSpecTypeMap':
        return `map<${scSpecTypeToString(def.map().keyType())}, ${scSpecTypeToString(
          def.map().valueType()
        )}>`;
      case 'scSpecTypeResult':
        return `result<${scSpecTypeToString(def.result().okType())}, ${scSpecTypeToString(
          def.result().errorType()
        )}>`;
      case 'scSpecTypeTuple':
        return `(${(def.tuple().valueTypes() || [])
          .map((t: any) => scSpecTypeToString(t))
          .join(', ')})`;
      case 'scSpecTypeBytesN':
        return `bytesN<${def.bytesN().n()}>`;
      case 'scSpecTypeUdt':
        return def.udt().name().toString();
      default:
        return short;
    }
  } catch {
    return short;
  }
}

function bufToString(value: any): string {
  if (value === null || value === undefined) return '';
  try {
    return value.toString();
  } catch {
    return '';
  }
}

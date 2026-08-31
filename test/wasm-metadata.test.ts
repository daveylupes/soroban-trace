/**
 * WASM custom-section metadata extraction tests.
 *
 * Run with: npm test
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractWasmMetadata, scSpecTypeToString } from '../src/wasm-metadata';
import { SorobanTrace } from '../src/index';

const wasmPath = path.join(__dirname, 'fixtures', 'sample-contract.wasm');

describe('extractWasmMetadata', () => {
  it('reads the contract spec functions from contractspecv0', async () => {
    const wasm = fs.readFileSync(wasmPath);
    const meta = await extractWasmMetadata(wasm);

    expect(meta.wasmSize).toBe(wasm.length);
    expect(meta.wasmHash).toMatch(/^[0-9a-f]{64}$/);

    const names = meta.functions.map((f) => f.name).sort();
    expect(names).toEqual(['balance', 'transfer']);

    const transfer = meta.functions.find((f) => f.name === 'transfer')!;
    expect(transfer.inputs).toEqual([
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'i128' },
    ]);
    expect(transfer.outputs).toEqual(['bool']);
  });

  it('reads build metadata key/value pairs from contractmetav0', async () => {
    const meta = await extractWasmMetadata(fs.readFileSync(wasmPath));
    expect(meta.meta.rsver).toBe('1.81.0');
    expect(meta.meta.rssdkver).toBe('21.7.6#...');
  });

  it('returns an empty-but-valid result for non-contract wasm', async () => {
    const bareModule = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    const meta = await extractWasmMetadata(bareModule);
    expect(meta.functions).toEqual([]);
    expect(meta.meta).toEqual({});
  });
});

describe('scSpecTypeToString', () => {
  it('falls back to "unknown" for unrecognized input', () => {
    expect(scSpecTypeToString({})).toBe('unknown');
  });
});

describe('SorobanTrace - upload transaction end to end', () => {
  it('surfaces the contract spec in the formatted output', async () => {
    const tracer = new SorobanTrace();
    const out = await tracer.traceFromFile('./test/fixtures/upload-wasm.json', {
      colors: false,
    });
    expect(out).toContain('CONTRACT WASM');
    expect(out).toContain('transfer(from: address, to: address, amount: i128) -> bool');
  });

  it('includes wasmMetadata in JSON output and drops the raw buffer', async () => {
    const tracer = new SorobanTrace();
    const out = await tracer.traceFromFile('./test/fixtures/upload-wasm.json', {
      json: true,
      colors: false,
    });
    const parsed = JSON.parse(out);
    expect(parsed.wasmMetadata.functions).toHaveLength(2);
    expect(parsed._pendingWasm).toBeUndefined();
  });
});

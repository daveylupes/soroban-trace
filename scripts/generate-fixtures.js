/**
 * Regenerates the deterministic test fixtures used by the parser and
 * wasm-metadata test suites, plus the bundled example transaction.
 *
 *   node scripts/generate-fixtures.js
 *
 * The output is synthetic but structurally valid XDR built with the Stellar
 * SDK, so it exercises every decode path (envelope, sorobanData, meta ext v1,
 * events, WASM custom sections) without needing live network access.
 */

const fs = require('fs');
const path = require('path');
const {
  xdr,
  Account,
  Address,
  Contract,
  Networks,
  Operation,
  TransactionBuilder,
  SorobanDataBuilder,
  nativeToScVal,
  hash,
} = require('@stellar/stellar-sdk');

const SOURCE = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
const TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const SPENDER = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';

const fixturesDir = path.join(__dirname, '..', 'test', 'fixtures');
const examplesDir = path.join(__dirname, '..', 'examples');
fs.mkdirSync(fixturesDir, { recursive: true });

// --------------------------------------------------------------------------
// 1. An invokeContract transaction envelope: token.transfer(from, to, amount)
// --------------------------------------------------------------------------
function buildInvokeEnvelope() {
  const account = new Account(SOURCE, '1234567890');
  const contract = new Contract(TOKEN);
  const op = contract.call(
    'transfer',
    nativeToScVal(Address.fromString(SOURCE), { type: 'address' }),
    nativeToScVal(Address.fromString(SPENDER), { type: 'address' }),
    nativeToScVal(2500000n, { type: 'i128' })
  );

  let tx = new TransactionBuilder(account, {
    fee: '150000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(120)
    .build();

  const sorobanData = new SorobanDataBuilder()
    .setResourceFee(1_043_216)
    .setResources(3_214_876, 4_920, 128)
    .setReadOnly([])
    .setReadWrite([])
    .build();

  tx = TransactionBuilder.cloneFrom(tx).setSorobanData(sorobanData).build();

  return tx.toEnvelope().toXDR('base64');
}

// --------------------------------------------------------------------------
// 2. A matching result XDR (success, fee charged)
// --------------------------------------------------------------------------
function buildResultXdr(feeCharged) {
  const opResult = xdr.OperationResult.opInner(
    xdr.OperationResultTr.invokeHostFunction(
      xdr.InvokeHostFunctionResult.invokeHostFunctionSuccess(
        Buffer.alloc(32, 7)
      )
    )
  );

  const result = new xdr.TransactionResult({
    feeCharged: new xdr.Int64(feeCharged),
    result: xdr.TransactionResultResult.txSuccess([opResult]),
    ext: new xdr.TransactionResultExt(0),
  });

  return result.toXDR('base64');
}

// --------------------------------------------------------------------------
// 3. A meta XDR (v3) carrying a transfer event + resource-fee breakdown
// --------------------------------------------------------------------------
function buildMetaXdr() {
  const transferEvent = new xdr.ContractEvent({
    ext: new xdr.ExtensionPoint(0),
    contractId: Address.fromString(TOKEN).toScAddress().contractId(),
    type: xdr.ContractEventType.contract(),
    body: new xdr.ContractEventBody(
      0,
      new xdr.ContractEventV0({
        topics: [
          nativeToScVal('transfer', { type: 'symbol' }),
          nativeToScVal(Address.fromString(SOURCE), { type: 'address' }),
          nativeToScVal(Address.fromString(SPENDER), { type: 'address' }),
        ],
        data: nativeToScVal(2500000n, { type: 'i128' }),
      })
    ),
  });

  const sorobanMeta = new xdr.SorobanTransactionMeta({
    ext: new xdr.SorobanTransactionMetaExt(
      1,
      new xdr.SorobanTransactionMetaExtV1({
        ext: new xdr.ExtensionPoint(0),
        totalNonRefundableResourceFeeCharged: new xdr.Int64(890123),
        totalRefundableResourceFeeCharged: new xdr.Int64(153093),
        rentFeeCharged: new xdr.Int64(41210),
      })
    ),
    events: [transferEvent],
    returnValue: nativeToScVal(true),
    diagnosticEvents: [],
  });

  const metaV3 = new xdr.TransactionMetaV3({
    ext: new xdr.ExtensionPoint(0),
    txChangesBefore: [],
    operations: [new xdr.OperationMeta({ changes: [] })],
    txChangesAfter: [],
    sorobanMeta,
  });

  return new xdr.TransactionMeta(3, metaV3).toXDR('base64');
}

// --------------------------------------------------------------------------
// 4. A synthetic contract WASM with contractspecv0 / contractmetav0 sections
// --------------------------------------------------------------------------
function leb128(value) {
  const bytes = [];
  let v = value;
  do {
    let byte = v & 0x7f;
    v >>>= 7;
    if (v !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (v !== 0);
  return Buffer.from(bytes);
}

function customSection(name, payload) {
  const nameBuf = Buffer.from(name, 'utf-8');
  const body = Buffer.concat([leb128(nameBuf.length), nameBuf, payload]);
  return Buffer.concat([Buffer.from([0x00]), leb128(body.length), body]);
}

function specEntryFunction(name, inputs, output) {
  return xdr.ScSpecEntry.scSpecEntryFunctionV0(
    new xdr.ScSpecFunctionV0({
      doc: `${name} does a thing`,
      name,
      inputs: inputs.map(
        ([argName, type]) =>
          new xdr.ScSpecFunctionInputV0({ doc: '', name: argName, type })
      ),
      outputs: output ? [output] : [],
    })
  );
}

function buildWasm() {
  const t = xdr.ScSpecTypeDef;
  const specEntries = [
    specEntryFunction(
      'transfer',
      [
        ['from', t.scSpecTypeAddress()],
        ['to', t.scSpecTypeAddress()],
        ['amount', t.scSpecTypeI128()],
      ],
      t.scSpecTypeBool()
    ),
    specEntryFunction('balance', [['id', t.scSpecTypeAddress()]], t.scSpecTypeI128()),
  ];

  const metaEntries = [
    xdr.ScMetaEntry.scMetaV0(
      new xdr.ScMetaV0({ key: 'rsver', val: '1.81.0' })
    ),
    xdr.ScMetaEntry.scMetaV0(
      new xdr.ScMetaV0({ key: 'rssdkver', val: '21.7.6#...' })
    ),
  ];

  const specPayload = Buffer.concat(
    specEntries.map((e) => e.toXDR())
  );
  const metaPayload = Buffer.concat(metaEntries.map((e) => e.toXDR()));

  const header = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
  return Buffer.concat([
    header,
    customSection('contractspecv0', specPayload),
    customSection('contractmetav0', metaPayload),
  ]);
}

// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// 5. An uploadContractWasm transaction envelope carrying the synthetic WASM
// --------------------------------------------------------------------------
function buildUploadEnvelope(wasm) {
  const account = new Account(SOURCE, '1234567891');
  const op = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeUploadContractWasm(wasm),
    auth: [],
  });
  const tx = new TransactionBuilder(account, {
    fee: '200000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(120)
    .build();
  return tx.toEnvelope().toXDR('base64');
}

const feeCharged = 1_100_000;
const envelopeXdr = buildInvokeEnvelope();
const resultXdr = buildResultXdr(feeCharged);
const resultMetaXdr = buildMetaXdr();
const wasm = buildWasm();

const invokeFixture = {
  hash: 'a'.repeat(64),
  ledger: 1234567,
  createdAt: '2026-01-15T09:30:00Z',
  status: 'SUCCESS',
  envelopeXdr,
  resultXdr,
  resultMetaXdr,
};

const uploadFixture = {
  hash: 'b'.repeat(64),
  ledger: 1234568,
  createdAt: '2026-01-15T09:31:00Z',
  status: 'SUCCESS',
  envelopeXdr: buildUploadEnvelope(wasm),
  resultXdr: buildResultXdr(210_000),
};

fs.writeFileSync(
  path.join(fixturesDir, 'invoke-transfer.json'),
  JSON.stringify(invokeFixture, null, 2) + '\n'
);
fs.writeFileSync(
  path.join(fixturesDir, 'upload-wasm.json'),
  JSON.stringify(uploadFixture, null, 2) + '\n'
);
fs.writeFileSync(path.join(fixturesDir, 'sample-contract.wasm'), wasm);
fs.writeFileSync(
  path.join(fixturesDir, 'sample-contract.meta.json'),
  JSON.stringify({ wasmHash: hash(wasm).toString('hex'), wasmSize: wasm.length }, null, 2) + '\n'
);

// The bundled example doubles as the integration-test input.
fs.writeFileSync(
  path.join(examplesDir, 'sample-transaction.json'),
  JSON.stringify(
    {
      _comment:
        'Synthetic but structurally valid testnet-style Soroban transfer, generated by scripts/generate-fixtures.js',
      hash: invokeFixture.hash,
      ledger: invokeFixture.ledger,
      createdAt: invokeFixture.createdAt,
      status: 'SUCCESS',
      envelopeXdr,
      resultXdr,
      resultMetaXdr,
    },
    null,
    2
  ) + '\n'
);

console.log('Wrote:');
console.log('  test/fixtures/invoke-transfer.json');
console.log('  test/fixtures/upload-wasm.json');
console.log('  test/fixtures/sample-contract.wasm', `(${wasm.length} bytes)`);
console.log('  test/fixtures/sample-contract.meta.json');
console.log('  examples/sample-transaction.json');

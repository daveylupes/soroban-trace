# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Resolve WASM metadata for any invoked contract (fetch spec by contract ID from RPC)
- Full storage read/write extraction from operation meta
- Enhanced error messages with context
- Performance optimizations

## [0.2.0] - 2026-09-01

### Added
- **Transaction envelope decoding**: real contract IDs, invoked function names,
  and decoded arguments now replace the previous generic `invoke()` placeholder
- **Nested call tree**: sub-invocations are reconstructed from the transaction's
  Soroban authorization entries
- **Gas / resource analytics** (`RESOURCE USAGE` section): CPU instructions,
  disk-read/write bytes, footprint entry counts, and a full fee breakdown
  (resource fee, non-refundable, refundable, rent, inclusion fee, total charged),
  also included under `gas` in `--json` output
- **WASM metadata extraction**: for transactions that upload contract code, the
  `contractspecv0` / `contractmetav0` / `contractenvmetav0` custom sections are
  decoded into a function list (name, argument names/types, return type) and
  build metadata (`rsver`, `rssdkver`, host interface version)
- `extractWasmMetadata` and `scSpecTypeToString` exported from the package entry point
- `scripts/generate-fixtures.js` to regenerate deterministic test fixtures

### Changed
- `SorobanTrace#traceFromFile` and `#traceFromData` are now `async` and return
  `Promise<string>` (WASM decoding requires `WebAssembly.compile`)
- Envelope, result, and meta XDR are now parsed additively instead of one being
  chosen exclusively
- `--json` output serializes `BigInt` values (i128/u64/…) as decimal strings
  instead of throwing

### Fixed
- Operation success was never detected: the code checked for an
  `invokeHostFunctionResult` arm named `success` (the real name is
  `invokeHostFunctionSuccess`) and tried to ScVal-decode the return-value hash
- Contract events from the meta XDR now decode their topics, data, and contract
  ID (previously empty / raw hex); diagnostic events are unwrapped correctly
- CI: commit `package-lock.json` (was git-ignored, breaking `npm ci` and
  setup-node caching); bump retired GitHub Action versions
  (`upload-artifact` v3→v4, `codeql-action` v2→v3, `dependency-review-action`
  v3→v4, `codecov-action` v3→v5, `action-gh-release` v1→v2); replace EOL Node
  21.x with 22.x in the test matrix

## [0.1.0] - 2025-10-07

### Added
- Initial release of soroban-trace
- CLI interface for tracing Soroban smart contract transactions
- Support for multiple networks (testnet, futurenet, mainnet)
- Custom RPC endpoint support with `--rpc-url` option
- Automatic fallback from Soroban RPC to Horizon API
- Transaction parsing with XDR decoding
- Event extraction and display
- Storage change tracking
- Operation result analysis
- Beautiful CLI output with color coding
- JSON export functionality with `--json` flag
- Verbose mode with `--verbose` flag
- File-based transaction tracing with `file` command
- Programmatic API for Node.js/TypeScript projects
- Clear distinction between Transaction and Operation status
- Comprehensive documentation suite
- Test infrastructure with Jest
- Mermaid diagrams for architecture and concepts

### Features
- **Transaction Tracing**: Trace any Soroban transaction by hash
- **Network Support**: Works with testnet, futurenet, mainnet, and custom RPCs
- **Smart Fallback**: Automatically tries Horizon if RPC fails
- **Clear Output**: Human-readable formatted output
- **Developer-Friendly**: Shows the crucial Transaction vs Operation distinction
- **Multiple Formats**: CLI tree view or JSON export
- **Fast**: Get debugging information in 2 seconds

### Documentation
- Complete README with examples
- Quick start guide
- User flow documentation
- Understanding transaction results guide
- Architecture documentation
- Contributing guidelines
- Testing guide
- Deployment guides
- 12 Mermaid diagrams

### Technical
- TypeScript implementation
- Built on @stellar/stellar-sdk v14.2.0
- Commander.js for CLI
- Chalk for colored output
- Axios for HTTP requests
- Jest for testing
- Full type definitions

### Testing
- Unit tests for parser, formatter, RPC client
- Integration tests
- 15 tests passing
- Test coverage reporting
- Example transactions for testing

---

## Release Notes

### v0.1.0 - Initial Release

**soroban-trace** is a developer tool for tracing and visualizing Soroban smart contract execution on the Stellar network.

**Key Innovation:** Clear distinction between Transaction success (network accepted it) and Operation success (contract executed correctly). This is crucial for debugging but hard to see in raw XDR.

**Installation:**
```bash
npm install -g soroban-trace
```

**Basic Usage:**
```bash
soroban-trace tx <TX_HASH> --network testnet
```

**What It Shows:**
- Transaction status (SUCCESS/FAILED)
- Operation status (SUCCESS/FAILED/ERROR)
- Contract addresses involved
- Events emitted
- Storage changes
- Return values
- Error messages

**Perfect For:**
- Debugging failed contracts
- Understanding transaction behavior
- Analyzing events and storage
- Learning Soroban development
- Production monitoring

**Tested and Verified:**
- Real testnet contracts traced successfully
- Multiple network support confirmed
- RPC fallback mechanism working
- All documentation validated

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.2.0 | 2026-09-01 | Envelope decoding, gas analytics, WASM metadata |
| 0.1.0 | 2025-10-07 | Initial release - Transaction tracing CLI tool |

---

## Upgrade Guide

### From Pre-release to v0.1.0

This is the first stable release. No upgrade needed.

---

## Breaking Changes

None in v0.1.0 (initial release)

---

## Known Issues

See [docs/known-issues.md](docs/known-issues.md) for current limitations and workarounds.

**Main Limitations:**
- WASM spec is only resolved for transactions that upload contract code, not for
  arbitrary invoked contract IDs (planned)
- Storage read/write extraction from operation meta is still partial
- Large transactions may be slow to parse
- No live monitoring yet (planned for Phase 5)

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for how to contribute.

**Want to help?**
- Report bugs via GitHub Issues
- Suggest features
- Submit pull requests
- Improve documentation
- Share your use cases

---

## Credits

Built with:
- [@stellar/stellar-sdk](https://github.com/stellar/js-stellar-sdk) - XDR parsing
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors

Special thanks to the Stellar and Soroban communities!

---

## Support

- **GitHub Issues**: https://github.com/daveylupes/soroban-trace/issues
- **Documentation**: https://github.com/daveylupes/soroban-trace/tree/main/docs
- **Stellar Discord**: #soroban channel

---

[Unreleased]: https://github.com/daveylupes/soroban-trace/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/daveylupes/soroban-trace/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/daveylupes/soroban-trace/releases/tag/v0.1.0


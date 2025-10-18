# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- WASM metadata extraction for function names
- Gas usage analytics
- Enhanced error messages with context
- Contract ABI integration
- Performance optimizations

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
- Function names show as generic "invoke()" - WASM metadata extraction not yet implemented
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

[Unreleased]: https://github.com/daveylupes/soroban-trace/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/daveylupes/soroban-trace/releases/tag/v0.1.0


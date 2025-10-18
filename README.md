# soroban-trace

> Developer tool for tracing and visualizing Soroban smart contract execution on the Stellar network.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## What is soroban-trace?

`soroban-trace` gives developers **visibility into Soroban smart contract execution** — function calls, storage interactions, emitted events, and error points — in a structured, human-readable format.

Think of it as a **"transaction introspector"** or **"debugging lens"** for Soroban contracts on Stellar.

### Why You Need This

When debugging Soroban contracts, you often face:
- Generic error codes with no context
- No visibility into nested contract calls
- Difficulty analyzing gas usage, state changes, or emitted events
- Painful debugging for complex, multi-contract logic

**soroban-trace** solves this by parsing transaction results and displaying them in an easy-to-understand format.

---

## Quick Start

### Installation

```bash
# Global installation (when published to npm)
npm install -g soroban-trace

# Or local development
git clone https://github.com/daveylupes/soroban-trace.git
cd soroban-trace
npm install && npm run build
```

### Basic Usage

```bash
# Trace a transaction (using verified test transaction)
soroban-trace tx d3bb417530b528e776c146580bcd93269cd86fa09d74e8c18cd7f7b0e9deab0b --network testnet

# Verbose mode with all details
soroban-trace tx <TX_HASH> --verbose

# Export to JSON
soroban-trace tx <TX_HASH> --json > trace.json

# Different networks
soroban-trace tx <TX_HASH> --network futurenet
soroban-trace tx <TX_HASH> --network mainnet

# From file
soroban-trace file ./transaction.json
```

See [QUICKSTART.md](QUICKSTART.md) for a complete guide.

---

## Example Output

```
┌──────────────────────────────────────────────────────────────────────┐
│ Transaction: d3bb417530b528e776c146580bcd93269cd86fa09d74e8c18c...   │
│ Time: 2025-08-19T22:02:30Z                                           │
│ Status: SUCCESS                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ OPERATIONS:                                                          │
│   1. CALL: invoke()                                                  │
│      ◆ EVENT: Transfer                                               │
│        Data: { from: alice, to: bob, amount: 1000 }                  │
│      → success                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ EVENTS:                                                              │
│   ◆ EVENT: Transfer                                                  │
│     Data: { from: alice, to: bob, amount: 1000 }                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Programmatic Usage

Use `soroban-trace` as a library in your Node.js/TypeScript projects:

```typescript
import { SorobanTrace } from 'soroban-trace';

const tracer = new SorobanTrace({
  network: 'testnet',
  // or use custom RPC URL:
  // rpcUrl: 'https://custom-rpc.example.com'
});

// Trace by transaction hash
const result = await tracer.traceTransaction(
  'd3bb417530b528e776c146580bcd93269cd86fa09d74e8c18cd7f7b0e9deab0b',
  { json: false, verbose: true }
);

console.log(result);

// Or trace from a file
const fileResult = tracer.traceFromFile('./transaction.json');
console.log(fileResult);
```

---

## Documentation

- **[Quick Start](QUICKSTART.md)** - Get started in 5 minutes
- **[Testing Guide](docs/TESTING.md)** - How to test with real transactions
- **[Architecture](docs/ARCHITECTURE.md)** - Technical details
- **[Contributing](docs/CONTRIBUTING.md)** - How to contribute
- **[Known Issues](docs/known-issues.md)** - Current limitations

### Additional Resources

- **[Deploy Test Contract](docs/deploy-test-contract.md)** - Create your own test transactions
- **[Find Transactions](docs/find-transactions.md)** - Where to find Soroban transactions

---

## Features

### Current (v0.1.0)

- Transaction tracing by hash
- Support for testnet, futurenet, and mainnet
- Custom RPC endpoint support
- Event parsing and display
- Storage change tracking
- Beautiful CLI output with colors
- JSON export
- Verbose mode
- File-based tracing
- Library API for programmatic use

### Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| **Phase 1** | CLI MVP with transaction tracing | Complete |
| **Phase 2** | WASM metadata parsing, gas analytics | Planned |
| **Phase 3** | Web UI for visualization | Planned |
| **Phase 4** | VSCode extension integration | Planned |
| **Phase 5** | Live tracing during tests | Planned |

---

## Use Cases

- **Debugging Failed Transactions**: See exactly where and why your contract failed
- **Analyzing Multi-Contract Interactions**: Visualize nested contract calls
- **Event Monitoring**: Track all events emitted during execution
- **Gas Optimization**: Understand which operations consume resources
- **Testing & Development**: Validate contract behavior during development
- **Audit & Analysis**: Review historical transaction data

---

## Testing

```bash
# Build the project
npm run build

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Test with a real transaction
npm start -- tx d3bb417530b528e776c146580bcd93269cd86fa09d74e8c18cd7f7b0e9deab0b -n testnet
```

See the [testing guide](docs/TESTING.md) for comprehensive testing instructions.

---

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, or code contributions, we'd love your help.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

---

## Project Structure

```
soroban-trace/
├── src/              # TypeScript source code
│   ├── cli.ts        # CLI interface
│   ├── index.ts      # Library API
│   ├── parser.ts     # Transaction parser
│   ├── formatter.ts  # Output formatter
│   ├── rpc-client.ts # RPC/Horizon client
│   └── types.ts      # Type definitions
├── test/             # Test files
├── docs/             # Documentation
├── examples/         # Example files
├── dist/             # Compiled output
└── scripts/          # Helper scripts
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Links

- **[Stellar Documentation](https://stellar.org/developers)**
- **[Soroban Documentation](https://soroban.stellar.org/docs)**
- **[Stellar Discord](https://discord.gg/stellar)** - Join the #soroban channel

---

## Acknowledgments

Built with:
- [Stellar SDK](https://github.com/stellar/js-stellar-sdk) - XDR parsing and Stellar types
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [TypeScript](https://www.typescriptlang.org/) - Type safety

Special thanks to the Stellar and Soroban communities!

---

**Made for the Stellar & Soroban developer community**

## Star History

If you find this tool useful, please consider giving it a star on GitHub!

# Contributing to soroban-trace

Thank you for your interest in contributing! This guide will help you get started.

##  Ways to Contribute

- **Report bugs:** Open an issue with reproduction steps
- **Suggest features:** Share your ideas for improvements
- **Submit code:** Fork, develop, and create a pull request
- **Improve documentation:** Fix typos or add examples
- **Share feedback:** Let us know what works well

##  Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git
- TypeScript knowledge

### Setup

```bash
# Fork and clone
git clone https://github.com/daveylupes/soroban-trace.git
cd soroban-trace

# Install dependencies
npm install

# Build
npm run build

# Test
npm start -- --help
```

##  Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming:
- `feature/add-gas-metrics`
- `fix/parser-error-handling`
- `docs/improve-quickstart`

### 2. Make Changes

- Follow existing code style
- Add TypeScript types
- Comment complex logic
- Keep commits focused

### 3. Test

```bash
npm run build
npm test
npm start -- tx <TEST_TX_HASH> --network testnet
```

### 4. Commit

```bash
git commit -m "feat: add gas usage metrics"
```

Commit format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Open a pull request with:
- Clear title and description
- Related issue numbers
- Test results
- Screenshots (if applicable)

##  Project Structure

```
soroban-trace/
├── src/              # Source code
├── test/             # Test files
├── docs/             # Documentation
├── examples/         # Example files
├── dist/             # Compiled output
└── scripts/          # Helper scripts
```

##  Code Guidelines

### TypeScript Style

- Use strict mode
- Define interfaces
- Avoid `any` types
- Use descriptive names
- Add JSDoc comments

### Error Handling

- Catch errors gracefully
- Provide helpful messages
- Don't crash the program

### Code Organization

- Keep functions small
- Extract reusable logic
- Group related functionality
- Use classes for state

##  Testing

See [`test/README.md`](../test/README.md) for testing guidelines.

Manual testing checklist:
- [ ] CLI commands work
- [ ] Options work correctly
- [ ] Error messages are helpful
- [ ] Output is formatted correctly
- [ ] JSON export is valid

##  Documentation

Update documentation when you:
- Change behavior
- Add features
- Fix bugs
- Add examples

##  Bug Reports

Include:
1. Description
2. Steps to reproduce
3. Environment (OS, Node version)
4. Transaction hash (if applicable)
5. Error messages
6. Screenshots

##  Feature Requests

Include:
1. Use case
2. Proposed solution
3. Alternatives considered
4. Examples

##  Priority Areas

### Current Focus
- [ ] Automated testing
- [ ] Better XDR parsing
- [ ] WASM metadata extraction
- [ ] Performance optimizations
- [ ] Error messages

### Future Enhancements
- [ ] Web UI
- [ ] VSCode extension
- [ ] Real-time monitoring
- [ ] Analytics tools

##  Communication

- **GitHub Issues:** Bug reports and features
- **Pull Requests:** Code contributions
- **Discussions:** General questions
- **Stellar Discord:** Community support

## 📜 Code of Conduct

Be respectful, constructive, and professional:
- Welcome newcomers
- Provide constructive feedback
- Focus on the problem, not the person
- Assume good intentions

##  Recognition

Contributors will be:
- Listed in contributors
- Mentioned in release notes
- Credited in documentation

## ❓ Questions?

- Open a GitHub Discussion
- Ask in Stellar Discord (#soroban)
- Open an issue labeled "question"

---

**Thank you for contributing! **


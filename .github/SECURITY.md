# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** open a public issue
2. Report via one of these methods:
   - GitHub Security Advisories: https://github.com/daveylupes/soroban-trace/security/advisories/new
   - Email: lupscyber@gmail.com (encrypt with PGP if sensitive)

3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Time

- We will acknowledge receipt within 48 hours
- We will provide a detailed response within 7 days
- We will work on a fix and keep you updated

## Disclosure Policy

- We follow coordinated disclosure
- We will credit reporters (unless they prefer to remain anonymous)
- We will publish security advisories for confirmed vulnerabilities

## Security Best Practices for Users

When using soroban-trace:

1. **Keep it updated**: Always use the latest version
   ```bash
   npm update -g soroban-trace
   ```

2. **Be careful with transaction hashes**: Don't share sensitive transaction hashes publicly

3. **Custom RPC URLs**: Only use trusted RPC endpoints

4. **Review output**: Verify transaction data before acting on it

## Known Security Considerations

- This tool fetches transaction data from public RPC/Horizon endpoints
- Transaction hashes and data are public on the blockchain
- No private keys or sensitive data are handled by this tool
- All network requests are to public Stellar network endpoints

## Updates

Security updates will be released as patch versions and announced via:
- GitHub Security Advisories
- npm package updates
- Release notes

Thank you for helping keep soroban-trace and its users safe!


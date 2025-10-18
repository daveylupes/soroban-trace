#!/usr/bin/env node

/**
 * CLI interface for soroban-trace
 */

import { Command } from 'commander';
import { SorobanTrace } from './index';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

// Read package.json for version
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

program
  .name('soroban-trace')
  .description('Developer tool for tracing and visualizing Soroban smart contract execution')
  .version(packageJson.version);

program
  .command('tx <hash>')
  .description('Trace a transaction by hash')
  .option('-n, --network <network>', 'Network to use (testnet, futurenet, mainnet)', 'testnet')
  .option('-r, --rpc-url <url>', 'Custom RPC URL')
  .option('-j, --json', 'Output as JSON')
  .option('-v, --verbose', 'Verbose output with additional details')
  .option('--no-colors', 'Disable colored output')
  .action(async (hash, options) => {
    try {
      const tracer = new SorobanTrace({
        network: options.network,
        rpcUrl: options.rpcUrl,
      });

      const result = await tracer.traceTransaction(hash, {
        json: options.json,
        verbose: options.verbose,
        colors: options.colors,
      });

      console.log(result);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('file <path>')
  .description('Trace a transaction from a JSON file')
  .option('-j, --json', 'Output as JSON')
  .option('-v, --verbose', 'Verbose output with additional details')
  .option('--no-colors', 'Disable colored output')
  .action((filePath, options) => {
    try {
      const tracer = new SorobanTrace();

      const result = tracer.traceFromFile(filePath, {
        json: options.json,
        verbose: options.verbose,
        colors: options.colors,
      });

      console.log(result);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);


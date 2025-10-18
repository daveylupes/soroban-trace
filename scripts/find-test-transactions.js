#!/usr/bin/env node

/**
 * Helper script to find Soroban transactions on testnet
 * Usage: node scripts/find-test-transactions.js
 */

const axios = require('axios');

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

async function findSorobanTransactions() {
  console.log('Searching for Soroban transactions on testnet...\n');
  
  try {
    // Fetch recent transactions
    const response = await axios.get(`${HORIZON_URL}/transactions`, {
      params: {
        order: 'desc',
        limit: 100
      }
    });

    const transactions = response.data._embedded.records;
    
    // Filter for potential Soroban transactions
    // Check each transaction to see if it contains invoke_host_function operations
    const sorobanTxs = [];
    
    for (const tx of transactions) {
      if (!tx.successful) continue;
      
      try {
        // Fetch operations for this transaction
        const opsResponse = await axios.get(tx._links.operations.href);
        const operations = opsResponse.data._embedded.records;
        
        // Check if any operation is invoke_host_function (Soroban)
        const hasSorobanOp = operations.some(op => op.type === 'invoke_host_function');
        
        if (hasSorobanOp) {
          sorobanTxs.push(tx);
        }
      } catch (error) {
        // Skip if we can't fetch operations
        continue;
      }
      
      // Limit search to avoid too many API calls
      if (sorobanTxs.length >= 5) break;
    }

    if (sorobanTxs.length === 0) {
      console.log('No potential Soroban transactions found in recent 100 transactions');
      console.log('\nTips:');
      console.log('  - Testnet might not have recent Soroban activity');
      console.log('  - Try deploying your own test contract');
      console.log('  - Check Stellar Discord for active test contracts');
      return;
    }

    console.log(`Found ${sorobanTxs.length} potential transactions:\n`);
    
    // Display first 10
    sorobanTxs.slice(0, 10).forEach((tx, index) => {
      console.log(`${index + 1}. Transaction: ${tx.hash}`);
      console.log(`   Ledger: ${tx.ledger}`);
      console.log(`   Time: ${tx.created_at}`);
      console.log(`   Operations: ${tx.operation_count}`);
      console.log(`   Fee: ${tx.fee_charged} stroops`);
      console.log('');
    });

    console.log('\n📋 To test soroban-trace with any of these:');
    console.log('   node dist/cli.js tx <HASH> --network testnet --verbose\n');
    
    console.log('Example:');
    console.log(`   node dist/cli.js tx ${sorobanTxs[0].hash} --network testnet --verbose\n`);

  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  - Check your internet connection');
    console.log('  - Horizon testnet might be down');
    console.log('  - Try again in a few moments');
  }
}

// Run the script
findSorobanTransactions();


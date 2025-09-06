#!/usr/bin/env tsx
// Festival-Moon Covenant Simulator
// Demonstrates the financial management capabilities of the SPRAXXX ecosystem
import { FestivalMoonLedger } from '../models/festival-moon-ledger.js';
import { AccountType, TransactionType } from '../models/ledger-types.js';
// Color output for terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}
function banner(title) {
    log('\n' + '='.repeat(60), 'cyan');
    log(`  ${title}`, 'bright');
    log('='.repeat(60), 'cyan');
}
function section(title) {
    log(`\n--- ${title} ---`, 'blue');
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function simulateFestivalMoonCovenant() {
    banner('Festival-Moon Covenant Simulator');
    log('Demonstrating SPRAXXX financial management system...', 'green');
    // Initialize in-memory database for simulation
    const ledger = new FestivalMoonLedger(':memory:');
    section('1. Creating Covenant Community');
    // Create steward accounts
    log('Creating steward accounts...', 'yellow');
    const alice = await ledger.createAccount('alice_steward', AccountType.STEWARD);
    const bob = await ledger.createAccount('bob_steward', AccountType.STEWARD);
    const charlie = await ledger.createAccount('charlie_steward', AccountType.STEWARD);
    log(`✓ Alice's account: ${alice.id}`, 'green');
    log(`✓ Bob's account: ${bob.id}`, 'green');
    log(`✓ Charlie's account: ${charlie.id}`, 'green');
    // Create enterprise account
    log('\nCreating covenant enterprise...', 'yellow');
    const enterprise = await ledger.createAccount('alice_steward', AccountType.COVENANT_ENTERPRISE, 'dignified_devs_org');
    log(`✓ Dignified Developers Enterprise: ${enterprise.id}`, 'green');
    // Create community treasury
    log('\nCreating community treasury...', 'yellow');
    const treasury = await ledger.createAccount('spraxxx_treasury', AccountType.COMMUNITY_TREASURY);
    log(`✓ SPRAXXX Community Treasury: ${treasury.id}`, 'green');
    section('2. Initial Funding');
    // Add initial balances (simulating covenant grants)
    log('Adding initial covenant funding...', 'yellow');
    await ledger.addBalance(alice.id, 2000);
    await ledger.addBalance(bob.id, 1500);
    await ledger.addBalance(enterprise.id, 5000);
    await ledger.addBalance(treasury.id, 10000);
    log('✓ Alice: $2,000', 'green');
    log('✓ Bob: $1,500', 'green');
    log('✓ Enterprise: $5,000', 'green');
    log('✓ Treasury: $10,000', 'green');
    await sleep(1000);
    section('3. Covenant Wage Transaction');
    log('Alice hires Bob for web development work...', 'yellow');
    const wageTransaction = await ledger.createTransaction(alice.id, bob.id, 240, // $240 for 16 hours = $15/hour (fair wage)
    TransactionType.COVENANT_WAGE, 'Web development work - 16 hours', 'Fair covenant wage for legitimate development work');
    log(`✓ Transaction created: ${wageTransaction.id}`, 'green');
    log(`  Status: ${wageTransaction.status}`, 'cyan');
    log(`  Dignity Impact Score: ${wageTransaction.dignityImpactScore.toFixed(2)}`, 'cyan');
    const processed = await ledger.processTransaction(wageTransaction.id);
    if (processed) {
        log('✓ Transaction processed successfully!', 'green');
        const aliceAfter = await ledger.getAccount(alice.id);
        const bobAfter = await ledger.getAccount(bob.id);
        log(`  Alice balance: $${aliceAfter?.balance}`, 'cyan');
        log(`  Bob balance: $${bobAfter?.balance}`, 'cyan');
    }
    await sleep(1000);
    section('4. Dignity Preservation Transaction');
    log('Community assists Charlie with emergency housing...', 'yellow');
    const dignityTransaction = await ledger.createTransaction(treasury.id, charlie.id, 800, TransactionType.DIGNITY_PRESERVATION, 'Emergency housing assistance for covenant member', 'Preserving human dignity through community support');
    log(`✓ Dignity transaction: ${dignityTransaction.id}`, 'green');
    log(`  Dignity Impact Score: ${dignityTransaction.dignityImpactScore.toFixed(2)}`, 'cyan');
    await ledger.processTransaction(dignityTransaction.id);
    const charlieAfter = await ledger.getAccount(charlie.id);
    log(`✓ Charlie now has $${charlieAfter?.balance} for housing`, 'green');
    await sleep(1000);
    section('5. Gift Economy Transaction');
    log('Bob shares abundance with community...', 'yellow');
    const giftTransaction = await ledger.createTransaction(bob.id, treasury.id, 100, TransactionType.GIFT_ECONOMY, 'Thanksgiving gift to community treasury');
    await ledger.processTransaction(giftTransaction.id);
    log('✓ Gift processed - building community bonds!', 'green');
    await sleep(1000);
    section('6. SPRAXXX Ignition Key Payment');
    log('Enterprise purchases SPRAXXX ignition keys...', 'yellow');
    const ignitionTransaction = await ledger.createTransaction(enterprise.id, treasury.id, 250, // $50 x 5 keys
    TransactionType.IGNITION_KEY_PAYMENT, 'Enterprise ignition keys - 5 developers', 'Payment for SPRAXXX access and dignity protection');
    await ledger.processTransaction(ignitionTransaction.id);
    log('✓ Enterprise now has access to SPRAXXX services!', 'green');
    await sleep(1000);
    section('7. Stewardship Investment');
    log('Alice invests in community infrastructure...', 'yellow');
    const investmentTransaction = await ledger.createTransaction(alice.id, treasury.id, 300, TransactionType.STEWARDSHIP_INVESTMENT, 'Investment in covenant server infrastructure');
    await ledger.processTransaction(investmentTransaction.id);
    log('✓ Investment supports long-term community growth!', 'green');
    await sleep(1000);
    section('8. Covenant Violation Detection');
    log('Attempting below-fair-wage transaction...', 'yellow');
    try {
        const violationTransaction = await ledger.createTransaction(alice.id, charlie.id, 30, // $30 for development work (below fair wage)
        TransactionType.COVENANT_WAGE, 'Development work - 8 hours' // Would be $3.75/hour
        );
        log(`⚠ Transaction flagged: ${violationTransaction.status}`, 'red');
        log('  Covenant protects workers from exploitation!', 'yellow');
    }
    catch (error) {
        log(`⚠ Transaction prevented: ${error}`, 'red');
    }
    await sleep(1000);
    section('9. Financial Reporting');
    log('Generating financial summaries...', 'yellow');
    const accounts = [
        { name: 'Alice (Steward)', account: alice },
        { name: 'Bob (Developer)', account: bob },
        { name: 'Charlie (Assisted)', account: charlie },
        { name: 'Enterprise', account: enterprise },
        { name: 'Treasury', account: treasury }
    ];
    for (const { name, account } of accounts) {
        const summary = await ledger.getFinancialSummary(account.id);
        log(`\n${name}:`, 'cyan');
        log(`  Balance: $${summary.currentBalance}`, 'green');
        log(`  Income: $${summary.totalIncome}`, 'green');
        log(`  Expenses: $${summary.totalExpenses}`, 'green');
        log(`  Covenant Score: ${summary.covenantScore}`, 'green');
        log(`  Transactions: ${summary.transactionCount}`, 'green');
    }
    await sleep(1000);
    section('10. Transaction History');
    log('Recent community transactions:', 'yellow');
    const treasuryHistory = await ledger.getTransactionHistory(treasury.id, 5);
    for (const tx of treasuryHistory) {
        const isIncoming = tx.toAccountId === treasury.id;
        const direction = isIncoming ? 'Received' : 'Sent';
        const amount = isIncoming ? `+$${tx.amount}` : `-$${tx.amount}`;
        log(`  ${direction} ${amount}: ${tx.description}`, 'cyan');
        log(`    Type: ${tx.type}, Impact: ${tx.dignityImpactScore.toFixed(2)}`, 'magenta');
    }
    banner('Festival-Moon Covenant Demonstration Complete');
    log('Key Accomplishments:', 'green');
    log('✓ Fair wage verification and protection', 'green');
    log('✓ Dignity preservation through community support', 'green');
    log('✓ Gift economy fostering mutual aid', 'green');
    log('✓ Transparent financial management', 'green');
    log('✓ Covenant compliance monitoring', 'green');
    log('✓ Community treasury stewardship', 'green');
    log('\nThe Festival-Moon Covenant demonstrates how financial systems', 'yellow');
    log('can serve human dignity rather than exploit it. Every transaction', 'yellow');
    log('is evaluated for its impact on the covenant community.', 'yellow');
    log('\n"Where your treasure is, there your heart will be also."', 'cyan');
    log('- Matthew 6:21', 'cyan');
    // Close database
    ledger.close();
}
// Run simulation if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    simulateFestivalMoonCovenant().catch(console.error);
}
export { simulateFestivalMoonCovenant };

// Festival-Moon Ledger Test Suite
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FestivalMoonLedger } from '../src/models/festival-moon-ledger.js';
import { AccountType, TransactionType, TransactionStatus } from '../src/models/ledger-types.js';
describe('Festival-Moon Ledger', () => {
    let ledger;
    beforeEach(() => {
        // Create in-memory database for testing
        ledger = new FestivalMoonLedger(':memory:');
    });
    afterEach(() => {
        ledger.close();
    });
    describe('Account Management', () => {
        it('should create a steward account', async () => {
            const account = await ledger.createAccount('steward_123', AccountType.STEWARD);
            expect(account).toBeDefined();
            expect(account.id).toMatch(/^acc_/);
            expect(account.type).toBe(AccountType.STEWARD);
            expect(account.stewardId).toBe('steward_123');
            expect(account.balance).toBe(0);
            expect(account.covenantScore).toBe(100);
            expect(account.isActive).toBe(true);
        });
        it('should create an enterprise account with organization ID', async () => {
            const account = await ledger.createAccount('steward_456', AccountType.COVENANT_ENTERPRISE, 'org_789');
            expect(account.type).toBe(AccountType.COVENANT_ENTERPRISE);
            expect(account.organizationId).toBe('org_789');
        });
        it('should retrieve account by ID', async () => {
            const account = await ledger.createAccount('steward_123', AccountType.STEWARD);
            const retrieved = await ledger.getAccount(account.id);
            expect(retrieved).toEqual(account);
        });
        it('should retrieve accounts by steward ID', async () => {
            await ledger.createAccount('steward_123', AccountType.STEWARD);
            await ledger.createAccount('steward_123', AccountType.COVENANT_ENTERPRISE, 'org_456');
            const accounts = await ledger.getAccountsByStward('steward_123');
            expect(accounts).toHaveLength(2);
            expect(accounts.every(acc => acc.stewardId === 'steward_123')).toBe(true);
        });
        it('should return null for non-existent account', async () => {
            const account = await ledger.getAccount('non_existent');
            expect(account).toBeNull();
        });
    });
    describe('Transaction Creation', () => {
        let fromAccount;
        let toAccount;
        beforeEach(async () => {
            fromAccount = await ledger.createAccount('steward_from', AccountType.STEWARD);
            toAccount = await ledger.createAccount('steward_to', AccountType.STEWARD);
            // Add initial balance to from account
            await ledger.addBalance(fromAccount.id, 1000);
        });
        it('should create a valid covenant wage transaction', async () => {
            const transaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 120, // $120 for 8 hours = $15/hour (meets fair wage)
            TransactionType.COVENANT_WAGE, 'Web development work - 8 hours', 'Fair wage for legitimate development work');
            expect(transaction).toBeDefined();
            expect(transaction.id).toMatch(/^txn_/);
            expect(transaction.amount).toBe(120);
            expect(transaction.type).toBe(TransactionType.COVENANT_WAGE);
            expect(transaction.status).toBe(TransactionStatus.COVENANT_VERIFIED);
            expect(transaction.dignityImpactScore).toBeGreaterThan(0);
        });
        it('should create a dignity preservation transaction', async () => {
            const transaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 50, TransactionType.DIGNITY_PRESERVATION, 'Emergency housing assistance');
            expect(transaction.type).toBe(TransactionType.DIGNITY_PRESERVATION);
            expect(transaction.dignityImpactScore).toBeGreaterThan(0);
        });
        it('should reject transaction with insufficient balance', async () => {
            // Set balance to less than transaction amount
            await ledger.addBalance(fromAccount.id, -950); // Reduce balance to 50
            await expect(ledger.createTransaction(fromAccount.id, toAccount.id, 100, TransactionType.COVENANT_WAGE, 'Test transaction')).rejects.toThrow('Insufficient balance');
        });
        it('should reject transaction with zero or negative amount', async () => {
            await expect(ledger.createTransaction(fromAccount.id, toAccount.id, 0, TransactionType.COVENANT_WAGE, 'Invalid transaction')).rejects.toThrow('Transaction amount must be positive');
            await expect(ledger.createTransaction(fromAccount.id, toAccount.id, -50, TransactionType.COVENANT_WAGE, 'Invalid transaction')).rejects.toThrow('Transaction amount must be positive');
        });
        it('should reject transaction with invalid account IDs', async () => {
            await expect(ledger.createTransaction('invalid_account', toAccount.id, 100, TransactionType.COVENANT_WAGE, 'Invalid transaction')).rejects.toThrow('Invalid account IDs');
        });
    });
    describe('Transaction Processing', () => {
        let fromAccount;
        let toAccount;
        let transaction;
        beforeEach(async () => {
            fromAccount = await ledger.createAccount('steward_from', AccountType.STEWARD);
            toAccount = await ledger.createAccount('steward_to', AccountType.STEWARD);
            // Add initial balance to from account
            await ledger.addBalance(fromAccount.id, 1000);
            transaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 200, TransactionType.COVENANT_WAGE, 'Development work - 10 hours', 'Fair wage payment');
        });
        it('should process a covenant-verified transaction', async () => {
            const success = await ledger.processTransaction(transaction.id);
            expect(success).toBe(true);
            // Check balances were updated
            const fromAccountUpdated = await ledger.getAccount(fromAccount.id);
            const toAccountUpdated = await ledger.getAccount(toAccount.id);
            expect(fromAccountUpdated?.balance).toBe(800); // 1000 - 200
            expect(toAccountUpdated?.balance).toBe(200); // 0 + 200
            // Check transaction status
            const processedTransaction = await ledger.getTransaction(transaction.id);
            expect(processedTransaction?.status).toBe(TransactionStatus.COMPLETED);
            expect(processedTransaction?.processedAt).toBeDefined();
        });
        it('should not process pending transaction', async () => {
            // Force transaction to pending status by recreating it with a different condition
            // Since we can't directly modify the status, we'll create a transaction that would be pending
            // Create a transaction that would fail covenant compliance
            const pendingTransaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 30, // Below fair wage
            TransactionType.COVENANT_WAGE, 'Development work - 8 hours' // Would be below fair wage
            );
            const success = await ledger.processTransaction(pendingTransaction.id);
            expect(success).toBe(false);
        });
        it('should not process covenant violation transaction', async () => {
            // Create a transaction that violates the covenant
            const violationTransaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 50, // Below fair wage for development work
            TransactionType.COVENANT_WAGE, 'Development work' // Would be flagged as below fair wage
            );
            const success = await ledger.processTransaction(violationTransaction.id);
            expect(success).toBe(false);
        });
    });
    describe('Transaction History', () => {
        let account1;
        let account2;
        beforeEach(async () => {
            account1 = await ledger.createAccount('steward_1', AccountType.STEWARD);
            account2 = await ledger.createAccount('steward_2', AccountType.STEWARD);
            // Add initial balance
            await ledger.addBalance(account1.id, 1000);
        });
        it('should retrieve transaction history for account', async () => {
            // Create multiple transactions
            await ledger.createTransaction(account1.id, account2.id, 100, TransactionType.COVENANT_WAGE, 'Transaction 1');
            await ledger.createTransaction(account1.id, account2.id, 150, TransactionType.GIFT_ECONOMY, 'Transaction 2');
            // Add balance to account2 for the third transaction
            await ledger.addBalance(account2.id, 500);
            await ledger.createTransaction(account2.id, account1.id, 75, TransactionType.DIGNITY_PRESERVATION, 'Transaction 3');
            const history = await ledger.getTransactionHistory(account1.id);
            expect(history).toHaveLength(3);
            // Should be ordered by creation time (newest first)
            expect(history[0].description).toBe('Transaction 3');
            expect(history[1].description).toBe('Transaction 2');
            expect(history[2].description).toBe('Transaction 1');
        });
        it('should limit transaction history results', async () => {
            // Create 10 transactions
            for (let i = 0; i < 10; i++) {
                await ledger.createTransaction(account1.id, account2.id, 10, TransactionType.COVENANT_WAGE, `Transaction ${i}`);
            }
            const limitedHistory = await ledger.getTransactionHistory(account1.id, 5);
            expect(limitedHistory).toHaveLength(5);
        });
    });
    describe('Covenant Compliance', () => {
        let fromAccount;
        let toAccount;
        beforeEach(async () => {
            fromAccount = await ledger.createAccount('steward_from', AccountType.STEWARD);
            toAccount = await ledger.createAccount('steward_to', AccountType.STEWARD);
            await ledger.addBalance(fromAccount.id, 1000);
        });
        it('should verify fair wage for development work', async () => {
            const transaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 120, // $120 for 8 hours = $15/hour (fair wage)
            TransactionType.COVENANT_WAGE, 'Development work - 8 hours');
            expect(transaction.status).toBe(TransactionStatus.COVENANT_VERIFIED);
        });
        it('should flag below fair wage transactions', async () => {
            const transaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 50, // $50 for estimated development work (below fair wage)
            TransactionType.COVENANT_WAGE, 'Development work');
            expect(transaction.status).toBe(TransactionStatus.COVENANT_VIOLATION);
        });
        it('should approve gift economy transactions without wage verification', async () => {
            const transaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 25, TransactionType.GIFT_ECONOMY, 'Community support gift');
            expect(transaction.status).toBe(TransactionStatus.COVENANT_VERIFIED);
        });
    });
    describe('Financial Reporting', () => {
        let account;
        let otherAccount;
        beforeEach(async () => {
            account = await ledger.createAccount('steward_test', AccountType.STEWARD);
            otherAccount = await ledger.createAccount('steward_other', AccountType.STEWARD);
            // Set initial balances
            await ledger.addBalance(account.id, 500);
            await ledger.addBalance(otherAccount.id, 1000);
        });
        it('should generate financial summary for account', async () => {
            // Create and process some transactions
            const transaction1 = await ledger.createTransaction(otherAccount.id, account.id, 200, TransactionType.COVENANT_WAGE, 'Income transaction');
            await ledger.processTransaction(transaction1.id);
            const transaction2 = await ledger.createTransaction(account.id, otherAccount.id, 100, TransactionType.STEWARDSHIP_INVESTMENT, 'Expense transaction');
            await ledger.processTransaction(transaction2.id);
            const summary = await ledger.getFinancialSummary(account.id);
            expect(summary.accountId).toBe(account.id);
            expect(summary.currentBalance).toBe(600); // 500 + 200 - 100
            expect(summary.totalIncome).toBe(200);
            expect(summary.totalExpenses).toBe(100);
            expect(summary.transactionCount).toBe(2);
            expect(summary.covenantScore).toBe(100);
            expect(summary.lastActivity).toBeDefined();
        });
        it('should handle account with no transactions', async () => {
            const summary = await ledger.getFinancialSummary(account.id);
            expect(summary.currentBalance).toBe(500);
            expect(summary.totalIncome).toBe(0);
            expect(summary.totalExpenses).toBe(0);
            expect(summary.transactionCount).toBe(0);
        });
        it('should throw error for non-existent account', async () => {
            await expect(ledger.getFinancialSummary('non_existent')).rejects.toThrow('Account not found');
        });
    });
    describe('Dignity Impact Calculation', () => {
        let fromAccount;
        let toAccount;
        beforeEach(async () => {
            fromAccount = await ledger.createAccount('steward_from', AccountType.STEWARD);
            toAccount = await ledger.createAccount('steward_to', AccountType.STEWARD);
            await ledger.addBalance(fromAccount.id, 1000);
        });
        it('should calculate higher dignity impact for dignity preservation', async () => {
            const dignityTransaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 100, TransactionType.DIGNITY_PRESERVATION, 'Housing assistance');
            const wageTransaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 100, TransactionType.COVENANT_WAGE, 'Regular work payment');
            expect(dignityTransaction.dignityImpactScore).toBeGreaterThan(wageTransaction.dignityImpactScore);
        });
        it('should scale dignity impact with transaction amount', async () => {
            const smallTransaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 50, TransactionType.GIFT_ECONOMY, 'Small gift');
            const largeTransaction = await ledger.createTransaction(fromAccount.id, toAccount.id, 500, TransactionType.GIFT_ECONOMY, 'Large gift');
            expect(largeTransaction.dignityImpactScore).toBeGreaterThan(smallTransaction.dignityImpactScore);
        });
    });
});

import { Account, Transaction, FinancialSummary, AccountType, TransactionType } from './ledger-types.js';
export declare class FestivalMoonLedger {
    private db;
    private dbRun;
    private dbGet;
    private dbAll;
    constructor(dbPath?: string);
    private initializeTablesSync;
    createAccount(stewardId: string, type: AccountType, organizationId?: string): Promise<Account>;
    getAccount(accountId: string): Promise<Account | null>;
    getAccountsByStward(stewardId: string): Promise<Account[]>;
    createTransaction(fromAccountId: string, toAccountId: string, amount: number, type: TransactionType, description: string, covenantJustification?: string): Promise<Transaction>;
    private calculateDignityImpact;
    processTransaction(transactionId: string): Promise<boolean>;
    getTransaction(transactionId: string): Promise<Transaction | null>;
    getTransactionHistory(accountId: string, limit?: number): Promise<Transaction[]>;
    private performCovenantCompliance;
    private verifyFairWage;
    private estimateWorkHours;
    getFinancialSummary(accountId: string): Promise<FinancialSummary>;
    addBalance(accountId: string, amount: number): Promise<void>;
    close(): void;
}

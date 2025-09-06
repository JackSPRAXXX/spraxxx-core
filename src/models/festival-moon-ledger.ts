// Festival-Moon Ledger Implementation (using sqlite3)
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import {
  Account,
  Transaction,
  CovenantCompliance,
  FinancialSummary,
  AccountType,
  TransactionType,
  TransactionStatus
} from './ledger-types.js';

export class FestivalMoonLedger {
  private db: sqlite3.Database;
  private dbRun: (sql: string, ...params: any[]) => Promise<any>;
  private dbGet: (sql: string, ...params: any[]) => Promise<any>;
  private dbAll: (sql: string, ...params: any[]) => Promise<any[]>;

  constructor(dbPath: string = ':memory:') {
    this.db = new sqlite3.Database(dbPath);
    this.dbRun = promisify(this.db.run.bind(this.db));
    this.dbGet = promisify(this.db.get.bind(this.db));
    this.dbAll = promisify(this.db.all.bind(this.db));
    // Initialize tables synchronously to ensure they exist before any operations
    this.initializeTablesSync();
  }

  private initializeTablesSync(): void {
    const tables = `
      CREATE TABLE IF NOT EXISTS ledger_accounts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        steward_id TEXT NOT NULL,
        organization_id TEXT,
        balance REAL DEFAULT 0,
        covenant_score REAL DEFAULT 100,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS ledger_transactions (
        id TEXT PRIMARY KEY,
        from_account_id TEXT NOT NULL,
        to_account_id TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT NOT NULL,
        covenant_justification TEXT,
        dignity_impact_score REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        processed_at TEXT,
        metadata TEXT,
        FOREIGN KEY (from_account_id) REFERENCES ledger_accounts(id),
        FOREIGN KEY (to_account_id) REFERENCES ledger_accounts(id)
      );

      CREATE TABLE IF NOT EXISTS covenant_compliance (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL UNIQUE,
        is_compliant BOOLEAN DEFAULT 0,
        fair_wage_verified BOOLEAN DEFAULT 0,
        dignity_impact_score REAL DEFAULT 0,
        notes TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        FOREIGN KEY (transaction_id) REFERENCES ledger_transactions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_steward ON ledger_accounts(steward_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_from ON ledger_transactions(from_account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_to ON ledger_transactions(to_account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON ledger_transactions(status);
    `;

    // Execute table creation statements synchronously
    this.db.exec(tables);
  }

  // Account Management
  async createAccount(
    stewardId: string, 
    type: AccountType, 
    organizationId?: string
  ): Promise<Account> {
    const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    await this.dbRun(`
      INSERT INTO ledger_accounts 
      (id, type, steward_id, organization_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, id, type, stewardId, organizationId, now, now);
    
    return this.getAccount(id) as Promise<Account>;
  }

  async getAccount(accountId: string): Promise<Account | null> {
    const row = await this.dbGet(`
      SELECT * FROM ledger_accounts WHERE id = ?
    `, accountId);
    
    if (!row) return null;
    
    return {
      id: row.id,
      type: row.type as AccountType,
      stewardId: row.steward_id,
      organizationId: row.organization_id,
      balance: row.balance,
      covenantScore: row.covenant_score,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: !!row.is_active
    };
  }

  async getAccountsByStward(stewardId: string): Promise<Account[]> {
    const rows = await this.dbAll(`
      SELECT * FROM ledger_accounts WHERE steward_id = ? AND is_active = 1
    `, stewardId);
    
    return rows.map(row => ({
      id: row.id,
      type: row.type as AccountType,
      stewardId: row.steward_id,
      organizationId: row.organization_id,
      balance: row.balance,
      covenantScore: row.covenant_score,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: !!row.is_active
    }));
  }

  // Transaction Management
  async createTransaction(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    type: TransactionType,
    description: string,
    covenantJustification?: string
  ): Promise<Transaction> {
    if (amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }

    const fromAccount = await this.getAccount(fromAccountId);
    const toAccount = await this.getAccount(toAccountId);
    
    if (!fromAccount || !toAccount) {
      throw new Error('Invalid account IDs');
    }

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient balance');
    }

    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Calculate dignity impact score based on transaction type
    const dignityImpactScore = this.calculateDignityImpact(type, amount);
    
    await this.dbRun(`
      INSERT INTO ledger_transactions 
      (id, from_account_id, to_account_id, amount, type, status, description, 
       covenant_justification, dignity_impact_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, id, fromAccountId, toAccountId, amount, type, 
    TransactionStatus.PENDING, description, covenantJustification, 
    dignityImpactScore, now);

    // Perform covenant compliance check
    await this.performCovenantCompliance(id);
    
    return this.getTransaction(id) as Promise<Transaction>;
  }

  private calculateDignityImpact(type: TransactionType, amount: number): number {
    const baseScore = {
      [TransactionType.COVENANT_WAGE]: 10,
      [TransactionType.DIGNITY_PRESERVATION]: 15,
      [TransactionType.STEWARDSHIP_INVESTMENT]: 8,
      [TransactionType.GIFT_ECONOMY]: 12,
      [TransactionType.IGNITION_KEY_PAYMENT]: 5
    }[type];

    // Scale by transaction size (logarithmic to prevent gaming)
    return baseScore + Math.log(amount + 1) * 2;
  }

  async processTransaction(transactionId: string): Promise<boolean> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.COVENANT_VERIFIED) {
      return false;
    }

    try {
      // Debit from account
      await this.dbRun(`
        UPDATE ledger_accounts SET balance = balance - ? WHERE id = ?
      `, transaction.amount, transaction.fromAccountId);
      
      // Credit to account  
      await this.dbRun(`
        UPDATE ledger_accounts SET balance = balance + ? WHERE id = ?
      `, transaction.amount, transaction.toAccountId);
      
      // Update transaction status
      await this.dbRun(`
        UPDATE ledger_transactions SET status = ?, processed_at = ? WHERE id = ?
      `, TransactionStatus.COMPLETED, new Date().toISOString(), transactionId);
      
      return true;
    } catch (error) {
      console.error('Transaction processing failed:', error);
      await this.dbRun(`
        UPDATE ledger_transactions SET status = ?, processed_at = ? WHERE id = ?
      `, TransactionStatus.FAILED, new Date().toISOString(), transactionId);
      return false;
    }
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    const row = await this.dbGet(`
      SELECT * FROM ledger_transactions WHERE id = ?
    `, transactionId);
    
    if (!row) return null;
    
    return {
      id: row.id,
      fromAccountId: row.from_account_id,
      toAccountId: row.to_account_id,
      amount: row.amount,
      type: row.type as TransactionType,
      status: row.status as TransactionStatus,
      description: row.description,
      covenantJustification: row.covenant_justification,
      dignityImpactScore: row.dignity_impact_score,
      createdAt: new Date(row.created_at),
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  async getTransactionHistory(accountId: string, limit: number = 50): Promise<Transaction[]> {
    const rows = await this.dbAll(`
      SELECT * FROM ledger_transactions 
      WHERE from_account_id = ? OR to_account_id = ?
      ORDER BY created_at DESC 
      LIMIT ?
    `, accountId, accountId, limit);
    
    return rows.map(row => ({
      id: row.id,
      fromAccountId: row.from_account_id,
      toAccountId: row.to_account_id,
      amount: row.amount,
      type: row.type as TransactionType,
      status: row.status as TransactionStatus,
      description: row.description,
      covenantJustification: row.covenant_justification,
      dignityImpactScore: row.dignity_impact_score,
      createdAt: new Date(row.created_at),
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  // Covenant Compliance
  private async performCovenantCompliance(transactionId: string): Promise<void> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) return;

    let isCompliant = true;
    let fairWageVerified = false;
    const notes: string[] = [];

    // Check fair wage compliance for covenant wages
    if (transaction.type === TransactionType.COVENANT_WAGE) {
      fairWageVerified = this.verifyFairWage(transaction.amount, transaction.description);
      if (!fairWageVerified) {
        notes.push('Potential below-fair-wage payment detected');
        isCompliant = false;
      }
    }

    // Check dignity impact
    if (transaction.dignityImpactScore < 0) {
      notes.push('Negative dignity impact detected');
      isCompliant = false;
    }

    const complianceId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.dbRun(`
      INSERT INTO covenant_compliance 
      (id, transaction_id, is_compliant, fair_wage_verified, dignity_impact_score, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, complianceId, transactionId, isCompliant, fairWageVerified, 
    transaction.dignityImpactScore, JSON.stringify(notes));

    // Update transaction status based on compliance
    const newStatus = isCompliant ? TransactionStatus.COVENANT_VERIFIED : TransactionStatus.COVENANT_VIOLATION;
    await this.dbRun(`
      UPDATE ledger_transactions SET status = ? WHERE id = ?
    `, newStatus, transactionId);
  }

  private verifyFairWage(amount: number, description: string): boolean {
    // Simple fair wage verification - could be enhanced with more sophisticated logic
    const minHourlyWage = 15; // Base covenant minimum wage
    const estimatedHours = this.estimateWorkHours(description);
    
    return amount >= (minHourlyWage * estimatedHours);
  }

  private estimateWorkHours(description: string): number {
    // Enhanced heuristic - look for explicit hour mentions first
    const hourMatch = description.match(/(\d+)\s*hours?/i);
    if (hourMatch) {
      return parseInt(hourMatch[1]);
    }

    // Simple heuristic - could be enhanced with ML or manual specification
    const keywordHours: Record<string, number> = {
      'consultation': 1,
      'development': 8,
      'design': 4,
      'review': 2,
      'meeting': 1,
      'project': 40
    };

    for (const [keyword, hours] of Object.entries(keywordHours)) {
      if (description.toLowerCase().includes(keyword)) {
        return hours;
      }
    }
    
    return 1; // Default to 1 hour minimum
  }

  // Financial Reporting
  async getFinancialSummary(accountId: string): Promise<FinancialSummary> {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const transactionStats = await this.dbGet(`
      SELECT 
        SUM(CASE WHEN to_account_id = ? THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN from_account_id = ? THEN amount ELSE 0 END) as total_expenses,
        COUNT(*) as transaction_count,
        MAX(created_at) as last_activity
      FROM ledger_transactions 
      WHERE (from_account_id = ? OR to_account_id = ?) AND status = ?
    `, accountId, accountId, accountId, accountId, TransactionStatus.COMPLETED);

    return {
      accountId: account.id,
      currentBalance: account.balance,
      totalIncome: transactionStats.total_income || 0,
      totalExpenses: transactionStats.total_expenses || 0,
      covenantScore: account.covenantScore,
      transactionCount: transactionStats.transaction_count || 0,
      lastActivity: transactionStats.last_activity ? new Date(transactionStats.last_activity) : account.createdAt
    };
  }

  // Add method to add balance for testing
  async addBalance(accountId: string, amount: number): Promise<void> {
    await this.dbRun('UPDATE ledger_accounts SET balance = balance + ? WHERE id = ?', amount, accountId);
  }

  // Close database connection
  close(): void {
    this.db.close();
  }
}
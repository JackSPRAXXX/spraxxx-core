// SQLite model and schema with Festival-Moon integration
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { FestivalMoonLedger } from './festival-moon-ledger.js';
import { AccountType, TransactionType } from './ledger-types.js';

const db = new sqlite3.Database('database.db');
const dbRun = promisify(db.run.bind(db)) as (sql: string, ...params: any[]) => Promise<any>;
const dbGet = promisify(db.get.bind(db)) as (sql: string, ...params: any[]) => Promise<any>;
const dbAll = promisify(db.all.bind(db)) as (sql: string, ...params: any[]) => Promise<any[]>;

export const festivalMoonLedger = new FestivalMoonLedger('database.db');

export async function createTables() {
    const tables = `
        CREATE TABLE IF NOT EXISTS entitlements (
            id INTEGER PRIMARY KEY,
            userId INTEGER,
            active BOOLEAN,
            ledger_account_id TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY,
            userId INTEGER,
            amount REAL,
            transaction_id TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY,
            userId INTEGER,
            deviceName TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            password TEXT,
            steward_id TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS peer_keys (
            id INTEGER PRIMARY KEY,
            userId INTEGER,
            publicKey TEXT,
            createdAt TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
        );
    `;

    // Execute table creation statements one by one
    const statements = tables.split(';').filter(stmt => stmt.trim());
    for (const stmt of statements) {
        if (stmt.trim()) {
            await dbRun(stmt);
        }
    }
}

// Enhanced entitlement validation with Festival-Moon integration
export async function validateEntitlement(userId: number): Promise<boolean> {
    try {
        const user = await getUserById(userId);
        if (!user || !user.steward_id) return false;

        // Get user's accounts from Festival-Moon ledger
        const accounts = await festivalMoonLedger.getAccountsByStward(user.steward_id);
        
        // Check if user has any active account with sufficient balance for services
        const hasValidAccount = accounts.some(account => 
            account.isActive && 
            account.balance >= 0 && 
            account.covenantScore >= 50 // Minimum covenant compliance score
        );

        if (!hasValidAccount) return false;

        // Check database entitlement status
        const entitlement = await dbGet('SELECT active FROM entitlements WHERE userId = ?', userId) as { active: boolean } | undefined;
        
        return entitlement?.active ?? false;
    } catch (error) {
        console.error('Entitlement validation error:', error);
        return false;
    }
}

export async function storePeerPublicKey(userId: number, peerPublicKey: string): Promise<void> {
    await dbRun(`
        INSERT INTO peer_keys (userId, publicKey, createdAt) 
        VALUES (?, ?, ?)
    `, userId, peerPublicKey, new Date().toISOString());
}

// User management functions
export async function createUser(username: string, password: string): Promise<number> {
    const stewardId = `steward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await dbRun(`
        INSERT INTO users (username, password, steward_id) 
        VALUES (?, ?, ?)
    `, username, password, stewardId) as { lastID: number };
    
    const userId = result.lastID as number;
    
    // Create default steward account in Festival-Moon ledger
    try {
        const account = await festivalMoonLedger.createAccount(stewardId, AccountType.STEWARD);
        
        // Create entitlement record linked to ledger account
        await dbRun(`
            INSERT INTO entitlements (userId, active, ledger_account_id) 
            VALUES (?, ?, ?)
        `, userId, true, account.id);
    } catch (error) {
        console.error('Error creating ledger account:', error);
    }
    
    return userId;
}

export async function getUserById(userId: number): Promise<{ id: number; username: string; steward_id: string } | null> {
    return await dbGet('SELECT id, username, steward_id FROM users WHERE id = ?', userId) as any;
}

export async function getUserByUsername(username: string): Promise<{ id: number; username: string; steward_id: string } | null> {
    return await dbGet('SELECT id, username, steward_id FROM users WHERE username = ?', username) as any;
}

// Purchase tracking with Festival-Moon integration
export async function recordPurchase(
    userId: number, 
    amount: number, 
    description: string,
    paymentAccountId?: string
): Promise<string | null> {
    try {
        const user = await getUserById(userId);
        if (!user) throw new Error('User not found');

        // Get user's primary account or use specified payment account
        let fromAccountId = paymentAccountId;
        if (!fromAccountId) {
            const accounts = await festivalMoonLedger.getAccountsByStward(user.steward_id);
            const primaryAccount = accounts.find(acc => acc.type === AccountType.STEWARD);
            if (!primaryAccount) throw new Error('No payment account available');
            fromAccountId = primaryAccount.id;
        }

        // Create SPRAXXX treasury account if it doesn't exist
        const treasuryAccounts = await festivalMoonLedger.getAccountsByStward('spraxxx_treasury');
        let treasuryAccount = treasuryAccounts.find(acc => acc.type === AccountType.COMMUNITY_TREASURY);
        
        if (!treasuryAccount) {
            treasuryAccount = await festivalMoonLedger.createAccount(
                'spraxxx_treasury', 
                AccountType.COMMUNITY_TREASURY
            );
        }

        // Create transaction for ignition key payment
        const transaction = await festivalMoonLedger.createTransaction(
            fromAccountId,
            treasuryAccount.id,
            amount,
            TransactionType.IGNITION_KEY_PAYMENT,
            description,
            'Payment for SPRAXXX ignition key access'
        );

        // Process the transaction
        const processed = await festivalMoonLedger.processTransaction(transaction.id);
        
        if (processed) {
            // Record purchase in local database
            await dbRun(`
                INSERT INTO purchases (userId, amount, transaction_id) 
                VALUES (?, ?, ?)
            `, userId, amount, transaction.id);
            
            return transaction.id;
        }
        
        return null;
    } catch (error) {
        console.error('Purchase recording error:', error);
        return null;
    }
}

// Initialize tables on module load
createTables();

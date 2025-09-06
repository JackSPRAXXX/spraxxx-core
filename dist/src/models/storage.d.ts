import { FestivalMoonLedger } from './festival-moon-ledger.js';
export declare const festivalMoonLedger: FestivalMoonLedger;
export declare function createTables(): Promise<void>;
export declare function validateEntitlement(userId: number): Promise<boolean>;
export declare function storePeerPublicKey(userId: number, peerPublicKey: string): Promise<void>;
export declare function createUser(username: string, password: string): Promise<number>;
export declare function getUserById(userId: number): Promise<{
    id: number;
    username: string;
    steward_id: string;
} | null>;
export declare function getUserByUsername(username: string): Promise<{
    id: number;
    username: string;
    steward_id: string;
} | null>;
export declare function recordPurchase(userId: number, amount: number, description: string, paymentAccountId?: string): Promise<string | null>;

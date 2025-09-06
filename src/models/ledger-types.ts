// Festival-Moon Ledger Types and Interfaces
export enum AccountType {
  STEWARD = 'steward',
  COVENANT_ENTERPRISE = 'covenant_enterprise', 
  COMMUNITY_TREASURY = 'community_treasury'
}

export enum TransactionType {
  COVENANT_WAGE = 'covenant_wage',
  DIGNITY_PRESERVATION = 'dignity_preservation',
  STEWARDSHIP_INVESTMENT = 'stewardship_investment',
  GIFT_ECONOMY = 'gift_economy',
  IGNITION_KEY_PAYMENT = 'ignition_key_payment'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COVENANT_VERIFIED = 'covenant_verified',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COVENANT_VIOLATION = 'covenant_violation'
}

export interface Account {
  id: string;
  type: AccountType;
  stewardId: string;
  organizationId?: string;
  balance: number;
  covenantScore: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  covenantJustification?: string;
  dignityImpactScore: number;
  createdAt: Date;
  processedAt?: Date;
  metadata?: Record<string, any>;
}

export interface CovenantCompliance {
  transactionId: string;
  isCompliant: boolean;
  fairWageVerified: boolean;
  dignityImpactScore: number;
  notes: string[];
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface FinancialSummary {
  accountId: string;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  covenantScore: number;
  transactionCount: number;
  lastActivity: Date;
}
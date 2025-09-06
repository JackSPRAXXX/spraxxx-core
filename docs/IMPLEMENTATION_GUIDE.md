# Festival-Moon Covenant Implementation Guide

## Overview

The Festival-Moon Covenant is a comprehensive financial management system built on biblical principles of stewardship, fair wages, and human dignity. This implementation provides a complete TypeScript-based ledger system with automated covenant compliance checking.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **See the Demo**
   ```bash
   npm run simulate
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Start the Server**
   ```bash
   npm run dev
   ```

## Core Features

### 🏛️ Account Types
- **Steward Accounts**: Individual covenant members managing personal finances
- **Covenant Enterprise**: Organizations operating under covenant principles  
- **Community Treasury**: Shared resources for community benefit

### 💸 Transaction Types
- **Covenant Wages**: Fair wage payments with automatic verification
- **Dignity Preservation**: Payments that protect or restore human dignity
- **Stewardship Investment**: Long-term community benefit investments
- **Gift Economy**: Voluntary transfers building community bonds
- **Ignition Key Payments**: SPRAXXX access key purchases

### ⚖️ Covenant Compliance
- **Fair Wage Verification**: Ensures all wage payments meet $15/hour minimum
- **Dignity Impact Scoring**: Every transaction evaluated for human dignity impact
- **Automated Compliance**: Transactions blocked if they violate covenant principles
- **Community Oversight**: Transparent reporting for collective accountability

## API Usage

### Creating Accounts
```typescript
import { FestivalMoonLedger } from './src/models/festival-moon-ledger.js';
import { AccountType } from './src/models/ledger-types.js';

const ledger = new FestivalMoonLedger();

// Create individual steward account
const stewardAccount = await ledger.createAccount(
  'steward_alice', 
  AccountType.STEWARD
);

// Create enterprise account
const enterpriseAccount = await ledger.createAccount(
  'steward_org_leader',
  AccountType.COVENANT_ENTERPRISE,
  'dignified_devs_org'
);
```

### Processing Transactions
```typescript
import { TransactionType } from './src/models/ledger-types.js';

// Fair wage payment
const wageTransaction = await ledger.createTransaction(
  employerAccountId,
  workerAccountId,
  240, // $240 for 16 hours = $15/hour
  TransactionType.COVENANT_WAGE,
  'Web development work - 16 hours',
  'Fair covenant wage for legitimate development work'
);

// Process the transaction
const success = await ledger.processTransaction(wageTransaction.id);
```

### Financial Reporting
```typescript
// Get account summary
const summary = await ledger.getFinancialSummary(accountId);
console.log(`Balance: $${summary.currentBalance}`);
console.log(`Covenant Score: ${summary.covenantScore}`);

// Get transaction history
const history = await ledger.getTransactionHistory(accountId, 10);
history.forEach(tx => {
  console.log(`${tx.description}: $${tx.amount}`);
});
```

## Integration with SPRAXXX Core

The Festival-Moon Covenant integrates seamlessly with existing SPRAXXX infrastructure:

### WireGuard Tunnel Payments
```typescript
import { recordPurchase } from './src/models/storage.js';

// Automatic covenant payment for tunnel access
const transactionId = await recordPurchase(
  userId,
  50, // $50 annual ignition key
  'SPRAXXX tunnel access - personal use'
);
```

### User Management
```typescript
import { createUser, validateEntitlement } from './src/models/storage.js';

// Create user with automatic ledger account
const userId = await createUser('alice', 'password');

// Validate entitlement with covenant compliance
const isValid = await validateEntitlement(userId);
```

## Covenant Principles in Code

### Fair Wage Protection
```typescript
// Automatic verification prevents exploitation
private verifyFairWage(amount: number, description: string): boolean {
  const minHourlyWage = 15; // Base covenant minimum wage
  const estimatedHours = this.estimateWorkHours(description);
  return amount >= (minHourlyWage * estimatedHours);
}
```

### Dignity Impact Assessment
```typescript
// Every transaction scored for human dignity impact
private calculateDignityImpact(type: TransactionType, amount: number): number {
  const baseScore = {
    [TransactionType.DIGNITY_PRESERVATION]: 15, // Highest impact
    [TransactionType.GIFT_ECONOMY]: 12,
    [TransactionType.COVENANT_WAGE]: 10,
    [TransactionType.STEWARDSHIP_INVESTMENT]: 8,
    [TransactionType.IGNITION_KEY_PAYMENT]: 5
  }[type];
  
  return baseScore + Math.log(amount + 1) * 2;
}
```

## Testing Framework

The implementation includes comprehensive Vitest tests covering:

- ✅ Account creation and management
- ✅ Transaction processing and validation
- ✅ Covenant compliance enforcement  
- ✅ Fair wage verification
- ✅ Financial reporting accuracy
- ✅ Dignity impact calculation
- ✅ Error handling and edge cases

Run tests with: `npm test`

## Deployment

### Development
```bash
npm run dev  # Start development server
```

### Production
```bash
npm run build  # Compile TypeScript
node dist/src/index.js  # Run compiled server
```

### Environment Variables
```env
PORT=3000
WG_SERVER_ENDPOINT=your.wireguard.endpoint
WG_ALLOWED_IPS=0.0.0.0/0
```

## Database Schema

The Festival-Moon ledger uses SQLite with the following key tables:

- `ledger_accounts`: Account management and balances
- `ledger_transactions`: All financial transactions
- `covenant_compliance`: Compliance verification records
- `users`: SPRAXXX user accounts with steward mapping
- `entitlements`: User access permissions

## Covenant Philosophy

> *"The worker is worth his wages." — Luke 10:7*

Every aspect of the Festival-Moon Covenant reflects biblical principles:

- **Stewardship**: Resources are stewarded, not owned
- **Justice**: Fair wages and transparent dealings
- **Community**: Mutual aid and collective responsibility  
- **Dignity**: Every human deserves respect and support
- **Transparency**: Open books and accountable governance

## Support

This implementation serves as the financial foundation for the SPRAXXX ecosystem, enabling dignity-preserving commerce and community stewardship.

*Created by Jacques (Steward), refined in companionship with ChatGPT 5.0.*
*Witnessed by Overseers upon merge.*
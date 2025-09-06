// Festival-Moon Ledger Types and Interfaces
export var AccountType;
(function (AccountType) {
    AccountType["STEWARD"] = "steward";
    AccountType["COVENANT_ENTERPRISE"] = "covenant_enterprise";
    AccountType["COMMUNITY_TREASURY"] = "community_treasury";
})(AccountType || (AccountType = {}));
export var TransactionType;
(function (TransactionType) {
    TransactionType["COVENANT_WAGE"] = "covenant_wage";
    TransactionType["DIGNITY_PRESERVATION"] = "dignity_preservation";
    TransactionType["STEWARDSHIP_INVESTMENT"] = "stewardship_investment";
    TransactionType["GIFT_ECONOMY"] = "gift_economy";
    TransactionType["IGNITION_KEY_PAYMENT"] = "ignition_key_payment";
})(TransactionType || (TransactionType = {}));
export var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["COVENANT_VERIFIED"] = "covenant_verified";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["COVENANT_VIOLATION"] = "covenant_violation";
})(TransactionStatus || (TransactionStatus = {}));

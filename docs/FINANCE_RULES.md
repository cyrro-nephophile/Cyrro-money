# Finance ledger rules

## Source of truth

Transactions are the source of truth. Account balances are derived from opening balances and the complete transaction ledger; code must not increment or decrement a stored balance as the canonical value.

## Transaction rules

- `income`: adds the amount to `accountId`.
- `expense`: subtracts the amount from `accountId`.
- `transfer`: subtracts from `accountId` and adds to `destinationAccountId`.
- Transfers are excluded from income and expense summaries.
- Amounts are positive safe integers representing whole Rupiah. Do not use floating-point amounts.
- A transfer must have two different existing accounts.
- Editing or deleting a transaction means recalculating from the resulting ledger.

## Balance formula

`balance = openingBalance + income - expense + transferIn - transferOut`

Negative balances are currently permitted by the calculation layer. The product can add a configurable or explicit insufficient-funds policy later without corrupting ledger arithmetic.

## Storage requirements

When persistence is connected, multi-record writes (especially transfers and restore operations) must be atomic. Validate account references and transaction shape before committing. Browser IndexedDB and Android SQLite should implement the same repository contract.

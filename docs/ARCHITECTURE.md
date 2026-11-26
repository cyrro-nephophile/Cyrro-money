# Architecture

## Product constraints
- Offline-first, single-user app; no account, cloud sync, ads, or tracking.
- Currency: IDR (Rupiah).
- Money is stored as integer units, never floating-point values.
- Account balances are derived from opening balances and the transaction ledger.
- Transfers change account balances but are not income or expense.

## Runtime targets

### Browser preview
- Vite serves the app.
- IndexedDB stores browser test data.
- Service Worker / Cache Storage stores only the app shell and static assets.
- Clearing browser storage may erase preview data; this is not the durable Android database.

### Android
- Capacitor hosts the same web UI.
- Native persistence will use SQLite in app-private storage.
- Storage adapters keep feature logic independent from the platform database.
- Android backup/export will be implemented explicitly; app data is not synced to a server.

## Planned domain model
- Account: id, name, kind, openingBalance, createdAt, updatedAt
- Transaction: id, type, amount, sourceAccountId, destinationAccountId, categoryId, note, transactionDate, createdAt, updatedAt
- Category: id, name, kind, icon, isDefault
- Budget: id, categoryId, period, limitAmount
- Settings: theme and app configuration

## Balance rule
For each account:

`opening balance + income - expense + transfer in - transfer out`

Recalculate from the ledger after edits, deletes, imports, and restores. Use database transactions for multi-record operations.

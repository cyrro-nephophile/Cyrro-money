const TRANSACTION_TYPES = new Set(['income', 'expense', 'transfer']);

export function validateTransaction(transaction, accountIds) {
  if (!transaction || typeof transaction !== 'object') {
    throw new TypeError('Transaksi tidak valid.');
  }
  if (!TRANSACTION_TYPES.has(transaction.type)) {
    throw new TypeError('Jenis transaksi tidak dikenal.');
  }
  if (!Number.isSafeInteger(transaction.amount) || transaction.amount <= 0) {
    throw new RangeError('Nominal harus berupa bilangan Rupiah positif yang aman.');
  }
  if (!transaction.accountId || !accountIds.has(transaction.accountId)) {
    throw new Error('Dompet sumber tidak ditemukan.');
  }

  if (transaction.type === 'transfer') {
    if (!transaction.destinationAccountId || !accountIds.has(transaction.destinationAccountId)) {
      throw new Error('Dompet tujuan transfer tidak ditemukan.');
    }
    if (transaction.destinationAccountId === transaction.accountId) {
      throw new Error('Dompet asal dan tujuan harus berbeda.');
    }
  } else if (transaction.destinationAccountId != null) {
    throw new Error('Hanya transfer yang boleh memiliki dompet tujuan.');
  }

  return true;
}

/**
 * Derive balances from opening balances and the transaction ledger.
 * The ledger remains the source of truth; balances are never incremented in place.
 */
export function calculateAccountBalances(accounts, transactions) {
  const balances = new Map();
  const accountIds = new Set();

  for (const account of accounts) {
    if (!account?.id || accountIds.has(account.id)) {
      throw new Error('ID dompet kosong atau duplikat.');
    }
    if (!Number.isSafeInteger(account.openingBalance)) {
      throw new TypeError('Saldo awal harus berupa bilangan Rupiah yang aman.');
    }
    accountIds.add(account.id);
    balances.set(account.id, account.openingBalance);
  }

  for (const transaction of transactions) {
    validateTransaction(transaction, accountIds);

    if (transaction.type === 'income') {
      balances.set(transaction.accountId, balances.get(transaction.accountId) + transaction.amount);
    } else if (transaction.type === 'expense') {
      balances.set(transaction.accountId, balances.get(transaction.accountId) - transaction.amount);
    } else {
      balances.set(transaction.accountId, balances.get(transaction.accountId) - transaction.amount);
      balances.set(
        transaction.destinationAccountId,
        balances.get(transaction.destinationAccountId) + transaction.amount
      );
    }

    for (const id of transaction.type === 'transfer'
      ? [transaction.accountId, transaction.destinationAccountId]
      : [transaction.accountId]) {
      if (!Number.isSafeInteger(balances.get(id))) {
        throw new RangeError('Hasil saldo melebihi batas angka aman JavaScript.');
      }
    }
  }

  return balances;
}

export function summarizeTransactions(transactions) {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    if (transaction.type === 'income') income += transaction.amount;
    if (transaction.type === 'expense') expense += transaction.amount;
  }

  if (!Number.isSafeInteger(income) || !Number.isSafeInteger(expense)) {
    throw new RangeError('Total transaksi melebihi batas angka aman JavaScript.');
  }

  const net = income - expense;
  if (!Number.isSafeInteger(net)) throw new RangeError('Arus kas bersih melebihi batas angka aman JavaScript.');
  return { income, expense, net };
}

export function formatRupiah(amount, options = {}) {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError('Nominal harus berupa bilangan Rupiah yang aman.');
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    ...options
  }).format(amount);
}

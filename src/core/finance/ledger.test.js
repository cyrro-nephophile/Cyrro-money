import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAccountBalances,
  formatRupiah,
  summarizeTransactions,
  validateTransaction
} from './ledger.js';

const accounts = [
  { id: 'cash', openingBalance: 100_000 },
  { id: 'bank', openingBalance: 250_000 }
];

test('income and expense update the correct account balance', () => {
  const transactions = [
    { type: 'income', amount: 50_000, accountId: 'cash' },
    { type: 'expense', amount: 20_000, accountId: 'cash' }
  ];
  const balances = calculateAccountBalances(accounts, transactions);
  assert.equal(balances.get('cash'), 130_000);
  assert.equal(balances.get('bank'), 250_000);
});

test('transfer moves money without affecting income or expense totals', () => {
  const transactions = [
    { type: 'transfer', amount: 75_000, accountId: 'cash', destinationAccountId: 'bank' }
  ];
  const balances = calculateAccountBalances(accounts, transactions);
  assert.equal(balances.get('cash'), 25_000);
  assert.equal(balances.get('bank'), 325_000);
  assert.deepEqual(summarizeTransactions(transactions), { income: 0, expense: 0, net: 0 });
});

test('balance is reproducible after editing or deleting ledger entries', () => {
  const original = [{ type: 'expense', amount: 10_000, accountId: 'cash' }];
  const edited = [{ type: 'expense', amount: 5_000, accountId: 'cash' }];
  assert.equal(calculateAccountBalances(accounts, original).get('cash'), 90_000);
  assert.equal(calculateAccountBalances(accounts, edited).get('cash'), 95_000);
  assert.equal(calculateAccountBalances(accounts, []).get('cash'), 100_000);
});

test('rejects invalid amount, missing account and same-account transfer', () => {
  const ids = new Set(['cash', 'bank']);
  assert.throws(() => validateTransaction({ type: 'income', amount: 0, accountId: 'cash' }, ids), /Nominal/);
  assert.throws(() => validateTransaction({ type: 'expense', amount: 1.5, accountId: 'cash' }, ids), /Nominal/);
  assert.throws(() => validateTransaction({ type: 'income', amount: 100, accountId: 'missing' }, ids), /sumber/);
  assert.throws(() => validateTransaction({
    type: 'transfer', amount: 100, accountId: 'cash', destinationAccountId: 'cash'
  }, ids), /berbeda/);
});

test('rejects unsafe integer balances and amounts', () => {
  assert.throws(() => calculateAccountBalances(
    [{ id: 'cash', openingBalance: Number.MAX_SAFE_INTEGER }],
    [{ type: 'income', amount: 1, accountId: 'cash' }]
  ), /batas angka aman/);
  assert.throws(() => validateTransaction({
    type: 'income', amount: Number.MAX_SAFE_INTEGER + 1, accountId: 'cash'
  }, new Set(['cash'])), /Nominal/);
});

test('formats whole Rupiah values without decimal fractions', () => {
  assert.match(formatRupiah(125_000), /125\.000/);
});

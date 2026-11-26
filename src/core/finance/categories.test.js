import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CATEGORIES,
  archiveCategory,
  getAvailableCategories,
  restoreCategory,
  searchCategories,
  validateCategory
} from './categories.js';

test('default categories cover income and expense without duplicate IDs', () => {
  const ids = DEFAULT_CATEGORIES.map((category) => category.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(DEFAULT_CATEGORIES.some((category) => category.type === 'income'));
  assert.ok(DEFAULT_CATEGORIES.some((category) => category.type === 'expense'));
});

test('available categories exclude archived items and filter by transaction type', () => {
  const categories = [
    { id: 'food', name: 'Makanan', type: 'expense', isArchived: false },
    { id: 'salary', name: 'Gaji', type: 'income', isArchived: false },
    { id: 'old', name: 'Lama', type: 'expense', isArchived: true }
  ];
  assert.deepEqual(getAvailableCategories(categories, 'expense').map((item) => item.id), ['food']);
});

test('category search is case-insensitive', () => {
  assert.deepEqual(searchCategories(DEFAULT_CATEGORIES, 'MAKAN').map((item) => item.name), ['Makanan']);
});

test('category names are unique within their type, but may match across types', () => {
  const existing = [{ id: 'a', name: 'Lainnya', type: 'expense' }];
  assert.throws(() => validateCategory({ id: 'b', name: ' lainnya ', type: 'expense' }, existing), /sudah digunakan/);
  assert.equal(validateCategory({ id: 'c', name: 'Lainnya', type: 'income' }, existing).name, 'Lainnya');
});

test('archive and restore preserve the category identity and metadata', () => {
  const category = { id: 'food', name: 'Makanan', type: 'expense', icon: 'utensils' };
  const archived = archiveCategory(category);
  assert.equal(archived.id, category.id);
  assert.equal(archived.isArchived, true);
  assert.equal(restoreCategory(archived).isArchived, false);
});

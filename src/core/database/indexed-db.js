const DB_NAME = 'cyrro-money';
const DB_VERSION = 2;

function createStore(db, name, options) {
  if (!db.objectStoreNames.contains(name)) {
    return db.createObjectStore(name, options);
  }
  return null;
}

export function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      createStore(db, 'metadata', { keyPath: 'key' });

      const accounts = createStore(db, 'accounts', { keyPath: 'id' }) || request.transaction.objectStore('accounts');
      if (!accounts.indexNames.contains('by_name')) accounts.createIndex('by_name', 'name', { unique: false });

      const transactions = createStore(db, 'transactions', { keyPath: 'id' }) || request.transaction.objectStore('transactions');
      for (const [name, keyPath] of [['by_date', 'transactionDate'], ['by_account', 'accountId'], ['by_type', 'type'], ['by_category', 'categoryId']]) {
        if (!transactions.indexNames.contains(name)) transactions.createIndex(name, keyPath, { unique: false });
      }

      const categories = createStore(db, 'categories', { keyPath: 'id' }) || request.transaction.objectStore('categories');
      if (!categories.indexNames.contains('by_type')) categories.createIndex('by_type', 'type', { unique: false });

      const budgets = createStore(db, 'budgets', { keyPath: 'id' }) || request.transaction.objectStore('budgets');
      for (const [name, keyPath] of [['by_period', 'period'], ['by_category', 'categoryId']]) {
        if (!budgets.indexNames.contains(name)) budgets.createIndex(name, keyPath, { unique: false });
      }

      createStore(db, 'settings', { keyPath: 'key' });
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };

    request.onerror = () => reject(request.error ?? new Error('Unable to open database.'));
    request.onblocked = () => reject(new Error('Database upgrade is blocked by another tab.'));
  });
}

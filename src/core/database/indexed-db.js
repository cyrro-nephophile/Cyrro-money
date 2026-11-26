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

      const accounts = createStore(db, 'accounts', { keyPath: 'id' });
      if (accounts) {
        accounts.createIndex('by_name', 'name', { unique: false });
      }

      const transactions = createStore(db, 'transactions', { keyPath: 'id' });
      if (transactions) {
        transactions.createIndex('by_date', 'transactionDate', { unique: false });
        transactions.createIndex('by_account', 'accountId', { unique: false });
        transactions.createIndex('by_type', 'type', { unique: false });
        transactions.createIndex('by_category', 'categoryId', { unique: false });
      }

      const categories = createStore(db, 'categories', { keyPath: 'id' });
      if (categories) {
        categories.createIndex('by_type', 'type', { unique: false });
      }

      const budgets = createStore(db, 'budgets', { keyPath: 'id' });
      if (budgets) {
        budgets.createIndex('by_period', 'period', { unique: false });
        budgets.createIndex('by_category', 'categoryId', { unique: false });
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

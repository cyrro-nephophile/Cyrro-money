export const DEFAULT_CATEGORIES = Object.freeze([
  { id: 'expense-food', name: 'Makanan', type: 'expense', icon: 'utensils', isDefault: true },
  { id: 'expense-transport', name: 'Transportasi', type: 'expense', icon: 'car', isDefault: true },
  { id: 'expense-shopping', name: 'Belanja', type: 'expense', icon: 'shopping-bag', isDefault: true },
  { id: 'expense-bills', name: 'Tagihan', type: 'expense', icon: 'receipt', isDefault: true },
  { id: 'expense-health', name: 'Kesehatan', type: 'expense', icon: 'heart-pulse', isDefault: true },
  { id: 'expense-education', name: 'Pendidikan', type: 'expense', icon: 'graduation-cap', isDefault: true },
  { id: 'expense-entertainment', name: 'Hiburan', type: 'expense', icon: 'clapperboard', isDefault: true },
  { id: 'expense-home', name: 'Kebutuhan rumah', type: 'expense', icon: 'house', isDefault: true },
  { id: 'expense-other', name: 'Lainnya', type: 'expense', icon: 'ellipsis', isDefault: true },
  { id: 'income-salary', name: 'Gaji', type: 'income', icon: 'wallet', isDefault: true },
  { id: 'income-pocket-money', name: 'Uang saku', type: 'income', icon: 'hand-coins', isDefault: true },
  { id: 'income-gift', name: 'Hadiah', type: 'income', icon: 'gift', isDefault: true },
  { id: 'income-bonus', name: 'Bonus', type: 'income', icon: 'sparkles', isDefault: true },
  { id: 'income-business', name: 'Hasil usaha', type: 'income', icon: 'briefcase-business', isDefault: true },
  { id: 'income-other', name: 'Lainnya', type: 'income', icon: 'ellipsis', isDefault: true }
].map((category) => Object.freeze({ ...category, isArchived: false })));

export function getAvailableCategories(categories, type) {
  return categories.filter((category) => category.type === type && !category.isArchived);
}

export function searchCategories(categories, query = '') {
  const normalized = query.trim().toLocaleLowerCase('id-ID');
  if (!normalized) return [...categories];
  return categories.filter((category) => category.name.toLocaleLowerCase('id-ID').includes(normalized));
}

export function validateCategory(category, categories = []) {
  if (!category || typeof category !== 'object') {
    throw new TypeError('Kategori tidak valid.');
  }
  if (!['income', 'expense'].includes(category.type)) {
    throw new TypeError('Jenis kategori tidak valid.');
  }
  const name = String(category.name || '').trim();
  if (!name || name.length > 40) {
    throw new RangeError('Nama kategori harus berisi 1–40 karakter.');
  }
  if (categories.some((item) =>
    item.id !== category.id &&
    item.type === category.type &&
    item.name.trim().toLocaleLowerCase('id-ID') === name.toLocaleLowerCase('id-ID')
  )) {
    throw new Error('Nama kategori sudah digunakan untuk jenis transaksi ini.');
  }
  return { ...category, name };
}

export function archiveCategory(category) {
  if (!category?.id) throw new TypeError('Kategori tidak valid.');
  return { ...category, isArchived: true, archivedAt: Date.now() };
}

export function restoreCategory(category) {
  if (!category?.id) throw new TypeError('Kategori tidak valid.');
  return { ...category, isArchived: false, archivedAt: null };
}

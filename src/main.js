import './styles.css';
import { openDatabase } from './core/database/indexed-db.js';
import { calculateAccountBalances, summarizeTransactions, formatRupiah } from './core/finance/ledger.js';

const $ = (selector, root = document) => root.querySelector(selector);
const view = $('#view');
const modal = $('#modal');
const modalContent = $('#modal-content');
const toastNode = $('#toast');
let db;
let page = 'home';
let accounts = [];
let transactions = [];
let toastTimer;

const today = () => new Date().toISOString().slice(0, 10);
const id = () => crypto.randomUUID();
const money = (value) => formatRupiah(value);
const monthStart = () => today().slice(0, 7);
const accountMap = () => new Map(accounts.map((account) => [account.id, account]));
const balances = () => calculateAccountBalances(accounts, transactions);
const monthTransactions = () => transactions.filter((item) => (item.transactionDate || '').startsWith(monthStart()));

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function store(name, mode = 'readonly') {
  return db.transaction(name, mode).objectStore(name);
}
async function all(name) { return requestResult(store(name).getAll()); }
async function put(name, value) {
  const tx = db.transaction(name, 'readwrite');
  tx.objectStore(name).put(value);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Penyimpanan dibatalkan.'));
  });
}
async function remove(name, key) {
  const tx = db.transaction(name, 'readwrite');
  tx.objectStore(name).delete(key);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function refresh() {
  [accounts, transactions] = await Promise.all([all('accounts'), all('transactions')]);
  accounts.sort((a,b) => a.name.localeCompare(b.name));
  transactions.sort((a,b) => (b.transactionDate || '').localeCompare(a.transactionDate || '') || (b.createdAt || 0) - (a.createdAt || 0));
  render();
}
function showToast(message) {
  toastNode.textContent = message;
  toastNode.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastNode.classList.remove('show'), 2400);
}
function emptyState(title, detail) {
  return `<div class="empty"><div class="empty-icon">✳</div><strong>${title}</strong><p>${detail}</p></div>`;
}
function transactionRow(item) {
  const isIncome = item.type === 'income';
  const isTransfer = item.type === 'transfer';
  const account = accountMap();
  const sign = isIncome ? '+' : isTransfer ? '↔' : '−';
  const name = isTransfer
    ? `${account.get(item.accountId)?.name || 'Dompet'} → ${account.get(item.destinationAccountId)?.name || 'Dompet'}`
    : (item.category || (isIncome ? 'Pemasukan' : 'Pengeluaran'));
  return `<button class="transaction-row" data-action="edit-transaction" data-id="${item.id}">
    <span class="transaction-icon ${item.type}">${isIncome ? '↗' : isTransfer ? '⇄' : '↘'}</span>
    <span class="transaction-info"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(item.note || account.get(item.accountId)?.name || 'Tanpa catatan')} · ${formatDate(item.transactionDate)}</small></span>
    <strong class="amount ${isIncome ? 'positive' : isTransfer ? '' : 'negative'}">${sign} ${money(item.amount)}</strong>
  </button>`;
}
function formatDate(value) {
  if (!value) return 'Tanggal tidak diketahui';
  return new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'short', year:'numeric' }).format(new Date(value + 'T00:00:00'));
}
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function render() {
  document.querySelectorAll('[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
  if (page === 'home') renderHome();
  if (page === 'transactions') renderTransactions();
  if (page === 'stats') renderStats();
  if (page === 'accounts') renderAccounts();
}
function renderHome() {
  const sums = summarizeTransactions(monthTransactions());
  const total = [...balances().values()].reduce((a,b) => a + b, 0);
  const recent = transactions.slice(0, 5);
  view.innerHTML = `
    <section class="hero-card"><div class="card-top"><span>Saldo gabungan</span><button class="text-button" data-action="toggle-balance">Sembunyikan</button></div><strong class="hero-balance" id="balance-value">${money(total)}</strong><div class="hero-bottom"><span>◉ ${accounts.length} dompet aktif</span><span>Offline · tersimpan di perangkat</span></div></section>
    <section class="summary-grid"><article class="summary-card"><span class="summary-icon income">↗</span><small>Pemasukan bulan ini</small><strong class="positive">${money(sums.income)}</strong></article><article class="summary-card"><span class="summary-icon expense">↘</span><small>Pengeluaran bulan ini</small><strong class="negative">${money(sums.expense)}</strong></article></section>
    <section class="section"><div class="section-heading"><div><p class="eyebrow">AKTIVITAS</p><h3>Transaksi terbaru</h3></div><button class="link-button" data-page="transactions">Lihat semua</button></div>
    <div class="list-card">${recent.length ? recent.map(transactionRow).join('') : emptyState('Belum ada transaksi','Tekan tombol + untuk mencatat pemasukan atau pengeluaran pertamamu.')}</div></section>
    <section class="quick-actions"><button data-action="add-transaction" data-type="income"><span class="quick-icon income">↗</span><span><b>Tambah pemasukan</b><small>Catat uang masuk</small></span></button><button data-action="add-transaction" data-type="expense"><span class="quick-icon expense">↘</span><span><b>Tambah pengeluaran</b><small>Catat uang keluar</small></span></button></section>`;
}
function renderTransactions() {
  view.innerHTML = `<section class="page-heading"><p class="eyebrow">CATATAN KEUANGAN</p><h2>Transaksi</h2><p class="muted">Semua pemasukan, pengeluaran, dan transfer.</p></section>
  <div class="filter-tabs"><button class="selected" data-filter="all">Semua</button><button data-filter="income">Masuk</button><button data-filter="expense">Keluar</button><button data-filter="transfer">Transfer</button></div>
  <div class="list-card transaction-list">${transactions.length ? transactions.map(transactionRow).join('') : emptyState('Belum ada transaksi','Transaksi yang kamu tambahkan akan muncul di sini.')}</div>`;
}
function renderAccounts() {
  const sums = balances();
  view.innerHTML = `<section class="page-heading"><p class="eyebrow">TEMPAT PENYIMPANAN</p><h2>Dompet</h2><p class="muted">Kelola uang tunai, rekening, dan e-wallet.</p></section>
  <div class="account-list">${accounts.map((account) => `<article class="account-card"><div class="account-symbol">${account.kind === 'Bank' ? '▤' : account.kind === 'E-wallet' ? '▣' : '◉'}</div><div class="account-details"><strong>${escapeHtml(account.name)}</strong><small>${escapeHtml(account.kind || 'Dompet')}</small></div><strong>${money(sums.get(account.id) || 0)}</strong><button class="more-button" data-action="account-menu" data-id="${account.id}" aria-label="Opsi dompet">···</button></article>`).join('') || emptyState('Belum ada dompet','Tambahkan dompet untuk mulai mencatat uangmu.')}</div>
  <button class="outline-button full" data-action="add-account">＋ Tambah dompet</button>
  <button class="outline-button full" data-action="add-transaction" data-type="transfer">⇄ Transfer antar-dompet</button>`;
}
function renderStats() {
  const sums = summarizeTransactions(monthTransactions());
  const max = Math.max(sums.income, sums.expense, 1);
  const total = [...balances().values()].reduce((a,b) => a + b, 0);
  view.innerHTML = `<section class="page-heading"><p class="eyebrow">GAMBARAN BESAR</p><h2>Statistik</h2><p class="muted">Ringkasan bulan ${new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(new Date())}.</p></section>
  <article class="stat-total"><small>Saldo seluruh dompet</small><strong>${money(total)}</strong></article>
  <section class="section"><div class="section-heading"><h3>Arus kas bulan ini</h3></div><div class="chart-card"><div class="bar-group"><div class="bar-label"><span>Pemasukan</span><b class="positive">${money(sums.income)}</b></div><div class="bar-track"><i class="bar income-bar" style="width:${sums.income / max * 100}%"></i></div></div><div class="bar-group"><div class="bar-label"><span>Pengeluaran</span><b class="negative">${money(sums.expense)}</b></div><div class="bar-track"><i class="bar expense-bar" style="width:${sums.expense / max * 100}%"></i></div></div><div class="net-row"><span>Selisih pemasukan - pengeluaran</span><strong class="${sums.net >= 0 ? 'positive' : 'negative'}">${money(sums.net)}</strong></div></div></section>
  <p class="muted tiny">Transfer antar-dompet tidak dihitung sebagai pemasukan atau pengeluaran.</p>`;
}
function openModal(content) {
  modalContent.innerHTML = content;
  modal.showModal();
}
function closeModal() { modal.close(); }
function accountOptions(selected = '') {
  return accounts.map((account) => `<option value="${account.id}" ${selected === account.id ? 'selected' : ''}>${escapeHtml(account.name)}</option>`).join('');
}
function transactionForm(existing = null, forcedType = null) {
  const item = existing || {};
  const type = forcedType || item.type || 'expense';
  const typeOptions = ['expense','income','transfer'].map((value) => `<button type="button" class="type-choice ${type === value ? 'chosen' : ''}" data-type-choice="${value}">${value === 'income' ? 'Masuk' : value === 'expense' ? 'Keluar' : 'Transfer'}</button>`).join('');
  openModal(`<div class="modal-head"><div><p class="eyebrow">${existing ? 'UBAH CATATAN' : 'TRANSAKSI BARU'}</p><h3>${existing ? 'Edit transaksi' : 'Tambah transaksi'}</h3></div><button type="button" class="close-button" data-action="close-modal">×</button></div>
    <div class="type-choices">${typeOptions}</div><input type="hidden" name="type" value="${type}">
    <label class="field"><span>Nominal (Rp)</span><input name="amount" type="number" min="1" step="1" inputmode="numeric" placeholder="Contoh: 50000" value="${item.amount ?? ''}" required></label>
    <label class="field"><span>Dompet ${type === 'transfer' ? 'asal' : ''}</span><select name="accountId" required>${accountOptions(item.accountId || accounts[0]?.id)}</select></label>
    <label class="field destination-field" ${type === 'transfer' ? '' : 'hidden'}><span>Dompet tujuan</span><select name="destinationAccountId">${accountOptions(item.destinationAccountId || accounts[1]?.id)}</select></label>
    <label class="field category-field" ${type === 'transfer' ? 'hidden' : ''}><span>Kategori</span><input name="category" maxlength="40" placeholder="${type === 'income' ? 'Contoh: Gaji' : 'Contoh: Makanan'}" value="${escapeHtml(item.category || '')}"></label>
    <label class="field"><span>Tanggal</span><input name="transactionDate" type="date" value="${item.transactionDate || today()}" required></label>
    <label class="field"><span>Catatan (opsional)</span><input name="note" maxlength="120" placeholder="Tambahkan keterangan" value="${escapeHtml(item.note || '')}"></label>
    <div class="form-error" id="form-error"></div><button class="primary-button full" type="submit">${existing ? 'Simpan perubahan' : 'Simpan transaksi'}</button>
    ${existing ? '<button class="danger-button full" type="button" data-action="delete-transaction" data-id="'+item.id+'">Hapus transaksi</button>' : ''}`);
}
function addAccountForm() {
  openModal(`<div class="modal-head"><div><p class="eyebrow">DOMPET BARU</p><h3>Tambah dompet</h3></div><button type="button" class="close-button" data-action="close-modal">×</button></div>
  <label class="field"><span>Nama dompet</span><input name="name" maxlength="40" placeholder="Contoh: Tunai, BCA, GoPay" required></label>
  <label class="field"><span>Jenis dompet</span><select name="kind"><option>Tunai</option><option>Bank</option><option>E-wallet</option><option>Tabungan</option><option>Lainnya</option></select></label>
  <label class="field"><span>Saldo awal (Rp)</span><input name="openingBalance" type="number" step="1" inputmode="numeric" value="0" required></label>
  <div class="form-error" id="form-error"></div><button class="primary-button full" type="submit">Simpan dompet</button>`);
}
async function ensureDefaultAccount() {
  if (accounts.length) return;
  await put('accounts', { id: id(), name: 'Tunai', kind: 'Tunai', openingBalance: 0, createdAt: Date.now() });
}
async function saveTransaction(form) {
  const data = new FormData(form);
  const type = data.get('type');
  const amount = Number(data.get('amount'));
  const accountId = data.get('accountId');
  const destinationAccountId = type === 'transfer' ? data.get('destinationAccountId') : null;
  const error = $('#form-error');
  if (!Number.isSafeInteger(amount) || amount <= 0) { error.textContent = 'Masukkan nominal Rupiah yang valid.'; return; }
  if (type === 'transfer' && (!destinationAccountId || destinationAccountId === accountId)) { error.textContent = 'Pilih dua dompet yang berbeda.'; return; }
  const editingId = form.dataset.editingId;
  const existing = editingId ? transactions.find((item) => item.id === editingId) : null;
  const item = {
    id: editingId || id(), type, amount, accountId, destinationAccountId,
    category: type === 'transfer' ? '' : String(data.get('category') || '').trim(),
    note: String(data.get('note') || '').trim(),
    transactionDate: String(data.get('transactionDate') || today()),
    createdAt: existing?.createdAt || Date.now(), updatedAt: Date.now()
  };
  try {
    // Validate the complete resulting ledger before committing.
    const next = existing ? transactions.map((row) => row.id === editingId ? item : row) : [...transactions, item];
    calculateAccountBalances(accounts, next);
    await put('transactions', item);
    closeModal();
    await refresh();
    showToast(existing ? 'Transaksi diperbarui.' : 'Transaksi tersimpan.');
  } catch (err) { error.textContent = err.message || 'Transaksi gagal disimpan.'; }
}
async function submitModal(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.querySelector('[name="name"]')) {
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const openingBalance = Number(data.get('openingBalance'));
    const error = $('#form-error');
    if (!name) { error.textContent = 'Nama dompet wajib diisi.'; return; }
    if (!Number.isSafeInteger(openingBalance)) { error.textContent = 'Saldo awal harus berupa bilangan Rupiah bulat.'; return; }
    if (accounts.some((account) => account.name.toLowerCase() === name.toLowerCase())) { error.textContent = 'Nama dompet sudah digunakan.'; return; }
    await put('accounts', { id:id(), name, kind:String(data.get('kind')), openingBalance, createdAt:Date.now() });
    closeModal(); await refresh(); showToast('Dompet berhasil ditambahkan.'); return;
  }
  await saveTransaction(form);
}
function toggleTransactionType(type) {
  const form = $('#modal-form');
  if (!form) return;
  form.querySelector('[name="type"]').value = type;
  form.querySelectorAll('[data-type-choice]').forEach((button) => button.classList.toggle('chosen', button.dataset.typeChoice === type));
  $('.destination-field', form).hidden = type !== 'transfer';
  $('.category-field', form).hidden = type === 'transfer';
  $('.field span', $('.field:has([name="accountId"])', form)).textContent = type === 'transfer' ? 'Dompet asal' : 'Dompet';
}
document.addEventListener('click', async (event) => {
  const pageButton = event.target.closest('[data-page]');
  if (pageButton) { page = pageButton.dataset.page; render(); return; }
  const typeButton = event.target.closest('[data-type-choice]');
  if (typeButton) { toggleTransactionType(typeButton.dataset.typeChoice); return; }
  const filter = event.target.closest('[data-filter]');
  if (filter) {
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('selected', button === filter));
    const list = filter.dataset.filter === 'all' ? transactions : transactions.filter((item) => item.type === filter.dataset.filter);
    $('.transaction-list').innerHTML = list.length ? list.map(transactionRow).join('') : emptyState('Tidak ada transaksi','Belum ada catatan untuk filter ini.');
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'add-transaction') {
    if (!accounts.length) { await ensureDefaultAccount(); await refresh(); }
    transactionForm(null, button.dataset.type || null);
  }
  if (action === 'add-account') addAccountForm();
  if (action === 'close-modal') closeModal();
  if (action === 'edit-transaction') {
    const item = transactions.find((row) => row.id === button.dataset.id);
    if (item) { transactionForm(item); $('#modal-form').dataset.editingId = item.id; }
  }
  if (action === 'delete-transaction') {
    if (confirm('Hapus transaksi ini? Saldo akan dihitung ulang.')) {
      await remove('transactions', button.dataset.id); closeModal(); await refresh(); showToast('Transaksi dihapus.');
    }
  }
  if (action === 'account-menu') {
    const account = accounts.find((row) => row.id === button.dataset.id);
    if (account && confirm(`Hapus dompet "${account.name}"? Dompet yang masih memiliki transaksi tidak dapat dihapus.`)) {
      if (transactions.some((item) => item.accountId === account.id || item.destinationAccountId === account.id)) {
        showToast('Dompet masih digunakan oleh transaksi.'); return;
      }
      await remove('accounts', account.id); await refresh(); showToast('Dompet dihapus.');
    }
  }
  if (action === 'toggle-balance') {
    const node = $('#balance-value');
    const hidden = node.dataset.hidden !== 'true';
    node.dataset.hidden = String(hidden);
    node.textContent = hidden ? '••••••••' : money([...balances().values()].reduce((a,b)=>a+b,0));
    button.textContent = hidden ? 'Tampilkan' : 'Sembunyikan';
  }
  if (action === 'settings') {
    openModal(`<div class="modal-head"><div><p class="eyebrow">PREFERENSI</p><h3>Pengaturan</h3></div><button type="button" class="close-button" data-action="close-modal">×</button></div>
      <div class="settings-note"><strong>Data tersimpan lokal</strong><p>Transaksi dan dompet disimpan di penyimpanan browser pada perangkat ini. Tidak ada akun atau sinkronisasi cloud.</p></div>
      <button class="outline-button full" data-action="export">⇩ Cadangkan data (JSON)</button>
      <label class="outline-button full import-label">⇧ Pulihkan data JSON<input type="file" accept="application/json,.json" data-action="import" hidden></label>`);
  }
  if (action === 'export') exportBackup();
});
$('#modal-form').addEventListener('submit', submitModal);
$('#modal').addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
$('#modal').addEventListener('close', () => { $('#modal-form').reset(); delete $('#modal-form').dataset.editingId; });
document.addEventListener('change', async (event) => {
  if (event.target.matches('[data-action="import"]')) importBackup(event.target.files?.[0]);
});
async function exportBackup() {
  const data = { app:'Cyrro Money', schemaVersion:1, exportedAt:new Date().toISOString(), accounts, transactions };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href=url; anchor.download=`cyrro-money-backup-${today()}.json`; anchor.click();
  URL.revokeObjectURL(url); showToast('Cadangan data dibuat.');
}
async function importBackup(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'Cyrro Money' || data.schemaVersion !== 1 || !Array.isArray(data.accounts) || !Array.isArray(data.transactions)) throw new Error('Format cadangan tidak dikenali.');
    calculateAccountBalances(data.accounts, data.transactions);
    if (!confirm('Pulihkan cadangan? Data dompet dan transaksi saat ini akan diganti.')) return;
    const tx = db.transaction(['accounts','transactions'], 'readwrite');
    const accountStore = tx.objectStore('accounts'); const transactionStore = tx.objectStore('transactions');
    accountStore.clear(); transactionStore.clear();
    data.accounts.forEach((item) => accountStore.put(item));
    data.transactions.forEach((item) => transactionStore.put(item));
    await new Promise((resolve,reject) => { tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error); });
    closeModal(); await refresh(); showToast('Cadangan berhasil dipulihkan.');
  } catch (error) { showToast(error.message || 'Gagal memulihkan cadangan.'); }
}
async function start() {
  try {
    db = await openDatabase();
    await refresh();
    await ensureDefaultAccount();
    await refresh();
  } catch (error) {
    console.error(error);
    view.innerHTML = emptyState('Penyimpanan tidak tersedia','Coba buka ulang halaman ini di browser yang mendukung penyimpanan lokal.');
  }
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch((error) => console.error(error)));
  }
}
start();

// Ikon tombol sembunyikan / tampilkan saldo di kartu saldo.
// main.js sering menimpa isi tombol (textContent), jadi modul ini
// memasang ulang ikon setiap kali tampilan berubah.
// Status ikon disimpan di data-icon (bukan membandingkan innerHTML, karena
// browser menulis ulang markup SVG dan perbandingan itu nggak pernah cocok,
// yang bikin loop MutationObserver tanpa henti).

const STYLE_ID = 'balance-toggle-style';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    :root .balance-toggle {
      display: grid; place-items: center;
      width: 38px; height: 38px; min-height: 38px; padding: 0;
      border: 1px solid color-mix(in srgb, var(--green) 24%, transparent);
      border-radius: 12px;
      background: var(--green-soft);
      color: var(--green);
      transition: transform .16s cubic-bezier(.2,.8,.2,1), background-color .2s ease, border-color .2s ease, box-shadow .2s ease;
    }
    :root .balance-toggle:hover {
      background: color-mix(in srgb, var(--green) 14%, var(--green-soft));
    }
    :root .balance-toggle:active {
      transform: scale(.9);
      background: color-mix(in srgb, var(--green) 22%, var(--green-soft));
      box-shadow: inset 0 1px 3px color-mix(in srgb, var(--green) 25%, transparent);
    }
    /* Outline cuma muncul buat navigasi keyboard, bukan setiap kali diklik. */
    :root .balance-toggle:focus:not(:focus-visible) { outline: none; }
    :root .balance-toggle:focus-visible {
      outline: 2px solid var(--green);
      outline-offset: 3px;
    }
    :root .balance-toggle svg {
      animation: balance-eye-swap .28s cubic-bezier(.2,.9,.3,1);
    }
    @keyframes balance-eye-swap {
      from { opacity: 0; transform: scale(.6) rotate(-14deg); }
      to   { opacity: 1; transform: scale(1) rotate(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      :root .balance-toggle, :root .balance-toggle svg { transition: none; animation: none; }
    }
  `;
  document.head.appendChild(style);
}

const EYE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.3 6.3C3.6 8 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 5.1-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

function syncBalanceToggle() {
  const btn = document.querySelector('.balance-toggle');
  if (!btn) return;
  const hidden = document.getElementById('balance-value')?.dataset.hidden === 'true';
  const key = hidden ? 'show' : 'hide';          // saldo tersembunyi -> ikon "lihat"; saldo tampil -> ikon "sembunyikan"
  if (btn.dataset.icon !== key) {
    btn.dataset.icon = key;
    btn.innerHTML = hidden ? EYE : EYE_OFF;
  }
  const label = hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo';
  if (btn.getAttribute('aria-label') !== label) btn.setAttribute('aria-label', label);
}

const view = document.getElementById('view');
if (view) {
  new MutationObserver(syncBalanceToggle).observe(view, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ['data-hidden'],
  });
  syncBalanceToggle();
}

// Umpan balik tekan untuk semua tombol di Mamoney, plus fokus input yang halus.
// Sebelumnya saat ditekan di HP, yang kelihatan cuma outline fokus yang tebal.
// Sekarang tiap tombol: mengecil sedikit + lapisan tipis saat ditekan.
// Input / dropdown: border hijau + tint tipis + glow, bukan outline tebal.
// Outline tebal cuma buat navigasi keyboard.

const STYLE_ID = 'ui-press-feedback-style';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* ---- Tombol ---- */
    :root button { -webkit-tap-highlight-color: transparent; }
    :root button:not(:disabled) {
      transition: transform .14s cubic-bezier(.2,.8,.2,1),
                  background-color .2s ease,
                  background-image .2s ease,
                  border-color .2s ease,
                  color .2s ease,
                  box-shadow .2s ease;
    }
    :root button:not(:disabled):not(.balance-toggle):active {
      transform: scale(.96);
      background-image: linear-gradient(
        color-mix(in srgb, var(--text) 9%, transparent),
        color-mix(in srgb, var(--text) 9%, transparent)
      );
    }
    :root button:disabled { opacity: .5; cursor: not-allowed; }
    :root button:focus:not(:focus-visible) { outline: none; }
    :root button:focus-visible {
      outline: 2px solid var(--green);
      outline-offset: 2px;
    }

    /* ---- Input, select, dropdown ---- */
    :root input:not([type="checkbox"]):not([type="radio"]),
    :root select,
    :root textarea {
      transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease;
    }
    :root input:focus,
    :root select:focus,
    :root textarea:focus {
      outline: none;
      border-color: var(--green);
      background-color: color-mix(in srgb, var(--green) 5%, var(--surface));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 14%, transparent);
    }
    /* Keyboard tetap dapat outline yang jelas. */
    :root input:focus-visible:not(:focus),
    :root select:focus-visible:not(:focus) { outline: 2px solid var(--green); outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      :root button:not(:disabled),
      :root input, :root select, :root textarea { transition: none; }
    }
  `;
  document.head.appendChild(style);
}

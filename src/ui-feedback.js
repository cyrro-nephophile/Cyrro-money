// Umpan balik tekan untuk semua tombol di Mamoney.
// Sebelumnya saat ditekan di HP, yang kelihatan cuma outline fokus.
// Sekarang tiap tombol: mengecil sedikit + lapisan tipis saat ditekan,
// outline hanya muncul untuk navigasi keyboard.

const STYLE_ID = 'ui-press-feedback-style';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
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
    /* Outline cuma buat navigasi keyboard, bukan setiap kali disentuh. */
    :root button:focus:not(:focus-visible) { outline: none; }
    :root button:focus-visible {
      outline: 2px solid var(--green);
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      :root button:not(:disabled) { transition: none; }
    }
  `;
  document.head.appendChild(style);
}

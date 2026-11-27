// Gesture geser tab Keluar / Masuk / Transfer, gaya komentar Instagram:
// pill ngikutin jari secara langsung, ada efek karet di ujung, dan lemparan
// ringan tetap pindah tab. Lepas jari -> snap dengan spring.
// Modul ini berdiri sendiri: nggak ngubah main.js, cukup klik tombol aslinya.

const STYLE_ID = 'tabs-gesture-style';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Biarkan geseran horizontal sampai ke JS; vertikal tetap buat scroll form. */
    :root .type-tabs,
    :root .type-tabs button { touch-action: pan-y; }
    :root .type-tabs::before {
      transform: translate3d(calc(var(--i, 0) * (100% + 6px) + var(--dx, 0px)), 0, 0);
      transition: transform .38s cubic-bezier(.22,.9,.3,1);
    }
    :root .type-tabs.dragging::before,
    :root .type-tabs.dragging button { transition: none !important; }
    :root .type-tabs button { -webkit-user-select: none; user-select: none; }
    /* Blur itu mahal di HP kelas menengah: matiin supaya animasi tetap 60fps. */
    :root dialog::backdrop,
    :root #toast { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    @media (prefers-reduced-motion: reduce) {
      :root .type-tabs::before { transition: none; }
    }
  `;
  document.head.appendChild(style);
}

const DRAG_START_PX = 6;
const FLING_MS = 160;   // seberapa jauh "lemparan" diproyeksikan ke depan
let gesture = null;     // state gesture yang sedang jalan
let swallowClick = false;
let manualClick = false;

function metricsFor(tabs, buttons) {
  const width = tabs.clientWidth;
  const column = (width - 20) / 3;          // padding 4px kiri-kanan + gap 6px x2
  const step = column + 6;
  const index = Math.max(0, buttons.findIndex(b => b.classList.contains('chosen')));
  return { step, index, max: (buttons.length - 1) * step };
}

document.addEventListener('pointerdown', e => {
  const tabs = e.target.closest?.('.type-tabs');
  if (!tabs || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const buttons = [...tabs.querySelectorAll('button')];
  gesture = {
    tabs, buttons, id: e.pointerId,
    x0: e.clientX, y0: e.clientY,
    lastX: e.clientX, lastT: performance.now(), vx: 0,
    active: false,
    ...metricsFor(tabs, buttons),
  };
}, { passive: true });

document.addEventListener('pointermove', e => {
  if (!gesture || e.pointerId !== gesture.id) return;
  const raw = e.clientX - gesture.x0;

  if (!gesture.active) {
    if (Math.abs(raw) < DRAG_START_PX) return;
    // Kalau geraknya lebih vertikal (mau scroll form), biarkan browser yang urus.
    if (Math.abs(e.clientY - gesture.y0) > Math.abs(raw) + 4) { gesture = null; return; }
    gesture.active = true;
    gesture.tabs.classList.add('dragging');
    try { gesture.tabs.setPointerCapture(e.pointerId); } catch {}
  }

  const now = performance.now();
  const dt = Math.max(1, now - gesture.lastT);
  gesture.vx = (e.clientX - gesture.lastX) / dt;   // px per ms
  gesture.lastX = e.clientX;
  gesture.lastT = now;

  const { step, index, max } = gesture;
  let pos = index * step + raw;
  if (pos < 0) pos *= 0.3;                           // efek karet di ujung kiri
  else if (pos > max) pos = max + (pos - max) * 0.3; // efek karet di ujung kanan
  gesture.tabs.style.setProperty('--dx', (pos - index * step) + 'px');
}, { passive: true });

function endGesture(e) {
  if (!gesture || e.pointerId !== gesture.id) return;
  const s = gesture;
  gesture = null;
  if (!s.active) return;

  const { step, index, max } = s;
  const pos = index * step + (s.lastX - s.x0);
  const projected = Math.min(max, Math.max(0, pos + s.vx * FLING_MS));
  const target = Math.round(projected / step);

  s.tabs.classList.remove('dragging');           // aktifkan lagi transisi spring
  s.tabs.style.removeProperty('--dx');

  // Tombol asli akan ikut ke-klik setelah pointerup; kita telan supaya nggak double.
  swallowClick = true;
  setTimeout(() => { swallowClick = false; }, 350);

  if (target !== index && s.buttons[target]) {
    manualClick = true;
    s.buttons[target].click();                   // main.js yang update state & form
    manualClick = false;
  }
}

document.addEventListener('pointerup', endGesture);
document.addEventListener('pointercancel', endGesture);

document.addEventListener('click', e => {
  if (swallowClick && !manualClick) {
    swallowClick = false;
    e.stopPropagation();
    e.preventDefault();
  }
}, true);

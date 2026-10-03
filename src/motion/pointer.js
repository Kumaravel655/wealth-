// Pointer feedback for mouse users: buttons lean toward the cursor, cards tilt slightly,
// and surfaces pick up a soft light where the pointer is. Touch devices skip all of this.
import { gsap } from 'gsap';
import { deep } from './env.js';

const MAGNETIC = '.btn, .wa-float, .head-call, .tour-btn';
const TILT = '.pcard, .city-card, .review, .tile';
const SPOT = '.pcard, .why-list li, .review, .triage a, .tile, .side-box, .office, .index-list a, .district-card, .tool, .person';

export function initPointer() {
  if (!deep) return;
  document.querySelectorAll(MAGNETIC).forEach(magnetic);
  document.querySelectorAll(TILT).forEach(tilt);
  document.querySelectorAll(SPOT).forEach(spot);
}

function magnetic(el) {
  const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
  const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    x((e.clientX - r.left - r.width / 2) * 0.28);
    y((e.clientY - r.top - r.height / 2) * 0.38);
  });
  el.addEventListener('pointerleave', () => { x(0); y(0); });
}

function tilt(el) {
  const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' });
  const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' });
  // Set on entry: the scroll reveal clears inline transforms when it finishes.
  el.addEventListener('pointerenter', () => gsap.set(el, { transformPerspective: 1100 }));
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    rx(((e.clientY - r.top) / r.height - 0.5) * -4);
    ry(((e.clientX - r.left) / r.width - 0.5) * 5);
  });
  el.addEventListener('pointerleave', () => { rx(0); ry(0); });
}

function spot(el) {
  el.classList.add('wb-spot');
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

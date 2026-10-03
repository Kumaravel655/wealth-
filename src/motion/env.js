// What this visitor's device can comfortably run. Decided once, read everywhere.
const mq = (q) => window.matchMedia(q).matches;
const nav = navigator;

export const reduce = mq('(prefers-reduced-motion: reduce)');
export const finePointer = mq('(hover: hover) and (pointer: fine)');
// Budget Android is the real audience: Data Saver, little memory, or a slow touch device gets the light
// tier (reveals and the hero sequence only; no smooth scrolling or scroll-scrubbed parallax).
export const lite = !reduce && Boolean(
  (nav.connection && nav.connection.saveData) ||
  (nav.deviceMemory && nav.deviceMemory <= 2) ||
  (!finePointer && nav.hardwareConcurrency && nav.hardwareConcurrency <= 4)
);
export const rich = !reduce && !lite;
// Scroll-linked depth and pointer effects only where there is a mouse to justify the cost.
export const deep = rich && finePointer;

// Motion tokens, mirrored from the CSS tokens in base.css (--ease-out-expo, --dur-*).
export const EASE = { out: 'expo.out', inOut: 'power4.inOut', soft: 'power3.out' };
export const DUR = { fast: 0.15, base: 0.3, slow: 0.6, reveal: 0.9, hero: 1.2 };
export const STAGGER = 0.07;

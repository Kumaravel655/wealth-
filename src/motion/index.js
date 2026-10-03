// Motion layer. Everything here is progressive enhancement over the generated HTML:
// with reduced motion, or if this file never runs, every page is complete and readable.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { reduce, deep } from './env.js';
import { initScroll } from './scroll.js';
import { initHero, initPageHero } from './hero.js';
import { initReveals } from './reveal.js';
import { initPointer } from './pointer.js';
import { initSections } from './sections.js';

export function initMotion() {
  const root = document.documentElement;
  if (reduce) { root.classList.remove('wb-motion'); return; }
  root.classList.add('wb-motion');
  if (deep) root.classList.add('wb-deep');

  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ overwrite: 'auto' });
  // Shared sequences name elements that only some pages have (a photo, breadcrumbs, a button row).
  gsap.config({ nullTargetWarn: false });
  ScrollTrigger.config({ ignoreMobileResize: true });

  initScroll();
  initHero();
  initPageHero();
  initReveals();
  initSections();
  initPointer();

  // Initial states are now held by GSAP inline styles, so the CSS pre-hide can go.
  root.classList.add('wb-ready');

  if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger });

  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
}

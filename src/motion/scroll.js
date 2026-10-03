// Smooth scrolling (mouse users only), the hide-on-scroll header, and scroll velocity for the marquees.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { deep } from './env.js';

export let lenis = null;

export function initScroll() {
  if (deep) {
    lenis = new Lenis({ duration: 1.1, anchors: { offset: -88 }, prevent: (node) => node.closest?.('.site-nav, .mega, .table-scroll, .ticker-view') });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // The mobile menu locks the page; keep Lenis in step with it.
    new MutationObserver(() => (document.body.classList.contains('nav-open') ? lenis.stop() : lenis.start()))
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  initHeader();
  initProgress();
  initVelocity();
}

function initHeader() {
  const head = document.querySelector('.site-head');
  if (!head) return;
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      head.classList.toggle('is-scrolled', y > 8);
      // Never hide while a menu is open or focus is inside the header.
      const busy = document.body.classList.contains('nav-open') || head.querySelector('.mega.open') || head.contains(document.activeElement);
      if (busy || y < 160 || y < last - 4) head.classList.remove('is-hidden');
      else if (y > last + 4) head.classList.add('is-hidden');
      last = y;
    },
  });
  head.addEventListener('focusin', () => head.classList.remove('is-hidden'));
}

// The stylesheet drives the header progress bar with a CSS scroll timeline; this covers browsers without one.
function initProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar || CSS.supports('animation-timeline: scroll()')) return;
  bar.classList.add('js-progress');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => bar.style.setProperty('--p', s.progress.toFixed(4)) });
}

// Marquees speed up and lean with scroll velocity, then settle back.
function initVelocity() {
  const tracks = [...document.querySelectorAll('.audience .marquee, .ticker-mover')];
  if (!tracks.length) return;
  const anims = () => tracks.flatMap((t) => t.getAnimations());
  // The tracks' parents carry the CSS marquee animation, so the lean goes on the tracks themselves.
  const leaners = document.querySelectorAll('.audience .marquee-track, .ticker-track');
  const skew = [gsap.quickTo(leaners, 'skewX', { duration: 0.5, ease: 'power3.out' })];
  const state = { rate: 1 };
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const v = self.getVelocity();
      const rate = 1 + Math.min(Math.abs(v) / 300, 5);
      gsap.to(state, { rate, duration: 0.2, overwrite: true, onUpdate: apply, onComplete: settle });
      skew.forEach((s) => s(gsap.utils.clamp(-6, 6, v / -250)));
    },
  });
  function apply() { anims().forEach((a) => { a.playbackRate = state.rate; }); }
  function settle() {
    gsap.to(state, { rate: 1, duration: 1.2, ease: 'power2.out', onUpdate: apply });
    skew.forEach((s) => s(0));
  }
}

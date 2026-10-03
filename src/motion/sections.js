// Choreography for specific sections, where a generic reveal would undersell what the content is.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { deep, EASE, DUR } from './env.js';
import { addGlow } from './hero.js';
import { parallax } from './reveal.js';

export function initSections() {
  triage();
  bridge();
  reviews();
  map();
  faq();
  cta();
  menus();
}

// "What do you need help with?": the grid wipes open left to right, then each option slides in.
function triage() {
  const list = document.querySelector('.triage ul');
  if (!list) return;
  gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 90%', once: true } })
    .fromTo(list, { clipPath: 'inset(0% 100% 0% 0% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.1, ease: EASE.inOut })
    .from(list.querySelectorAll('a'), { x: -24, opacity: 0, duration: DUR.slow, ease: EASE.out, stagger: 0.06 }, 0.35);
}

// Two offices: the cards close in from either side while the arc between them is drawn by the scroll.
function bridge() {
  document.querySelectorAll('.bridge').forEach((sec) => {
    const cards = sec.querySelectorAll('.city-card');
    cards.forEach((card, i) => {
      const dir = i % 2 ? 1 : -1;
      gsap.from(card, {
        x: 90 * dir, rotate: 2.5 * dir, opacity: 0, duration: 1.3, ease: EASE.out,
        scrollTrigger: { trigger: card, start: 'top 88%', once: true },
      });
      gsap.from(card.querySelectorAll('.city-body > *'), {
        y: 24, opacity: 0, duration: DUR.reveal, ease: EASE.out, stagger: 0.07, delay: 0.35,
        scrollTrigger: { trigger: card, start: 'top 88%', once: true },
      });
      parallax(card.querySelector('.city-img'), card, 6);
    });
    const arcs = sec.querySelectorAll('.span-arc, .span-post');
    if (arcs.length) {
      const span = sec.querySelector('.span');
      gsap.fromTo(arcs, { strokeDashoffset: 1 }, deep
        ? { strokeDashoffset: 0, ease: 'none', stagger: 0.25, scrollTrigger: { trigger: span, start: 'top 85%', end: 'center 45%', scrub: 0.6 } }
        : { strokeDashoffset: 0, ease: EASE.inOut, duration: 1.4, stagger: 0.25, scrollTrigger: { trigger: span, start: 'top 85%', once: true } });
    }
  });
}

// Reviews: the rating counts up to 5.0 and the stars land one by one.
function reviews() {
  const rating = document.querySelector('.rating');
  if (!rating) return;
  const n = rating.querySelector('.rating-n');
  const final = parseFloat(n?.textContent || '0');
  const tl = gsap.timeline({ scrollTrigger: { trigger: rating, start: 'top 90%', once: true } });
  if (n && final) {
    const v = { x: 0 };
    tl.to(v, { x: final, duration: 1.4, ease: 'power3.out', onUpdate: () => { n.textContent = v.x.toFixed(1); } }, 0);
  }
  tl.from(rating.querySelectorAll('.stars svg'), {
    scale: 0, rotate: -50, opacity: 0, duration: 0.6, ease: 'back.out(2.4)', stagger: 0.09,
  }, 0.25);
  document.querySelectorAll('.review').forEach((r) => {
    gsap.fromTo(r, { '--q': 0 }, { '--q': 1, duration: 1, ease: EASE.out, scrollTrigger: { trigger: r, start: 'top 90%', once: true } });
  });
}

// Tamil Nadu map: settles into place, then sits on its own depth layer.
function map() {
  const fig = document.querySelector('.tnmap');
  if (!fig) return;
  gsap.from(fig, {
    scale: 0.9, rotate: -3, opacity: 0, duration: 1.6, ease: EASE.out,
    scrollTrigger: { trigger: fig, start: 'top 85%', once: true },
  });
  if (deep) gsap.to(fig, { y: -50, ease: 'none', scrollTrigger: { trigger: fig.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
  const card = document.querySelector('.district-card');
  // The legacy script swaps the district text; animate each swap rather than only the name.
  if (card) new MutationObserver(() => {
    gsap.fromTo(card.querySelectorAll('.dc-mode, .dc-facts dd'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: EASE.out, stagger: 0.05, overwrite: true });
  }).observe(card.querySelector('.dc-name'), { childList: true });
}

// FAQ: answers open and close smoothly instead of snapping. The native <details> still does the work.
function faq() {
  document.querySelectorAll('.faq details').forEach((d) => {
    const sum = d.querySelector('summary');
    if (!sum) return;
    const body = [...d.children].filter((c) => c !== sum);
    let busy = false;
    sum.addEventListener('click', (e) => {
      e.preventDefault();
      if (busy) return;
      busy = true;
      const from = d.offsetHeight;
      if (!d.open) {
        d.open = true;
        gsap.fromTo(d, { height: from }, { height: 'auto', duration: 0.55, ease: EASE.out, onComplete: done });
        gsap.fromTo(body, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: EASE.out, delay: 0.08 });
      } else {
        const closed = sum.offsetHeight + (d.offsetHeight - d.clientHeight);
        gsap.to(body, { opacity: 0, duration: 0.2 });
        gsap.fromTo(d, { height: from }, { height: closed, duration: 0.42, ease: EASE.inOut, onComplete: () => { d.open = false; done(); } });
      }
    });
    function done() {
      gsap.set([d, ...body], { clearProps: 'height,opacity,transform' });
      busy = false;
      ScrollTrigger.refresh();
    }
  });
}

function cta() {
  document.querySelectorAll('.cta-band').forEach((band) => {
    addGlow(band);
    if (!deep) return;
    const s = band.querySelector('.stripes');
    // The stripes are mirrored with a CSS transform, so they move through `translate` instead.
    if (s) gsap.fromTo(s, { '--wb-shift': '60px' }, { '--wb-shift': '-60px', ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

// Desktop services menu: give each item its place in the stagger (the CSS does the motion).
function menus() {
  document.querySelectorAll('.mega').forEach((m) => {
    m.querySelectorAll('.mega-h, .mega li, .mega-foot').forEach((el, i) => el.style.setProperty('--i', i));
  });
  document.querySelectorAll('.nav-list > li').forEach((el, i) => el.style.setProperty('--i', i));
}

// Scroll reveals: headings rise line by line out of a mask, content arrives in batches,
// photographs unveil from the bottom edge and then drift with the scroll.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { deep, EASE, DUR, STAGGER } from './env.js';

const HEROES = '.hero, .page-hero';
const outsideHeroes = (els) => [...els].filter((el) => !el.closest(HEROES));
const all = (sel) => outsideHeroes(document.querySelectorAll(sel));

const HEADINGS = '.sec-h, .faq h2, .cta-band h2, .svc-main h2, .prose h2, .svc-group-h, .also h3, .triage-h, .two-col h2';
const INTROS = '.sec-intro, .eyebrow, .prose .first, .reviews-head .rating, .cta-band p';
// Everything that arrives in batches. Photo cards and office cards have their own choreography.
const ITEMS = [
  '.reveal:not(.city-card):not(.why-media):not(.triage li)', '.why-list li', '.review', '.index-list li', '.ticks li',
  '.steps > li', '.timeline-h > li', '.ledger tbody tr', '.facts dl > div', '.tile', '.person', '.team > li',
  '.side-box', '.office', '.tool', '.values > div', '.timeline > li', '.faq details', '.district-card',
  '.map-legend li', '.form', '.toc', '.also .index-list', '.foot-grid > div',
].join(', ');

export function initReveals() {
  headings();
  intros();
  items();
  media();
}

function headings() {
  all(HEADINGS).forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 105, duration: 1.05, ease: EASE.out, stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    });
  });
}

function intros() {
  all(INTROS).forEach((el) => {
    gsap.from(el, {
      y: 22, opacity: 0, duration: DUR.reveal, ease: EASE.out, delay: 0.15,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

function items() {
  // Drop nested matches so a card and its own children never animate twice.
  const list = all(ITEMS).filter((el, _, arr) => !arr.some((o) => o !== el && o.contains(el)));
  if (!list.length) return;
  gsap.set(list, { opacity: 0, y: 44 });
  ScrollTrigger.batch(list, {
    start: 'top 92%', once: true, interval: 0.08,
    onEnter: (batch) => gsap.to(batch, {
      opacity: 1, y: 0, duration: DUR.reveal, ease: EASE.out, stagger: STAGGER,
      clearProps: 'transform,opacity',
    }),
  });
}

function media() {
  // Practice cards: the photo unveils from the bottom edge as the card rises.
  all('.pcard-media').forEach((box) => {
    const img = box.querySelector('img');
    gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 88%', once: true } })
      .fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE.inOut })
      // Rest slightly enlarged when the photo will drift, so its edge never shows.
      .fromTo(img, { scale: 1.35 }, { scale: deep ? 1.16 : 1, duration: 1.6, ease: EASE.out }, 0);
    parallax(img, box);
  });

  // "One principal" photograph: unveil, then the glass caption floats up on its own layer.
  all('.why-media').forEach((fig) => {
    const img = fig.querySelector('img');
    const cap = fig.querySelector('.float-card');
    gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
      .fromTo(img, { clipPath: 'inset(0% 0% 100% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.3, ease: EASE.inOut })
      .fromTo(fig, { '--wb-backdrop': 0 }, { '--wb-backdrop': 1, duration: 1.2, ease: EASE.out }, 0.3)
      .from(cap, { y: 40, opacity: 0, scale: 0.92, duration: 1, ease: EASE.out }, 0.7);
    if (deep && cap) gsap.to(cap, { y: -56, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Photos inside long-form pages.
  all('.prose img, .svc-main img').forEach((img) => {
    gsap.from(img, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: EASE.inOut, scrollTrigger: { trigger: img, start: 'top 88%', once: true } });
  });
}

// The image is scaled up inside its frame, so it can drift without showing an edge.
export function parallax(img, frame, amount = 7) {
  if (!deep || !img) return;
  gsap.fromTo(img, { yPercent: -amount }, {
    yPercent: amount, ease: 'none',
    scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

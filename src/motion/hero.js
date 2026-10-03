// The one orchestrated load moment per page.
// Home: the logo's W stripes assemble like a bridge being built, the headline rises word by word,
// and the compliance desk swings up into place. Inner pages run a shorter version of the same idea.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { deep, EASE, DUR, STAGGER } from './env.js';

// Shared: build the stripes from the bottom step up, then let them breathe in a slow wave.
function buildStripes(svg, at, tl) {
  const polys = svg ? svg.querySelectorAll('polygon') : [];
  if (!polys.length) return;
  tl.from(polys, {
    x: -90, y: 46, opacity: 0, duration: DUR.hero, ease: EASE.out,
    stagger: { each: 0.06, from: 'end' },
  }, at);
  if (!deep) return;
  tl.add(() => gsap.to(polys, {
    opacity: 0.55, duration: 2.4, ease: 'sine.inOut',
    stagger: { each: 0.18, from: 'end', repeat: -1, yoyo: true },
    // Only breathe while the band is on screen.
    scrollTrigger: { trigger: svg.parentElement, start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' },
  }));
}

// Depth on scroll: background drifts slower than the page, foreground a touch faster.
function depth(trigger, layers) {
  if (!deep) return;
  layers.forEach(([el, vars]) => el && gsap.to(el, {
    ...vars, ease: 'none',
    scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: true },
  }));
}

// A soft light that follows the pointer across a dark band.
export function addGlow(section) {
  if (!deep || !section) return;
  const glow = document.createElement('div');
  glow.className = 'wb-glow';
  glow.setAttribute('aria-hidden', 'true');
  section.prepend(glow);
  const x = gsap.quickTo(glow, 'x', { duration: 0.9, ease: 'power3.out' });
  const y = gsap.quickTo(glow, 'y', { duration: 0.9, ease: 'power3.out' });
  section.addEventListener('pointermove', (e) => {
    const r = section.getBoundingClientRect();
    x(e.clientX - r.left); y(e.clientY - r.top);
    glow.classList.add('on');
  });
  section.addEventListener('pointerleave', () => glow.classList.remove('on'));
}

export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const q = gsap.utils.selector(hero);
  const bg = q('.hero-bg')[0];
  const stripes = q('.stripes')[0];
  const desk = q('.desk')[0];
  const em = q('.h1-display em')[0];

  const tl = gsap.timeline({ defaults: { ease: EASE.out } });
  if (bg) tl.fromTo(bg, { scale: 1.3 }, { scale: 1.08, duration: 2.8, ease: 'power2.out' }, 0);
  buildStripes(stripes, 0.1, tl);
  tl.from(q('.h1-kicker'), { x: -16, opacity: 0, duration: DUR.reveal }, 0.15)
    .from(q('.h1-display .w > span'), {
      yPercent: 115, rotate: 5, transformOrigin: '0% 100%', duration: 1.1, stagger: STAGGER,
    }, 0.22)
    .add(() => em && em.classList.add('sheen'), 1.1)
    .from(q('.hero-copy > .btn-row > *'), { y: 24, opacity: 0, duration: DUR.reveal, stagger: 0.08 }, 0.6);
  // The lead paragraph is the mobile LCP element, so it is painted immediately and never animated.

  if (desk) {
    tl.from(desk, {
      y: 90, rotationX: 16, opacity: 0, transformPerspective: 1400, transformOrigin: '50% 100%',
      duration: 1.5,
    }, 0.35)
      .from(desk.querySelectorAll('.desk-head > *'), { y: 12, opacity: 0, duration: DUR.slow, stagger: 0.08 }, 0.75)
      .from(desk.querySelectorAll('.due'), { x: 34, opacity: 0, duration: DUR.reveal, stagger: STAGGER }, 0.85)
      .from(desk.querySelectorAll('.desk-note, .desk-cta'), { y: 18, opacity: 0, duration: DUR.slow, stagger: 0.1 }, 1.25);
  }

  depth(hero, [
    [bg, { yPercent: 14 }],
    [stripes, { y: -90 }],
    [q('.hero-copy')[0], { y: -60 }],
    [desk, { y: -120 }],
  ]);
  addGlow(hero);

  // Pointer: the stripes and the desk respond to the mouse once the intro has settled.
  if (!deep) return;
  tl.eventCallback('onComplete', () => {
    const sx = stripes && gsap.quickTo(stripes, 'x', { duration: 1.2, ease: 'power3.out' });
    const sy = stripes && gsap.quickTo(stripes, 'yPercent', { duration: 1.2, ease: 'power3.out' });
    const rx = desk && gsap.quickTo(desk, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = desk && gsap.quickTo(desk, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      if (sx) { sx(nx * -40); sy(ny * -6); }
      if (rx) { rx(ny * -5); ry(nx * 6); }
    });
    hero.addEventListener('pointerleave', () => { if (sx) { sx(0); sy(0); } if (rx) { rx(0); ry(0); } });
    if (desk) desk.addEventListener('pointermove', (e) => {
      const r = desk.getBoundingClientRect();
      desk.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
      desk.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}

export function initPageHero() {
  const hero = document.querySelector('.page-hero');
  if (!hero) return;
  const q = gsap.utils.selector(hero);
  const bg = q('.ph-bg')[0];
  const h1 = q('h1')[0];

  const tl = gsap.timeline({ defaults: { ease: EASE.out } });
  if (bg) tl.fromTo(bg, { scale: 1.25 }, { scale: 1.06, duration: 2.6, ease: 'power2.out' }, 0);
  buildStripes(q('.stripes')[0], 0, tl);
  tl.from(q('.crumbs'), { y: -10, opacity: 0, duration: DUR.slow }, 0.05)
    .from(q('.eyebrow'), { x: -16, opacity: 0, duration: DUR.reveal }, 0.1)
    .from(q('.lead'), { y: 16, opacity: 0, duration: DUR.reveal }, 0.4)
    .from(q('.btn-row > *'), { y: 22, opacity: 0, duration: DUR.reveal, stagger: 0.08 }, 0.55);

  if (h1) {
    // Fonts can change line breaks, so SplitText re-splits on load/resize and restores the returned
    // tween's progress. The tween stands alone: one added to the finished intro timeline would never play.
    gsap.set(h1, { opacity: 1 });
    SplitText.create(h1, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.1, stagger: 0.1, delay: 0.15, ease: EASE.out }),
    });
  }

  depth(hero, [[bg, { yPercent: 16 }], [q('.stripes')[0], { y: -70 }], [q('.wrap')[0], { y: -40 }]]);
  addGlow(hero);
}

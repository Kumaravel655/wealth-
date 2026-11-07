// The home page tour. The room list is plain HTML and works alone: without WebGL, or on a phone the
// lite tier protects, the stage shows a still of each room instead. It never takes over the page's
// scrolling; the camera moves only when a visitor chooses a room or walks the route.
import { gsap } from 'gsap';
import { finePointer, lite, reduce } from '../motion/env.js';
import { STOP_KEYS } from './route.js';

const LOOK = 0.07; // Radians of look-around at the stage edge.

export function initTour() {
  const root = document.querySelector('.tour');
  if (!root) return;
  const stage = root.querySelector('.tour-stage');
  const canvas = stage.querySelector('canvas');
  const still = stage.querySelector('img');
  const status = root.querySelector('.tour-status');
  const walkBtn = root.querySelector('.tour-walk');
  const items = [...root.querySelectorAll('.tour-stop')];
  const names = items.map((li) => li.querySelector('.tour-name').textContent);

  const route = { u: 0 };
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  let tour = null, active = 0, inView = false, dirty = true, walking = false, dwell = null;

  const mark = () => { dirty = true; };

  const showRoom = (i) => {
    active = i;
    items.forEach((li, n) => {
      li.classList.toggle('is-active', n === i);
      li.querySelector('button').setAttribute('aria-expanded', String(n === i));
    });
    still.src = items[i].dataset.still;
    still.alt = items[i].dataset.alt;
    status.textContent = `Now showing ${names[i]}`;
  };

  // A new destination replaces the one in progress and leaves from the current pose, along the route.
  const travel = (i, done) => {
    showRoom(i);
    const to = STOP_KEYS[i];
    if (!tour || reduce) { route.u = to; mark(); if (done) done(); return; }
    gsap.to(route, {
      u: to,
      duration: Math.min(1.1 + Math.abs(to - route.u) * 0.34, 5.5),
      ease: 'power2.inOut',
      overwrite: true,
      onUpdate: mark,
      onComplete: done,
    });
  };

  const setWalking = (on) => {
    walking = on;
    walkBtn.setAttribute('aria-pressed', String(on));
    walkBtn.textContent = on ? 'Pause the walk' : 'Walk the route';
    if (!on && dwell) { dwell.kill(); dwell = null; }
  };

  const nextRoom = () => {
    if (!walking) return;
    if (active === items.length - 1) { setWalking(false); return; }
    travel(active + 1, () => { dwell = gsap.delayedCall(2.8, nextRoom); });
  };

  items.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
    setWalking(false);
    travel(i);
  }));

  walkBtn.addEventListener('click', () => {
    if (walking) { gsap.killTweensOf(route); setWalking(false); return; }
    setWalking(true);
    // From the last room the walk restarts with a cut: the route back would just replay it in reverse.
    if (active === items.length - 1) {
      route.u = STOP_KEYS[0]; showRoom(0); mark();
      dwell = gsap.delayedCall(1.6, nextRoom);
    } else nextRoom();
  });

  if (lite || reduce) walkBtn.hidden = true;
  if (lite) return;

  const load = async () => {
    try {
      const { createTour } = await import('./scene.js');
      tour = await createTour(canvas, names);
    } catch {
      return; // No WebGL: the stills stay, and the room list still works.
    }
    canvas.addEventListener('webglcontextlost', () => { tour = null; stage.classList.remove('is-live'); });
    new ResizeObserver(([e]) => {
      tour.resize(e.contentRect.width, e.contentRect.height);
      mark();
    }).observe(stage);
    route.u = STOP_KEYS[active];
    gsap.ticker.add(() => {
      if (!tour || !inView) return;
      const dx = look.tx - look.x, dy = look.ty - look.y;
      const settling = Math.abs(dx) + Math.abs(dy) > 0.0004;
      if (settling) { look.x += dx * 0.09; look.y += dy * 0.09; }
      if (!dirty && !settling) return;
      tour.pose(route.u, look.x, look.y);
      tour.render();
      dirty = false;
      stage.classList.add('is-live');
    });
  };

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) { mark(); if (!load.started) { load.started = true; load(); } } else setWalking(false);
  }, { rootMargin: '300px' }).observe(stage);

  if (finePointer && !reduce) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      look.tx = -((e.clientX - r.left) / r.width - 0.5) * 2 * LOOK;
      look.ty = -((e.clientY - r.top) / r.height - 0.5) * 2 * LOOK * 0.6;
    });
    stage.addEventListener('pointerleave', () => { look.tx = 0; look.ty = 0; });
  }
}

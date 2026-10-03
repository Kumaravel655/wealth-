# Wealth Bridge — Vite build with motion

The same 25-page site as `../website`, bundled by Vite with an animation layer (GSAP, ScrollTrigger,
SplitText, Lenis). Every page stays static HTML, so search engines see exactly what they saw before.

## Commands (run inside `vite-site/`)

    npm install          # once
    npm run sync         # pull the latest generated pages from ../website
    npm run dev          # http://localhost:5173 (live reload)
    npm run build        # writes dist/ — upload everything inside it, including .htaccess
    npm run preview      # serve dist/ at http://localhost:4173

## How content flows

1. Edit content in `../source/` and run the Python build as before (see `../README.md`), then copy the
   result to `../website/`.
2. `npm run sync` copies the pages into this project. It swaps the old stylesheet/script tags for the
   Vite bundle, and adds the motion gate script. Do not hand-edit the synced
   `*.html` files; the next sync overwrites them.
3. `npm run build`.

## Where the motion lives

| File | What it does |
|---|---|
| `src/motion/env.js` | Device tiers: reduced motion (no animation), light tier for Data Saver, low-memory or slow touch devices, full tier for mouse users |
| `src/motion/hero.js` | Home load sequence (stripes build, headline, compliance desk), inner-page heroes, pointer glow |
| `src/motion/reveal.js` | Split-line headings, batched content reveals, photo unveils, parallax |
| `src/motion/sections.js` | Triage wipe, office bridge arc, reviews, map, FAQ accordion |
| `src/motion/pointer.js` | Magnetic buttons, card tilt, spotlight (mouse only) |
| `src/motion/scroll.js` | Smooth scrolling, hide-on-scroll header, marquee speed-up with scroll velocity |
| `src/styles/motion.css` | Page transitions, hand-over from the old CSS motion, hover systems |

`src/styles/base.css`, `src/legacy/site.js` and `src/legacy/tools.js` are copied in by the sync. Change
those in `../source/`, not here.

## Accessibility and performance

- `prefers-reduced-motion: reduce` turns the whole layer off. Pages render exactly as the original site.
- If the script fails to load, the hero is shown after 2.5 seconds anyway.
- Measured on the production build, with an emulated budget phone (4× CPU slowdown, 1.6 Mbps, 150 ms
  latency): home page LCP 2.2 s and CLS 0.006; GST page LCP 1.8 s.

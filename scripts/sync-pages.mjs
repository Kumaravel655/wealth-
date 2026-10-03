// Pulls the Python-generated site (../website by default) into this Vite project.
//
//   node scripts/sync-pages.mjs [path-to-generated-site]
//
// Content stays owned by source/build.py; this project owns bundling and motion.
//   *.html                  -> ./<same path>        (Vite multi-page inputs)
//   assets/css/style.css    -> src/styles/base.css  (bundled, hashed)
//   assets/js/main.js       -> src/legacy/site.js   (bundled, hashed)
//   assets/js/tools.js      -> src/legacy/tools.js  (calculators page only)
//   everything else         -> public/              (served as-is: images, fonts, data, robots, .htaccess)
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, process.argv[2] ?? '../website');
if (!existsSync(join(SRC, 'index.html'))) {
  console.error(`No index.html in ${SRC}. Run source/build.py first, or pass the generated site folder.`);
  process.exit(1);
}

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

// Decides motion before first paint so the hero never flashes its final state.
// wb-ready is the safety net: if the bundle fails to run, content is shown after 2.5s.
const GATE = `<script>(function(d){if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('wb-motion');setTimeout(function(){d.classList.add('wb-ready')},2500)}})(document.documentElement)</script>`;

function transform(html) {
  let out = html
    .replace(/<link rel="stylesheet" href="\/assets\/css\/style\.css[^"]*">/, '<script type="module" src="/src/main.js"></script>')
    .replace(/<script src="\/assets\/js\/main\.js[^"]*" defer><\/script>/, '')
    .replace(/<script src="\/assets\/js\/tools\.js[^"]*" defer><\/script>/, '<script type="module" src="/src/tools.js"></script>');
  out = out.replace("<script>document.documentElement.classList.add('js')</script>", (m) => m + '\n' + GATE);
  if (!out.includes('/src/main.js')) throw new Error('stylesheet link not found; the generator markup changed');
  return out;
}

// Clear previously synced pages (every */index.html outside src/public/node_modules/dist).
for (const f of walk(ROOT)) {
  const rel = relative(ROOT, f);
  const top = rel.split(sep)[0];
  if (['node_modules', 'dist', 'src', 'public', 'scripts'].includes(top)) continue;
  if (rel.endsWith('.html')) rmSync(f);
}
rmSync(join(ROOT, 'public'), { recursive: true, force: true });

const routes = { 'assets/css/style.css': 'src/styles/base.css', 'assets/js/main.js': 'src/legacy/site.js', 'assets/js/tools.js': 'src/legacy/tools.js' };
let pages = 0, files = 0;
for (const f of walk(SRC)) {
  const rel = relative(SRC, f).split(sep).join('/');
  const dest = rel.endsWith('.html') ? join(ROOT, rel) : join(ROOT, routes[rel] ?? join('public', rel));
  mkdirSync(dirname(dest), { recursive: true });
  if (rel.endsWith('.html')) { writeFileSync(dest, transform(readFileSync(f, 'utf8'))); pages++; }
  else { copyFileSync(f, dest); files++; }
}
console.log(`Synced ${pages} pages and ${files} files from ${SRC}`);

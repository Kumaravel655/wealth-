import { defineConfig } from 'vite';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Every synced page is a Vite input, so the site stays multi-page static HTML (good for search engines).
const SKIP = new Set(['node_modules', 'dist', 'public', 'src', 'scripts']);
function pages(dir = process.cwd()) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return SKIP.has(name) ? [] : pages(p);
    return name.endsWith('.html') ? [p] : [];
  });
}
const input = Object.fromEntries(
  pages().map((p) => [relative(process.cwd(), p).split(sep).join('/').replace(/(\/)?index\.html$|\.html$/, '') || 'home', p]),
);

export default defineConfig({
  appType: 'mpa',
  build: {
    rollupOptions: { input },
    assetsDir: 'assets/build',
    cssMinify: true,
    target: 'es2019',
  },
  server: { port: 5173 },
});

// Fails the build when Live Map outputs exceed their gzip budgets (Req 2.3, 17.5).
// Reads esbuild's metafile and groups outputs by how they are loaded:
//   boot  = boot.js + its static imports (always on the billing page)
//   app   = app.js/app.css + static imports not already in boot
//   scene = everything reached only through dynamic import() (ShopScene chunk)
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';

const OUT_DIR = 'dist/live-map';
const KB = 1024;
// React + react-dom alone are ~67 KB gzip, so app gets 90 KB; total stays at 400 KB (Req 17.5).
const BUDGETS = { boot: 5 * KB, app: 90 * KB, scene: 310 * KB, total: 400 * KB };

const meta = JSON.parse(readFileSync(join(OUT_DIR, 'meta.json'), 'utf8'));
const outputs = Object.keys(meta.outputs).filter((f) => !f.endsWith('.map'));
const norm = (p) => relative(OUT_DIR, p).replaceAll('\\', '/');
const byName = new Map(outputs.map((f) => [norm(f), f]));

// Static-import closure of an output, plus its CSS bundle. boot.css is skipped: esbuild
// copies app.css into it (CSS reached via dynamic import), but the page never loads it;
// the loader injects app.css on first open.
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const out = meta.outputs[file];
  if (out.cssBundle && norm(out.cssBundle) !== 'boot.css') seen.add(out.cssBundle);
  for (const imp of out.imports ?? []) {
    if (imp.kind === 'import-statement' && !imp.external) closure(imp.path, seen);
  }
  return seen;
}

const need = (name) => {
  const f = byName.get(name);
  if (!f) throw new Error(`[bundle-size] missing output ${name}`);
  return f;
};

const boot = closure(need('boot.js'));
const appAll = closure(need('app.js'));
const app = new Set([...appAll].filter((f) => !boot.has(f)));
const scene = new Set(outputs.filter((f) => !boot.has(f) && !app.has(f)));

const gz = (f) => gzipSync(readFileSync(f), { level: 9 }).length;
const sum = (set) => [...set].reduce((n, f) => n + gz(f), 0);

const sizes = { boot: sum(boot), app: sum(app), scene: sum(scene) };
sizes.total = sizes.boot + sizes.app + sizes.scene;

let failed = false;
for (const [group, budget] of Object.entries(BUDGETS)) {
  const ok = sizes[group] <= budget;
  failed ||= !ok;
  const kb = (n) => (n / KB).toFixed(1).padStart(6);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${group.padEnd(5)} ${kb(sizes[group])} KB / ${kb(budget)} KB gzip`);
}

if (failed) {
  console.error('[bundle-size] budget exceeded');
  process.exit(1);
}

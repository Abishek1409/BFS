// Checks that every menu image path exists in git with exact case (what Vercel deploys).
// Usage: node scripts/check-assets-git.cjs
const { execFileSync } = require('node:child_process');
const { MENU } = require('../menu-data.js');

const tracked = execFileSync('git', ['-c', 'core.quotepath=off', 'ls-files', 'assets'], { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean).map((p) => p.slice('assets/'.length));
const exact = new Set(tracked);
const byLower = new Map(tracked.map((t) => [t.toLowerCase(), t]));

const problems = [];
for (const item of MENU) {
  const file = item.img.slice('assets/'.length);
  if (exact.has(file)) continue;
  const inGit = byLower.get(file.toLowerCase());
  problems.push(item.name + ': menu wants "' + file + '" but git has ' + (inGit ? '"' + inGit + '" (case differs)' : 'nothing'));
}
console.log(problems.length ? problems.join('\n') : 'All menu images are tracked in git with matching case.');
process.exitCode = problems.length ? 1 : 0;

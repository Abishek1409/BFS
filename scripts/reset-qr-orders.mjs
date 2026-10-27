// Backs up, then deletes, QR test orders and their tracking data from Firebase.
// Keeps liveMap/tables (table layout) and everything else.
// Usage: node scripts/reset-qr-orders.mjs
import { mkdir, writeFile } from 'node:fs/promises';

const DB = 'https://bfs-qr-ordering-default-rtdb.asia-southeast1.firebasedatabase.app';
const PATHS = ['orders', 'orderStatus', 'liveMap/progress', 'liveMap/history'];

const backup = {};
for (const p of PATHS) {
  const res = await fetch(`${DB}/${p}.json`);
  if (!res.ok) throw new Error(`Read ${p} failed: HTTP ${res.status}`);
  backup[p] = await res.json();
}

await mkdir('backups', { recursive: true });
const file = `backups/firebase-orders-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
await writeFile(file, JSON.stringify(backup, null, 2));
console.log('Backup saved:', file);

for (const p of PATHS) {
  const count = backup[p] && typeof backup[p] === 'object' ? Object.keys(backup[p]).length : 0;
  const res = await fetch(`${DB}/${p}.json`, { method: 'DELETE' });
  console.log(`${p}: ${res.ok ? 'deleted' : 'DELETE failed HTTP ' + res.status} (${count} entries)`);
}

// Confirm
for (const p of PATHS) {
  const res = await fetch(`${DB}/${p}.json`);
  console.log(`${p} now:`, JSON.stringify(await res.json()));
}

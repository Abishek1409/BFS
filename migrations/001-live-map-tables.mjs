#!/usr/bin/env node
// Seeds liveMap/tables (8 tables) and liveMap/schemaVersion through the RTDB REST API.
// Idempotent: writes only when liveMap/tables is missing or empty. Touches nothing
// outside liveMap, so orders and orderStatus stay unchanged (Req 18.1, 18.2).
//
// Usage:
//   FIREBASE_DB_URL=https://<project>-default-rtdb.<region>.firebasedatabase.app \
//   FIREBASE_AUTH=<database secret or ID token, optional with open rules> \
//   node migrations/001-live-map-tables.mjs
import { readFile } from 'node:fs/promises';

const dbUrl = (process.env.FIREBASE_DB_URL || '').replace(/\/+$/, '');
const auth = process.env.FIREBASE_AUTH || '';

if (!/^https:\/\/[^/]+$/.test(dbUrl)) {
  console.error('Set FIREBASE_DB_URL to your Realtime Database URL (https://..., no path).');
  process.exit(1);
}

const seed = JSON.parse(await readFile(new URL('./001-live-map-tables.json', import.meta.url), 'utf8'));

function url(path) {
  const u = new URL(`${dbUrl}/${path}.json`);
  if (auth) u.searchParams.set('auth', auth);
  return u;
}

async function request(method, path, body) {
  const res = await fetch(url(path), {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} /${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

try {
  const existing = await request('GET', 'liveMap/tables');
  if (existing && typeof existing === 'object' && Object.keys(existing).length > 0) {
    console.log(`liveMap/tables already has ${Object.keys(existing).length} table(s). Nothing to do.`);
    process.exit(0);
  }
  await request('PUT', 'liveMap/tables', seed.tables);
  await request('PUT', 'liveMap/schemaVersion', seed.schemaVersion);
  console.log(`Seeded ${Object.keys(seed.tables).length} tables under liveMap/tables (schemaVersion ${seed.schemaVersion}).`);
} catch (err) {
  // The error text never includes the auth token (it is only in the query string).
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
}

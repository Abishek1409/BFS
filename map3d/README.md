# BFS Live Map

A full-screen 3D view of the shop, opened from the "🗺️ Live Map" button on the billing page. Source lives in `map3d/` (`lib`, `hooks`, `ui`, `scene`) and builds to `dist/live-map/`.

## Setup

```bat
npm install
npm run build
npm run typecheck
npm run test:live-map
```

`npm run build` bundles `boot.js` (always loaded) plus the lazy app and scene chunks, then fails if a gzip budget is exceeded (boot 5 KB, app 90 KB, scene 310 KB, total 400 KB).

The map uses the Firebase app that `index.html` already initialises from `firebase-config.js`. Without a config it opens in offline mode with the built-in layout.

## Migration: seed the 8 tables

The map works without this step (it falls back to 8 unoccupied tables), but the Occupied toggle needs `liveMap/tables` to keep its data consistent.

Option A, Firebase console: Realtime Database → Data → hover the root → add a child `liveMap` → ⋮ → Import JSON → choose `migrations/001-live-map-tables.json`. Import replaces the node you import into, so import at `/liveMap` only, never at the root.

Option B, script (only writes when `liveMap/tables` is empty, safe to re-run):

```bat
set FIREBASE_DB_URL=https://<project>-default-rtdb.<region>.firebasedatabase.app
set FIREBASE_AUTH=<database secret or ID token, if your rules need it>
node migrations\001-live-map-tables.mjs
```

Neither option touches `orders` or `orderStatus`.

Optional rules: `migrations/database.rules.example.json` keeps the current open read/write model and adds shape validation for `liveMap/*`. Merge it with your existing rules by hand in Realtime Database → Rules, and use the Rules Playground before publishing.

## Vercel deployment

No project settings change. `vercel.json` runs `npm run build` and serves the repo root.

- `/dist/live-map/chunks/*` are content-hashed and cached as immutable.
- `boot.js`, `app.js` and `app.css` are revalidated on every load, so a deploy is picked up right away.

Commit, push to a branch and check the preview: open billing, open the Live Map, place a test QR order, step it through Preparing, Ready and Served, print the bill, and confirm the table returns to Free.

## Security note

The Live Map keeps the billing page's existing no-login model. Anyone with the public Firebase config can read and write whatever your current rules allow, and this feature adds `liveMap/*` to that surface. The example rules only validate data shape; they do not restrict who can write. Adding Firebase Auth is the way to close that gap and is out of scope for this feature.

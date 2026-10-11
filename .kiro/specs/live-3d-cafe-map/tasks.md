# Implementation Plan

- [x] 1. Set up TypeScript build, bundle splitting and size budget





  - Add pinned dev dependencies `typescript`, `@types/react`, `@types/react-dom`, `@types/three`; add `tsconfig.json` (strict, `jsx: react-jsx`, `noEmit`, `allowImportingTsExtensions`, no enums)
  - Replace the `build` script with the esbuild splitting command from the design (entries `map3d/boot.ts`, `map3d/app.tsx` → `dist/live-map/`, metafile on); add `typecheck` and `test:live-map` scripts
  - Create `scripts/check-bundle-size.mjs` that reads `meta.json`, gzips outputs and fails on budget overrun (boot ≤ 5 KB, app ≤ 90 KB, scene ≤ 310 KB, total ≤ 400 KB); chain it after the build
  - Add placeholder `map3d/boot.ts` and `map3d/app.tsx` so the build runs
  - _Requirements: 1.5, 2.1, 2.3, 17.5_

- [x] 2. Implement shared pure lib modules




- [x] 2.1 Create types, layout, format and theme modules


  - Write `map3d/lib/types.ts` with the core types from the design
  - Write `map3d/lib/layout.ts` (`SHOP_LAYOUT`: 14×10 floor, 8 tables with chair slots, 3 counters, walls, `staffPath`, `bounds`)
  - Write `map3d/lib/format.ts` (`elapsed`, `money`, `shortOrderNo`) and `map3d/lib/theme.ts` (`readTheme` from CSS vars with fallbacks)
  - _Requirements: 1.3, 1.4, 3.1, 18.3_


- [x] 2.2 Implement order normalisation and progress transitions

  - Write `map3d/lib/orders.ts` (`isValidOrder`, `normalizeOrder`, `itemPrefs` from ice/sugar/size/note/spec)
  - Write `map3d/lib/progress.ts` (`createFrom`, `withStage`, `withPaid`, `isClosable`)
  - _Requirements: 1.4, 1.6, 8.1, 8.7_


- [x] 2.3 Implement status derivation, counters and events




  - Write `map3d/lib/status.ts` (`deriveTableStatus` incl. primary order, `extraOrders`, paid badge; `STATUS_META` with palette and labels)
  - Write `map3d/lib/counters.ts` (`openCount`, `avgPrepMinutes`, `todaySales`) and `map3d/lib/events.ts` (`diffToEvents`, 8-item ring buffer, 1.5 s pulses)
  - _Requirements: 5.1, 5.2, 8.5, 8.6, 9.1, 9.2, 9.3, 11.3, 11.4, 14.4_

- [x] 2.4 Write unit tests for lib logic







  - `test/live-map/status.test.ts`, `progress.test.ts`, `counters.test.ts`, `events.test.ts` run with `node --test`
  - _Requirements: 1.6, 5.1, 8.5, 8.6, 8.7, 9.1, 9.2, 11.3_
-

- [x] 3. Implement Firebase access and the progress recorder




- [x] 3.1 Create the Firebase wrapper


  - Write `map3d/lib/firebase.ts` (`getDb()` from the existing `window.firebase` app, returns null if config is missing; `PATHS`; `runTxn` promise wrapper)
  - _Requirements: 1.1, 19.3_


- [x] 3.2 Implement ProgressRecorder

  - Write `map3d/lib/recorder.ts`: `orders` child_added/child_changed → transactional create of `liveMap/progress/{id}` for valid orders; `served` status → stage served; per-active-order `orderStatus/{id}` listener → paid; closable records move to `liveMap/history/{date}/{id}` and `liveMap/tables/{n}/occupied=false`; returns `stop()`
  - Write only under `liveMap`; idempotent across tabs
  - _Requirements: 1.1, 1.6, 8.5, 8.6, 8.7, 15.1, 19.3_

- [ ]* 3.3 Write recorder tests against an in-memory RTDB fake
  - `test/live-map/recorder.test.ts`: snapshot on add, survives `orders/{id}` removal, served from stub record, close when served+paid, two recorders give one record
  - _Requirements: 8.5, 8.7, 15.1_

- [x] 4. Build the LiveStore and React hooks





- [x] 4.1 Implement LiveStore

  - Write `map3d/lib/store.ts` (`createLiveStore`): subscribe to `liveMap/progress`, `liveMap/tables` (built-in layout fallback when empty), `.info/connected`, today's history once; read today's bills via `window.BillHistory`; microtask-coalesced snapshot rebuild; `select`, `setStage` and `setOccupied` with optimistic update, rollback and error event
  - _Requirements: 8.1, 8.3, 8.4, 9.3, 9.4, 15.1, 15.2, 15.3, 18.3_


- [x] 4.2 Emit bill-saved event from billHistory.js

  - In `billHistory.js` dispatch `window.dispatchEvent(new CustomEvent('bfs:bill-saved', { detail: record }))` after a successful save; no other change
  - _Requirements: 9.4_


- [x] 4.3 Create hooks

  - Write `map3d/hooks/useLiveStore.ts`, `useNow.ts` (shared 1 Hz), `useViewMode.ts` (localStorage `bfs.liveMap.view`), `useTabVisible.ts`, `useReducedMotion.ts`
  - _Requirements: 6.2, 12.4, 12.5, 17.3_

- [x] 5. Build the HUD shell and List View







- [x] 5.1 Create HUD styles and LiveMapApp root









  - Write `map3d/ui/live-map.css` using existing CSS vars (translucent panels, focus outlines, Map_Focus fade with hover/focus-within restore, Billing_Focus layering, < 900 px layout)
  - Write `map3d/ui/LiveMapApp.tsx` (grid layout, Esc clears selection, view-mode classes) and `map3d/app.tsx` (`mount`/`unmount`, creates the store)
  - _Requirements: 1.3, 7.5, 12.1, 12.2, 12.3, 12.4_


- [x] 5.2 Implement TopBar, Legend and Minimap

  - `TopBar.tsx`: open count (1.5 s highlight on new order), avg prep, today's sales, offline pill, view toggle, close
  - `Legend.tsx` for six statuses; `Minimap.tsx` SVG from `SHOP_LAYOUT` with clickable, labelled tables
  - _Requirements: 5.4, 9.1, 9.2, 9.3, 14.1, 14.2, 14.5, 15.2, 15.3_


- [x] 5.3 Implement SidePanel, OrderList and OrderPanel

  - `OrderList.tsx`: active orders oldest first with table, order no., status label+colour, item count, total, elapsed; empty state; "Unknown table" tag; click selects table
  - `OrderPanel.tsx`: items with prefs and totals, elapsed, stage buttons, Paid badge / "Billed #", Bill button, Occupied toggle for tables without orders, close button
  - _Requirements: 6.1, 7.1, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.6, 10.1, 10.2, 10.3_



- [x] 5.4 Implement BillingBridge, BottomBar and EventsFeed

  - Write `map3d/lib/bridge.ts` calling existing `loadQrOrder`, `clearBill`, `openRptDrawer`, `openHistDrawer` and scrolling to `#oqList`; actions switch to Billing_Focus first
  - `BottomBar.tsx` (quick actions, reset view, view toggle, list toggle) and `EventsFeed.tsx` (`aria-live="polite"`, 8 items)
  - _Requirements: 8.2, 11.1, 11.2, 11.3, 11.4_


- [x] 5.5 Implement ListView, LoadingSkeleton and SceneBoundary

  - `ListView.tsx`: 8-table grid with status label/colour, order no., elapsed, selection opening the same OrderPanel
  - `LoadingSkeleton.tsx` in HUD style; `SceneBoundary.tsx` error boundary falling back to ListView with "Retry 3D"; `map3d/lib/webgl.ts` (`hasWebGL`)
  - Wire `React.lazy` import of `scene/ShopScene.tsx` with `Suspense` in `LiveMapApp`, plus list toggle
  - _Requirements: 2.2, 2.4, 16.1, 16.2, 16.3, 16.4, 16.5_
-

- [x] 6. Build the 3D shop scene



- [x] 6.1 Create ShopScene, materials, CameraRig and FrameGovernor










  - `ShopScene.tsx` (`Canvas dpr={[1,1.5]}`, lights, theme materials from `materials.ts`)
  - `CameraRig.tsx` with drei `CameraControls` (limits, `setBoundary`, smooth `reset`, 10 s idle drift ≤ 0.5 u, disabled for reduced motion / Billing_Focus); expose reset to BottomBar
  - `FrameGovernor.tsx` (`never` when hidden, 10 fps `demand` in Billing_Focus)
  - _Requirements: 3.3, 3.4, 4.4, 12.2, 13.1, 13.2, 13.3, 13.4, 17.1, 17.3, 17.4_


- [x] 6.2 Build the static environment with instancing

  - `Floor.tsx` (instanced tilges), `Walls.tsx`, `Chairs.tsx` (single `Instances`), `BillingCounter.tsx`, `JuiceStation.tsx` with juicer and `FruitCrates.tsx` (instanced crates and fruit), `SnackCounter.tsx`
  - _Requirements: 3.1, 3.2, 3.4, 17.2_


- [x] 6.3 Implement TableEntity with markers, selection, tooltip and pulse

  - `TableEntity.tsx` (exponential colour lerp ~600 ms, hover, click → `store.select`)
  - `StatusMarker.tsx` (drei `Html`, order no. + elapsed or table number only, `+N` badge), `SelectionRing.tsx`, `Tooltip.tsx`, `OrderPulse.tsx`

  - _Requirements: 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 14.3, 14.4_

- [x] 6.4 Add ambient animations

  - `Steam.tsx` (instanced puffs over snack counter), `JuicePour.tsx` (while any order preparing), `StaffFigure.tsx` (Catmull-Rom loop)
  - _Requirements: 4.1, 4.2, 4.3_


- [ ] 7. Wire the boot entry into index.html and replace the prototype

- [x] 7.1 Implement boot loader


  - `map3d/boot.ts`: start recorder when Firebase is available; `window.BFSLiveMap = { open, close }` dynamically importing `./app.js`, mounting into a created `#bfsLiveMap` root, loading skeleton during import, inline retry on failure; restore saved view via `requestIdleCallback`; all in try/catch
  - _Requirements: 2.1, 2.2, 2.4, 12.5, 19.1_


- [x] 7.2 Update index.html to use the new Live Map


  - Add `<script type="module" src="dist/live-map/boot.js">` and the `app.css` link after existing scripts; point the header "Live Map" button to `BFSLiveMap.open()`
  - Remove the inline `3D MAP TABLE INTEGRATION`, `3D LIVE MAP INTEGRATION`, `LIVE MAP DRAWER` blocks and the `#mapDrawer`/`#liveMapContainer` markup, after confirming the file list with the owner
  - _Requirements: 1.2, 1.4, 19.1, 19.2_

- [x] 7.3 Remove superseded map3d prototype files





  - After owner confirmation, delete old `map3d/*.js` modules, demos, TASK notes, `dist/map3d.js`, and old tests covering only those modules; ensure `npm test`, `npm run typecheck` and `npm run build` pass
  - _Requirements: 1.2, 1.4, 17.5_

- [x] 8. Add migration, rules example, Vercel headers and setup guide





  - Create `migrations/001-live-map-tables.json` (schemaVersion + 8 seeded tables), `migrations/001-live-map-tables.mjs` (idempotent REST seeding), `migrations/database.rules.example.json` (validation for `liveMap/*`)
  - Update `vercel.json` headers: immutable for `/dist/live-map/chunks/(.*)`, revalidate for `boot.js`/`app.js`/`app.css`; remove the old `/map3d/(.*)` rule
  - Write `map3d/README.md` with short setup, migration and Vercel deployment steps plus the open-access security note
  - _Requirements: 18.1, 18.2, 18.3, 19.2, 19.4_

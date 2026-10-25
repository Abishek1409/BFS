# Implementation Plan

- [x] 1. Build server-side JWT auth on Vercel Functions





- [x] 1.1 Create `lib/jwt.js` with HS256 sign, verify, and password check



  - Use Node `crypto` (`createHmac`, `timingSafeEqual`), base64url encoding, `exp` check
  - Return `null` from `verify` for malformed, tampered, or expired tokens
  - _Requirements: 2.2, 3.3, 3.5_


- [x] 1.2 Create `api/admin/login.js` and `api/admin/verify.js`

  - Login: POST only, read `ADMIN_PASSWORD_HASH` and `JWT_SECRET` env vars, issue 8h token, 401 "Incorrect password" with delay, 500 if env missing
  - Verify: read Bearer token, return `{valid, exp}` or 401
  - _Requirements: 2.2, 2.4, 3.1, 3.3, 3.5_


- [x] 1.3 Add `scripts/hash-password.mjs` to print sha256 hex of a password









  - _Requirements: 3.5_


- [ ]* 1.4 Write `test/admin-jwt.test.js`



  - Round trip, expired, tampered, malformed tokens; login handler 200/401 via mock req/res
  - _Requirements: 2.2, 2.4, 3.3_

-


- [x] 2. Build client auth module



- [x] 2.1 Create `adminAuth.js` exposing `window.AdminAuth`


  - `login`, `logout`, `isActive`, `validate`, `requireAdmin`, `onChange`
  - Store token in `bfs_admin_token`; auto-logout timer at `exp`
  - Lockout after 5 failures in 15 minutes, return `lockedForMs`
  - Handle unreachable server with "Cannot reach login server"
  - _Requirements: 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

- [x] 3. Build inventory module




- [x] 3.1 Create `inventory.js` exposing `window.Inventory` with injectable storage


  - Seed from built-in menu when empty, persist to `bfs_inventory_v1`
  - `updatePrice` (1..100000), `addItem` (unique id, non-empty unique name), `setAvailable`, `getAvailable`
  - `setTracking`, `restock`, `deductForBill` (floor 0), `exportJson`, `importJson` with validation
  - `onChange` listeners; also export via `module.exports` for Node tests
  - _Requirements: 5.2, 5.3, 5.4, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 3.2 Write `test/inventory.test.js`
  - Seeding, price bounds, duplicate names, stock floor at 0, invalid import rejected
  - _Requirements: 5.3, 6.3, 7.3, 8.1, 8.5_

- [x] 4. Wire inventory into the billing page




- [x] 4.1 Replace hard-coded `MENU` usage in `index.html` with Inventory


  - Rename array to `DEFAULT_MENU` as seed; build menu grid and item lookup from `Inventory.getAvailable()`
  - Show "Out of stock" label on menu card when tracked qty is 0
  - Re-render menu on `Inventory.onChange`
  - _Requirements: 1.1, 1.2, 5.2, 5.4, 6.5, 7.5, 8.1, 8.2_


- [x] 4.2 Deduct stock after a bill is saved





  - Call `Inventory.deductForBill(billItems)` after `BillHistory.saveBillRecord` resolves; leave saved bill records untouched
  - _Requirements: 5.5, 7.3_

- [x] 5. Add admin login UI and gate protected features




- [x] 5.1 Add login modal and header buttons in `index.html`


  - "Admin" button when logged out, "Admin Panel" and "Logout" when logged in
  - Hide History and Reports buttons while logged out; toggle via `AdminAuth.onChange`
  - Login modal with password field, error text, and lockout countdown
  - Validate stored token on page load before showing protected controls
  - _Requirements: 1.3, 1.4, 2.1, 2.3, 2.4, 2.5, 3.1, 3.4_


- [x] 5.2 Gate `openHistDrawer` and `openRptDrawer` with `AdminAuth.requireAdmin`





  - Show login modal instead when no valid session
  - _Requirements: 3.2, 4.1, 4.2, 4.3_
-

- [x] 6. Build the Admin_Panel drawer




- [x] 6.1 Add items table with price editing and availability toggle

  - List name, category, price; inline price edit with error "Price must be between 1 and 100000"
  - Buttons to open History and Reports from the panel
  - Each action calls `AdminAuth.requireAdmin` before saving
  - _Requirements: 3.2, 4.1, 4.2, 5.1, 5.2, 5.3, 6.4_


- [x] 6.2 Add "New item" form





  - Name, emoji, price, category, ice/sugar options; show validation errors from `Inventory.addItem`
  - _Requirements: 6.1, 6.2, 6.3_


- [x] 6.3 Add stock controls





  - Enable tracking, set qty and low-stock threshold, restock amount input, low-stock indicator

  - _Requirements: 7.1, 7.2, 7.4_

- [x] 6.4 Add inventory export and import buttons





  - Download JSON file; import with "Invalid inventory file" on failure
  - _Requirements: 8.4, 8.5_

- [x] 7. Load new scripts and add test script





  - Add `<script src="adminAuth.js">` and `<script src="inventory.js">` to `index.html` before the main script
  - Add `test:admin` script in `package.json` running the new test files
  - _Requirements: 1.1, 2.1_

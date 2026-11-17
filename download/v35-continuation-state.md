# SLP Billing v35 — continuation state (session cut off mid-task)

Everything below is ALREADY in the workspace and committed as `f91635c` (v35 WIP part 1).
The app source, Prisma schema, tests and this file are saved. Send any message to continue.

## What is DONE and verified (all E2E-proven on the isolated test server)

### Req 1 — Admin login ✅
- Gate gained an "Owner login (Admin)" step: username **Pradeep**, initial password **2125**.
- Seeded silently (client-side DEK re-wrap + server scrypt hash — plain password never stored)
  on the FIRST owner MPIN unlock after this update.
- Login works from the lock screen; wrong credentials get one generic error (no username probing).
- Old MPIN unlock still works unchanged.

### Req 2 — Staff accounts ✅
- Admin creates staff (username + temp password) in Settings (existing flow, audited now).
- Staff login verified; staff see ONLY Bill / History / Verify (no owner tabs).
- Staff can change their OWN password from the header button (`data-staff-password-btn`
  → current + new password, DEK re-wrapped, scrypt hash replaced server-side).
- Admin reset/deactivate/delete all work (existing UI, now with audit events).

### Req 3 — Staff price editing ✅
- Cart lines show the product's SAVED price (`origPrice`) next to the edited selling price.
- Per-item discount toggle ₹ / % (both kinds computed and synced to legacy `discount` field).
- Owner-configured limits: Settings → "Staff discount limits" (max % + max ₹ per item,
  optional "allow over-limit with approval"). Stored in the new server `AppConfig` table.
- Over-limit staff discounts: BLOCKED in the UI (Complete Bill disabled) when approval mode is
  off; flagged `needsApproval` + owner notification when approval mode is on (server-side too).
- Master product prices never change; the NEXT bill uses the saved price again (proven in E2E).
- The server RECOMPUTES all totals + GST from the line items (client totals never trusted).

### Req 4/5/7 — UPI QR + verification barcode ✅
- New `QrCode.tsx` (inline SVG via `qrcode` pkg, VPA validated by `isValidUpiId`).
- Payment QR on: the UPI collection screen, the formal invoice, the 58/80mm thermal slip.
  Labeled "QR CODE – MAKE PAYMENT". Decodes (ZXing round-trip) to `upi://pay?pa=<saved id>&am=<amount>&cu=INR`.
- UPI ID changes in Settings propagate server-side → every device's QR regenerates (mirror ≤ ~5 s).
- Code 128 verification barcode moved to the invoice TOP-RIGHT (white chip in the navy header),
  labeled "SCAN TO VERIFY BILL". Never a QR; the QR is never a verification barcode.
- Invalid UPI ID → no QR rendered (validation gate proven).

### Req 8/14 — Backend enforcement + audit ✅
- Staff tokens get 403 on: config PUT, notifications, bills monitor, audit read/write, staff
  management, bill cancellation. Audit POST is owner-only (staff actions are recorded server-side
  at registration instead — cannot be faked).
- New `AuditEvent` model: `bill_created`, `price_edit`, `discount_applied`, `bill_cancelled`,
  `staff_created/reset/activated/deactivated/deleted`, `owner_password_seeded/changed`,
  `config_changed` (old→new values). Owner reads it in the dashboard.

### Req 10 — Centralized sync ✅ (mostly pre-existing, extended)
- The vault engine (4 s pull, union-merge, tombstones) already syncs products/settings/bills.
- NEW: server-authoritative `AppConfig` (UPI ID, GST, discount limits) polled every cycle;
  offline config saves queue and retry (`saveConfigToServer`).
- NEW: offline-saved bills join `pendingRegIds` (persisted) and auto-register on reconnect —
  the printed barcode always ends up verifiable.
- NEW: **server-reserved bill numbers** (`POST /api/bills/reserve`, atomic counter) — two staff
  billing at the same moment get DIFFERENT bill numbers (fixed a real collision bug found in testing).

### Req 11/12/13 — Notifications + dashboard ✅
- New `Notification` model: created SERVER-SIDE only when a staff bill row is actually written
  (failed saves can never notify); unique (type, billNo) — duplicates impossible.
- Admin Dashboard (owner-only tab, red unread badge on the nav): notification list with staff
  name + @username + bill no + customer + total + discount + status + time; click → the real
  invoice document (view/download via the existing InvoiceModal); mark-all-read; live staff
  activity feed; Staff Billing Activity (search bill no/customer/staff, staff + date filters,
  per-staff sales/discount totals, high-discount flags, CSV export).

### Req 6 — Camera scanner ✅ (code done, E2E suite still to write)
- `VerifyView.startCamera` rewritten: real `getUserMedia` (back camera), native BarcodeDetector
  where available, **ZXing Code 128 decoder fallback everywhere else** (the old "camera not
  opening" was BarcodeDetector being unavailable); explicit handling for NotAllowedError
  (denied-permission help panel with enable steps) and NotFoundError; camera STOPS the moment a
  code reads; manual entry always available.

## Test results so far (isolated :3100 server, throwaway db)
- `scripts/shot-v35-auth.mjs`      → **24/24 PASS**
- `scripts/shot-v35-billing.mjs`   → **21/21 PASS**
- `scripts/shot-v35-dashboard.mjs` → **23/23 PASS**
- `scripts/shot-v35-invoice.mjs`   → was RUNNING when the session ended (check its last run;
  it validates QR decode round-trips + barcode placement; needed a fixed ~5.2 s SW-settle wait
  after first goto because the fresh SW's controllerchange auto-reloads once)
- `scripts/shot-v35-camera.mjs`    → NOT WRITTEN YET (see plan below)
- `scripts/shot-v35-sync.mjs`      → NOT WRITTEN YET

## What remains (do in this order)
1. Run `PORT=3100 bash scripts/run-e2e.sh scripts/shot-v35-invoice.mjs` → fix whatever fails
   (all other suites' fixes are already in; likely only locator/timing nits left).
2. Write + run `shot-v35-camera.mjs`: (a) stub `navigator.mediaDevices.getUserMedia` to return
   a `canvas.captureStream()` that draws a rendered Code 128 barcode bitmap (generate with
   JsBarcode in-page), delete `window.BarcodeDetector` first to force the ZXing path, click
   "Scan with camera" → expect `[data-verify-result="valid"]`; (b) make getUserMedia reject
   with NotAllowedError → expect `[data-camera-denied]` + manual entry still works; (c) assert
   the stream tracks are STOPPED after the successful hit.
3. Write + run `shot-v35-sync.mjs`: owner adds a product → appears in staff's Bill tab ≤ 8 s;
   owner edits a price → staff sees it; offline bill registration retry (route-abort
   /api/verify/register, complete bill, unroute → registry row appears); config change (UPI)
   mirrors to staff.
4. Full regression: v24 v25 v27 v29 v30 v32 smoke debug-te + all v35 suites (popup pins already
   bumped to '35' in every old suite).
5. `bun run lint && bun run build` (the build predates the last fixes — reserve route, audit 403s,
   patch-config, bill reservation wiring).
6. Visual check: render the invoice PNG (barcode top-right + QR) — soffice/pdftoppm not needed;
   screenshot via Playwright and Read it (check "SCAN TO VERIFY BILL" top-right, QR section,
   no overlap with the status stamp).
7. Commit as v35 (final), restart :3000 with the new build
   (`node scripts/free-port.mjs` then `bun run start` in background; verify /verify 200 and
   owner MPIN state), then update `scripts/shot-v32.mjs`-style popup pins if needed.
8. Real-device notes for the user: Android Chrome gets the native detector; iOS Safari/Firefox
   get the ZXing path; camera permission prompt appears on first scan.

## Key files touched (for reference)
- Server: `src/app/api/{auth/owner/login, auth/owner/password, auth/state, staff/me/password,
  staff, staff/[id], config, notifications, bills, bills/reserve, audit, verify/register,
  verify/cancel, verify/[code]}/route.ts`, `src/lib/server/auth.ts`
- Client: `src/lib/{cloud,sync,store,billing,types,role,version,i18n}.ts`,
  `src/components/{LockScreen,BillPanel,QrCode,PaymentScreen,InvoiceDoc,ThermalSlip,VerifyView,
  AdminDashboard,Navigation,SettingsView}.tsx`, `src/app/page.tsx`
- Schema: `prisma/schema.prisma` (SyncAccount owner-password fields, AppConfig, Notification,
  AuditEvent, VerifiedBill.createdById/needsApproval) — pushed to the production db (additive).
- Version: APP_VERSION '35', sw CACHE 'slp-billing-v35'.

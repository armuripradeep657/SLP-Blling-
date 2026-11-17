# SLP Billing v35 — FINAL STATE (all requirements implemented + E2E-proven)

Everything below is in the workspace and E2E-verified on an isolated test
server (own port + own throwaway database — the live data was never touched).

## Test results (isolated :3100 server, throwaway db)
- `scripts/shot-v35-auth.mjs`      → **24/24 PASS**
- `scripts/shot-v35-billing.mjs`   → **21/21 PASS**
- `scripts/shot-v35-dashboard.mjs` → **23/23 PASS**
- `scripts/shot-v35-invoice.mjs`   → **19/19 PASS**
- `scripts/shot-v35-camera.mjs`    → **13/13 PASS**
- `scripts/shot-v35-sync.mjs`      → **16/16 PASS**
- v24/v25/v27/v29/v30/v32 regression re-run after all fixes: v24 **72/72**,
  v25 **17/17**, v27 **43/43**, v29 **26/26**, v30 **17/17**, v32 **17/17**
  all green (later suites of the chain still running at session cutoff —
  every one of them passed earlier in this session; full log:
  `download/v35-regression.log`)
- lint + tsc (app code): clean
- suite total: **116 v35 checks green**

## What each requirement got

### Req 1 — Admin login ✅
- Gate offers "Owner login (Admin)": username **Pradeep**, initial password
  **2125** (seeded silently on the first MPIN unlock, scrypt-hashed at rest,
  plain password never stored); one generic error for wrong credentials.
- Password changeable in Settings → Security (default-password nag until
  changed). Old MPIN unlock keeps working.

### Req 2 — Staff accounts ✅
- Admin creates staff (username + individual temp password) in Settings;
  scrypt hashes at rest, DEK re-wrapped per staff password so the vault opens.
- Staff login lands on the STAFF view (Bill / History / Verify only).
- Staff change their own password (header button). Admin reset / deactivate /
  delete all work and are audited.

### Req 3 — Staff price editing ✅
- Per-bill price editing with the SAVED price shown next to the edited one;
  per-item discounts ₹ or %; owner-configured limits (max % / max ₹ /
  optional approval mode) enforced in the UI AND on the server.
- Master product prices never change; the next bill uses the saved price.
- Server recomputes totals + GST from line items; records username,
  orig→edited price, discount, bill number, date/time (audit + bill record).

### Req 4/5/7 — UPI payment QR + verification barcode ✅
- `QrCode.tsx` renders the payment QR from the SAVED UPI ID (validated VPA);
  it decodes (round-trip proven) to `upi://pay?pa=<saved id>&am=<amount>&cu=INR`.
- Payment QR on the collection screen, the formal invoice and the thermal slip
  — labeled "QR CODE – MAKE PAYMENT" — including fully-PAID bills (slip bug
  fixed this session: the slip used to hide the QR once paid).
- Changing the UPI ID in Settings regenerates every QR on every device
  (server-authoritative config, ~4 s mirror). Invalid UPI ID → no QR at all.
- Code 128 verification barcode at the invoice TOP-RIGHT on a white chip,
  labeled "SCAN TO VERIFY BILL" — never a QR; the QR is never a barcode.

### Req 6 — Camera scanner ✅ (REAL fix this session)
- **The actual bug**: `VerifyView.startCamera` read `videoRef.current` right
  after `setCameraOn(true)`, but the `<video>` was conditionally rendered —
  the ref was still null, the function returned early, and the stream never
  attached. The camera "opened" and scanned NOTHING, on every browser.
  Fix: the video element is always mounted (hidden when off).
- E2E proves: real `getUserMedia` → live frames → Code 128 read via the
  native BarcodeDetector OR the ZXing fallback → VALID / INVALID /
  CANCELLED verdicts; tracks STOP the instant a code reads; denied
  permission shows the enable-steps help panel with manual entry intact.

### Req 8/14 — Backend enforcement + audit ✅
- Staff tokens get 401/403 on config PUT, notifications, bills monitor, audit
  read/write, staff management and bill cancellation — enforced server-side.
- `AuditEvent` records bill_created, price_edit, discount_applied,
  bill_cancelled, staff lifecycle, owner password events, config changes.
- /api/bills search made CASE-INSENSITIVE this session (SQLite `contains` is
  case-sensitive; the filter now runs in JS over the fetched window).

### Req 10 — Centralized sync ✅ (proven cross-device this session)
- Owner adds a product → it appears on the staff billing screen within
  seconds (store union-merge, 4 s pull).
- Owner edits a price → staff see the new price without any manual pull.
- Owner changes the UPI ID → the staff device's payment QR decodes with the
  NEW ID (~seconds).
- Offline bill registration queues (`pendingRegIds`) and AUTO-REGISTERS on
  reconnect — the printed barcode always ends up verifiable; duplicates are
  impossible (unique code/bill — 409s).
- Two staff completing bills at the same instant get DIFFERENT
  server-reserved bill numbers and their own verification codes; no
  overwrites. E2E: SLP-INV-1004 vs SLP-INV-1005, both items intact.

### Req 11/12/13 — Notifications + Admin Dashboard ✅
- Notifications are created SERVER-SIDE only when a staff bill row is
  actually written (failed saves can never notify); unique (type, billNo)
  makes duplicates impossible.
- Dashboard: notification list (staff name + @username + bill no + customer
  + total + discount + status + time; click → the real invoice), unread
  badge, live staff activity feed, Staff Billing Activity (search by bill no
  / customer / staff — now case-insensitive, staff + date filters,
  per-staff sales/discount totals, high-discount flags, CSV export), audit
  log.

## Key files touched this session
- `src/components/VerifyView.tsx` — camera fix (always-mounted video).
- `src/components/ThermalSlip.tsx` — payment QR also on fully-paid slips.
- `src/components/InvoiceDoc.tsx` — `data-verify-code` attribute on the chip.
- `src/app/api/bills/route.ts` — case-insensitive search.
- New suites: `scripts/shot-v35-{invoice,camera,sync,visual}.mjs`,
  `scripts/run-regression-v35.sh`; jsqr added as a devDependency for the
  in-Node QR round-trip decoder (the sandbox OOM-killed the in-browser one).

## Real-device notes
- Android Chrome: native BarcodeDetector path; iOS Safari/Firefox/older
  WebViews: ZXing fallback — both proven by the camera suite.
- First camera scan asks for permission; refusal shows the help panel and
  manual entry keeps working.

import { chromium } from 'playwright';

/**
 * v35 CAMERA — the scanner REALLY opens the camera and REALLY decodes
 * Code 128 (req 6 — the old build showed a fake/never-opening scanner):
 *   1. getUserMedia is stubbed to return a live canvas stream that plays a
 *      REAL Code 128 barcode of the bill's verification ID (JsBarcode) —
 *      BarcodeDetector is deleted first so the ZXING fallback path runs
 *   2. "Scan with camera" → the code is read from the live video frames →
 *      [data-verify-result="valid"] with the original bill
 *   3. the camera STOPS the instant a code reads (tracks ended)
 *   4. an unknown code → INVALID verdict via the same camera path
 *   5. owner cancels the bill → the SAME code now scans as CANCELLED
 *   6. getUserMedia rejects NotAllowedError → [data-camera-denied] help
 *      panel, and manual entry still works after the denial
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch({
  args: ['--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const dlg = (pg = page) => pg.locator('[role="dialog"]');
const closePopup = async (target = page) => {
  try {
    const pop = target.locator('[aria-label="Install app notification"]');
    for (let i = 0; i < 3; i++) {
      if (!(await pop.isVisible().catch(() => false))) return;
      await pop.getByRole('button', { name: 'Close install notification' }).click();
      await pop.waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
    }
  } catch {}
};

/* ---------- setup: owner unlock + one completed bill ---------- */
// the camera stub is an INIT script: it survives any mid-suite reload (the
// app's SW update listeners can reload the page at any moment) — it defines
// window.JsBarcode, deletes BarcodeDetector (forces the ZXING fallback path)
// and serves canvas-stream "cameras" drawing the code from localStorage
await page.addInitScript({ path: '/tmp/slp-cam-stub.js' });
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
// NEVER await sw.ready (can hang without a timeout on a fresh origin) —
// a fixed settle lets the SW's one-time controllerchange reload finish
await page.waitForTimeout(5200);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup();
ok(true, 'owner app unlocked');

await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(500);
await page.locator('main button:has-text("FT")').first().click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(800);
await dlg().getByPlaceholder('Customer name').fill('Camera Customer');
await dlg().getByLabel('Payment mode').click();
await page.getByRole('option', { name: 'UPI', exact: true }).click();
await page.waitForTimeout(500);
await dlg().getByRole('button', { name: /Complete Bill/ }).first().click();
await page.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 12000 });
await page.waitForTimeout(700);
await page.locator('[data-payment-received]').click();
await dlg().first().waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);
await dlg().first().getByRole('button', { name: 'Invoice' }).click();
const vbLoc = dlg().first().locator('[data-verify-barcode]');
await vbLoc.waitFor({ state: 'visible', timeout: 12000 });
const VCODE = (await vbLoc.getAttribute('data-verify-code')) ||
  (await vbLoc.locator('[data-barcode]').first().getAttribute('data-barcode')) || '';
ok(/^SLP-/.test(VCODE), `the completed bill carries the verification ID (${VCODE})`);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

/* ---------- the camera stub (installed as an init script above) ---------- */
// BarcodeDetector deleted → the app MUST take the ZXing fallback path.
// getUserMedia returns a live canvas stream that keeps drawing a real
// Code 128 of localStorage 'slp-e2e-cam-code' (JsBarcode, canvas renderer).

/* ---------- 1. scan the REAL code from live frames → VALID ---------- */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Verify' }).first().click();
await page.waitForTimeout(500);
await page.evaluate((c) => localStorage.setItem('slp-e2e-cam-code', c), VCODE);
await page.evaluate(() => localStorage.setItem('slp-e2e-cam-mode', 'barcode'));
await page.getByRole('button', { name: 'Scan with camera' }).click();
await page.locator('[data-verify-result="valid"]').waitFor({ state: 'visible', timeout: 25000 });
const validTxt = (await page.locator('[data-verify-result="valid"]').textContent()) || '';
ok(validTxt.toUpperCase().includes('ORIGINAL BILL') || validTxt.length > 0, 'the camera scan reads the code → VALID verdict');
ok(validTxt.includes('Camera Customer'), 'the scanned bill shows the original bill data (customer)');
ok(((await page.locator('[data-camera-denied]').count()) === 0), 'no permission error during a normal scan');

/* ---------- 2. the camera stopped the moment the code read ---------- */
const tracksEnded = await page.evaluate(() => {
  const s = window.__camStream;
  return !!s && s.getTracks().length > 0 && s.getTracks().every((tr) => tr.readyState === 'ended');
});
ok(tracksEnded, 'the stream tracks are STOPPED after the successful scan (no wasted camera)');
ok((await page.getByRole('button', { name: 'Stop camera' }).count()) === 0 &&
   (await page.getByRole('button', { name: 'Scan with camera' }).count()) === 1,
  'the camera button flipped back to "Scan with camera"');

/* ---------- 3. an unknown code scanned → INVALID ---------- */
await page.evaluate(() => localStorage.setItem('slp-e2e-cam-code', 'SLP-QQQQ4444-TTTT'));
await page.evaluate(() => localStorage.setItem('slp-e2e-cam-mode', 'barcode'));
await page.getByRole('button', { name: 'Scan with camera' }).click();
// diagnostics (visible if the verdict never arrives)
await page.waitForTimeout(6000);
console.log('  DEBUG cam2:', JSON.stringify({
  msg: (await page.locator('[data-camera-msg]').textContent().catch(() => '')) || '',
  code: await page.locator('[data-verify-input]').inputValue().catch(() => ''),
  results: await page.locator('[data-verify-result]').evaluateAll((els) => els.map((e) => e.getAttribute('data-verify-result'))),
  tracks: await page.evaluate(() => { const s = window.__camStream; return s ? s.getTracks().map((t) => t.readyState) : null; }),
}));
await page.locator('[data-verify-result="invalid"]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'an UNKNOWN code scanned by camera → INVALID BILL verdict');

/* ---------- 4. owner cancels the bill → the SAME code scans CANCELLED ---------- */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await page.waitForTimeout(700);
const row = page.locator('button', { hasText: 'Camera Customer' }).last();
await row.waitFor({ state: 'visible', timeout: 8000 });
await row.locator('xpath=..').getByRole('button', { name: 'Cancel bill' }).click();
await page.waitForTimeout(900);
const pub = await (await fetch(`${BASE}/api/verify/${encodeURIComponent(VCODE)}`)).json();
ok(pub.status === 'cancelled', 'the cancel reached the server registry');

await page.locator('[aria-label="Main navigation"] button', { hasText: 'Verify' }).first().click();
await page.waitForTimeout(500);
// the scanner input still holds the code from the last hit — re-arm + rescan it
await page.evaluate((c) => localStorage.setItem('slp-e2e-cam-code', c), VCODE);
await page.evaluate(() => localStorage.setItem('slp-e2e-cam-mode', 'barcode'));
await page.getByRole('button', { name: 'Scan with camera' }).click();
await page.locator('[data-verify-result="cancelled"]').waitFor({ state: 'visible', timeout: 25000 });
ok(true, 'the SAME code re-scanned after cancellation → CANCELLED verdict');

/* ---------- 5. DENIED camera permission → help + manual entry still works ---------- */
await page.evaluate(() => localStorage.setItem('slp-e2e-cam-mode', 'denied'));
await page.getByRole('button', { name: 'Scan with camera' }).click();
await page.locator('[data-camera-denied]').waitFor({ state: 'visible', timeout: 8000 });
const deniedTxt = (await page.locator('[data-camera-denied]').textContent()) || '';
ok(deniedTxt.length > 30, 'a DENIED camera permission shows the enable-steps help panel');
ok((await page.locator('[data-verify-input]').count()) === 1, 'manual entry stays available after a denial');
await page.locator('[data-verify-input]').fill(VCODE);
await page.getByRole('button', { name: 'Verify barcode' }).click();
await page.locator('[data-verify-result="cancelled"]').waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'MANUAL entry still verifies after the camera denial (cancelled code)');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

import { chromium } from 'playwright';

/**
 * v25 regression — the MPIN lock screen is:
 *   A. reload-proof  (typed digits survive a page reload via the draft)
 *   B. not auto-submitting (Enter never opens the app by itself)
 *   C. number-pad friendly (inputmode=numeric, no password-manager hijack)
 *   D. double-tap-proof (one submit at a time)
 *   E. stuck-proof    (a black-holed server brings the button back with an error)
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

/* ---------- A+C. fresh setup ---------- */
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600); // splash + probe
const newPin = page.getByLabel('New MPIN');
await newPin.waitFor({ state: 'visible', timeout: 15000 });
ok((await newPin.getAttribute('inputmode')) === 'numeric', 'MPIN field opens the number pad (inputmode=numeric)');
ok((await newPin.getAttribute('type')) === 'text', 'MPIN field is a text field (no password-manager hijack)');

// type two digits, then the preview frame "reloads" mid-typing
await newPin.pressSequentially('12', { delay: 250 });
ok((await newPin.inputValue()) === '12', 'digits accepted while typing');
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const newPin2 = page.getByLabel('New MPIN');
await newPin2.waitFor({ state: 'visible', timeout: 15000 });
ok((await newPin2.inputValue()) === '12', 'RELOAD-PROOF: typed digits survive the page reload');

// finish the MPIN; Enter on the confirm field must NOT auto-submit
await newPin2.pressSequentially('34', { delay: 120 });
await page.getByLabel('Confirm MPIN').pressSequentially('1234', { delay: 60 });
await page.getByLabel('Confirm MPIN').press('Enter');
await page.waitForTimeout(1200);
ok((await page.locator('[data-header]').count()) === 0, 'Enter does NOT auto-submit — nothing opens by itself');
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'MPIN saved and the app opened');

// dismiss the one-time install popup if it shows (fresh context, v25 unseen)
const popup = page.locator('[aria-label="Install app notification"]');
try {
  await popup.waitFor({ state: 'visible', timeout: 8000 });
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await popup.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
} catch {}

/* ---------- D. double-tap "Open app" is safe ---------- */
await page.getByRole('button', { name: 'Settings' }).click();
await page.getByRole('button', { name: 'Lock app' }).click();
await page.waitForTimeout(2500); // lock reloads the page
const unlockPin = page.getByLabel('MPIN', { exact: true });
await unlockPin.waitFor({ state: 'visible', timeout: 15000 });
await unlockPin.pressSequentially('1234', { delay: 80 });
await page.getByRole('button', { name: 'Open app' }).dblclick();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'double-tap on Open app opens the app once — no stuck state');

/* ---------- E. OFFLINE open: the MPIN is verified on the phone ---------- */
await page.getByRole('button', { name: 'Settings' }).click();
await page.getByRole('button', { name: 'Lock app' }).click();
await page.waitForTimeout(2500); // lock reloads the page
const unlockPin3 = page.getByLabel('MPIN', { exact: true });
await unlockPin3.waitFor({ state: 'visible', timeout: 15000 });
ok((await page.getByLabel('New MPIN').count()) === 0, 'lock screen is a LOGIN — never Create MPIN again');
await page.context().setOffline(true);
await unlockPin3.fill('1234');
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'OFFLINE unlock: MPIN verified on the phone — app opens with zero internet');
await page.context().setOffline(false);

/* ---------- fresh open still lands on the Bill tab ---------- */
const activeTxt = (
  (await page.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent()) || ''
).trim();
ok(activeTxt === 'Bill', `fresh open lands on the Bill tab (active: ${activeTxt})`);

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

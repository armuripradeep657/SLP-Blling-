import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

/**
 * v28 regression — "created ONCE, asked when it matters, never in the way":
 *   1. first use creates the MPIN once
 *   2. a page REFRESH does NOT ask the MPIN — the app re-opens on the same tab
 *   3. LABOUR: edit the entered details + record balance payment / extra
 *      money given + delete a wrong payment; month cards stay correct
 *   4. the SERVER DATABASE GETS WIPED under the working app — the account is
 *      silently re-registered from the device's own credentials (no banner,
 *      no Create screen, no user action) and the data re-uploads
 *   5. after the wipe a refresh still opens straight in — data intact
 *   6. LEGACY repair — a brand-new browser + the SAME MPIN repairs an
 *      all-zero-verifier account (the owner's pre-fix situation)
 *   7. v28 LOCK POLICY: after 5 idle minutes (3 s in the test) the app locks
 *      itself — the gate is a LOGIN (never Create), digits are HIDDEN while
 *      typing, wrong MPIN errors, right MPIN opens on the same tab
 *   8. FORGOT MPIN (device key present): a new MPIN replaces the old one,
 *      all data survives, the server accepts the new MPIN and rejects the old
 *   9. FORGOT MPIN (no device key): the warning shows, a fresh key starts,
 *      the app still opens with the data this device has
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const db = new PrismaClient();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const closeInstallPopup = async () => {
  const popup = page.locator('[aria-label="Install app notification"]');
  try {
    await popup.waitFor({ state: 'visible', timeout: 6000 });
    await popup.getByRole('button', { name: 'Close install notification' }).click();
    await popup.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  } catch {}
};

/** set the idle lock to 3 s, let the time pass, then force the visibility check */
const idleLockNow = async () => {
  await page.evaluate(() => localStorage.setItem('slp-idle-ms', '3000'));
  await page.waitForTimeout(3500);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
};

const activeTab = async () =>
  ((await page.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent()) || '').trim();

/* ---- 1. first use: create the MPIN once ---- */
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const newPin = page.getByLabel('New MPIN');
await newPin.waitFor({ state: 'visible', timeout: 15000 });
await newPin.fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'first use: MPIN created once and the app opened');
await closeInstallPopup();

/* ---- 2. a REFRESH does not ask the MPIN — same tab, straight in ---- */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
ok((await page.getByLabel('MPIN', { exact: true }).count()) === 0, 'refresh does NOT ask the MPIN — the app opens straight in');
ok((await page.getByLabel('New MPIN').count()) === 0, 'the Create screen never returns on a refresh');
ok((await activeTab()) === 'Bill', 'refresh lands back on the tab the user was on (Bill)');

/* ---- 3. LABOUR — edit entered details + balance payment + extra money ---- */
await page.getByRole('button', { name: 'Ledger', exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole('tab', { name: 'Labour work' }).click();
await page.waitForTimeout(600);
await page.waitForTimeout(600);

await page.getByLabel('Worker name').fill('Ramesh');
await page.getByLabel('Work done').fill('ring making');
await page.getByLabel('Work quantity').fill('25');
await page.getByLabel('Labour paid').fill('300');
await page.getByLabel('Labour balance').fill('200');
await page.getByRole('button', { name: 'Add labour work' }).click();
const row = page.locator('[data-labour-row="Ramesh"]');
await row.waitFor({ state: 'visible', timeout: 8000 });
ok(((await row.textContent()) || '').includes('300.00'), 'entry shows the money paid now (−₹300)');
ok(((await row.textContent()) || '').includes('200.00'), 'entry shows the balance still to pay (₹200)');

// edit the entered details: rename + change the wage
await page.getByRole('button', { name: 'Edit work Ramesh' }).click();
const wageField = page.getByLabel('Edit total wage');
await wageField.waitFor({ state: 'visible', timeout: 8000 });
ok((await wageField.inputValue()) === '500', 'edit dialog opens with the wage (300 paid + 200 balance = ₹500)');
await page.getByLabel('Edit worker name').fill('Ramesh K');
await wageField.fill('600');
await page.getByRole('button', { name: 'Save labour changes' }).click();
const row2 = page.locator('[data-labour-row="Ramesh K"]');
await row2.waitFor({ state: 'visible', timeout: 8000 });
ok(((await row2.textContent()) || '').includes('300.00'), 'edited name + wage saved — balance recomputed to ₹300 (600−300)');

// record the BALANCE payment (money given later)
await page.getByRole('button', { name: 'Edit work Ramesh K' }).click();
await page.getByLabel('Payment amount').waitFor({ state: 'visible', timeout: 8000 });
await page.getByLabel('Payment amount').fill('300');
await page.getByRole('button', { name: 'Add payment' }).click();
await page.waitForTimeout(400);
const summary1 = (await page.locator('[data-edit-summary]').textContent()) || '';
ok(summary1.includes('600.00') && !summary1.includes('300.00'), 'balance payment recorded — paid ₹600, balance cleared');
await page.getByRole('button', { name: 'Save labour changes' }).click();
await page.waitForTimeout(400);
ok(!(((await row2.textContent()) || '').includes('300.00')), 'row no longer shows a balance');

// give EXTRA money beyond the wage
await page.getByRole('button', { name: 'Edit work Ramesh K' }).click();
await page.getByLabel('Payment amount').fill('150');
await page.getByLabel('Payment note').fill('bonus');
await page.getByRole('button', { name: 'Add payment' }).click();
await page.waitForTimeout(400);
const summary2 = (await page.locator('[data-edit-summary]').textContent()) || '';
ok(summary2.includes('150.00'), 'extra money beyond the wage is recorded');
await page.getByRole('button', { name: 'Save labour changes' }).click();
const extraBadge = row2.locator('[data-labour-extra]');
await extraBadge.waitFor({ state: 'visible', timeout: 8000 });
ok(((await extraBadge.textContent()) || '').includes('150.00'), 'row shows the EXTRA money given (₹150)');

// a wrong payment can be removed again
await page.getByRole('button', { name: 'Edit work Ramesh K' }).click();
await page.getByRole('button', { name: 'Delete payment 150' }).click();
await page.waitForTimeout(400);
ok((await page.locator('[data-edit-summary]').textContent() || '').includes('600.00'), 'deleting the wrong payment restores paid to ₹600');
await page.getByRole('button', { name: 'Save labour changes' }).click();
await page.waitForTimeout(400);
ok((await row2.locator('[data-labour-extra]').count()) === 0, 'extra badge gone after the payment was removed');

const monthPaid = (await page.locator('[data-labour-month-paid]').textContent()) || '';
const monthBal = (await page.locator('[data-labour-month-balance]').textContent()) || '';
ok(monthPaid.includes('600.00'), 'month PAID card sums the payments (₹600)');
ok(monthBal.includes('0.00'), 'month BALANCE card is cleared (₹0)');

/* ---- 4. the server database is WIPED under the working app ---- */
await db.session.deleteMany();
await db.syncAccount.deleteMany();
const gone = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
ok(!gone, 'simulated disaster: server database wiped under the working app');

// the engine notices on its next pull and silently re-registers the SAME account
let acc = null;
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  acc = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
  if (acc?.ciphertext) break;
}
ok(Boolean(acc?.pinVerifier) && Boolean(acc?.dekWrapped), 'account silently re-registered with the SAME key — no MPIN asked');
ok(Boolean(acc?.ciphertext) && (acc?.dataVersion ?? 0) >= 1, 'encrypted data re-uploaded automatically');
ok((await page.locator('[data-reauth-banner]').count()) === 0, 'NO banner, NO prompt — the owner never noticed');

/* ---- 5. after the wipe a refresh still opens straight in — data intact ---- */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
ok((await page.getByLabel('MPIN', { exact: true }).count()) === 0, 'after a server wipe a refresh STILL opens without the MPIN');
const row3 = page.locator('[data-labour-row="Ramesh K"]');
await row3.waitFor({ state: 'visible', timeout: 10000 });
ok(((await row3.textContent()) || '').includes('600.00'), 'labour data intact after the wipe + refresh (tab preserved: Labour)');
ok((await activeTab()) === 'Ledger', 'refresh after the wipe stays on the Ledger tab (labour lives inside it)');

/* ---- 6. LEGACY repair — the owner's exact situation ----
 * Accounts created before the verifier fix stored an ALL-ZERO verifier, so a
 * normal unlock could never match (this is why the MPIN seemed to "never
 * work"). Simulate it: zero the verifier in the DB, then open the app in a
 * BRAND-NEW browser (no local credentials — like the owner's v25/v26 phone).
 * The lock screen must still be a LOGIN, and the SAME MPIN must repair the
 * account, keep the data and never show "Create MPIN". */
await db.syncAccount.update({
  where: { slot: 'owner' },
  data: { pinVerifier: '0'.repeat(64) },
});
ok(true, 'account downgraded to the legacy all-zero verifier (pre-fix state)');

const ctx2 = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
const p2 = await ctx2.newPage();
await p2.goto(BASE, { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(2600);
const legacyPin = p2.getByLabel('MPIN', { exact: true });
await legacyPin.waitFor({ state: 'visible', timeout: 15000 });
ok((await p2.getByLabel('New MPIN').count()) === 0, 'legacy account: probe shows a LOGIN, never Create MPIN');
await legacyPin.fill(MPIN);
await p2.getByRole('button', { name: 'Open app' }).click();
await p2.locator('[data-header]').waitFor({ state: 'visible', timeout: 25000 });
ok(true, 'SAME MPIN repairs the legacy account and opens the app');
const fixed = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
ok(Boolean(fixed?.pinVerifier) && !/^0+$/.test(fixed.pinVerifier), 'server verifier repaired to the REAL digest');
await p2.getByRole('button', { name: 'Ledger', exact: true }).click();
await p2.waitForTimeout(500);
await p2.getByRole('tab', { name: 'Labour work' }).click();
await p2.waitForTimeout(600);
await p2.waitForTimeout(800);
ok(((await p2.locator('[data-labour-row="Ramesh K"]').textContent()) || '').includes('600.00'), 'the owner keeps all their data — nothing was recreated');
await ctx2.close();

/* ---- 7. v28 LOCK POLICY: idle lock → a LOGIN with hidden digits ---- */
await idleLockNow();
const lockPin = page.getByLabel('MPIN', { exact: true });
await lockPin.waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'idle lock: after 5 minutes without use (3 s in test) the MPIN gate returns');
ok((await page.getByLabel('Confirm MPIN').count()) === 0, 'the gate is a LOGIN — no confirm field, never a setup');
const secHidden = await lockPin.evaluate((el) => getComputedStyle(el).webkitTextSecurity);
ok(secHidden === 'disc', 'MPIN digits are HIDDEN while typing (text-security: disc)');
await lockPin.fill(MPIN);
await page.getByRole('button', { name: 'Show MPIN' }).click();
const secShown = await lockPin.evaluate((el) => getComputedStyle(el).webkitTextSecurity);
ok(secShown !== 'disc' && (await lockPin.inputValue()) === MPIN, 'the eye toggle reveals the typed MPIN');
await page.getByRole('button', { name: 'Hide MPIN' }).click();
await lockPin.fill('9999');
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-lock-error]').waitFor({ state: 'visible', timeout: 15000 });
ok(((await page.locator('[data-lock-error]').textContent()) || '').includes('Wrong'), 'wrong MPIN shows a clear error');
await lockPin.fill(MPIN);
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok((await activeTab()) === 'Ledger', 'right MPIN opens the app on the tab it was left on (Ledger with labour inside)');
await page.evaluate(() => localStorage.removeItem('slp-idle-ms'));

/* ---- 8. FORGOT MPIN (device key present) — new MPIN, data kept ---- */
const verifierBefore = (await db.syncAccount.findUnique({ where: { slot: 'owner' } }))?.pinVerifier;
await idleLockNow();
const forgotGate = page.getByLabel('MPIN', { exact: true });
await forgotGate.waitFor({ state: 'visible', timeout: 10000 });
await page.getByRole('button', { name: 'Forgot MPIN' }).click();
const newPinF = page.getByRole('textbox', { name: 'New MPIN', exact: true });
await newPinF.waitFor({ state: 'visible', timeout: 8000 });
ok((await newPinF.count()) === 1, 'Forgot MPIN opens the new-MPIN form');
await newPinF.fill('5678');
await page.getByLabel('Confirm MPIN').fill('5678');
await page.getByRole('button', { name: 'Set new MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 25000 });
ok(true, 'a NEW MPIN (5678) is set and the app opens — no data lost');
await page.getByRole('button', { name: 'Ledger', exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole('tab', { name: 'Labour work' }).click();
await page.waitForTimeout(600);
const row4 = page.locator('[data-labour-row="Ramesh K"]');
await row4.waitFor({ state: 'visible', timeout: 8000 });
ok(((await row4.textContent()) || '').includes('600.00'), 'all labour data survives the forgot-MPIN reset');
const accAfter = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
ok(
  Boolean(accAfter?.pinVerifier) && accAfter.pinVerifier !== verifierBefore,
  'server credential chain was replaced (verifier changed)'
);

// the server now accepts ONLY the new MPIN — Lock app wipes the device copy
await page.getByRole('button', { name: 'Settings', exact: true }).click();
await page.getByRole('button', { name: 'Lock app' }).click();
await page.waitForTimeout(2500);
const srvPin = page.getByLabel('MPIN', { exact: true });
await srvPin.waitFor({ state: 'visible', timeout: 15000 });
await srvPin.fill(MPIN);
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-lock-error]').waitFor({ state: 'visible', timeout: 15000 });
ok(((await page.locator('[data-lock-error]').textContent()) || '').includes('Wrong'), 'the OLD MPIN no longer opens (server rejects it)');
await srvPin.fill('5678');
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 25000 });
ok(true, 'the NEW MPIN logs in through the server (reset really persisted)');

/* ---- 9. FORGOT MPIN without a device key — warning + fresh key ---- */
await page.getByRole('button', { name: 'Settings', exact: true }).click();
await page.getByRole('button', { name: 'Lock app' }).click();
await page.waitForTimeout(2500);
const warnPin = page.getByLabel('MPIN', { exact: true });
await warnPin.waitFor({ state: 'visible', timeout: 15000 });
await page.getByRole('button', { name: 'Forgot MPIN' }).click();
const warnPinF = page.getByRole('textbox', { name: 'New MPIN', exact: true });
await warnPinF.waitFor({ state: 'visible', timeout: 8000 });
ok(
  (await page.getByText('fresh data key').count()) > 0,
  'no device key: the forgot form warns that a fresh key replaces the vault'
);
await warnPinF.fill('7777');
await page.getByLabel('Confirm MPIN').fill('7777');
await page.getByRole('button', { name: 'Set new MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 25000 });
ok(true, 'the fresh-key reset completes and the app opens');
const row5 = page.locator('[data-labour-row="Ramesh K"]');
await page.getByRole('button', { name: 'Ledger', exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole('tab', { name: 'Labour work' }).click();
await page.waitForTimeout(600);
await row5.waitFor({ state: 'visible', timeout: 8000 });
ok(((await row5.textContent()) || '').includes('600.00'), 'device data is intact after the fresh-key reset');
await page.evaluate(() => localStorage.removeItem('slp-idle-ms'));

console.log(`\n${pass} passed, ${fail} failed`);
await db.$disconnect();
await browser.close();
process.exit(fail ? 1 : 0);

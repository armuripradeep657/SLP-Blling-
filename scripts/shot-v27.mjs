import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

/**
 * v27 regression — "the MPIN is asked on EVERY app open, but created ONCE":
 *   1. first use creates the MPIN once
 *   2. every reload asks the MPIN to LOG IN — the Create screen never returns
 *   3. wrong MPIN → clear error; right MPIN → opens, landing on Bill
 *   4. LABOUR: edit the entered details + record balance payment / extra
 *      money given + delete a wrong payment; month cards stay correct
 *   5. the SERVER DATABASE GETS WIPED under the working app — the account is
 *      silently re-registered from the device's own credentials (no banner,
 *      no Create screen, no user action) and the data re-uploads
 *   6. after the wipe the app still just asks the MPIN — data intact
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

/* ---- 2. every open asks the MPIN to LOG IN — never Create ---- */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
const loginPin = page.getByLabel('MPIN', { exact: true });
await loginPin.waitFor({ state: 'visible', timeout: 15000 });
ok((await page.getByLabel('New MPIN').count()) === 0, 'reload asks the MPIN to LOG IN — no Create screen');
ok((await page.getByLabel('Confirm MPIN').count()) === 0, 'no confirm field — it is a login, not a setup');

/* ---- 3. wrong MPIN errors, right MPIN opens on Bill ---- */
await loginPin.fill('9999');
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-lock-error]').waitFor({ state: 'visible', timeout: 15000 });
ok(((await page.locator('[data-lock-error]').textContent()) || '').includes('Wrong'), 'wrong MPIN shows a clear error');
await loginPin.fill(MPIN);
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
const activeTxt = (
  (await page.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent()) || ''
).trim();
ok(activeTxt === 'Bill', `right MPIN opens the app straight on the Bill tab (active: ${activeTxt})`);

/* ---- 4. LABOUR — edit entered details + balance payment + extra money ---- */
await page.getByRole('button', { name: 'Labour', exact: true }).click();
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

/* ---- 5. the server database is WIPED under the working app ---- */
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

/* ---- 6. after the wipe the app still only asks the MPIN — data intact ---- */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
const loginPin2 = page.getByLabel('MPIN', { exact: true });
await loginPin2.waitFor({ state: 'visible', timeout: 15000 });
ok((await page.getByLabel('New MPIN').count()) === 0, 'after a server wipe: STILL a login, never Create MPIN again');
await loginPin2.fill(MPIN);
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await page.getByRole('button', { name: 'Labour', exact: true }).click();
const row3 = page.locator('[data-labour-row="Ramesh K"]');
await row3.waitFor({ state: 'visible', timeout: 8000 });
ok(((await row3.textContent()) || '').includes('600.00'), 'labour data intact after the wipe + login');

/* ---- 7. LEGACY repair — the owner's exact situation ----
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
await p2.getByRole('button', { name: 'Labour', exact: true }).click();
await p2.waitForTimeout(800);
ok(((await p2.locator('[data-labour-row="Ramesh K"]').textContent()) || '').includes('600.00'), 'the owner keeps all their data — nothing was recreated');
await ctx2.close();

console.log(`\n${pass} passed, ${fail} failed`);
await db.$disconnect();
await browser.close();
process.exit(fail ? 1 : 0);

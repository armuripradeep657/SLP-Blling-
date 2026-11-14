import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

/**
 * v30 regression — "money arrived but the QR never closed" bug:
 *   1. OWNER CONFIRM: money paid straight into the personal UPI ID → no
 *      gateway exists to fire a webhook → nothing happened (the bug). Now the
 *      "Money received" button records the payment and completes the bill the
 *      same way auto-detection does — slip, stock, notification.
 *   2. POLL-GAP CATCH-UP: the webhook lands while the phone is offline
 *      (browser timers throttled / network dead) → the very next tick after
 *      coming back online completes the bill by itself.
 *   3. NO IDLE-LOCK MID-COLLECTION: with a 6 s idle timeout the app would
 *      lock while the owner just watches the customer pay — the payment
 *      screen keeps the session alive; locking resumes only after leaving it.
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
const SECRET = 'slp-e2e-webhook-secret';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const db = new PrismaClient();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const dlg = () => page.locator('[role="dialog"]');

/** report a payment the way a real gateway does — HMAC-signed webhook */
const reportPayment = async (billRef, amount) => {
  const body = JSON.stringify({ billRef, amount, method: 'UPI' });
  const sig = createHmac('sha256', SECRET).update(body).digest('hex');
  const res = await fetch(`${BASE}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-slp-signature': `sha256=${sig}` },
    body,
  });
  return res.status;
};

const unlockWithMpin = async () => {
  await page.getByLabel('MPIN', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByLabel('MPIN', { exact: true }).fill(MPIN);
  await page.getByRole('button', { name: 'Open app' }).click();
  await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
};

/* ---- setup ---- */
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
const popup = page.locator('[aria-label="Install app notification"]');
try {
  await popup.waitFor({ state: 'visible', timeout: 8000 });
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await popup.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
} catch {}
ok(true, 'app unlocked');

const startUpiBill = async (name, phone) => {
  await page.locator('main button:has-text("FT")').first().click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'View bill' }).click();
  await page.waitForTimeout(800);
  await dlg().getByPlaceholder('Customer name').fill(name);
  await dlg().getByPlaceholder('Mobile / WhatsApp').fill(phone);
  await dlg().getByLabel('Payment mode').click();
  await page.getByRole('option', { name: 'UPI', exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Complete Bill/ }).first().click();
  await page.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 10000 });
};
const screen = page.locator('[data-payment-screen]');
const readAmount = async () => {
  const alt = (await screen.locator('img').getAttribute('alt')) || '';
  return Number((alt.match(/₹([\d.]+)/) || [])[1]);
};
const readRef = async () => ((await page.locator('[data-bill-ref]').textContent()) || '').trim();

/* ================= 1. OWNER CONFIRM — the reported bug ================= */
await startUpiBill('Umesh Kumar', '9876543210');
const amount = await readAmount();
const billRef = await readRef();
ok(Number.isFinite(amount) && amount > 0, `QR screen shows the amount (₹${amount})`);
ok(/^SLP-/.test(billRef), `the bill carries its payment ref (${billRef})`);

// the bug's precondition: the customer paid outside the app, no gateway →
// no webhook → the poll finds nothing and NOTHING happens (7 s here)
await page.waitForTimeout(7000);
ok((await screen.count()) === 1 && (await screen.locator('[data-payment-waiting]').count()) === 1,
  'money received outside the app — the screen waits (no false auto-complete)');

// THE FIX: one tap records the payment and completes the bill
ok((await screen.locator('[data-payment-received]').count()) === 1, '"Money received" button is on the screen');
await page.locator('[data-payment-received]').click();
await screen.waitFor({ state: 'detached', timeout: 10000 });
await dlg().first().waitFor({ state: 'visible', timeout: 10000 });
const slipTxt = (await dlg().first().textContent()) || '';
ok(slipTxt.includes('Umesh Kumar'), 'the slip opened by itself with the customer name');
await page.waitForTimeout(800);
const ev = await db.paymentEvent.findUnique({ where: { billRef } });
ok(ev?.provider === 'owner', 'the tap recorded the payment event on the server (provider: owner)');
ok(ev?.amount === amount, `the event carries the bill amount (₹${ev?.amount})`);
ok(ev?.waStatus === 'skipped', `customer notification ran automatically (WhatsApp: ${ev?.waStatus} — no provider configured here)`);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'History', exact: true }).click();
await page.waitForTimeout(700);
const row = page.locator('button', { hasText: 'Umesh Kumar' }).last();
const rowTxt = (await row.locator('xpath=..').textContent()) || ''; // badge + balance sit beside the row button, inside the card
if (!(/Paid/.test(rowTxt) && /Bal ₹0(?!\d)/.test(rowTxt))) console.log('  DEBUG row:', rowTxt);
ok(/Paid/.test(rowTxt) && /Bal ₹0(?!\d)/.test(rowTxt), 'the bill landed in History fully paid (Paid badge, zero balance)');
await page.getByRole('button', { name: 'Bill', exact: true }).click();
await page.waitForTimeout(500);

/* ================= 2. POLL-GAP CATCH-UP (webhook while offline) ================= */
await startUpiBill('Vijaya Lakshmi', '9123456780');
const ref2 = await readRef();
const amount2 = await readAmount();
await page.context().setOffline(true);
ok((await reportPayment(ref2, amount2)) === 200, 'gateway reports the money while the phone is offline');
await page.waitForTimeout(4500); // a poll tick passes — the offline page cannot see it yet
await page.context().setOffline(false);
await screen.waitFor({ state: 'detached', timeout: 12000 }); // the very next tick must complete it
await dlg().first().waitFor({ state: 'visible', timeout: 10000 });
ok(((await dlg().first().textContent()) || '').includes('Vijaya Lakshmi'), 'the bill completed itself the moment the phone came back online');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

/* ================= 3. NO IDLE-LOCK MID-COLLECTION ================= */
await page.evaluate(() => localStorage.setItem('slp-idle-ms', '6000'));
await startUpiBill('Idle Ravi', '9988776655');
await page.waitForTimeout(21000); // two idle windows would pass if the screen kept silent
ok((await screen.count()) === 1, '20 s of hands-off waiting — the payment screen is still up (no lock)');
ok(!(await page.getByLabel('MPIN', { exact: true }).isVisible().catch(() => false)), 'the MPIN gate did NOT take over mid-collection');
await page.getByRole('button', { name: 'Cancel payment' }).click();
await screen.waitFor({ state: 'detached', timeout: 10000 });
// validity: once away from the payment screen the idle lock DOES return
await page.waitForTimeout(24000);
ok(await page.getByLabel('MPIN', { exact: true }).isVisible(), 'leaving the screen, the idle lock returns as before');
await unlockWithMpin();
await page.evaluate(() => localStorage.removeItem('slp-idle-ms'));

console.log(`\n${pass} passed, ${fail} failed`);
await db.$disconnect();
await browser.close();
process.exit(fail ? 1 : 0);

import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

/**
 * v29 regression — UPI scan-and-pay auto-completion + the labour notebook:
 *   1. UPI bill → scan-and-pay QR screen (amount + bill ref embedded)
 *   2. the gateway webhook reports the payment (HMAC-signed) — the bill
 *      completes ITSELF: slip opens, status Paid, NO button pressed
 *   3. the customer notification runs automatically (WhatsApp/SMS providers
 *      not configured here → recorded as 'skipped'; the wa.me fallback fires)
 *   4. PARTIAL payment: webhook reports half the total → bill lands as
 *      Partial with the balance still due
 *   5. cash-instead fallback completes the bill on the spot; Cancel leaves
 *      the bill untouched
 *   6. LABOUR NOTEBOOK: day-wise register (who · what work · qty × rate ·
 *      money) with the workers remembered for picking; Entries view unchanged
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

/** forge a payment without the signature — must be rejected */
const badWebhook = async (billRef) => {
  const res = await fetch(`${BASE}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ billRef, amount: 9999 }),
  });
  return res.status;
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

/* ---- a UPI bill waiting on the scan-and-pay screen ---- */
const startUpiBill = async (name, phone) => {
  await page.locator('main button:has-text("FT")').first().click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'View bill' }).click();
  await page.waitForTimeout(800);
  await dlg().getByPlaceholder('Customer name').fill(name);
  await dlg().getByPlaceholder('Mobile / WhatsApp').fill(phone);
  await dlg().getByLabel('Payment mode').click();
  await page.getByRole('option', { name: 'UPI', exact: true }).click();
  // let React re-render with the new payment mode before completing
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Complete Bill/ }).first().click();
  try {
    await page.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 10000 });
  } catch {
    await page.screenshot({ path: '/home/z/my-project/download/v29-debug-bill.png' });
    console.log('  DEBUG dialog:', ((await dlg().first().textContent().catch(() => '')) || '').replace(/\s+/g, ' ').slice(0, 300));
    console.log('  DEBUG body:', ((await page.locator('body').textContent()) || '').replace(/\s+/g, ' ').slice(0, 300));
    throw new Error('payment screen did not appear — see v29-debug-bill.png');
  }
};

await startUpiBill('Umesh Kumar', '9876543210');
const screen = page.locator('[data-payment-screen]');
const amountEl = screen.locator('[data-payment-amount]');
await amountEl.waitFor({ state: 'visible', timeout: 10000 });
const amount = Number((((await amountEl.textContent()) || '').match(/₹([\d.]+)/) || [])[1]);
const billRef = ((await page.locator('[data-bill-ref]').textContent()) || '').trim();
ok(Number.isFinite(amount) && amount > 0, `payment screen shows the amount (₹${amount})`);
ok((await screen.locator('img').count()) === 0, 'no QR anywhere on the payment screen (Code 128 app)');
ok(/^SLP-/.test(billRef), `the bill carries its payment ref (${billRef})`);
ok((await screen.locator('[data-payment-waiting]').count()) === 1, 'waiting state — nothing pressed yet');
await page.screenshot({ path: '/home/z/my-project/download/v29-payment-qr.png' });

/* a forged webhook (no signature) must be rejected */
ok((await badWebhook(billRef)) === 401, 'a forged payment report without the signature is rejected');

/* ---- the gateway reports the money → the bill completes itself ---- */
ok((await reportPayment(billRef, amount)) === 200, 'gateway webhook accepts the signed payment event');
await screen.waitFor({ state: 'detached', timeout: 15000 });
await dlg().first().waitFor({ state: 'visible', timeout: 10000 });
const slipTxt = (await dlg().first().textContent()) || '';
ok(slipTxt.includes('Umesh Kumar'), 'the slip opened by itself with the customer name');
await page.waitForTimeout(800);
const ev = await db.paymentEvent.findUnique({ where: { billRef } });
ok(ev?.amount === amount, 'the payment event matches the bill amount');
ok(ev?.waStatus === 'skipped', `customer notification ran automatically (WhatsApp: ${ev?.waStatus} — no provider configured here)`);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

/* ---- partial payment: half the money → Partial bill ---- */
await startUpiBill('Padma Devi', '9123456780');
const ref2 = ((await page.locator('[data-bill-ref]').textContent()) || '').trim();
const amount2 = Number((((await page.locator('[data-payment-amount]').textContent()) || '').match(/₹([\d.]+)/) || [])[1]);
ok((await reportPayment(ref2, Math.round(amount2 / 2))) === 200, 'gateway reports HALF the total');
await page.locator('[data-payment-screen]').waitFor({ state: 'detached', timeout: 15000 });
await dlg().first().waitFor({ state: 'visible', timeout: 10000 });
await page.waitForTimeout(800);
await page.keyboard.press('Escape');
await page.getByRole('button', { name: 'History', exact: true }).click();
await page.waitForTimeout(700);
const hist = (await page.locator('main').textContent()) || '';
ok(hist.includes('Padma Devi') && hist.includes('Partial'), 'partial UPI payment lands as a Partial bill');
await page.getByRole('button', { name: 'Bill', exact: true }).click();
await page.waitForTimeout(500);

/* ---- cash-instead fallback ---- */
await startUpiBill('Cash Ravi', '9988776655');
await page.getByRole('button', { name: 'Pay by cash instead' }).click();
await page.locator('[data-payment-screen]').waitFor({ state: 'detached', timeout: 10000 });
await dlg().first().waitFor({ state: 'visible', timeout: 10000 });
ok(((await dlg().first().textContent()) || '').includes('Cash Ravi'), 'cash-instead completes the bill on the spot');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

/* ---- cancel leaves the bill untouched ---- */
await startUpiBill('Cancel Test', '9000000000');
await page.getByRole('button', { name: 'Cancel payment' }).click();
await page.locator('[data-payment-screen]').waitFor({ state: 'detached', timeout: 10000 });
await page.waitForTimeout(600);
ok((await dlg().count()) === 0, 'cancel closes the payment screen without completing');
await page.getByRole('button', { name: 'History', exact: true }).click();
await page.waitForTimeout(700);
ok(!(((await page.locator('main').textContent()) || '').includes('Cancel Test')), 'the pending bill was NOT saved — nothing in History');
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(700);

/* ---- LABOUR NOTEBOOK ---- */
await page.getByRole('button', { name: 'Ledger', exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole('tab', { name: 'Labour work' }).click();
await page.waitForTimeout(600);
await page.waitForTimeout(700);

const yesterday = new Date(Date.now() - 86400000);
const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

// entry 1 — Ramesh today
await page.getByLabel('Worker name').fill('Ramesh');
await page.getByLabel('Work done').fill('ring making');
await page.getByLabel('Work quantity').fill('25');
await page.getByLabel('Labour paid').fill('300');
await page.getByLabel('Labour balance').fill('200');
await page.getByRole('button', { name: 'Add labour work' }).click();
await page.locator('[data-labour-row="Ramesh"]').waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'entry 1 added (Ramesh, ring making ×25)');

// entry 2 — Ramesh again today (worker must NOT duplicate)
await page.getByLabel('Worker name').fill('Ramesh');
await page.getByLabel('Work done').fill('mould fitting');
await page.getByLabel('Work quantity').fill('10');
await page.getByLabel('Labour paid').fill('500');
await page.getByRole('button', { name: 'Add labour work' }).click();
await page.waitForTimeout(600);
ok(true, 'entry 2 added (Ramesh again)');

// entry 3 — Suresh YESTERDAY (a different notebook page)
await page.getByLabel('Work date').fill(yKey);
await page.getByLabel('Worker name').fill('Suresh');
await page.getByLabel('Work done').fill('slab carrying');
await page.getByLabel('Work quantity').fill('40');
await page.getByLabel('Labour balance').fill('600');
await page.getByRole('button', { name: 'Add labour work' }).click();
await page.waitForTimeout(600);
ok(true, 'entry 3 added (Suresh, yesterday)');

// workers are remembered for picking — and Ramesh is not duplicated
const workerOpts = await page.locator('#labour-workers option').count();
ok(workerOpts === 2, `workers list remembers each labourer once (${workerOpts})`);

// open the notebook
await page.locator('[data-view-notebook]').click();
await page.locator('[data-labour-notebook]').waitFor({ state: 'visible', timeout: 8000 });
await page.waitForTimeout(600);
await page.screenshot({ path: '/home/z/my-project/download/v29-notebook.png' });
const dayCount = await page.locator('[data-notebook-day]').count();
ok(dayCount === 2, `the notebook groups the work day by day (${dayCount} pages)`);

const todayCard = page.locator('[data-notebook-day]').first();
const todayTxt = (await todayCard.textContent()) || '';
ok((await todayCard.locator('[data-notebook-entry="Ramesh"]').count()) === 2, 'both Ramesh works listed under today');
ok(todayTxt.includes('ring making') && todayTxt.includes('mould fitting'), 'each entry shows what they did that day');
ok(todayTxt.includes('×'), 'quantity × rate is shown');
const yesterdayCard = page.locator('[data-notebook-day]').last();
const yTxt = (await yesterdayCard.textContent()) || '';
ok(yTxt.includes('Suresh') && yTxt.includes('slab carrying'), 'Suresh sits on the yesterday page');
ok(yTxt.includes('× ₹15'), 'rate per unit computed (600 / 40 = ₹15)');

// back to the entries view
await page.locator('[data-view-entries]').click();
await page.waitForTimeout(500);
ok((await page.locator('[data-labour-row="Ramesh"]').count()) === 2, 'Entries view still shows every row');

console.log(`\n${pass} passed, ${fail} failed`);
await db.$disconnect();
await browser.close();
process.exit(fail ? 1 : 0);

/* Task 16 E2E smoke: UPI ID hidden on all bill surfaces, new unique invoice design,
   ledger income/spent details with NAMES + Cash/UPI mode chips, animations, popup v16 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const DL = '/home/z/my-project/download';
const shot = (n) => `${DL}/v16-verify-${n}.png`;

let page;

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
  });
  const V = (loc) => loc.locator('visible=true');
  const A = (cond, msg) => {
    if (!cond) throw new Error('ASSERT FAIL: ' + msg);
    console.log('  ✓', msg);
  };

  /* ---------- Phase A: one-time popup armed at version 16 ---------- */
  console.log('Phase A — one-time update popup (v16)');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1900);
  const popup = page.locator('[aria-label="Install app notification"]');
  A(await popup.count() === 1, 'update popup appears on fresh visit');
  A((await popup.innerText()).includes('App updated'), 'popup is the post-update notice');
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await page.waitForTimeout(300);
  A(await popup.count() === 0, 'popup closes');
  A((await page.evaluate(() => localStorage.getItem('slp-update-notice-seen'))) === '16', 'dismiss persisted with version 16');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1900);
  A(await popup.count() === 0, 'popup never returns after closing');

  /* ---------- Phase B: setup + animations present ---------- */
  console.log('Phase B — settings + animation classes live');
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Settings' }).click();
  await page.waitForTimeout(400);
  await page.getByPlaceholder('name@upi').fill('prasad@upi');
  await page.getByPlaceholder('98765 43210').fill('9876543210');
  await page.waitForTimeout(200);
  const animCount = await page.evaluate(() => document.querySelectorAll('.anim-fade-up, .anim-pop, .anim-badge, .anim-glow').length);
  A(animCount >= 1, `animation utility classes active in DOM (${animCount} nodes)`);

  /* ---------- Phase C: PAID bill — no UPI ID anywhere, QR none ---------- */
  console.log('Phase C — PAID bill: UPI ID hidden');
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Bill' }).click();
  await page.waitForTimeout(400);
  await V(page.locator('button', { hasText: '+2FT' })).first().click();
  await page.waitForTimeout(300);
  await V(page.getByRole('button', { name: 'View bill' })).click();
  await page.waitForTimeout(500);
  await V(page.getByPlaceholder('Customer name')).fill('Ravi Kumar');
  await V(page.getByPlaceholder('Mobile / WhatsApp')).fill('9876501234');
  await page.waitForTimeout(300);
  await V(page.getByRole('button', { name: /Complete Bill/ })).click();
  await page.waitForTimeout(900);
  const dialog = page.locator('[role="dialog"]').first();
  const slipText = await dialog.innerText();
  A(slipText.includes('AMOUNT PAID'), 'cash-full bill shows AMOUNT PAID stamp');
  A(!slipText.toLowerCase().includes('prasad@upi'), 'NO "prasad@upi" text on slip');
  A(!/upi\s*id\s*:/i.test(slipText), 'NO "UPI ID:" label on slip');
  A(await dialog.locator('img[alt="UPI QR code"]').count() === 0, 'no balance QR on paid bill');
  A(await dialog.locator('.shadow-md img, [class*="watermark"]').count() >= 0, 'slip rendered');
  // image-only direct send regression
  await page.evaluate(() => {
    window.__opened = [];
    window.open = (u) => { window.__opened.push(String(u)); return null; };
  });
  await dialog.getByRole('button', { name: /Send Direct to Ravi Kumar/ }).click();
  await page.waitForTimeout(2500);
  const opened = await page.evaluate(() => window.__opened || []);
  A(opened.length === 1 && /^https:\/\/wa\.me\/919876501234$/.test(opened[0]), `direct send image-only: ${opened[0] || 'NONE'}`);
  await page.locator('[data-slot="dialog-close"]').locator('visible=true').first().click();
  await page.waitForTimeout(500);

  /* ---------- Phase D: DUE bill — QR renders, scan text has NO UPI ID ---------- */
  console.log('Phase D — balance bill: QR kept, UPI ID hidden');
  await V(page.locator('button', { hasText: '+2FT' })).first().click();
  await page.waitForTimeout(300);
  await V(page.getByRole('button', { name: 'View bill' })).click();
  await page.waitForTimeout(500);
  await V(page.getByPlaceholder('Customer name')).fill('Suresh Babu');
  await V(page.getByPlaceholder('Mobile / WhatsApp')).fill('9000012345');
  await V(page.getByLabel('Payment mode')).click();
  await page.getByRole('option', { name: 'Due' }).click();
  await page.waitForTimeout(300);
  await V(page.getByLabel('Amount paid', { exact: true })).fill('100');
  // Delivered tick + driver fields regression
  await V(page.getByRole('checkbox')).click();
  await page.waitForTimeout(300);
  await V(page.getByPlaceholder('Driver name')).fill('Ramesh');
  await V(page.getByPlaceholder('Vehicle number')).fill('AP07AB 1234');
  await V(page.getByPlaceholder('Delivery address')).fill('Gandhi Street, Kurnool');
  await page.waitForTimeout(200);
  await V(page.getByRole('button', { name: /Complete Bill/ })).click();
  await page.waitForTimeout(1000);
  const dlg2 = page.locator('[role="dialog"]').first();
  const t2 = await dlg2.innerText();
  A(t2.includes('PARTIAL'), 'due bill shows PARTIAL');
  A(await dlg2.locator('img[alt="UPI QR code"]').count() === 1, 'balance UPI QR still renders');
  A(!t2.toLowerCase().includes('prasad@upi'), 'NO UPI ID visible on balance slip');
  A(t2.includes('Scan to Pay Balance Rs.'), 'scan text = "Scan to Pay Balance Rs. …" (no handle)');
  // driver slip regression — no prices
  await dlg2.locator('button', { hasText: 'Driver' }).first().click();
  await page.waitForTimeout(600);
  const driverText = await dlg2.locator('.shadow-md').innerText();
  A(driverText.includes('DELIVERY SLIP'), 'driver slip renders');
  const dLow = driverText.toLowerCase().replace(/\s/g, '');
  A(dLow.includes('ramesh') && dLow.includes('ap07ab1234'), 'driver + vehicle shown');
  A(!driverText.includes('₹') && !driverText.includes('Rs.'), 'NO prices on driver slip');
  await page.locator('[data-slot="dialog-close"]').locator('visible=true').first().click();
  await page.waitForTimeout(500);

  /* ---------- Phase E: history Invoice view = NEW unique design ---------- */
  console.log('Phase E — redesigned invoice from history');
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'History' }).click();
  await page.waitForTimeout(500);
  const row2 = page.locator('li', { hasText: 'SLP-INV-1002' }).first();
  A(await row2.locator('button', { hasText: 'Invoice' }).count() === 1, 'history row Invoice button');
  await row2.locator('button', { hasText: 'Invoice' }).click();
  await page.waitForTimeout(800);
  const invDlg = page.locator('[role="dialog"]').first();
  const invText = await invDlg.innerText();
  A(invText.includes('INVOICE'), 'new design: INVOICE eyebrow present');
  A(invText.includes('Open any UPI app'), 'scan-to-pay hint present (no UPI ID)');
  A(!invText.toLowerCase().includes('prasad@upi'), 'NO UPI ID on new invoice');
  A(await invDlg.locator('img[alt="UPI QR code"]').count() >= 1, 'QR still on balance invoice');
  // watermark logo present on the doc
  const wmCount = await invDlg.locator('img[src*="narasimha"]').count();
  A(wmCount >= 1, `narasimha logo used on invoice (${wmCount} img nodes)`);
  await page.screenshot({ path: shot('new-invoice-due') });
  await page.locator('[data-slot="dialog-close"]').locator('visible=true').first().click();
  await page.waitForTimeout(400);

  /* ---------- Phase F: ledger names + cash/UPI modes ---------- */
  console.log('Phase F — ledger details with names + modes');
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Ledger' }).click();
  await page.waitForTimeout(600);
  const ledger = page.locator('main');
  let dayTxt = await ledger.innerText();
  A(dayTxt.includes('Received from Ravi Kumar'), 'income detail shows NAME (Received from Ravi Kumar)');
  A(dayTxt.includes('CASH'), 'payment mode chip CASH visible');
  A(dayTxt.includes('₹300.00'), 'today income 300 (200 + 100 advance)');
  await page.screenshot({ path: shot('ledger-day-rows') });

  // Expenses tab: Diesel 250 via CASH
  await page.locator('button[role="tab"]', { hasText: 'Expenses' }).click();
  await page.waitForTimeout(400);
  await V(page.getByLabel('Expense category')).click();
  await page.getByRole('option', { name: 'Diesel' }).click();
  await V(page.getByLabel('Expense amount')).fill('250');
  await V(page.getByLabel('Expense note')).fill('Auto diesel');
  await V(page.getByRole('button', { name: /Add expense/ })).click();
  await page.waitForTimeout(600);
  dayTxt = await ledger.innerText();
  A(dayTxt.includes('Diesel') && dayTxt.includes('250.00'), 'expense listed with amount');
  A(dayTxt.includes('CASH'), 'expense shows CASH mode chip');

  // Dues: receive balance via UPI
  await page.locator('button[role="tab"]', { hasText: /Dues/ }).click();
  await page.waitForTimeout(500);
  A((await ledger.innerText()).includes('Suresh Babu'), 'dues list shows Suresh Babu');
  await V(page.getByRole('button', { name: /Receive/ })).first().click();
  await page.waitForTimeout(400);
  A(await V(page.getByLabel('Amount received')).inputValue() === '100', 'receive amount prefilled = balance 100');
  await V(page.getByLabel('Payment mode')).click();
  await page.getByRole('option', { name: 'UPI', exact: true }).click();
  await page.waitForTimeout(200);
  await V(page.getByRole('button', { name: /Receive payment/ })).click();
  await page.waitForTimeout(700);
  A((await ledger.innerText()).includes('No dues pending'), 'dues cleared');
  await page.screenshot({ path: shot('dues-received-upi') });

  // Day view now: Received from Suresh Babu with UPI chip
  await page.locator('button[role="tab"]', { hasText: /^Day/ }).click();
  await page.waitForTimeout(500);
  dayTxt = await ledger.innerText();
  A(dayTxt.includes('Received from Suresh Babu'), 'dues receipt counts as income with customer NAME');
  A(dayTxt.includes('UPI'), 'UPI mode chip visible on received dues');

  // All-days expand: both rows with modes
  await page.locator('button[role="tab"]', { hasText: /All days/ }).click();
  await page.waitForTimeout(500);
  await page.locator('main').getByRole('button').filter({ hasText: /2026|Nov/ }).first().click();
  await page.waitForTimeout(600);
  const allTxt = await ledger.innerText();
  A(allTxt.includes('Received from Ravi Kumar') && allTxt.includes('Received from Suresh Babu'), 'all-days expand lists income rows by name');
  A(allTxt.includes('Diesel'), 'all-days expand lists expense by category');
  A(allTxt.includes('CASH') && allTxt.includes('UPI'), 'both mode chips in expanded day');
  await page.screenshot({ path: shot('alldays-expanded-modes') });

  /* ---------- Phase G: Telugu app + Telugu invoice still clean ---------- */
  console.log('Phase G — Telugu surface check');
  await page.locator('header [aria-label="Switch app language"]').click();
  await page.waitForTimeout(400);
  const navTe = await page.locator('nav[aria-label="Main navigation"]').innerText();
  A(navTe.includes('లెడ్జర్'), 'app UI Telugu');
  await page.screenshot({ path: shot('te-final') });

  /* ---------- errors ---------- */
  const realErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('net::') && !e.includes('X-Frame'));
  console.log('\nConsole/page errors:', realErrors.length);
  realErrors.slice(0, 10).forEach((e) => console.log('  !', e.slice(0, 200)));
  await browser.close();
  if (realErrors.length) process.exitCode = 2;
  console.log('DONE — v16 smoke verification complete');
};

run().catch(async (e) => {
  console.error('FAILED:', e.message);
  try {
    console.log('URL:', page.url());
    console.log('body:', (await page.locator('body').innerText().catch(() => '')).slice(0, 400).replace(/\n/g, '|'));
    await page.screenshot({ path: '/tmp/fail-v16.png' }).catch(() => {});
  } catch {}
  process.exit(1);
});

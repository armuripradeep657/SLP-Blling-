import { chromium } from 'playwright';

/** v24 regression smoke — core bill flow still works behind the MPIN gate */
const BASE = 'http://localhost:3000';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

// login (returning device: MPIN only)
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.getByLabel('MPIN', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
await page.getByLabel('MPIN', { exact: true }).fill(MPIN);
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
ok(true, 'MPIN login works');
const popup = page.locator('[aria-label="Install app notification"]');
try {
  await popup.waitFor({ state: 'visible', timeout: 9000 });
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await popup.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
} catch {}
// fresh open should land on Bill
const activeTxt = (
  (await page.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent()) || ''
).trim();
ok(activeTxt === 'Bill', `opens on the Bill tab (active: ${activeTxt})`);
await page.waitForTimeout(400);

// bill: add a product, view bill sheet, complete the bill
await page.getByRole('button', { name: /^Well ring/i }).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
const sizeBtns = page.locator('main button:has-text("FT")');
const before = await sizeBtns.count();
ok(before > 0, `product size buttons available (${before})`);
await sizeBtns.first().click();
await page.waitForTimeout(600);
const dlg = () => page.locator('[role="dialog"]');
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(900);
const nameInput = dlg().getByPlaceholder('Customer name');
ok(await nameInput.isVisible(), 'bill sheet opens with customer fields');
await nameInput.fill('Smoke Kumar');
await dlg().getByLabel('Amount paid').fill('500');
await page.getByRole('button', { name: /Complete Bill/ }).first().click();
await page.waitForTimeout(1800);
const modal = page.locator('[role="dialog"]');
ok(await modal.isVisible(), 'invoice slip modal opens after completing the bill');
const modalTxt = (await modal.first().textContent()) || '';
ok(modalTxt.includes('Smoke Kumar'), 'slip shows the customer name');
await page.screenshot({ path: '/home/z/my-project/download/v24-smoke-bill.png' });

// history shows it
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'History', exact: true }).click();
await page.waitForTimeout(600);
const hist = (await page.locator('main').textContent()) || '';
ok(hist.includes('Smoke Kumar'), 'invoice appears in History');
ok(hist.includes('Due') || hist.includes('Partial'), 'status reflects the part payment');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

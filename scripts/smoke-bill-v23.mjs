import { chromium } from 'playwright';

/** v23 regression smoke — core bill flow still works behind the OTP gate */
const BASE = 'http://localhost:3000';
const PHONE = '9876543211';
const PIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

// login (returning device: OTP + PIN)
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.getByLabel('Login mobile number').waitFor({ state: 'visible', timeout: 15000 });
await page.getByLabel('Login mobile number').fill(PHONE);
await page.getByRole('button', { name: 'Send OTP' }).click();
const demo = page.locator('[data-demo-otp]');
await demo.waitFor({ state: 'visible', timeout: 15000 });
await page.getByLabel('OTP code').fill((await demo.getAttribute('data-demo-otp')) || '');
await page.getByRole('button', { name: 'Verify OTP' }).click();
// first-time (fresh account) → PIN setup; returning → PIN unlock
const setupInput = page.getByLabel('New security PIN');
try {
  await setupInput.waitFor({ state: 'visible', timeout: 6000 });
  await setupInput.fill(PIN);
  await page.getByLabel('Confirm security PIN').fill(PIN);
  await page.getByRole('button', { name: 'Save PIN' }).click();
} catch {
  await page.getByLabel('Security PIN', { exact: true }).fill(PIN);
  await page.getByRole('button', { name: 'Unlock data' }).click();
}
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
ok(true, 'login works');
const popup = page.locator('[aria-label="Install app notification"]');
try {
  await popup.waitFor({ state: 'visible', timeout: 9000 });
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await popup.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
} catch {}
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
await page.screenshot({ path: '/home/z/my-project/download/v23-smoke-bill.png' });

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

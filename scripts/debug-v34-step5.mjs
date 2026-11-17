import { chromium } from 'playwright';
const BASE = 'http://localhost:3100';
const MPIN = '2468';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('request', (r) => { if (r.url().includes('/api/verify')) console.log('[req]', r.url().slice(-45)); });
page.on('response', (r) => { if (r.url().includes('/api/verify')) console.log('[res]', r.status(), r.url().slice(-45)); });

// quick bill via API? need the UI — reuse: unlock + make bill
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '33'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const mpinBox = page.getByLabel('New MPIN');
if (await mpinBox.isVisible().catch(() => false)) {
  await mpinBox.fill(MPIN);
  await page.getByLabel('Confirm MPIN').fill(MPIN);
  await page.getByRole('button', { name: 'Save MPIN' }).click();
} else {
  await page.getByLabel('MPIN').fill(MPIN);
  await page.getByRole('button', { name: /Unlock|Open/ }).click();
}
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await page.goto(`${BASE}/verify`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// simulate the exact suite sequence: offline → retry → invalid
await page.route('**/api/verify/**', (r) => r.abort());
await page.keyboard.type('Q9TGT86F-D2H3');
await page.keyboard.press('Enter');
await page.locator('[data-verify-result="offline"]').waitFor({ timeout: 8000 });
console.log('step4a: offline shown');
await page.unroute('**/api/verify/**');
await page.getByRole('button', { name: 'Retry verification' }).click();
await page.locator('[data-verify-result="valid"]').waitFor({ timeout: 8000 });
console.log('step4b: valid after retry');
await page.evaluate(() => document.activeElement?.blur?.());
await page.keyboard.type('ZZZZ9999-WXYZ');
await page.waitForTimeout(200);
console.log('input now:', JSON.stringify(await page.locator('[data-verify-input]').inputValue()));
await page.keyboard.press('Enter');
await page.waitForTimeout(2500);
console.log('card now:', await page.locator('[data-verify-result]').getAttribute('data-verify-result').catch(() => 'NONE'));
console.log('card text:', (await page.locator('[data-verify-result]').textContent().catch(() => '')).slice(0, 120));
await browser.close();

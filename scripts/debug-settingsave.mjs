import { chromium } from 'playwright';

/** SETTINGS-SAVE probe: unlock → Settings → fill UPI → check dirty/disabled →
 *  click Update details → did POST /api/settings fire? */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('request', (r) => { if (r.url().includes('/api/settings')) console.log('REQ:', r.method(), r.url()); });
page.on('response', (r) => { if (r.url().includes('/api/settings')) console.log('RES:', r.status(), r.url()); });
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 90)));
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.getByLabel('New MPIN').fill('1234');
await page.getByLabel('Confirm MPIN').fill('1234');
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(4500);
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(900);
await page.getByLabel('UPI ID').fill('slpcement@ybl');
await page.waitForTimeout(400);
const btn = page.getByRole('button', { name: 'Update details' });
console.log('button count:', await btn.count(), 'disabled:', await btn.first().isDisabled().catch(() => '?'));
await btn.first().click();
await page.waitForTimeout(1500);
const cfg = await page.evaluate(async () => {
  const auth = JSON.parse(localStorage.getItem('slp-auth-v1') || '{}');
  const res = await fetch('/api/config', { headers: { Authorization: `Bearer ${auth.token}` } });
  return res.json();
});
console.log('SERVER CONFIG:', JSON.stringify(cfg));
await browser.close();

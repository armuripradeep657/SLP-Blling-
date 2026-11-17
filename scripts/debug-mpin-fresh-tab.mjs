import { chromium } from 'playwright';
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
// fresh tab in the SAME context
const p2 = await ctx.newPage();
await p2.goto(BASE, { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(3000);
const step = await p2.evaluate(() => ({
  auth: localStorage.getItem('slp-auth-v1')?.slice(0, 20),
  session: sessionStorage.getItem('slp-unlock-session'),
  mat: Boolean(localStorage.getItem('slp-recover-v1') || localStorage.getItem('slp-recover-v2')),
}));
console.log('fresh tab state:', JSON.stringify(step));
console.log('MPIN input count:', await p2.getByLabel('MPIN').count());
console.log('header count:', await p2.locator('[data-header]').count());
console.log('body:', JSON.stringify(((await p2.textContent('body')) || '').replace(/\s+/g, ' ').slice(0, 120)));
await browser.close();

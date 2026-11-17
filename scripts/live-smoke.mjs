import { chromium } from 'playwright';

/** LIVE-SMOKE — the real :3000 server (no test db): the gate renders, the
 *  bundle loads, no page errors. Read-only; does NOT log in. */
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4500);
const mpin = await page.getByLabel('MPIN').isVisible().catch(() => false);
const newMpin = await page.getByLabel('New MPIN').isVisible().catch(() => false);
const title = await page.title();
const lockErr = await page.locator('[data-lock-error]').count();
const ownerLink = await page.locator('[data-owner-login-link]').isVisible().catch(() => false);
const bodyHead = ((await page.textContent('body').catch(() => '')) || '').replace(/\s+/g, ' ').slice(0, 220);
console.log(JSON.stringify({ title, mpinGate: mpin, newMpinGate: newMpin, ownerLink, lockErr, pageErrors: errors.slice(0, 3) }));
console.log('BODY:', bodyHead);
await browser.close();

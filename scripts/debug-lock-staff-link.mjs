import { chromium } from 'playwright';
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
// fresh device → probe → 'setup' step → staff link should be visible
console.log('setup-step staff link:', await page.locator('[data-staff-login-link]').count());
console.log('body:', JSON.stringify(((await page.textContent('body')) || '').replace(/\s+/g, ' ').slice(0, 150)));
await browser.close();

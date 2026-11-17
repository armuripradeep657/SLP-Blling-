import { chromium } from 'playwright';

/** OFFLINE-DELETE probe: what ACTUALLY happens when the owner confirms a
 *  delete while offline — request fate, dialog state, toast, row state. */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 110)));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR', m.text().slice(0, 110)); });
page.on('requestfailed', (r) => { if (r.url().includes('/api/')) console.log('REQ-FAILED', r.method(), r.url(), r.failure()?.errorText); });
page.on('response', (r) => { if (r.url().includes('/api/bills')) console.log('RESP', r.status(), r.request().method(), r.url()); });
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.getByLabel('New MPIN').fill('1234');
await page.getByLabel('Confirm MPIN').fill('1234');
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(4500);
// one bill
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator('main button[title="2FT — ₹200"]').first().click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(800);
await page.locator('[role="dialog"]:not([aria-label="Install app notification"])').getByPlaceholder('Customer name').fill('Probe Offline');
await page.locator('[role="dialog"]:not([aria-label="Install app notification"])').getByRole('button', { name: /Complete Bill/ }).first().click();
await page.waitForTimeout(2000);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// go OFFLINE and delete
await ctx.setOffline(true);
await page.waitForTimeout(6500);
await page.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('Search invoices').fill('Probe Offline');
await page.waitForTimeout(500);
const row = page.locator('li', { hasText: 'SLP-INV-' }).first();
console.log('row found:', await row.isVisible().catch(() => false));
await row.locator('button[aria-label^="Delete "]').first().click();
await page.waitForTimeout(700);
console.log('alertdialog open:', await page.locator('[role="alertdialog"]').count());
const confirm = page.locator('[role="alertdialog"]').getByRole('button', { name: 'Delete', exact: true });
console.log('confirm visible:', await confirm.isVisible().catch(() => false), 'disabled:', await confirm.isDisabled().catch(() => '?'));
await confirm.click();
console.log('clicked confirm at', new Date().toISOString());
for (const waitMs of [4000, 8000, 12000, 20000]) {
  await page.waitForTimeout(waitMs - (waitMs === 4000 ? 0 : [4000, 8000, 12000, 20000][[4000, 8000, 12000, 20000].indexOf(waitMs) - 1]));
  const bodyTxt = ((await page.textContent('body').catch(() => '')) || '').replace(/\s+/g, ' ');
  console.log(`t+${waitMs}s: toasts=`, await page.locator('[aria-label="Notifications (F8)"] li[data-state="open"]').count(),
    '| Internet-required in body:', bodyTxt.includes('Internet connection required'),
    '| row still there:', ((await page.locator('li button', { hasText: 'SLP-INV-' }).count()) > 0));
}
await browser.close();

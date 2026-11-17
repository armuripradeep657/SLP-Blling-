import { chromium } from 'playwright';

/** FRESH-SEED probe: a brand-new device with NO old local data → MPIN setup
 *  → the central db must be seeded with the DEFAULT product catalog. */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 100)));
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.getByLabel('New MPIN').fill('1234');
await page.getByLabel('Confirm MPIN').fill('1234');
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(5000); // bootstrap + migration + re-pull
const st = await page.evaluate(async () => {
  const auth = JSON.parse(localStorage.getItem('slp-auth-v1') || '{}');
  const res = await fetch('/api/state?rev=-1', { headers: { Authorization: `Bearer ${auth.token}` } });
  const data = await res.json();
  return { products: (data.products || []).map((p) => p.name), upi: data.config?.upiId, settingsCompany: data.settings?.companyName };
});
console.log('SEED RESULT:', JSON.stringify(st));
// the FT chip visible on the Bill tab?
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(900);
console.log('FT chips:', await page.locator('main button:has-text("FT")').count());
await browser.close();

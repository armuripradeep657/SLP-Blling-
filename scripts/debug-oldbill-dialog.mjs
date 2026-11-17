import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();

await page.addInitScript(() => {
  localStorage.setItem('slp-update-notice-seen', '37');
  localStorage.setItem('slp-cement-billing-v1', JSON.stringify({
    state: {
      settings: { companyName: 'Old Device Shop', appLang: 'en' },
      products: [{ id: 'old-prod-1', name: 'Old 37 Cement Block', category: 'Blocks', price: 350, sizes: [], sizePrices: {} }],
      invoices: [{
        id: 'old-inv-1', no: 'SLP-INV-1003', dateISO: '2026-11-01T10:00:00.000Z',
        customer: { name: 'Ramesh', phone: '' },
        items: [{ key: 'old-prod-1::', productId: 'old-prod-1', name: 'Old 37 Cement Block', size: '', price: 350, qty: 1, discount: 0 }],
        totals: { subtotal: 350, discount: 0, labourCharge: 0, autoCharge: 0, total: 350, paid: 350, balance: 0 },
        discountType: 'amount', discountValue: 0, labourCharge: 0, autoCharge: 0,
        paymentMode: 'Cash', language: 'en', status: 'Paid', createdBy: 'Owner', cancelled: false,
      }],
      expenses: [], incomes: [], labourWorks: [], labourWorkers: [],
      dataUpdatedAt: Date.now(),
    },
    version: 0,
  }));
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.getByLabel('New MPIN').fill('1234');
await page.getByLabel('Confirm MPIN').fill('1234');
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(4000);

const storeInv = await page.evaluate(() => {
  const s = window.__ZUSTAND_STORE_DEBUG__ || null;
  // read the persisted UI state is not the store; instead fetch central state
  return null;
});

// go to History and open the old bill
await page.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await page.waitForTimeout(1200);
const row = page.locator('li button', { hasText: 'SLP-INV-1003' }).first();
console.log('row visible:', await row.isVisible().catch(() => false));
await row.click();
await page.waitForTimeout(1500);
const dlgCount = await page.locator('[role="dialog"]').count();
console.log('dialogs open:', dlgCount);
const vbCount = await page.locator('[role="dialog"] [data-verify-barcode]').count();
console.log('verify-barcode in dialogs:', vbCount);
const anyVb = await page.locator('[data-verify-barcode]').count();
console.log('verify-barcode anywhere:', anyVb);
const dlgText = (await page.locator('[role="dialog"]').first().textContent().catch(() => '')) || '';
console.log('dialog text head:', dlgText.slice(0, 300));
// what does the store hold?
const invFromApi = await page.evaluate(async () => {
  const auth = JSON.parse(localStorage.getItem('slp-auth-v1') || '{}');
  const res = await fetch('/api/state?rev=-1', { headers: { Authorization: `Bearer ${auth.token}` } });
  const data = await res.json();
  const inv = (data.invoices || [])[0] || {};
  return { verifyCode: inv.verifyCode, no: inv.no, keys: Object.keys(inv) };
});
console.log('central invoice:', JSON.stringify(invFromApi));
await browser.close();

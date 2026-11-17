import { chromium } from 'playwright';

/**
 * v35 VISUAL — screenshots of the final artifacts for the layout review:
 *   1. the formal INVOICE (Code 128 barcode top-right "SCAN TO VERIFY BILL",
 *      shop details + bill no, per-line orig→edited price + discount + GST;
 *      NO payment QR when fully paid — the QR appears only on a bill with a
 *      balance due, labeled "QR CODE – PAY BALANCE DUE", UPI ID never printed)
 *   2. the PAYMENT screen (QR + UPI ID — staff collection UI keeps both)
 *   3. the 58mm THERMAL SLIP (both codes on a due bill)
 * Saved to /home/z/my-project/download/v35-*.png — Read them afterwards.
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const dlg = () => page.locator('[role="dialog"]');

await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5200);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });

// saved UPI + GST so the invoice carries both
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('UPI ID').fill('slpcement@ybl');
await page.getByRole('button', { name: 'Update details' }).click();
await page.getByLabel('GST percent').fill('5');
await page.getByRole('button', { name: 'Update bill settings' }).click();
await page.waitForTimeout(600);

// a bill with a mid-bill price edit + a percent discount
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(500);
await page.locator('main button:has-text("FT")').first().click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(800);
await dlg().getByLabel('Unit price for Gagulu (Well Ring)').fill('250');
await page.waitForTimeout(300);
await dlg().getByPlaceholder('Customer name').fill('Ramesh Kumar');
await dlg().getByLabel('Payment mode').click();
await page.getByRole('option', { name: 'UPI', exact: true }).click();
await page.waitForTimeout(500);
await dlg().getByRole('button', { name: /Complete Bill/ }).first().click();
await page.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 12000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/home/z/my-project/download/v35-payment-screen.png' });

await page.locator('[data-payment-received]').click();
await dlg().first().waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(1000);
await dlg().first().getByRole('button', { name: 'Invoice' }).click();
await page.waitForTimeout(1400);
const inv = dlg().first().locator('[data-invoice-doc]');
const invEl = (await inv.count()) ? inv.first() : dlg().first();
await invEl.screenshot({ path: '/home/z/my-project/download/v35-invoice.png' });

await dlg().first().getByRole('button', { name: 'Slip' }).click().catch(() => {});
await page.waitForTimeout(1000);
const slip = dlg().first();
await slip.screenshot({ path: '/home/z/my-project/download/v35-slip.png' });

console.log('visual shots saved');
await browser.close();
process.exit(0);

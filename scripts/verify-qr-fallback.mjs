/* Verify: fresh user (no UPI, no phone) sees the QR hint chip */
import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // add item, open bill, complete with empty customer
  await page.locator('button:has-text("+2FT")').first().click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("View Bill")').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Complete Bill")').last().click();
  await page.waitForTimeout(1500);

  const hint = await page.locator('text=No QR yet').isVisible().catch(() => false);
  const qrCount = await page.locator('img[alt*="QR code"]').count();
  console.log('Hint chip visible (fresh, no UPI/phone):', hint, '| QR imgs on slip:', qrCount);
  await page.screenshot({ path: '/home/z/my-project/scripts/v2-7-noqr-hint.png' });

  // now set ONLY shop phone -> WhatsApp contact QR should appear
  await page.evaluate(() => {
    const KEY = 'slp-cement-billing-v1';
    const data = JSON.parse(localStorage.getItem(KEY) || '{"state":{}}');
    data.state.settings = { ...(data.state.settings || {}), phone: '9876500000' };
    localStorage.setItem(KEY, JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  // open last invoice from history
  await page.locator('button[aria-label="Main navigation"] >> text=History').click().catch(async () => {
    await page.locator('nav button:has-text("History")').click();
  });
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Slip")').first().click();
  await page.waitForTimeout(1200);
  const qrInfo = await page.evaluate(() => {
    const slipImgs = [...document.querySelectorAll('img[alt="WhatsApp QR code"]')];
    return { waQr: slipImgs.length, caption: slipImgs.length ? slipImgs[0].alt : '' };
  });
  console.log('WhatsApp contact QR when only phone set:', JSON.stringify(qrInfo));
  const waCaption = await page.locator('text=Scan to chat on WhatsApp').first().isVisible().catch(() => false);
  console.log('Caption visible:', waCaption);
  await page.screenshot({ path: '/home/z/my-project/scripts/v2-8-wa-qr-fallback.png' });

  await browser.close();
};

run().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

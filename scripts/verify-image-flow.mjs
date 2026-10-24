/* E2E verification: bill -> thermal slip image with QR -> WhatsApp image flow */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const shot = (n) => `/home/z/my-project/scripts/v2-${n}.png`;

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    permissions: [],
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });

  // --- Step 0: fresh start (clear poisoned state from earlier sessions), seed full settings
  await page.evaluate(() => {
    localStorage.removeItem('slp-cement-billing-v1');
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const KEY = 'slp-cement-billing-v1';
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    data.state = data.state || {};
    data.state.settings = Object.assign(
      {
        companyName: 'Sri Lakshmi Penchil Narasimha Swamy Cement Works',
        ownerName: 'A. Prasad',
        phone: '',
        whatsappNumber: '',
        address: '',
        gstin: '',
        upiId: '',
        invoicePrefix: 'SLP-INV-',
        nextInvoiceNo: 1001,
        defaultTaxRate: 0,
        roundOffEnabled: true,
        slipWidthMm: 80,
        thankYouNote: 'Thank you! Visit Again',
        returnPolicy: 'Goods once sold will not be taken back',
      },
      data.state.settings,
      {
        upiId: 'prasad@upi',
        phone: '9876543210',
        whatsappNumber: '9876543210',
        address: 'Main Road, Tenali',
      }
    );
    localStorage.setItem(KEY, JSON.stringify(data));
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot('1-home') });

  // --- Step 1: add a product (tap a size button)
  await page.locator('button:has-text("+3FT")').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("+8FT")').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot('2-cart') });

  // --- Step 2: open bill sheet, fill customer
  await page.locator('button:has-text("View Bill")').click();
  await page.waitForTimeout(500);
  await page.locator('input[placeholder="Customer name"]').last().fill('Ravi Kumar');
  await page.locator('input[placeholder="Mobile / WhatsApp"]').last().fill('9123456780');
  await page.screenshot({ path: shot('3-customer') });

  // --- Step 3: complete bill
  await page.locator('button:has-text("Complete Bill")').last().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: shot('4-invoice-modal'), fullPage: false });

  // --- Step 4: verify QR is rendered on the slip
  const qrInfo = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img[alt*="QR"], img[alt*="QR code"]')];
    return {
      count: imgs.length,
      srcs: imgs.map((i) => (i.src || '').slice(0, 30)),
    };
  });
  console.log('QR check:', JSON.stringify(qrInfo));

  // Verify slip text content
  const slipText = await page.evaluate(() => {
    const mono = [...document.querySelectorAll('div')].find((d) =>
      (d.style?.fontFamily || '').includes('Courier')
    );
    return mono ? mono.innerText.slice(0, 400) : 'SLIP NOT FOUND';
  });
  console.log('SLIP TEXT >>>\n' + slipText + '\n<<<');

  // --- Step 5: tap "Send Bill Image on WhatsApp" (headless = no Web Share files -> fallback dialog)
  await page.locator('button:has-text("Send Bill Image on WhatsApp")').click();
  await page.waitForTimeout(2500);
  const fallbackVisible = await page.locator('text=Bill image ready').isVisible().catch(() => false);
  console.log('Fallback helper dialog visible:', fallbackVisible);
  await page.screenshot({ path: shot('5-wa-fallback') });

  // The helper dialog shows a preview img of the captured slip
  const previewOk = await page.evaluate(() => {
    const img = [...document.querySelectorAll('img[alt="Bill slip preview"]')][0];
    if (!img) return { ok: false };
    return { ok: img.naturalWidth > 100, w: img.naturalWidth, h: img.naturalHeight };
  });
  console.log('Captured slip preview:', JSON.stringify(previewOk));

  // --- Step 6: close helper (Escape), then Download works
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await page.locator('button:has-text("Download")').first().click();
  const dl2 = await page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  console.log('Download triggered:', !!dl2, dl2 ? dl2.suggestedFilename() : '');

  // --- Step 7: PWA checks
  const pwa = await page.evaluate(async () => {
    const swReg = await navigator.serviceWorker.getRegistration();
    return {
      swActive: !!swReg && (!!swReg.active || !!swReg.installing || !!swReg.waiting),
      manifestLink: !!document.querySelector('link[rel="manifest"]'),
      themeColor: document.querySelector('meta[name="theme-color"]')?.content || '',
    };
  });
  console.log('PWA:', JSON.stringify(pwa));

  // --- Step 8: desktop view sanity
  const desk = await ctx.browser().newContext({ viewport: { width: 1440, height: 900 } });
  const dpage = await desk.newPage();
  await dpage.goto(BASE, { waitUntil: 'networkidle' });
  await dpage.waitForTimeout(600);
  await dpage.screenshot({ path: shot('6-desktop') });
  const hasTabs = await dpage.locator('button:has-text("New Bill")').isVisible();
  console.log('Desktop tabs visible:', hasTabs);

  console.log('JS ERRORS:', errors.length ? errors.slice(0, 8) : 'none');
  await browser.close();
};

run().catch((e) => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});

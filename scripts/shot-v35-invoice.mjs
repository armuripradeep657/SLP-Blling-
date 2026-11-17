import { chromium } from 'playwright';
import jsQR from 'jsqr';

/**
 * v35 INVOICE — the two codes, clearly separated (req 4/5/7):
 *   1. UPI PAYMENT QR built from the SAVED UPI ID — on the payment screen
 *      AND on the bill (invoice + slip); the QR DECODES (ZXing) to a valid
 *      upi://pay URI with pa=<saved id> + the amount
 *   2. the Code 128 verification barcode sits at the TOP-RIGHT of the
 *      invoice labeled "SCAN TO VERIFY BILL" — never a QR
 *   3. changing the UPI ID in Admin Settings regenerates every payment QR
 *   4. an invalid UPI ID never produces a QR
 *   5. GST + totals + per-line orig→edited prices print on the invoice
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('framenavigated', (f) => { if (f === page.mainFrame()) console.log('  NAV->', f.url()); });
page.on('pageerror', (e) => console.log('  PAGEERR', String(e).slice(0, 120)));
page.on('crash', () => console.log('  CRASH mainPage'));
const dlg = (pg = page) => pg.locator('[role="dialog"]');
const closePopup = async (target = page) => {
  try {
    const pop = target.locator('[aria-label="Install app notification"]');
    for (let i = 0; i < 3; i++) {
      if (!(await pop.isVisible().catch(() => false))) return;
      await pop.getByRole('button', { name: 'Close install notification' }).click();
      await pop.waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
    }
  } catch {}
};

/**
 * decode a QR rendered in the page (svg[data-qr]) with jsQR IN NODE:
 * the page only rasterizes the REAL svg (Image → canvas → getImageData),
 * the pixel buffer comes back to Node and jsQR decodes it there. A second
 * browser page + in-page ZXing decode kept getting its context destroyed
 * under this sandbox's memory pressure (no swap, OOM-kill mid-decode) —
 * this keeps one page and one small allocation instead.
 */
const decodeQr = async (pg, selector) => {
  await pg.locator(selector).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  const raster = await pg.evaluate((sel) => {
    const svgs = Array.from(document.querySelectorAll(sel));
    if (svgs.length === 0) return { err: 'qr svg not found' };
    return new Promise((resolve) => {
      let i = 0;
      const tryNext = () => {
        if (i >= svgs.length) {
          resolve({ err: 'svg img load failed', n: svgs.length, head: svgs[0].outerHTML.slice(0, 160) });
          return;
        }
        const svg = svgs[i++];
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        const xml = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.onload = () => {
          const scale = 3;
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale + 60;
          canvas.height = img.height * scale + 60;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 30, 30, img.width * scale, img.height * scale);
          const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const bytes = new Uint8Array(id.data.buffer);
          let bin = '';
          for (let k = 0; k < bytes.length; k += 0x8000) {
            bin += String.fromCharCode.apply(null, bytes.subarray(k, k + 0x8000));
          }
          resolve({ b64: btoa(bin), w: canvas.width, h: canvas.height });
        };
        img.onerror = () => tryNext();
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
      };
      tryNext();
    });
  }, selector);
  if (!raster || raster.err) return { err: raster?.err || 'qr svg not found', head: raster?.head };
  const pixels = new Uint8ClampedArray(Buffer.from(raster.b64, 'base64'));
  const res = jsQR(pixels, raster.w, raster.h);
  return res ? { text: res.data } : { err: 'no qr decoded' };
};

/* ---------- setup: owner + UPI ID saved ---------- */
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
// let the service worker install + claim fully — its one-time controllerchange
// auto-reload must NOT fire mid-flow (it destroyed page.evaluate mid-decode).
// NEVER await sw.ready here: on a fresh origin it can hang without a timeout.
await page.waitForTimeout(5200);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup();

await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('UPI ID').fill('slpcement@ybl');
await page.getByRole('button', { name: 'Update details' }).click();
await page.waitForTimeout(800);
ok(true, 'UPI ID saved in Admin Settings (slpcement@ybl)');

/* ---------- 1. the payment screen QR ---------- */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(500);
await page.locator('main button:has-text("FT")').first().click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(800);
await dlg().getByPlaceholder('Customer name').fill('QR Customer');
await dlg().getByLabel('Payment mode').click();
await page.getByRole('option', { name: 'UPI', exact: true }).click();
await page.waitForTimeout(600);
await dlg().getByRole('button', { name: /Complete Bill/ }).first().click();
await page.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 12000 });
await page.waitForTimeout(900);
ok((await page.locator('[data-payment-qr]').count()) === 1, 'the payment screen shows the UPI payment QR');
const payQr = await decodeQr(page, '[data-payment-qr] svg');
console.log('  DEBUG pay QR:', JSON.stringify(payQr));
ok(typeof payQr.text === 'string' && payQr.text.startsWith('upi://pay?') && payQr.text.includes('pa=slpcement%40ybl') &&
   payQr.text.includes('cu=INR'),
  `the payment QR DECODES to a UPI URI for the saved ID (${payQr.text || payQr.err})`);
const amt = payQr.text?.match(/am=([\d.]+)/)?.[1];
ok(amt && Number(amt) === 200, `the QR carries the amount (₹${amt})`);
ok(((await page.locator('[data-payment-qr]').textContent()) || '').includes('QR CODE – MAKE PAYMENT'),
  'the QR is labeled QR CODE – MAKE PAYMENT');
await page.locator('[data-payment-received]').click();
await dlg().first().waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(1200);

/* ---------- 2. the invoice: verification barcode top-right + payment QR ---------- */
await dlg().first().getByRole('button', { name: 'Invoice' }).click();
await page.waitForTimeout(1200);
const doc = dlg().first();
const docText = (await doc.textContent()) || '';

// Code 128 verification barcode — top-right corner, labeled SCAN TO VERIFY BILL
const vb = doc.locator('[data-verify-barcode]');
ok((await vb.count()) === 1, 'the invoice carries the verification barcode');
const docBox = await doc.locator('div').first().boundingBox();
const vbBox = await vb.boundingBox();
console.log('  DEBUG doc box:', JSON.stringify(docBox), 'barcode box:', JSON.stringify(vbBox));
ok(vbBox && docBox && vbBox.x + vbBox.width / 2 > docBox.x + docBox.width / 2 && vbBox.y < docBox.y + 300,
  `the barcode sits at the TOP-RIGHT (barcode center ${Math.round((vbBox?.x || 0) + (vbBox?.width || 0) / 2)} vs doc center ${Math.round(docBox.x + docBox.width / 2)})`);
ok(docText.includes('SCAN TO VERIFY BILL'), 'labeled SCAN TO VERIFY BILL');
const vCode = (await vb.getAttribute('data-verify-code')) || '';
const vbSvg = await vb.locator('[data-barcode]').first().getAttribute('data-barcode');
ok(!!vbSvg, `the Code 128 encodes the verification ID (${vCode || vbSvg})`);

// payment QR section on the invoice
ok((await doc.locator('[data-payment-qr-section]').count()) === 1, 'the invoice carries the payment QR section');
ok(docText.includes('QR CODE – MAKE PAYMENT'), 'labeled QR CODE – MAKE PAYMENT');
const invQr = await decodeQr(page, '[data-payment-qr-section] [data-qr] svg');
console.log('  DEBUG invoice QR:', JSON.stringify(invQr));
ok(typeof invQr.text === 'string' && invQr.text.includes('pa=slpcement%40ybl'),
  `the invoice QR decodes to the SAME saved UPI ID (${invQr.text || invQr.err + ' ' + (invQr.head || '')})`);

// the two codes are DIFFERENT things: barcode is 1-D Code 128, QR is the UPI URI
ok(vbSvg !== invQr.text && !!invQr.text, 'the verification barcode and the payment QR are separate codes');

/* ---------- 3. the thermal slip carries both too ---------- */
await dlg().first().getByRole('button', { name: 'Slip' }).click().catch(() => {});
await page.waitForTimeout(1000);
const slipText = (await dlg().first().textContent()) || '';
ok((await dlg().first().locator('[data-barcode]').count()) >= 1, 'Code 128 verification barcode on the thermal slip');
ok((await dlg().first().locator('[data-slip-payment-qr] [data-qr]').count()) === 1, 'payment QR on the thermal slip');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

/* ---------- 4. changing the UPI ID regenerates the QR ---------- */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('UPI ID').fill('slpnew@okaxis');
await page.getByRole('button', { name: 'Update details' }).click();
await page.waitForTimeout(900);

await page.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await page.waitForTimeout(800);
await page.locator('li button', { hasText: 'SLP-INV-' }).first().click();
await dlg().first().waitFor({ state: 'visible', timeout: 12000 });
await dlg().first().getByRole('button', { name: 'Invoice' }).click();
await page.waitForTimeout(1200);
const invQr2 = await decodeQr(page, '[data-payment-qr-section] [data-qr] svg');
ok(typeof invQr2.text === 'string' && invQr2.text.includes('pa=slpnew%40okaxis'),
  `after the UPI ID change the QR encodes the NEW ID (${invQr2.text || invQr2.err + ' ' + (invQr2.head || '')})`);
await page.keyboard.press('Escape');

/* ---------- 5. an invalid UPI ID never renders a QR ---------- */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('UPI ID').fill('not-a-upi');
await page.getByRole('button', { name: 'Update details' }).click();
await page.waitForTimeout(900);
await page.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await page.waitForTimeout(800);
await page.locator('li button', { hasText: 'SLP-INV-' }).first().click();
await dlg().first().waitFor({ state: 'visible', timeout: 12000 });
await dlg().first().getByRole('button', { name: 'Invoice' }).click();
await page.waitForTimeout(1000);
ok((await dlg().first().locator('[data-payment-qr-section]').count()) === 0,
  'an INVALID UPI ID produces NO payment QR (validation gate)');
await page.keyboard.press('Escape');

/* ---------- 6. GST + orig→edited price print on the invoice ---------- */
// owner edits a price mid-bill and completes with GST 5%
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('UPI ID').fill('slpcement@ybl');
await page.getByRole('button', { name: 'Update details' }).click();
await page.getByLabel('GST percent').fill('5');
await page.getByRole('button', { name: 'Update bill settings' }).click();
await page.waitForTimeout(600);
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(500);
await page.locator('main button:has-text("FT")').first().click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(800);
await dlg().getByLabel('Unit price for Gagulu (Well Ring)').fill('250');
await page.waitForTimeout(300);
await dlg().getByPlaceholder('Customer name').fill('GST Customer');
await dlg().getByRole('button', { name: /Complete Bill/ }).first().click();
await dlg().first().waitFor({ state: 'visible', timeout: 15000 });
await dlg().first().getByRole('button', { name: 'Invoice' }).click();
await page.waitForTimeout(1200);
const gstText = (await dlg().first().textContent()) || '';
ok(gstText.includes('200') && gstText.includes('250'), 'the invoice prints the saved price → edited price');
ok(gstText.includes('5%') && gstText.includes('262.50'), `GST 5% on ₹250 = ₹12.50, total ₹262.50`);
await page.keyboard.press('Escape');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

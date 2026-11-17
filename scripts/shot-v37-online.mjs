import { chromium } from 'playwright';
import jsQR from 'jsqr';

/**
 * v37 ONLINE — the whole app is admin-only + online-only on ONE central db:
 *   1. a pre-online device's old localStorage data MIGRATES into the central
 *      database on first login (old bills get verification codes and verify)
 *   2. owner password (Pradeep/2125) seeds silently after the first MPIN
 *      unlock — every OTHER device signs in with it (no MPIN copy needed)
 *   3. THREE browser contexts = three devices on one server: a product added
 *      on A appears on B; a price change on A lands on B live (4s poll, no
 *      reload); the UPI change on A regenerates B's payment QR; a GST change
 *      on A is applied by the SERVER when B saves a bill
 *   4. a bill saved on A (server-confirmed, Code 128 registered) appears in
 *      B's and C's History with the same number and details — no reload
 *   5. OFFLINE: the banner shows "Internet connection required.", the save
 *      FAILS, nothing pretends to be saved; back online the same bill saves
 *      exactly once
 *   6. barcode verification from ANOTHER device: migrated old bill VALID,
 *      unknown code INVALID, cancelled bill CANCELLED
 *   7. admin-only: no staff UI anywhere (Settings / lock screen)
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });

const DOC_DLG = '[role="dialog"]:not([aria-label="Install app notification"])';

/** tap a main tab on ANY device — mobile bottom nav or desktop Sections bar */
const navTo = async (pg, mobileLabel, desktopLabel) => {
  const mob = pg.locator('[aria-label="Main navigation"] button', { hasText: mobileLabel }).first();
  if (await mob.isVisible().catch(() => false)) { await mob.click(); return; }
  await pg.locator('[aria-label="Sections"] button', { hasText: desktopLabel ?? mobileLabel }).first().click();
};

const closePopup = async (target) => {
  try {
    const pop = target.locator('[aria-label="Install app notification"]');
    for (let i = 0; i < 3; i++) {
      if (!(await pop.isVisible().catch(() => false))) return;
      await pop.getByRole('button', { name: 'Close install notification' }).click();
      await pop.waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
    }
  } catch {}
};

/** decode a QR rendered in the page (svg[data-qr]) with jsQR IN NODE —
 *  the page rasterizes the REAL svg (Image → canvas → getImageData), the
 *  raw pixel buffer comes back to Node and jsQR decodes it there. */
const decodeQr = async (pg, selector) => {
  await pg.locator(selector).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  const raster = await pg.evaluate((sel) => {
    const svgs = Array.from(document.querySelectorAll(sel));
    if (svgs.length === 0) return { err: 'qr svg not found' };
    return new Promise((resolve) => {
      let i = 0;
      const tryNext = () => {
        if (i >= svgs.length) {
          resolve({ err: 'svg img load failed', head: svgs[0].outerHTML.slice(0, 120) });
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

/* ================= DEVICE A — the owner's phone (migration + setup) ====== */
const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pageA = await ctxA.newPage();
pageA.on('pageerror', (e) => console.log('  PAGEERR[pageA]', String(e).slice(0, 100)));

// the owner's OLD offline-era app data, exactly as the previous version kept it
await pageA.addInitScript(() => {
  localStorage.setItem('slp-update-notice-seen', '37');
  localStorage.setItem('slp-cement-billing-v1', JSON.stringify({
    state: {
      settings: { companyName: 'Old Device Shop', appLang: 'en', invoicePrefix: 'SLP-INV-' },
      appearance: {},
      products: [{ id: 'old-prod-1', name: 'Old 37 Cement Block', category: 'Blocks', price: 350, sizes: ['2FT'], sizePrices: {} }],
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

await pageA.goto(BASE, { waitUntil: 'domcontentloaded' });
await pageA.waitForTimeout(2600);
await pageA.getByLabel('New MPIN').fill(MPIN);
await pageA.getByLabel('Confirm MPIN').fill(MPIN);
await pageA.getByRole('button', { name: 'Save MPIN' }).click();
await pageA.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup(pageA);
ok(true, 'device A: MPIN created, app unlocked');

// owner password seeds in the background — B and C will sign in with it
let hasOwner = false;
for (let i = 0; i < 20; i++) {
  const st = await (await fetch(`${BASE}/api/auth/state`)).json();
  if (st.hasOwnerPassword) { hasOwner = true; break; }
  await pageA.waitForTimeout(1000);
}
ok(hasOwner, 'owner password (Pradeep/2125) seeded automatically after the first unlock');

/* ---- 1. migration: the old device data now lives centrally ---- */
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Products' }).first().click();
await pageA.waitForTimeout(900);
await pageA.getByLabel('Search products').fill('Old 37');
await pageA.waitForTimeout(500);
ok((await pageA.getByText('Old 37 Cement Block').count()) >= 1,
  'device A: the OLD product migrated into the central catalog');
await pageA.getByLabel('Search products').fill('');
await pageA.waitForTimeout(400);

await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await pageA.waitForTimeout(900);
const oldBillBtn = pageA.locator('li button', { hasText: 'SLP-INV-1003' }).first();
ok(await oldBillBtn.isVisible().catch(() => false),
  'device A: the OLD bill SLP-INV-1003 migrated into the central history');
await oldBillBtn.click();
await pageA.waitForTimeout(1100);
const oldVb = pageA.locator(DOC_DLG).first().locator('[data-verify-barcode]');
ok((await oldVb.count()) >= 1, 'the migrated OLD bill got a minted Code 128 verification ID');
const oldCode = (await oldVb.first().getAttribute('data-verify-code')) || '';
ok(/^SLP-[23456789ABCDEFGHJKMNPQRTUVWXY]{8}-[23456789ABCDEFGHJKMNPQRTUVWXY]{4}$/.test(oldCode),
  `minted code format (${oldCode})`);
await pageA.keyboard.press('Escape');
await pageA.waitForTimeout(400);

/* ---- 2. device A adds a product ---- */
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Products' }).first().click();
await pageA.waitForTimeout(600);
await pageA.locator('main button', { hasText: 'Add' }).first().click();
await pageA.waitForTimeout(600);
await pageA.getByPlaceholder('Product name *').fill('37 Sync Block');
await pageA.getByPlaceholder('0').first().fill('123');
await pageA.locator(DOC_DLG).getByRole('button', { name: 'Add product' }).click();
await pageA.waitForTimeout(1200);
ok((await pageA.getByText('37 Sync Block').count()) >= 1, 'device A: product added (server-confirmed)');

/* ---- 3. device A changes the UPI ID ---- */
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await pageA.waitForTimeout(700);
await pageA.getByLabel('UPI ID').fill('sync37@upi');
await pageA.getByRole('button', { name: 'Update details' }).click();
await pageA.waitForTimeout(900);
ok(true, 'device A: UPI ID changed to sync37@upi (central)');

/* ---- 4. device A saves a bill (server-confirmed) ---- */
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await pageA.waitForTimeout(500);
await pageA.locator('main button:has-text("2FT")').first().click();
await pageA.waitForTimeout(700);
await pageA.getByRole('button', { name: 'View bill' }).click();
await pageA.waitForTimeout(800);
await pageA.locator(DOC_DLG).getByPlaceholder('Customer name').fill('Sync Kumar');
await pageA.locator(DOC_DLG).getByLabel('Payment mode').click();
await pageA.getByRole('option', { name: 'Cash', exact: true }).click();
await pageA.waitForTimeout(400);
await pageA.locator(DOC_DLG).getByRole('button', { name: /Complete Bill/ }).first().click();
await pageA.locator(DOC_DLG).first().locator('[data-barcode]').first().waitFor({ state: 'visible', timeout: 15000 });
const billACode = (await pageA.locator(DOC_DLG).first().locator('[data-barcode]').first().getAttribute('data-barcode')) || '';
ok(/^SLP-[23456789ABCDEFGHJKMNPQRTUVWXY]{8}-[23456789ABCDEFGHJKMNPQRTUVWXY]{4}$/.test(billACode),
  `device A: bill saved — server registered the Code 128 (${billACode})`);
await pageA.keyboard.press('Escape');
await pageA.waitForTimeout(400);

// the reserved bill number comes from the server — read it back from History
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await pageA.waitForTimeout(900);
await pageA.getByLabel('Search invoices').fill('Sync Kumar');
await pageA.waitForTimeout(500);
const billARow = pageA.locator('li button', { hasText: 'SLP-INV-' }).first();
const billANo = (((await billARow.textContent().catch(() => '')) || '').match(/SLP-INV-\d+/) || [''])[0];
ok(/^SLP-INV-\d+$/.test(billANo), `device A: the saved bill is in History as ${billANo}`);
await pageA.getByLabel('Search invoices').fill('');
await pageA.waitForTimeout(400);

/* ================= DEVICE B — another phone (owner sign-in) ============== */
const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pageB = await ctxB.newPage();
pageB.on('pageerror', (e) => console.log('  PAGEERR[pageB]', String(e).slice(0, 100)));
await pageB.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await pageB.goto(BASE, { waitUntil: 'domcontentloaded' });
await pageB.waitForTimeout(2400);
await closePopup(pageB);
ok(await pageB.locator('[data-owner-login-link]').isVisible().catch(() => false),
  'device B: the gate offers Owner login (Admin)');
await pageB.locator('[data-owner-login-link]').click();
await pageB.getByLabel('Owner username').fill('Pradeep');
await pageB.getByLabel('Owner password').fill('2125');
await pageB.getByRole('button', { name: 'Owner sign in' }).click();
await pageB.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'device B: Pradeep/2125 signs in — same central database, no MPIN copy');

/* ---- 5. B sees A's product + the migrated catalog WITHOUT any reload ---- */
await navTo(pageB, 'Products');
await pageB.waitForTimeout(900);
ok((await pageB.getByText('37 Sync Block').count()) >= 1, 'device B: the product A added is already there');
ok((await pageB.getByText('Old 37 Cement Block').count()) >= 1, 'device B: the migrated old product too');

/* ---- 6. B sees A's bill in History with the same number/details ---- */
await navTo(pageB, 'History', 'Invoice History');
await pageB.waitForTimeout(900);
const billB = pageB.locator('li button', { hasText: billANo }).first();
ok(await billB.isVisible().catch(() => false), `device B: bill ${billANo} (saved on A) in History — no reload`);
const billBText = (await billB.textContent()) || '';
ok(billBText.includes('Sync Kumar') && billBText.includes('350'), 'device B: same customer + total ₹350');
await billB.click();
await pageB.waitForTimeout(1100);
const billBVb = pageB.locator(DOC_DLG).first().locator('[data-verify-barcode]');
ok(((await billBVb.first().getAttribute('data-verify-code')) || '') === billACode,
  'device B: the SAME Code 128 verification ID on the re-opened bill');
await pageB.keyboard.press('Escape');
await pageB.waitForTimeout(400);

/* ---- 7. LIVE propagation: A changes the price, B sees it without reload ---- */
await navTo(pageB, 'Products'); // B parks on the products page — no reload from here on
await pageB.waitForTimeout(700);
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Products' }).first().click();
await pageA.waitForTimeout(700);
await pageA.getByLabel('Search products').fill('37 Sync Block');
await pageA.waitForTimeout(500);
await pageA.locator('main button[aria-label="Edit 37 Sync Block"]').first().click();
await pageA.waitForTimeout(700);
await pageA.locator(DOC_DLG).getByPlaceholder('0').first().fill('150');
await pageA.locator(DOC_DLG).getByRole('button', { name: 'Save changes' }).click();
await pageA.waitForTimeout(1200);
ok((await pageA.locator('li', { hasText: '37 Sync Block' }).first().textContent().catch(() => '')).includes('150'),
  'device A: price now 150 (server-confirmed)');
await pageA.getByLabel('Search products').fill('');
let saw150 = false;
for (let i = 0; i < 10; i++) {
  const row = await pageB.locator('li', { hasText: '37 Sync Block' }).first().textContent().catch(() => '');
  if (row && row.includes('150')) { saw150 = true; break; }
  await pageB.waitForTimeout(1000);
}
ok(saw150, 'device B: the price change 123→150 arrived LIVE (poll, no reload)');

/* ---- 8. GST changed on A; the SERVER applies it to B's new bill ---- */
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await pageA.waitForTimeout(700);
await pageA.getByLabel('GST percent').fill('12');
await pageA.getByRole('button', { name: 'Update bill settings' }).click();
await pageA.waitForTimeout(900);
await navTo(pageB, 'Bill', 'New Bill');
await pageB.waitForTimeout(600);
await pageB.locator('main button:has-text("2FT")').first().click();
await pageB.waitForTimeout(900);
// DESKTOP: the live bill panel is the always-visible aside — no 'View bill' step
await pageB.getByPlaceholder('Customer name').first().fill('GST Check');
await pageB.getByLabel('Payment mode').click();
await pageB.getByRole('option', { name: 'Cash', exact: true }).click();
await pageB.waitForTimeout(400);
await pageB.getByRole('button', { name: /Complete Bill/ }).first().click();
await pageB.locator(DOC_DLG).first().locator('[data-barcode]').first().waitFor({ state: 'visible', timeout: 15000 });
const gstBillText = (await pageB.locator(DOC_DLG).first().textContent()) || '';
ok(gstBillText.includes('392'), 'device B: server recomputed with the GST set on A (₹350 + 12% = ₹392)');
await pageB.keyboard.press('Escape');
await pageB.waitForTimeout(400);

/* ---- 9. UPI changed on A → B's payment QR carries the new ID ---- */
await pageB.locator('main button:has-text("2FT")').first().click();
await pageB.waitForTimeout(900);
await pageB.getByPlaceholder('Customer name').first().fill('UPI Check');
await pageB.getByLabel('Payment mode').click();
await pageB.getByRole('option', { name: 'UPI', exact: true }).click();
await pageB.waitForTimeout(500);
await pageB.getByRole('button', { name: /Complete Bill/ }).first().click();
await pageB.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 15000 });
await pageB.waitForTimeout(800);
const payQrB = await decodeQr(pageB, '[data-payment-qr] svg');
ok(typeof payQrB.text === 'string' && payQrB.text.includes('pa=sync37%40upi'),
  `device B: payment QR regenerated from the UPI ID set on A (${payQrB.text || payQrB.err})`);
await pageB.locator('[data-payment-received]').click();
await pageB.waitForTimeout(1200);
await pageB.keyboard.press('Escape');
await pageB.waitForTimeout(400);

/* ---- 10. OFFLINE: banner + failed save, nothing pretends to be saved ---- */
await ctxA.setOffline(true);
await pageA.waitForTimeout(6500); // the poll marks the app offline within ~4s
ok(await pageA.locator('[data-offline-banner]').isVisible().catch(() => false),
  'device A offline: the banner shows');
const bannerText = (await pageA.locator('[data-offline-banner]').textContent().catch(() => '')) || '';
ok(bannerText.includes('Internet connection required'), `banner text ("${bannerText.trim()}")`);
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await pageA.waitForTimeout(600);
await pageA.locator('main button:has-text("2FT")').first().click();
await pageA.waitForTimeout(700);
await pageA.getByRole('button', { name: 'View bill' }).click();
await pageA.waitForTimeout(800);
await pageA.locator(DOC_DLG).getByPlaceholder('Customer name').fill('Offline Check');
await pageA.locator(DOC_DLG).getByRole('button', { name: /Complete Bill/ }).first().click();
await pageA.getByText('Internet connection required').first().waitFor({ state: 'visible', timeout: 12000 });
ok(true, 'device A offline: the save FAILED with "Internet connection required."');
ok((await pageA.locator(DOC_DLG + ' [data-barcode]').count()) === 0,
  'device A offline: NO bill-success dialog, NO verification code — nothing was faked');

/* back online: the same bill saves exactly once */
await ctxA.setOffline(false);
await pageA.waitForTimeout(4500);
ok(!(await pageA.locator('[data-offline-banner]').isVisible().catch(() => false)),
  'device A back online: banner gone');
await pageA.locator(DOC_DLG).getByRole('button', { name: /Complete Bill/ }).first().click();
await pageA.locator(DOC_DLG).first().locator('[data-barcode]').first().waitFor({ state: 'visible', timeout: 15000 });
ok(true, 'device A back online: the same bill saved — server confirmed');
await pageA.keyboard.press('Escape');
await pageA.waitForTimeout(600);

/* ---- 11. barcode verification from device C (third device) ---- */
const ctxC = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pageC = await ctxC.newPage();
pageC.on('pageerror', (e) => console.log('  PAGEERR[pageC]', String(e).slice(0, 100)));
await pageC.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await pageC.goto(`${BASE}/verify`, { waitUntil: 'domcontentloaded' });
await pageC.waitForTimeout(900);
await pageC.locator('[data-verify-input]').fill(oldCode);
await pageC.keyboard.press('Enter');
await pageC.locator('[data-verify-result="valid"]').waitFor({ state: 'visible', timeout: 10000 });
ok(await pageC.getByText('Ramesh').isVisible(), 'device C: the MIGRATED old bill verifies VALID (registry)');
await pageC.locator('[data-verify-input]').fill('SLP-PP888888-PPPP');
await pageC.keyboard.press('Enter');
await pageC.locator('[data-verify-result="invalid"]').waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'device C: an unknown code answers INVALID (no result found — fixed)');
// the offline-retry bill must exist exactly ONCE — cancel it from B, then verify
await navTo(pageB, 'History', 'Invoice History');
await pageB.waitForTimeout(800);
const offBtn = pageB.locator('li button', { hasText: 'Offline Check' });
ok((await offBtn.count()) === 1, 'device B: exactly ONE "Offline Check" bill (no duplicates, no losses)');
await offBtn.first().click();
await pageB.waitForTimeout(700);
const offCode = (await pageB.locator(DOC_DLG).first().locator('[data-barcode]').first().getAttribute('data-barcode')) || '';
await pageB.keyboard.press('Escape');
await pageB.waitForTimeout(300);
await pageB.locator('li button', { hasText: 'Offline Check' }).first().hover().catch(() => {});
await pageB.locator('li button[aria-label^="Cancel bill"]').first().click().catch(() => {});
await pageB.waitForTimeout(1200);
await pageC.locator('[data-verify-input]').fill(offCode);
await pageC.keyboard.press('Enter');
await pageC.locator('[data-verify-result="cancelled"]').waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'device C: the CANCELLED bill answers CANCELLED on verification');

/* ---- 12. device C sees the SAME full history ---- */
await pageC.goto(BASE, { waitUntil: 'domcontentloaded' });
await pageC.waitForTimeout(2000);
await closePopup(pageC);
await pageC.locator('[data-owner-login-link]').click();
await pageC.getByLabel('Owner username').fill('Pradeep');
await pageC.getByLabel('Owner password').fill('2125');
await pageC.getByRole('button', { name: 'Owner sign in' }).click();
await pageC.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup(pageC);
await pageC.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await pageC.waitForTimeout(900);
const histC = await pageC.locator('li button', { hasText: 'SLP-INV-' }).count();
ok(histC >= 5, `device C: the SAME complete history (${histC} bills — migrated + all new ones)`);

/* ---- 13. admin-only: no staff UI anywhere ---- */
await pageC.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await pageC.waitForTimeout(800);
ok((await pageC.getByText('Staff accounts').count()) === 0, 'no Staff accounts section in Settings');
const bodyC = (await pageC.textContent('body')) || '';
ok(!bodyC.includes('Staff management') && !bodyC.includes('Add staff'), 'no staff management text anywhere');
await pageC.evaluate(() => { localStorage.removeItem('slp-auth-v1'); });
await pageC.reload({ waitUntil: 'domcontentloaded' });
await pageC.waitForTimeout(1800);
ok((await pageC.getByText('Staff login').count()) === 0, 'no Staff login on the lock screen');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

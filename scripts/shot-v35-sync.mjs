import { chromium } from 'playwright';
import jsQR from 'jsqr';

/**
 * v35 SYNC — ONE centralized database, every authorized device sees admin
 * changes (req 10 + acceptance tests 1-3, 8, 10):
 *   1. owner ADDS a product → it appears on the staff billing screen ≤ ~8 s
 *   2. owner EDITS the product price → the staff screen shows the new price
 *   3. owner changes the UPI ID → the STAFF device's payment QR (and its
 *      decoded URI) uses the NEW saved ID — config is server-authoritative
 *   4. with /api/verify/register route-aborted ("offline"), a staff bill
 *      still completes (never lost) and AUTO-REGISTERS once the route is
 *      restored — the printed barcode ends up verifiable (no silent loss,
 *      no duplicates)
 *   5. TWO staff members completing bills at the SAME MOMENT get DIFFERENT
 *      server-reserved bill numbers and DIFFERENT verification codes
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const mkPage = async () => {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await p.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
  return p;
};
const dlg = (pg) => pg.locator('[role="dialog"]');
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
const ownerToken = async () => {
  const raw = await owner.evaluate(() => localStorage.getItem('slp-auth-v1'));
  return raw ? JSON.parse(raw).token : '';
};

/**
 * decode a QR rendered in the page (svg[data-qr]) with jsQR IN NODE:
 * the page only rasterizes the REAL svg (Image → canvas → getImageData),
 * the pixel buffer comes back to Node and jsQR decodes it there — one
 * page, one small allocation (the two-page ZXing decode kept getting its
 * context destroyed under this sandbox's memory pressure).
 */
const decodeQr = async (pg, selector) => {
  await pg.locator(selector).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  const raster = await pg.evaluate((sel) => {
    const svg = document.querySelector(sel);
    if (!svg) return null;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const xml = new XMLSerializer().serializeToString(svg);
    return new Promise((resolve) => {
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
        for (let i = 0; i < bytes.length; i += 0x8000) {
          bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        resolve({ b64: btoa(bin), w: canvas.width, h: canvas.height });
      };
      img.onerror = () => resolve({ err: 'svg img load failed' });
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
    });
  }, selector);
  if (!raster || raster.err) return { err: raster?.err || 'qr svg not found' };
  const pixels = new Uint8ClampedArray(Buffer.from(raster.b64, 'base64'));
  const res = jsQR(pixels, raster.w, raster.h);
  return res ? { text: res.data } : { err: 'no qr decoded' };
};

const staffBill = async (pg, product, customer) => {
  await pg.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
  await pg.waitForTimeout(500);
  // the product NAME lives in a <p> inside the card div — the click goes to
  // the card's own size chip (+Standard for a size-less product)
  const card = pg.locator('main .rounded-xl.border', { hasText: product }).first();
  await card.waitFor({ state: 'visible', timeout: 10000 });
  await card.getByRole('button', { name: '+Standard' }).click();
  await pg.waitForTimeout(700);
  await pg.getByRole('button', { name: 'View bill' }).click();
  await pg.waitForTimeout(800);
  await dlg(pg).getByPlaceholder('Customer name').fill(customer);
  await dlg(pg).getByLabel('Payment mode').click();
  await pg.getByRole('option', { name: 'UPI', exact: true }).click();
  await pg.waitForTimeout(500);
  await dlg(pg).getByRole('button', { name: /Complete Bill/ }).first().click();
  await pg.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 15000 });
  await pg.waitForTimeout(700);
};

/* ---------- setup: owner + two staff ---------- */
const owner = await mkPage();
await owner.goto(BASE, { waitUntil: 'domcontentloaded' });
// NEVER await sw.ready (can hang without a timeout on a fresh origin) —
// a fixed settle lets the SW's one-time controllerchange reload finish
await owner.waitForTimeout(5200);
await owner.getByLabel('New MPIN').fill(MPIN);
await owner.getByLabel('Confirm MPIN').fill(MPIN);
await owner.getByRole('button', { name: 'Save MPIN' }).click();
await owner.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup(owner);

await owner.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await owner.waitForTimeout(700);
await owner.getByLabel('New staff username').fill('ravi');
await owner.getByLabel('New staff name').fill('Ravi Kumar');
await owner.getByLabel('New staff password').fill('ravipass1');
await owner.getByRole('button', { name: 'Add staff' }).click();
await owner.locator('[data-staff-row="ravi"]').waitFor({ state: 'visible', timeout: 8000 });
await owner.getByLabel('New staff username').fill('kiran');
await owner.getByLabel('New staff name').fill('Kiran Rao');
await owner.getByLabel('New staff password').fill('kiranpass1');
await owner.getByRole('button', { name: 'Add staff' }).click();
await owner.locator('[data-staff-row="kiran"]').waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'owner created two staff accounts (ravi, kiran)');

const staffLogin = async (pg, username, password) => {
  await pg.goto(BASE, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2600);
  await pg.getByRole('button', { name: 'Staff login' }).click();
  await pg.getByLabel('Staff username').fill(username);
  await pg.getByLabel('Staff password').fill(password);
  await pg.getByRole('button', { name: 'Staff sign in' }).click();
  await pg.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
  await closePopup(pg);
};
const ravi = await mkPage();
await staffLogin(ravi, 'ravi', 'ravipass1');
const kiran = await mkPage();
await staffLogin(kiran, 'kiran', 'kiranpass1');
ok(true, 'both staff devices signed in');

/* ---------- 1. owner ADDS a product → staff billing screen ---------- */
await owner.locator('[aria-label="Main navigation"] button', { hasText: 'Products' }).first().click();
await owner.waitForTimeout(600);
await owner.getByRole('button', { name: 'Add', exact: true }).first().click();
await owner.waitForTimeout(500);
await owner.getByPlaceholder('Product name').fill('Sync Cement Block');
await owner.getByPlaceholder('0').first().fill('425');
await owner.getByRole('button', { name: 'Add product' }).last().click();
await owner.waitForTimeout(800);
ok((await owner.locator('text=Sync Cement Block').count()) > 0, 'owner added "Sync Cement Block" at ₹425');

const newCard = ravi.locator('main .rounded-xl.border', { hasText: 'Sync Cement Block' }).first();
await newCard.waitFor({ state: 'visible', timeout: 20000 });
const newCardTxt = (await newCard.textContent()) || '';
ok(newCardTxt.includes('425'), `the NEW product is on the staff billing screen within seconds with the saved price (${newCardTxt.replace(/\s+/g, ' ').slice(0, 60)})`);

/* ---------- 2. owner EDITS the price → staff sees the update ---------- */
await owner.locator(`[aria-label="Edit Sync Cement Block"]`).click();
await owner.waitForTimeout(500);
await owner.getByPlaceholder('0').first().fill('450');
await owner.getByRole('button', { name: 'Save changes' }).click();
await owner.waitForTimeout(700);
let staffSees450 = false;
for (let i = 0; i < 14 && !staffSees450; i++) {
  await ravi.waitForTimeout(1000);
  const txt = (await ravi.locator('main .rounded-xl.border', { hasText: 'Sync Cement Block' }).first().textContent().catch(() => '')) || '';
  if (txt.includes('450')) { staffSees450 = true; break; }
}
ok(staffSees450, 'the staff billing screen shows the UPDATED price ₹450 (no device restart, no manual pull)');

/* ---------- 3. owner changes the UPI ID → the staff payment QR follows ---------- */
await owner.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await owner.waitForTimeout(700);
await owner.getByLabel('UPI ID').fill('slpsync@okicici');
await owner.getByRole('button', { name: 'Update details' }).click();
await owner.waitForTimeout(900);

// while the register route is DOWN (simulated dead uplink), the staff bill
// must still save — never silently lost
await ravi.route('**/api/verify/register', (route) => route.abort('failed'));
await staffBill(ravi, 'Sync Cement Block', 'Offline Ravi');
const payTxt = (await ravi.locator('[data-payment-screen]').textContent()) || '';
ok(payTxt.includes('slpsync@okicici'), 'the staff payment screen shows the NEW admin-saved UPI ID');
const payQr = await decodeQr(ravi, '[data-payment-qr] svg');
ok(typeof payQr.text === 'string' && payQr.text.includes('pa=slpsync%40okicici'),
  `the staff device QR DECODES with the new UPI ID (${payQr.text || payQr.err})`);
// the bill itself SAVES when the money is confirmed — its registration fails
// (route still down) and must join the retry queue
await ravi.locator('[data-payment-received]').click();
await dlg(ravi).first().waitFor({ state: 'visible', timeout: 15000 });
ok(true, 'staff SAVED a bill while /api/verify/register was unreachable');
await ravi.keyboard.press('Escape');
await ravi.waitForTimeout(500);

/* ---------- 4. the queued registration self-heals when the route returns ---------- */
await ravi.unroute('**/api/verify/register');
let regCode = '';
let healed = false;
for (let i = 0; i < 14 && !healed; i++) {
  await ravi.waitForTimeout(3000); // poll loop (4 s) + flush gate (15 s) need a few cycles
  const res = await fetch(`${BASE}/api/bills?q=Offline%20Ravi`, { headers: { Authorization: `Bearer ${await ownerToken()}` } });
  if (!res.ok) {
    if (i === 0) console.log('  DEBUG /api/bills status', res.status);
    continue;
  }
  const rows = (await res.json()).bills || [];
  if (i === 0) console.log('  DEBUG /api/bills rows:', rows.length, JSON.stringify(rows.slice(0, 3).map((b) => b.customerName)));
  const row = rows.find((b) => (b.customerName || '').toLowerCase() === 'offline ravi');
  if (row?.code) {
    regCode = row.code;
    const v = await (await fetch(`${BASE}/api/verify/${encodeURIComponent(regCode)}`)).json();
    healed = v?.status === 'valid' && v?.bill?.billNo === row.billNo;
  }
}
ok(healed, `the offline-queued bill AUTO-REGISTERED on reconnect — ${regCode || 'no code'} is now verifiable (no lost bills)`);
const healDup = await fetch(`${BASE}/api/verify/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await ownerToken()}` },
  body: JSON.stringify({ code: regCode, billNo: 'SLP-INV-DUPE-TEST', companyName: 'X', billDateISO: new Date().toISOString(), customerName: 'x', items: [], gstPercent: 0, gstAmount: 0, discount: 0, labourCharge: 0, autoCharge: 0, subtotal: 1, total: 1, paid: 0, balance: 1, paymentMode: 'Cash', paymentStatus: 'Due', createdBy: 'Owner' }),
});
ok(healDup.status === 409, 'the retry queue NEVER double-registered the same bill (409 on reuse)');

/* ---------- 5. two staff bills at the SAME moment — no collisions ---------- */
await staffBillPrep(ravi, 'Sync Cement Block', 'Concurrent Ravi');
await staffBillPrep(kiran, 'FT', 'Concurrent Kiran', '2FT');
await Promise.all([
  dlg(ravi).getByRole('button', { name: /Complete Bill/ }).first().click(),
  dlg(kiran).getByRole('button', { name: /Complete Bill/ }).first().click(),
]);
await ravi.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 15000 });
await kiran.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 15000 });
ok(true, 'both staff reached the payment screen in the same instant');
// the bills SAVE the moment the money is confirmed — both reserve/register
// server-side at effectively the same moment
await Promise.all([
  ravi.locator('[data-payment-received]').click(),
  kiran.locator('[data-payment-received]').click(),
]);
await dlg(ravi).first().waitFor({ state: 'visible', timeout: 15000 });
await dlg(kiran).first().waitFor({ state: 'visible', timeout: 15000 });
ok(true, 'both staff bills SAVED in the same instant (server-reserved numbers)');
await ravi.keyboard.press('Escape');
await kiran.keyboard.press('Escape');
await ravi.waitForTimeout(1500);
const billsRes = await fetch(`${BASE}/api/bills?limit=50`, { headers: { Authorization: `Bearer ${await ownerToken()}` } });
console.log('  DEBUG /api/bills(concurrent) status', billsRes.status);
const rows = (billsRes.ok ? (await billsRes.json()).bills : []) || [];
console.log('  DEBUG customers:', JSON.stringify(rows.slice(0, 6).map((b) => `${b.customerName}|${b.billNo}`)));
const bRavi = rows.find((b) => (b.customerName || '') === 'Concurrent Ravi');
const bKiran = rows.find((b) => (b.customerName || '') === 'Concurrent Kiran');
ok(!!bRavi && !!bKiran, 'both simultaneous bills are in the central database');
ok(!!bRavi && !!bKiran && bRavi.billNo !== bKiran.billNo,
  `the server reserved DIFFERENT bill numbers (${bRavi?.billNo || '?'} vs ${bKiran?.billNo || '?'})`);
ok(!!bRavi && !!bKiran && bRavi.code !== bKiran.code, 'each bill got its OWN verification code');
ok(!!bRavi && bRavi.items?.length > 0 && !!bKiran && bKiran.items?.length > 0,
  'neither bill overwrote the other — both kept their full item data');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

/** open the bill dialog up to (but NOT including) the Complete click */
async function staffBillPrep(pg, product, customer, size) {
  // a payment screen left open from a previous bill covers the nav
  await pg.getByRole('button', { name: 'Cancel payment' }).click().catch(() => {});
  await pg.waitForTimeout(400);
  await pg.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
  await pg.waitForTimeout(500);
  if (size) {
    // sized product — click its size chip in the catalog (e.g. "+2FT")
    await pg.locator(`main button:has-text("+${size}")`).first().click();
  } else {
    // size-less product — click the +Standard chip inside ITS card
    const card = pg.locator('main .rounded-xl.border', { hasText: product }).first();
    await card.waitFor({ state: 'visible', timeout: 10000 });
    await card.getByRole('button', { name: '+Standard' }).click();
  }
  await pg.waitForTimeout(700);
  await pg.getByRole('button', { name: 'View bill' }).click();
  await pg.waitForTimeout(800);
  await dlg(pg).getByPlaceholder('Customer name').fill(customer);
  await dlg(pg).getByLabel('Payment mode').click();
  await pg.getByRole('option', { name: 'UPI', exact: true }).click();
  await pg.waitForTimeout(500);
}

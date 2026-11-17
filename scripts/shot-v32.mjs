import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

/**
 * v32 regression — CODE 128 BARCODE-ONLY BILL AUTHENTICATION (no QR anywhere):
 *   1. every finalized bill carries a printed Code 128 barcode + unique
 *      verification ID (SLP-XXXXXXXX-XXXX) on the slip and invoice
 *   2. PUBLIC verification API + page: the ORIGINAL bill details come back
 *      from the database (never from the barcode), private phone never leaks
 *   3. INVALID BILL for unknown codes; CANCELLED BILL after the owner cancels
 *   4. duplicate/reuse prevention (one code per bill, one bill per code)
 *   5. scanner inputs: manual entry + keyboard-wedge (USB/BT) simulation
 *   6. GST: owner-managed rate shows on the bill and the verification
 *   7. STAFF accounts: owner creates them, staff logs in, sees ONLY
 *      billing/verify/own-history, and owner-only APIs reject staff tokens
 *   8. the printed barcode DECODES back to its code (ZXing round-trip)
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const db = new PrismaClient();

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const dlg = (pg = page) => pg.locator('[role="dialog"]');

/** ZXing round-trip: render the printed Code 128 SVG to a canvas and DECODE
 *  it back — proof the barcode is genuinely scannable */
const decodeBarcode = async (pg, code) => {
  await pg.evaluate(() => new Promise((res) => (window.ZXing ? res() : res()))).catch(() => undefined);
  if (!(await pg.evaluate(() => Boolean(window.ZXing)))) {
    await pg.addScriptTag({ path: '/home/z/my-project/node_modules/@zxing/library/umd/index.min.js' });
  }
  return pg.evaluate(async (code) => {
    const svg = document.querySelector(`[data-barcode="${code}"]`);
    if (!svg) return { err: 'svg not found' };
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('svg load failed')); img.src = src; });
    // rasterize the SVG at 4x with smoothing OFF — the bars are ~1.15px wide
    // at natural size (anti-aliased mush); vectors upscale crisply
    const pad = 60;
    const scale = 4;
    const canvas = document.createElement('canvas');
    canvas.width = (img.width + pad * 2) * scale;
    canvas.height = (img.height + pad * 2) * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, pad * scale, pad * scale, img.width * scale, img.height * scale);
    // count dark pixels — proves the bars actually rendered
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let dark = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] < 128) dark++;
    try {
      // quiet zone matters: decode the padded rasterized image
      const padded = new Image();
      padded.src = canvas.toDataURL('image/png');
      await new Promise((res, rej) => { padded.onload = res; padded.onerror = rej; });
      const Reader = ZXing.BrowserBarcodeReader || ZXing.BrowserMultiFormatReader;
      const reader = new Reader();
      const res = await reader.decodeFromImage(padded);
      if (!res) return { err: 'decoder returned no result', w: img.width, h: img.height, dark };
      return { text: res.getText(), w: img.width, h: img.height, dark };
    } catch (e) {
      return { err: String(e && e.message ? e.message : e).slice(0, 120), w: img.width, h: img.height, dark, xml: xml.slice(0, 260) };
    }
  }, code);
};

/** the device's session token — for owner-token API calls from node */
const bearer = async () => {
  const raw = await page.evaluate(() => localStorage.getItem('slp-auth-v1'));
  return raw ? JSON.parse(raw).token : '';
};

/** complete a CASH bill through the UI, return {no, code} from the slip */
const makeCashBill = async (name, phone) => {
  await page.locator('main button:has-text("FT")').first().click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'View bill' }).click();
  await page.waitForTimeout(700);
  await dlg().getByPlaceholder('Customer name').fill(name);
  await dlg().getByPlaceholder('Mobile / WhatsApp').fill(phone);
  await dlg().getByLabel('Payment mode').click();
  await page.getByRole('option', { name: 'Cash', exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Complete Bill/ }).first().click();
  await dlg().first().waitFor({ state: 'visible', timeout: 12000 });
  await page.waitForTimeout(900); // barcode renders
  const code = (await dlg().first().locator('[data-barcode]').first().getAttribute('data-barcode')) || '';
  const barcodeCount = await dlg().first().locator('[data-barcode]').count();
  const body = (await dlg().first().textContent()) || '';
  // the printed barcode must DECODE back to its verification ID (round-trip)
  const decoded = await decodeBarcode(page, code);
  // switch the modal to the formal INVOICE view — the barcode prints there too
  await dlg().first().getByRole('button', { name: 'Invoice' }).click();
  await page.waitForTimeout(900);
  const invoiceBarcode = await dlg().first().locator('[data-barcode]').count();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  return { code, barcodeCount, invoiceBarcode, decoded, body, name };
};

/** the install-app popup re-appears on fresh contexts — close it per page */
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

/* ---------------- setup: owner MPIN + GST 5% ---------------- */
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
const popup = page.locator('[aria-label="Install app notification"]');
try {
  await popup.waitFor({ state: 'visible', timeout: 8000 });
  await popup.getByRole('button', { name: 'Close install notification' }).click();
} catch {}
ok(true, 'owner app unlocked');

// owner manages GST: Settings → Billing & Slip → GST % = 5
await closePopup();
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('GST percent').fill('5');
await page.getByRole('button', { name: 'Update bill settings' }).click();
await page.waitForTimeout(400);
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(500);

/* ---------------- bill 1: barcode printed + registered ---------------- */
const b1 = await makeCashBill('Umesh Kumar', '9876543210');
ok(/^SLP-[23456789ABCDEFGHJKMNPQRTUVWXY]{8}-[23456789ABCDEFGHJKMNPQRTUVWXY]{4}$/.test(b1.code),
  `unique verification ID generated (${b1.code})`);
ok(b1.barcodeCount >= 1, `Code 128 barcode printed on the thermal slip (${b1.barcodeCount})`);
ok(b1.invoiceBarcode >= 1, `Code 128 barcode printed on the formal invoice too (${b1.invoiceBarcode})`);
console.log('  DEBUG decode:', JSON.stringify(b1.decoded));
ok(b1.decoded.text === b1.code, `printed Code 128 DECODES back to its verification ID (${b1.decoded.text || b1.decoded.err})`);
ok(b1.body.includes(b1.code), 'the verification number is printed as text too');

const res1 = await fetch(`${BASE}/api/verify/${encodeURIComponent(b1.code)}`);
const j1 = await res1.json();
ok(res1.status === 200 && j1.status === 'valid', 'public verification (no login) answers VALID');
ok(j1.bill?.customerName === 'Umesh Kumar', 'genuine bill shows the customer name');
ok(j1.bill?.billNo && /^SLP-INV-/.test(j1.bill.billNo), `bill number returned (${j1.bill?.billNo})`);
ok(Array.isArray(j1.bill?.items) && j1.bill.items.length > 0, 'product names + line items returned');
ok(Number(j1.bill?.gstPercent) === 5 && Number(j1.bill?.gstAmount) > 0,
  `GST details returned (${j1.bill?.gstPercent}% · ₹${j1.bill?.gstAmount})`);
ok(!JSON.stringify(j1).includes('9876543210'), 'private customer phone NEVER leaks on public verification');
ok(j1.history?.count >= 1, `verification history is kept (${j1.history?.count} lookups)`);

// GST math: total = taxable + gst exactly
const g = j1.bill;
const expect = Math.round((g.subtotal - g.discount + g.labourCharge + g.autoCharge) * 5) / 100;
ok(Math.abs(g.gstAmount - expect) < 0.01, `GST amount matches the rate (₹${g.gstAmount} = 5% of taxable)`);
ok(Math.abs(g.total - (g.subtotal - g.discount + g.labourCharge + g.autoCharge + g.gstAmount)) < 0.01,
  'total includes GST exactly');

/* ---------------- verify tab: genuine / invalid / wedge ---------------- */
await closePopup();
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Verify' }).first().click();
await page.waitForTimeout(700);
await page.locator('[data-verify-input]').fill(b1.code);
await page.getByRole('button', { name: 'Verify barcode' }).click();
await page.locator('[data-verify-result="valid"]').waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'manual entry verifies the genuine bill in the app');
const validTxt = (await page.locator('[data-verify-result="valid"]').textContent()) || '';
ok(validTxt.includes('Umesh Kumar') && validTxt.includes('GENUINE'), 'verification card shows the original bill');

// a copied barcode resolves to the ORIGINAL bill — re-enter, same result
await page.locator('[data-verify-input]').fill(b1.code.replace('-', ' ').toLowerCase());
await page.getByRole('button', { name: 'Verify barcode' }).click();
await page.waitForTimeout(1500);
ok((await page.locator('[data-verify-result="valid"]').count()) === 1, 'copied/mistyped barcode still resolves to the original bill');

// invalid code
await page.locator('[data-verify-input]').fill('SLP-AAAA2222-BBBB');
await page.getByRole('button', { name: 'Verify barcode' }).click();
await page.locator('[data-verify-result="invalid"]').waitFor({ state: 'visible', timeout: 10000 });
const invTxt = (await page.locator('[data-verify-result="invalid"]').textContent()) || '';
ok(invTxt.toUpperCase().includes('INVALID BILL'), 'unknown barcode → INVALID BILL – BARCODE NOT FOUND');

// keyboard-wedge scan: USB/BT scanners "type" fast and press Enter
await page.locator('[data-verify-input]').focus();
const wedge = b1.code;
for (const ch of wedge) {
  await page.keyboard.type(ch, { delay: 4 });
}
await page.keyboard.press('Enter');
await page.locator('[data-verify-result="valid"]').waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'keyboard-wedge scan (USB/BT) verifies the bill');
ok(((await page.locator('[data-verify-input]').inputValue()) || '') === '', 'scan box auto-clears for the next scan');

/* ---------------- bill 2: uniqueness + duplicate/reuse prevention ---------------- */
await closePopup();
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(500);
const b2 = await makeCashBill('Vijaya Lakshmi', '9123456780');
ok(b2.code && b2.code !== b1.code, `every bill gets its own code (${b2.code})`);

const token = await bearer();
const dupeCode = await fetch(`${BASE}/api/verify/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    code: b1.code, billNo: 'SLP-INV-99999', companyName: 'X', billDateISO: new Date().toISOString(),
    customerName: 'x', items: [], gstPercent: 0, gstAmount: 0, discount: 0, labourCharge: 0,
    autoCharge: 0, subtotal: 1, total: 1, paid: 0, balance: 1, paymentMode: 'Cash',
    paymentStatus: 'Due', createdBy: 'Owner',
  }),
});
ok(dupeCode.status === 409, 'barcode REUSE for another bill is rejected (409)');

const dupeBill = await fetch(`${BASE}/api/verify/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    code: 'SLP-PPPP4444-QQQQ', billNo: j1.bill.billNo, companyName: 'X', billDateISO: new Date().toISOString(),
    customerName: 'x', items: [], gstPercent: 0, gstAmount: 0, discount: 0, labourCharge: 0,
    autoCharge: 0, subtotal: 1, total: 1, paid: 0, balance: 1, paymentMode: 'Cash',
    paymentStatus: 'Due', createdBy: 'Owner',
  }),
});
ok(dupeBill.status === 409, 'a second code for the SAME bill is rejected (409)');

/* ---------------- owner cancels bill 2 → CANCELLED everywhere ---------------- */
await closePopup();
await page.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await page.waitForTimeout(700);
const row2 = page.locator('button', { hasText: 'Vijaya Lakshmi' }).last();
await row2.waitFor({ state: 'visible', timeout: 8000 });
// scope the cancel button to THIS bill's card (badge + balance sit beside the row button)
await row2.locator('xpath=..').getByRole('button', { name: 'Cancel bill' }).click();
await page.waitForTimeout(900);
const after = await (await fetch(`${BASE}/api/verify/${encodeURIComponent(b2.code)}`)).json();
ok(after.status === 'cancelled', 'cancelled bill answers CANCELLED on the public API');
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Verify' }).first().click();
await page.waitForTimeout(500);
await page.locator('[data-verify-input]').fill(b2.code);
await page.getByRole('button', { name: 'Verify barcode' }).click();
await page.locator('[data-verify-result="cancelled"]').waitFor({ state: 'visible', timeout: 10000 });
const cancTxt = (await page.locator('[data-verify-result="cancelled"]').textContent()) || '';
ok(cancTxt.toUpperCase().includes('CANCELLED BILL'), 'UI shows CANCELLED BILL – THIS INVOICE IS NO LONGER VALID');

/* ---------------- public /verify page (fresh visitor, no MPIN) ---------------- */
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/verify`, { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(1500);
ok((await p2.locator('[data-verify-input]').count()) === 1, 'public /verify page opens with NO MPIN gate');
await p2.locator('[data-verify-input]').fill(b1.code);
await p2.getByRole('button', { name: 'Verify barcode' }).click();
await p2.locator('[data-verify-result="valid"]').waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'a visitor scanning the barcode sees the original bill');

/* ---------------- staff accounts: create, login, gating, API enforcement ---------------- */
await closePopup();
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('New staff username').fill('ravi');
await page.getByLabel('New staff name').fill('Ravi Kumar');
await page.getByLabel('New staff password').fill('ravipass1');
await page.getByRole('button', { name: 'Add staff' }).click();
await page.locator('[data-staff-row="ravi"]').waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'owner created a staff account (ravi) in Settings');

// staff device — fresh browser, staff login link on the gate
const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p3 = await ctx3.newPage();
p3.on('pageerror', (e) => console.log('  P3-ERR:', String(e).slice(0, 200)));
p3.on('console', (m) => { if (m.type() === 'error') console.log('  P3-CONSOLE:', m.text().slice(0, 200)); });
// the install popup is irrelevant to THIS suite — mark it seen before load
await p3.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await p3.goto(BASE, { waitUntil: 'domcontentloaded' });
await p3.waitForTimeout(2600);
await p3.getByRole('button', { name: 'Staff login' }).click();
await p3.getByLabel('Staff username').fill('ravi');
await p3.getByLabel('Staff password').fill('ravipass1');
await p3.getByRole('button', { name: 'Staff sign in' }).click();
await p3.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup(p3); // fresh context — its own install popup sits over the nav
ok(true, 'staff signed in with username + password');

const navLabels = await p3.locator('[aria-label="Main navigation"] button').allTextContents();
ok(!navLabels.some((l) => /Products|Ledger|Labour|Settings/i.test(l)), 'staff nav has NO owner tabs');
ok(navLabels.some((l) => /Bill/i.test(l)) && navLabels.some((l) => /Verify/i.test(l)) && navLabels.some((l) => /History/i.test(l)),
  `staff nav = billing + verification + history (${navLabels.join(', ')})`);

// staff bills a customer — barcode registers under THEIR name
await p3.locator('main button:has-text("FT")').first().click();
await p3.waitForTimeout(600);
await p3.getByRole('button', { name: 'View bill' }).click();
await p3.waitForTimeout(700);
await dlg(p3).getByPlaceholder('Customer name').fill('Staff Customer');
await dlg(p3).getByLabel('Payment mode').click();
await p3.getByRole('option', { name: 'Cash', exact: true }).click();
await p3.waitForTimeout(400);
await p3.getByRole('button', { name: /Complete Bill/ }).first().click();
await dlg(p3).first().waitFor({ state: 'visible', timeout: 12000 });
await p3.waitForTimeout(900);
const code3 = (await dlg(p3).first().locator('[data-barcode]').first().getAttribute('data-barcode')) || '';
await p3.keyboard.press('Escape');
const j3 = await (await fetch(`${BASE}/api/verify/${encodeURIComponent(code3)}`)).json();
ok(j3.bill?.createdBy === 'Ravi Kumar', `staff bill registered under the staff name (${j3.bill?.createdBy})`);

// staff history: own bill only
await p3.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await p3.waitForTimeout(700);
const histTxt = (await p3.locator('main').textContent()) || '';
ok(histTxt.includes('Staff Customer'), 'staff history shows their own bill');
ok(!histTxt.includes('Umesh Kumar'), 'staff history does NOT show the owner\u2019s bills');

// backend enforcement: staff token rejected on owner-only APIs
const staffToken = await p3.evaluate(() => {
  const raw = localStorage.getItem('slp-auth-v1');
  return raw ? JSON.parse(raw).token : '';
});
const staffCancel = await fetch(`${BASE}/api/verify/cancel`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
  body: JSON.stringify({ billNo: j1.bill.billNo, cancelled: true }),
});
ok(staffCancel.status === 401 || staffCancel.status === 403, `staff token REJECTED on /api/verify/cancel (${staffCancel.status})`);
const staffStaff = await fetch(`${BASE}/api/staff`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
  body: JSON.stringify({ username: 'evil', password: '12345', name: 'evil' }),
});
ok(staffStaff.status === 401 || staffStaff.status === 403, `staff token REJECTED on staff management (${staffStaff.status})`);
const staffList = await fetch(`${BASE}/api/staff`, { headers: { Authorization: `Bearer ${staffToken}` } });
ok(staffList.status === 401 || staffList.status === 403, 'staff token REJECTED on staff listing');

// wrong staff password rejected
const badStaff = await fetch(`${BASE}/api/auth/staff/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ravi', password: 'wrongpass' }),
});
ok(badStaff.status === 401, 'wrong staff password is rejected');

/* ---------------- payment screen: no QR (UPI pays by ID/link) ---------------- */
await closePopup();
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await page.waitForTimeout(500);
await page.locator('main button:has-text("FT")').first().click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(700);
await dlg().getByLabel('Payment mode').click();
await page.getByRole('option', { name: 'UPI', exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: /Complete Bill/ }).first().click();
await page.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 10000 });
const ps = page.locator('[data-payment-screen]');
ok((await ps.locator('img').count()) === 0, 'UPI collection screen shows NO QR');
ok((await ps.locator('[data-payment-upi]').count()) === 1, 'UPI ID displayed to pay into');
await page.getByRole('button', { name: 'Cancel payment' }).click();
await page.locator('[data-payment-screen]').waitFor({ state: 'detached', timeout: 8000 });

/* ---------------- QR absence sweep ---------------- */
const appHtml = await page.content();
ok(!appHtml.includes('qrcode') && !appHtml.includes('QrCode'), 'no QR library artifacts in the app page');

console.log(`\n${pass} passed, ${fail} failed`);
await db.$disconnect();
await browser.close();
process.exit(fail ? 1 : 0);

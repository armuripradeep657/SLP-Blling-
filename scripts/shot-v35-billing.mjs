import { chromium } from 'playwright';

/**
 * v35 BILLING — staff price editing + item discounts, master prices safe:
 *   1. staff edits the unit selling price for THIS bill — "Saved price ₹X"
 *      shows the original next to the edited one
 *   2. per-item discounts in BOTH ₹ and % (toggle); totals recompute live
 *   3. the product master price NEVER changes — the next bill bills at the
 *      saved price again (and the server record keeps origPrice vs price)
 *   4. the server recomputes totals + GST from the lines (client never
 *      trusted) and stores the price edit + discount with bill no + staff
 *      + time (audit + registry)
 *   5. staff discount limits: over-limit input is BLOCKED in the UI (and
 *      the server flags anything that slips through)
 *   6. GST + final amounts exactly right (5% configured)
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
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
const bearerOf = async (pg = page) => {
  const raw = await pg.evaluate(() => localStorage.getItem('slp-auth-v1'));
  return raw ? JSON.parse(raw).token : '';
};

/* ---------- setup: owner (MPIN + GST 5% + limits) + staff ---------- */
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup();

// GST 5% + discount limits (server config — staff devices mirror it)
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.getByLabel('GST percent').fill('5');
await page.getByRole('button', { name: 'Update bill settings' }).click();
await page.waitForTimeout(400);
await page.locator('[data-discount-limits]').scrollIntoViewIfNeeded();
await page.getByLabel('Max discount percent').fill('10');
await page.getByLabel('Max discount amount').fill('50');
await page.getByRole('button', { name: 'Save discount limits' }).click();
await page.waitForTimeout(600);
ok(true, 'owner configured GST 5% + discount limits (max 10% / ₹50)');

// server config actually holds the limits (for the staff mirror)
await page.waitForTimeout(1500);
const cfg = await (await fetch(`${BASE}/api/config`, { headers: { Authorization: `Bearer ${await bearerOf(page)}` } })).json();
ok(cfg.exists === true && Number(cfg.config.discountMaxPercent) === 10 && Number(cfg.config.gstPercent) === 5,
  `server config holds the limits + GST (authoritative for every device) [${JSON.stringify(cfg.config)}]`);

// staff account
await page.getByLabel('New staff username').fill('ravi');
await page.getByLabel('New staff name').fill('Ravi Kumar');
await page.getByLabel('New staff password').fill('ravipass1');
await page.getByRole('button', { name: 'Add staff' }).click();
await page.locator('[data-staff-row="ravi"]').waitFor({ state: 'visible', timeout: 8000 });

/* ---------- staff device: price edit + percent discount ---------- */
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await p2.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await p2.goto(BASE, { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(2400);
await p2.getByRole('button', { name: 'Staff login' }).click();
await p2.getByLabel('Staff username').fill('ravi');
await p2.getByLabel('Staff password').fill('ravipass1');
await p2.getByRole('button', { name: 'Staff sign in' }).click();
await p2.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup(p2);
ok(true, 'staff signed in');

// wait for the config mirror to reach the staff device
for (let i = 0; i < 10; i++) {
  const raw = await p2.evaluate(() => localStorage.getItem('slp-cement-billing-v1'));
  if (raw && JSON.parse(raw).state?.srvConfig?.discountMaxPercent === 10) break;
  await p2.waitForTimeout(1500);
}
const staffCfgRaw = await p2.evaluate(() => JSON.parse(localStorage.getItem('slp-cement-billing-v1') || '{}').state?.srvConfig);
ok(Number(staffCfgRaw?.discountMaxPercent) === 10,
  'staff device mirrored the discount limits from the server (auto-sync)');

// staff note visible on the bill panel (mobile: inside the bill sheet)
await p2.locator('main button:has-text("FT")').first().click();
await p2.waitForTimeout(700);
await p2.getByRole('button', { name: 'View bill' }).click();
await p2.waitForTimeout(800);
ok((await p2.locator('text=Price changes and discounts apply to THIS bill only').count()) > 0,
  'staff sees the "this bill only" price-edit note');

// edit the unit price 200 → 300: saved price proof appears
const priceInput = dlg(p2).getByLabel('Unit price for Gagulu (Well Ring)');
await priceInput.fill('300');
await p2.waitForTimeout(400);
ok((await p2.locator('[data-orig-price]').count()) > 0 &&
  ((await p2.locator('[data-orig-price]').first().textContent()) || '').includes('200'),
  'the line shows the SAVED price ₹200 next to the edited ₹300');

// percent discount 10% → line net 270
await dlg(p2).getByLabel('Discount type for Gagulu (Well Ring): percent').click(); // ₹ → %
await dlg(p2).getByLabel('Discount for Gagulu (Well Ring)').fill('10');
await p2.waitForTimeout(400);
ok((await dlg(p2).locator('text=₹270.00').count()) > 0,
  '10% discount on ₹300 = ₹270 line total (percent kind works)');

// over-limit discount (20% > 10%) → blocked
await dlg(p2).getByLabel('Discount for Gagulu (Well Ring)').fill('20');
await p2.waitForTimeout(500);
ok((await p2.locator('[data-discount-limit-warning]').count()) > 0, 'over-limit discount shows the warning');
const completeBtn = dlg(p2).getByRole('button', { name: /Complete Bill/ }).first();
ok(await completeBtn.isDisabled().catch(() => false), 'Complete Bill is BLOCKED while over the limit');

// back within the limit → completes
await dlg(p2).getByLabel('Discount for Gagulu (Well Ring)').fill('10');
await p2.waitForTimeout(400);
await dlg(p2).getByPlaceholder('Customer name').fill('Suresh Babu');
await dlg(p2).getByRole('button', { name: /Complete Bill/ }).first().click();
await dlg(p2).first().waitFor({ state: 'visible', timeout: 15000 });
await p2.waitForTimeout(1200);
const code = (await dlg(p2).first().locator('[data-barcode]').first().getAttribute('data-barcode')) || '';
ok(/^SLP-/.test(code), `staff bill saved with a verification code (${code})`);
await p2.keyboard.press('Escape');

/* ---------- the server record: price edit + discount + math ---------- */
await p2.waitForTimeout(1500);
const ownerToken = await bearerOf(page);
const billsRes = await fetch(`${BASE}/api/bills`, { headers: { Authorization: `Bearer ${ownerToken}` } });
const billsJson = await billsRes.json();
const rec = billsJson.bills.find((b) => b.code === code);
ok(Boolean(rec), 'the staff bill is in the centralized bill registry');

const item = rec?.items?.[0];
ok(item && Number(item.origPrice) === 200 && Number(item.price) === 300,
  `registry holds origPrice 200 vs billed price 300 (${item?.origPrice} → ${item?.price})`);
ok(item?.discountType === 'percent' && Number(item.discountValue) === 10 && Number(item.discount) === 30,
  `registry holds the 10% discount = ₹30 (${item?.discountType} ${item?.discountValue} → ₹${item?.discount})`);
ok(rec?.createdBy === 'Ravi Kumar' && rec?.createdById === 'ravi',
  `registry records the staff member (${rec?.createdBy} / @${rec?.createdById})`);

// GST math recomputed SERVER-side: taxable 270, GST 5% = 13.50, total 283.50
ok(Math.abs(Number(rec.gstAmount) - 13.5) < 0.01 && Math.abs(Number(rec.total) - 283.5) < 0.01,
  `server recomputed GST exactly (₹${rec?.gstAmount} GST, ₹${rec?.total} total)`);

/* ---------- master price untouched: next bill bills at ₹200 ---------- */
await p2.waitForTimeout(800);
await p2.locator('main button:has-text("FT")').first().click();
await p2.waitForTimeout(700);
await p2.getByRole('button', { name: 'View bill' }).click();
await p2.waitForTimeout(800);
const price2 = await dlg(p2).getByLabel('Unit price for Gagulu (Well Ring)').inputValue();
ok(Number(price2) === 200, `the NEXT customer's bill uses the SAVED price again (₹${price2})`);
await p2.keyboard.press('Escape').catch(() => {});

/* ---------- audit log: price edit + discount recorded with bill + time ---------- */
const auditRes = await fetch(`${BASE}/api/audit`, { headers: { Authorization: `Bearer ${ownerToken}` } });
const auditJson = await auditRes.json();
const priceEdit = auditJson.events.find((e) => e.action === 'price_edit');
const discountEv = auditJson.events.find((e) => e.action === 'discount_applied');
const billEv = auditJson.events.find((e) => e.action === 'bill_created');
ok(Boolean(priceEdit) && priceEdit.details.origPrice === 200 && priceEdit.details.editedPrice === 300 &&
   priceEdit.target === rec.billNo && priceEdit.actor === 'Ravi Kumar',
  'audit: price edit recorded (item, ₹200→₹300, bill no, staff)');
ok(Boolean(discountEv) && discountEv.details.discountType === 'percent' && Number(discountEv.details.discountAmount) === 30,
  'audit: discount recorded (type, value, amount)');
ok(Boolean(billEv) && billEv.actorRole === 'staff', 'audit: the bill creation itself is recorded');

// the notification for the owner arrived (tested in depth in the dashboard suite)
const notifRes = await fetch(`${BASE}/api/notifications`, { headers: { Authorization: `Bearer ${ownerToken}` } });
const notifJson = await notifRes.json();
const n1 = notifJson.notifications.find((n) => n.billNo === rec.billNo);
ok(Boolean(n1) && n1.staffUsername === 'ravi' && Math.abs(Number(n1.total) - 283.5) < 0.01,
  'the owner notification for the staff bill already exists (server-side)');

// staff token cannot fake an owner audit entry
const staffToken = (await (await fetch(`${BASE}/api/auth/staff/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ravi', password: 'ravipass1' }),
})).json()).token;
const fakeAudit = await fetch(`${BASE}/api/audit`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
  body: JSON.stringify({ action: 'config_changed', target: 'x', details: {} }),
});
ok(fakeAudit.status === 403, 'staff CANNOT write ANY audit entry (owner-only POST)');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

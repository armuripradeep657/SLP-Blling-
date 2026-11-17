import { chromium } from 'playwright';

/**
 * v35 DASHBOARD — the Admin's live staff-bill monitor (req 11-13):
 *   1. TWO staff members bill at the same time — both bills register under
 *      their own names without overwriting each other
 *   2. each bill arrives in the Admin Dashboard as a notification
 *      ("New Bill Created": staff name, bill no, customer, total, discount,
 *      payment status, time) with an unread count
 *   3. opening a notification shows EVERY item + calculation (the real
 *      invoice document) and marks it read
 *   4. search by bill no / customer, filter by staff + date
 *   5. per-staff sales + discount totals; high-discount flags
 *   6. live feed rows; CSV export download
 *   7. re-registering the same bill NEVER duplicates its notification
 *   8. audit log rows visible in the dashboard
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };
/** poll-wait — the dashboard refreshes itself; assertions must wait for convergence */
const waitUntil = async (fn, ms = 12000, every = 800) => {
  const end = Date.now() + ms;
  let last = false;
  while (Date.now() < end) {
    last = await fn();
    if (last) return true;
    await new Promise((r) => setTimeout(r, every));
  }
  return last;
};

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

/* ---------- setup: owner + two staff ---------- */
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup();

await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
for (const [u, n] of [['ravi', 'Ravi Kumar'], ['sunita', 'Sunita Devi']]) {
  await page.getByLabel('New staff username').fill(u);
  await page.getByLabel('New staff name').fill(n);
  await page.getByLabel('New staff password').fill(`${u}pass1`);
  await page.getByRole('button', { name: 'Add staff' }).click();
  await page.locator(`[data-staff-row="${u}"]`).waitFor({ state: 'visible', timeout: 8000 });
}
ok(true, 'two staff accounts created (ravi + sunita)');

/** staff context: sign in, add 2× FT, complete a cash bill → {no, code, total} */
const staffBill = async (username, password, customer) => {
  const pg = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await pg.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
  await pg.goto(BASE, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2400);
  await pg.getByRole('button', { name: 'Staff login' }).click();
  await pg.getByLabel('Staff username').fill(username);
  await pg.getByLabel('Staff password').fill(password);
  await pg.getByRole('button', { name: 'Staff sign in' }).click();
  await pg.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
  await closePopup(pg);
  await pg.locator('main button:has-text("FT")').first().click();
  await pg.waitForTimeout(500);
  await pg.locator('main button:has-text("FT")').first().click();
  await pg.waitForTimeout(700);
  await pg.getByRole('button', { name: 'View bill' }).click();
  await pg.waitForTimeout(800);
  await dlg(pg).getByPlaceholder('Customer name').fill(customer);
  await dlg(pg).getByPlaceholder('Mobile / WhatsApp').fill('9990001111').catch(() => {});
  await dlg(pg).getByLabel('Payment mode').click();
  await pg.getByRole('option', { name: 'Cash', exact: true }).click();
  await pg.waitForTimeout(400);
  await dlg(pg).getByRole('button', { name: /Complete Bill/ }).first().click();
  await dlg(pg).first().waitFor({ state: 'visible', timeout: 15000 });
  await pg.waitForTimeout(1200);
  const code = (await dlg(pg).first().locator('[data-barcode]').first().getAttribute('data-barcode')) || '';
  const noMatch = ((await dlg(pg).first().textContent()) || '').match(/SLP-INV-\d+/);
  await pg.keyboard.press('Escape');
  await pg.close();
  return { code, no: noMatch ? noMatch[0] : '', customer };
};

/* ---------- both staff bill at the same time ---------- */
const [b1, b2] = await Promise.all([
  staffBill('ravi', 'ravipass1', 'Anil Garu'),
  staffBill('sunita', 'sunitapass1', 'Kavya Rao'),
]);
ok(/^SLP-/.test(b1.code) && /^SLP-/.test(b2.code) && b1.code !== b2.code,
  `two staff billed concurrently — two distinct verification codes (${b1.no} / ${b2.no})`);
ok(b1.no !== b2.no, `the two bills got DIFFERENT bill numbers (${b1.no} vs ${b2.no} — server-reserved)`);

await page.waitForTimeout(2500);
const ownerToken = await bearerOf(page);
const billsJson = await (await fetch(`${BASE}/api/bills`, { headers: { Authorization: `Bearer ${ownerToken}` } })).json();
const r1 = billsJson.bills.find((b) => b.code === b1.code);
const r2 = billsJson.bills.find((b) => b.code === b2.code);
ok(r1?.createdById === 'ravi' && r2?.createdById === 'sunita',
  'both bills registered under the right staff members (no overwrite)');
ok(Math.abs(r1.total - 400) < 0.01 && Math.abs(r2.total - 400) < 0.01,
  `server totals for 2× ₹200 FT bills (₹${r1?.total} / ₹${r2?.total})`);

/* ---------- the Admin Dashboard ---------- */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Dashboard' }).first().click();
await page.waitForTimeout(1600);
ok((await page.locator('[data-dashboard]').count()) > 0, 'the Admin Dashboard opens');

// notifications for BOTH bills + unread count
await page.locator(`[data-notification="${b1.no}"]`).waitFor({ state: 'visible', timeout: 12000 });
ok((await page.locator(`[data-notification="${b2.no}"]`).count()) > 0, 'a notification for EACH staff bill arrived');
const unreadOk = await waitUntil(async () => /2/.test((await page.locator('[data-unread-count]').textContent().catch(() => '')) || ''));
ok(unreadOk, 'unread count shows 2');
const n1Ok = await waitUntil(async () => {
  const s = (await page.locator(`[data-notification="${b1.no}"]`).textContent()) || '';
  return s.includes('New Bill Created') && s.includes('Ravi Kumar') && s.includes('@ravi') &&
         s.includes('Anil Garu') && s.includes('₹400.00');
});
ok(n1Ok, 'notification carries staff name + id + customer + total');

// open the notification → the REAL invoice document with every line
await page.locator(`[data-notification="${b1.no}"] button`).first().click();
await dlg(page).waitFor({ state: 'visible', timeout: 12000 });
await page.waitForTimeout(1200);
const docText = (await dlg(page).first().textContent()) || '';
ok(docText.includes(b1.no) && docText.includes('Gagulu') && docText.includes('400.00'),
  'the opened bill shows bill no + items + totals (the invoice document)');
ok((await dlg(page).first().locator('[data-barcode]').count()) > 0, 'the opened bill carries its verification barcode');
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

// unread dropped to 1 after opening
const unreadOk2 = await waitUntil(async () => /1/.test((await page.locator('[data-unread-count]').textContent().catch(() => '')) || ''));
ok(unreadOk2, 'opening a notification marks it read (unread now 1)');

// mark all read
await page.getByRole('button', { name: 'Mark all read' }).click();
await page.waitForTimeout(900);
ok((await page.locator('[data-unread-count]').count()) === 0, 'mark-all-read clears the unread badge');

/* ---------- live feed ---------- */
const liveOk = await waitUntil(async () => (await page.locator('[data-live-feed] tbody tr').count()) >= 2);
ok(liveOk, 'live staff activity shows both bills');

/* ---------- search + filter ---------- */
await page.getByLabel('Search bills').fill(b2.no);
await page.waitForTimeout(1500);
ok((await page.locator('[data-bill-row]').count()) === 1 &&
   ((await page.locator('[data-bill-row]').first().textContent()) || '').includes(b2.no),
  'search by bill number filters to that one bill');

await page.getByLabel('Search bills').fill('Kavya');
await page.waitForTimeout(1500);
ok((await page.locator('[data-bill-row]').count()) === 1, 'search by customer name works too');

await page.getByLabel('Search bills').fill('');
await page.waitForTimeout(1200);
await page.locator('[aria-label="Filter by staff"]').click();
const optOk = await waitUntil(async () => {
  const vis = await page.getByRole('option', { name: 'Ravi Kumar' }).isVisible().catch(() => false);
  if (!vis) {
    await page.locator('[aria-label="Filter by staff"]').click().catch(() => {});
    await page.waitForTimeout(500);
    return await page.getByRole('option', { name: 'Ravi Kumar' }).isVisible().catch(() => false);
  }
  return true;
});
ok(optOk, 'staff filter lists both staff members');
await page.getByRole('option', { name: 'Ravi Kumar' }).click();
await page.waitForTimeout(1500);
const raviRows = await page.locator('[data-bill-row]').count();
ok(raviRows === 1 && ((await page.locator('[data-bill-row]').first().textContent()) || '').includes('Ravi Kumar'),
  'staff filter shows only that staff member\'s bills');
await page.locator('[aria-label="Filter by staff"]').click();
await page.getByRole('option', { name: 'All staff' }).click();
await page.waitForTimeout(1200);

// per-staff totals
const totalsOk = await waitUntil(async () => {
  const s = (await page.locator('[data-staff-totals]').textContent()) || '';
  return s.includes('Ravi Kumar') && s.includes('Sunita Devi') && s.includes('₹400.00');
});
ok(totalsOk, 'per-staff sales + discount totals (both staff, ₹400 each)');

/* ---------- CSV export downloads ---------- */
const downloadPromise = page.waitForEvent('download', { timeout: 8000 });
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;
ok(/^slp-staff-billing-.*\.csv$/.test(download.suggestedFilename()),
  `CSV export downloads (${download.suggestedFilename()})`);

/* ---------- duplicate notification prevention ---------- */
const beforeCount = (await (await fetch(`${BASE}/api/notifications`, { headers: { Authorization: `Bearer ${ownerToken}` } })).json()).notifications.length;
// re-register bill 1 (dues-style status refresh) — same code, same bill no
const dupRes = await fetch(`${BASE}/api/verify/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
  body: JSON.stringify({
    code: r1.code, billNo: r1.billNo, companyName: 'SLP Cement Works',
    billDateISO: r1.billDateISO, customerName: r1.customerName,
    items: r1.items, gstPercent: 0, gstAmount: 0, discount: 0,
    labourCharge: 0, autoCharge: 0, subtotal: r1.subtotal, total: r1.total,
    paid: 400, balance: 0, paymentMode: 'Cash', paymentStatus: 'Paid',
    createdBy: 'Ravi Kumar',
  }),
});
ok(dupRes.status === 200, 're-registering the same bill (status refresh) succeeds');
await page.waitForTimeout(800);
const afterJson = await (await fetch(`${BASE}/api/notifications`, { headers: { Authorization: `Bearer ${ownerToken}` } })).json();
ok(afterJson.notifications.length === beforeCount, 'NO duplicate notification for the same bill');

/* ---------- audit log in the dashboard ---------- */
await page.locator('[data-audit-log]').scrollIntoViewIfNeeded();
const auditText = (await page.locator('[data-audit-log]').textContent()) || '';
ok(auditText.includes('bill_created') && auditText.includes('Ravi Kumar'),
  'the audit log is visible in the dashboard with staff events');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

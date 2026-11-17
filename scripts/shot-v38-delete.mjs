import { chromium } from 'playwright';

/**
 * v38 DELETE + NUMBERING — the owner's exact complaint:
 *   1. three bills saved → SLP-INV-1004/1005/1006, STRICTLY sequential
 *   2. the middle bill (1005) deleted in History → the row is GONE for good
 *      (server-side delete, survives two sync polls), the OTHER two remain
 *      (no data loss), its barcode verifies INVALID (registry cleaned)
 *   3. the next bill CONTINUES the sequence: SLP-INV-1007 — no reuse, no
 *      reset, no interruption
 *   4. an ABANDONED cart (item added, bill never saved) no longer punches a
 *      gap into the numbering
 *   5. OFFLINE delete is refused with "Internet connection required." and
 *      the row stays; back online the same delete succeeds
 *   6. a second device sees the same post-delete history (central truth)
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pageA = await ctxA.newPage();
pageA.on('pageerror', (e) => console.log('  PAGEERR[A]', String(e).slice(0, 100)));
const DOC_DLG = '[role="dialog"]:not([aria-label="Install app notification"])';

const closePopup = async (target = pageA) => {
  try {
    const pop = target.locator('[aria-label="Install app notification"]');
    for (let i = 0; i < 3; i++) {
      if (!(await pop.isVisible().catch(() => false))) return;
      await pop.getByRole('button', { name: 'Close install notification' }).click();
      await pop.waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
    }
  } catch {}
};

/** save one cash bill for `name`; returns the reserved SLP-INV- number */
const saveBill = async (name) => {
  await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
  await pageA.waitForTimeout(500);
  await pageA.evaluate(() => window.scrollTo(0, 0));
  await pageA.locator('main button[title="2FT — ₹200"]').first().click();
  await pageA.waitForTimeout(700);
  await pageA.getByRole('button', { name: 'View bill' }).click();
  await pageA.waitForTimeout(800);
  await pageA.locator(DOC_DLG).getByPlaceholder('Customer name').fill(name);
  await pageA.locator(DOC_DLG).getByLabel('Payment mode').click();
  await pageA.getByRole('option', { name: 'Cash', exact: true }).click();
  await pageA.waitForTimeout(300);
  await pageA.locator(DOC_DLG).getByRole('button', { name: /Complete Bill/ }).first().click();
  await pageA.locator(DOC_DLG).first().locator('[data-barcode]').first().waitFor({ state: 'visible', timeout: 15000 });
  await pageA.keyboard.press('Escape');
  await pageA.waitForTimeout(400);
  await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
  await pageA.waitForTimeout(700);
  await pageA.getByLabel('Search invoices').fill(name);
  await pageA.waitForTimeout(500);
  const rowTxt = (await pageA.locator('li button', { hasText: 'SLP-INV-' }).first().textContent().catch(() => '')) || '';
  await pageA.getByLabel('Search invoices').fill('');
  await pageA.waitForTimeout(300);
  return (rowTxt.match(/SLP-INV-\d+/) || [''])[0];
};

/** delete the bill row for `name` via the History UI (trash → confirm Delete) */
const deleteBill = async (name) => {
  await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
  await pageA.waitForTimeout(700);
  await pageA.getByLabel('Search invoices').fill(name);
  await pageA.waitForTimeout(500);
  const row = pageA.locator('li', { hasText: 'SLP-INV-' }).first();
  await row.locator('button[aria-label^="Delete "]').first().click();
  // Radix AlertDialogContent renders role="alertdialog" (not role="dialog")
  const confirm = pageA.locator('[role="alertdialog"]').getByRole('button', { name: 'Delete', exact: true });
  await confirm.waitFor({ state: 'visible', timeout: 6000 });
  await confirm.click();
  await pageA.waitForTimeout(900);
  await pageA.getByLabel('Search invoices').fill('');
  await pageA.waitForTimeout(300);
};

/* ---------- setup: owner unlock + seeded catalog ---------- */
await pageA.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await pageA.goto(BASE, { waitUntil: 'domcontentloaded' });
await pageA.waitForTimeout(3000);
await pageA.getByLabel('New MPIN').fill(MPIN);
await pageA.getByLabel('Confirm MPIN').fill(MPIN);
await pageA.getByRole('button', { name: 'Save MPIN' }).click();
await pageA.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup();
ok(true, 'owner app unlocked, defaults seeded');

/* ---- 1. three bills → strictly sequential numbers ---- */
const n1 = await saveBill('Delete Test One');
const n2 = await saveBill('Delete Test Two');
const n3 = await saveBill('Delete Test Three');
const num = (s) => Number((s.match(/(\d+)$/)?.[1] ?? 0));
ok(/^SLP-INV-\d+$/.test(n1) && /^SLP-INV-\d+$/.test(n2) && /^SLP-INV-\d+$/.test(n3),
  `three bills saved (${n1}, ${n2}, ${n3})`);
ok(num(n2) === num(n1) + 1 && num(n3) === num(n2) + 1, 'the numbers are STRICTLY sequential');
ok(num(n1) === 1001, `the sequence starts at the shop's own numbering (${n1} — DEFAULT nextInvoiceNo 1001)`);

/* ---- 2. delete the middle bill → really gone, others intact ---- */
const code2 = (await pageA.evaluate(async (no) => {
  const auth = JSON.parse(localStorage.getItem('slp-auth-v1') || '{}');
  const res = await fetch('/api/state?rev=-1', { headers: { Authorization: `Bearer ${auth.token}` } });
  const data = await res.json();
  const inv = (data.invoices || []).find((i) => i.no === no);
  return inv ? inv.verifyCode : '';
}), n2);
ok(code2.length > 5, `the middle bill's verification code captured (${code2})`);
await deleteBill('Delete Test Two');
await pageA.getByLabel('Search invoices').fill('Delete Test Two');
await pageA.waitForTimeout(600);
ok((await pageA.locator('li button', { hasText: 'SLP-INV-' }).count()) === 0, 'the deleted bill vanished from History');
await pageA.getByLabel('Search invoices').fill('');
await pageA.waitForTimeout(5000); // two sync polls — it must NOT come back
ok((await pageA.locator('li button', { hasText: 'Delete Test Two' }).count()) === 0,
  'the deleted bill STAYS deleted after two sync polls (no resurrection)');
const central = await pageA.evaluate(async () => {
  const auth = JSON.parse(localStorage.getItem('slp-auth-v1') || '{}');
  const res = await fetch('/api/state?rev=-1', { headers: { Authorization: `Bearer ${auth.token}` } });
  const data = await res.json();
  return { nos: (data.invoices || []).map((i) => i.no) };
});
ok(central.nos.length === 2 && !central.nos.includes(n2),
  `the CENTRAL database no longer holds the deleted bill (${central.nos.join(', ')})`);
const pubRes = await (await fetch(`${BASE}/api/verify/${encodeURIComponent(code2)}`)).json();
ok(pubRes.status === 'not_found', 'the deleted bill\'s barcode verifies INVALID (registry cleaned)');

/* ---- 3. the next bill CONTINUES the sequence ---- */
const n4 = await saveBill('Delete Test Four');
ok(num(n4) === num(n3) + 1, `the next bill CONTINUES the same sequence (${n4} after ${n3}) — no reuse of ${n2}`);

/* ---- 4. an abandoned cart leaves NO gap ---- */
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await pageA.waitForTimeout(500);
await pageA.evaluate(() => window.scrollTo(0, 0));
await pageA.locator('main button[title="2FT — ₹200"]').first().click(); // item added, bill NEVER saved
await pageA.waitForTimeout(600);
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click(); // abandon
await pageA.waitForTimeout(600);
const n5 = await saveBill('Gap Check');
ok(num(n5) === num(n4) + 1, `an abandoned cart leaves NO gap (${n5} right after ${n4})`);

/* ---- 5. OFFLINE delete: refused with a clear message, nothing faked ---- */
const n6 = await saveBill('Offline Delete Check');
await ctxA.setOffline(true);
await pageA.waitForTimeout(6000); // the poll flips the app offline
await deleteBill('Offline Delete Check');
let toastTxt = '';
try {
  // toasts render inside Radix's "Notifications (F8)" region
  const toastEl = pageA.locator('[aria-label="Notifications (F8)"] li[data-state="open"]').first();
  await toastEl.waitFor({ state: 'visible', timeout: 12000 });
  toastTxt = (await toastEl.textContent()) || '';
} catch { /* no toast — caught below */ }
ok(toastTxt.includes('Internet connection required'), `OFFLINE delete refused with the right message ("${toastTxt.trim().slice(0, 40)}")`);
await pageA.getByLabel('Search invoices').fill('Offline Delete Check');
await pageA.waitForTimeout(500);
ok((await pageA.locator('li button', { hasText: 'SLP-INV-' }).count()) === 1,
  'OFFLINE delete: the bill is still there — no fake deletion');
await pageA.getByLabel('Search invoices').fill('');
await ctxA.setOffline(false);
await pageA.waitForTimeout(4500);
await deleteBill('Offline Delete Check');
await pageA.getByLabel('Search invoices').fill('Offline Delete Check');
await pageA.waitForTimeout(600);
ok((await pageA.locator('li button', { hasText: 'SLP-INV-' }).count()) === 0,
  'back online: the SAME delete succeeds');

/* ---- 6. a second device sees the same post-delete history ---- */
const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pageB = await ctxB.newPage();
await pageB.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await pageB.goto(BASE, { waitUntil: 'domcontentloaded' });
await pageB.waitForTimeout(2400);
await closePopup(pageB);
await pageB.locator('[data-owner-login-link]').click();
await pageB.getByLabel('Owner username').fill('Pradeep');
await pageB.getByLabel('Owner password').fill('2125');
await pageB.getByRole('button', { name: 'Owner sign in' }).click();
await pageB.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup(pageB);
await pageB.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await pageB.waitForTimeout(900);
const histB = (await pageB.locator('li button', { hasText: 'SLP-INV-' }).textContent().catch(() => '')) || '';
const countB = await pageB.locator('li button', { hasText: 'SLP-INV-' }).count();
ok(!histB.includes('Delete Test Two') && !histB.includes('Offline Delete Check'),
  'device B: the deleted bills are gone there too (central truth)');
// remaining: Delete Test One, Three, Four, Gap Check (Two + Offline Delete Check deleted)
ok(countB === 4, `device B: exactly the 4 remaining bills (${countB})`);

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

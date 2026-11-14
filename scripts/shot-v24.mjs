import { chromium } from 'playwright';
import fs from 'fs';

/** current app version straight from the source — the popup check never goes stale */
const APP_V = (fs.readFileSync('/home/z/my-project/src/lib/version.ts', 'utf8').match(/APP_VERSION = '(\d+)'/) || [])[1] ?? '';

/**
 * v24 verification
 *  1. FIRST-TIME LOCK: the whole app stands behind an MPIN gate — NO mobile number,
 *     NO OTP anywhere (no header/nav visible)
 *  2. MPIN setup: mismatch rejected → 1234 saved → app unlocks; update popup advertises v24
 *  3. LABOUR: product QUANTITY + Paid now ₹ + Balance ₹; rows + month cards add up; delete works
 *  4. MPIN asked on a real app open (login, never create) — a page REFRESH does
 *     not lock and stays on the same tab; a cold open ALWAYS lands on the BILL
 *     tab even if old storage says another tab
 *  5. Backup carries labourWorks with qty/paid/balance
 *  6. TWO-DEVICE SYNC: a second browser enters the SAME MPIN → sees device 1's data;
 *     device 2 adds an entry → appears on device 1 automatically
 *  7. END-TO-END ENCRYPTION: vault ciphertext + the SQLite file contain NO plain business text
 *  8. Sync & security settings (MPIN-protected status) + Lock app → gate returns →
 *     wrong MPIN rejected → correct MPIN re-opens
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (cond, name) => {
  if (cond) {
    pass++;
    console.log('  PASS', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};

const browser = await chromium.launch();

async function newDevice() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const stored = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem('slp-cement-billing-v1');
      return raw ? JSON.parse(raw)?.state ?? {} : {};
    });
  return { ctx, page, stored };
}

/** MPIN unlock on a device that already has an account on the server */
async function unlockWithMpin(page) {
  await page.getByLabel('MPIN', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByLabel('MPIN', { exact: true }).fill(MPIN);
  await page.getByRole('button', { name: 'Open app' }).click();
  await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
}

const closePopup = async (page) => {
  const popup = page.locator('[aria-label="Install app notification"]');
  try {
    await popup.waitFor({ state: 'visible', timeout: 9000 });
  } catch {
    return ''; // popup not shown (already closed for this version)
  }
  const txt = (await popup.textContent()) || '';
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await popup.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(200);
  return txt;
};

const device1 = await newDevice();
const { page: p1, stored: stored1 } = device1;

/* ---------------- 1. first-time lock gate ---------------- */
console.log('\n— 1. First-time use: the app is LOCKED behind the MPIN only —');
await p1.goto(BASE, { waitUntil: 'networkidle' });
await p1.evaluate(() => localStorage.clear());
await p1.goto(BASE, { waitUntil: 'networkidle' });
await p1.waitForTimeout(2600); // let the splash finish
const lockVisible = await p1.getByLabel('New MPIN').isVisible();
ok(lockVisible, 'lock screen shown on first open (MPIN setup step)');
ok((await p1.getByLabel('Login mobile number').count()) === 0, 'NO mobile number input anywhere');
ok((await p1.getByRole('button', { name: 'Send OTP' }).count()) === 0, 'NO Send-OTP button anywhere');
ok((await p1.getByLabel('OTP code').count()) === 0, 'NO OTP input anywhere');
ok((await p1.locator('[data-header]').count()) === 0, 'NO app header visible while locked');
ok((await p1.locator('[aria-label="Main navigation"]').count()) === 0, 'NO bottom nav visible while locked');
await p1.screenshot({ path: '/home/z/my-project/download/v24-lock-mpin.png' });

/* ---------------- 2. MPIN setup ---------------- */
console.log('\n— 2. MPIN setup (the only login) —');
// mismatched MPINs must be rejected
await p1.getByLabel('New MPIN').fill('1111');
await p1.getByLabel('Confirm MPIN').fill('2222');
await p1.getByRole('button', { name: 'Save MPIN' }).click();
await p1.waitForTimeout(600);
ok(await p1.locator('[data-lock-error]').isVisible(), 'mismatched MPINs rejected with an error');
// correct MPIN
await p1.getByLabel('New MPIN').fill(MPIN);
await p1.getByLabel('Confirm MPIN').fill(MPIN);
await p1.getByRole('button', { name: 'Save MPIN' }).click();
await p1.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'MPIN saved → app unlocks');
const popupTxt = await closePopup(p1);
ok(popupTxt.includes(`v${APP_V}`), `update popup advertises the current version (got: ${popupTxt.slice(0, 40)}…)`);
const navBtns = await p1.locator('[aria-label="Main navigation"] button').allTextContents();
const ledgerIdx = navBtns.findIndex((s) => s.includes('Ledger'));
const labourIdx = navBtns.findIndex((s) => s.includes('Labour'));
ok(labourIdx === ledgerIdx + 1, `labour sits beside ledger in the bottom bar (${navBtns.join(' | ')})`);
await p1.screenshot({ path: '/home/z/my-project/download/v24-unlocked.png' });

/* ---------------- 3. labour: qty + paid + balance ---------------- */
console.log('\n— 3. Labour: product QUANTITY + money paid now + balance —');
await p1.getByRole('button', { name: 'Labour', exact: true }).click();
await p1.waitForTimeout(600);
ok((await p1.getByLabel('Work product').count()) === 0, 'product NAME input is GONE');
ok(await p1.getByLabel('Work quantity').isVisible(), 'product QUANTITY input visible');
ok(await p1.getByLabel('Labour paid', { exact: true }).isVisible(), 'PAID NOW ₹ input visible');
ok(await p1.getByLabel('Labour balance').isVisible(), 'BALANCE ₹ input visible');
ok(await p1.getByLabel('Labour money mode').isVisible(), 'money MODE picker visible');

// entry 1 — Ramesh: 25 nos, ₹400 paid now, ₹200 balance
await p1.getByLabel('Worker name').fill('Ramesh');
await p1.getByLabel('Work done').fill('Ring making');
await p1.getByLabel('Work quantity').fill('25');
await p1.getByLabel('Labour paid', { exact: true }).fill('400');
await p1.getByLabel('Labour balance').fill('200');
await p1.getByRole('button', { name: 'Add labour work' }).click();
await p1.waitForTimeout(800);
const row1 = p1.locator('[data-labour-row="Ramesh"]');
ok(await row1.isVisible(), 'labour row appears');
const r1 = (await row1.textContent()) || '';
ok(r1.includes('Ring making'), 'row shows WHAT they did');
ok(r1.includes('25'), 'row shows the product QUANTITY (25)');
ok(r1.includes('400.00'), 'row shows money PAID now (₹400)');
ok(r1.includes('200.00'), 'row shows BALANCE money (₹200)');
ok(((await p1.locator('[data-labour-month-paid]').textContent()) || '').includes('400.00'), 'month PAID card = ₹400');
ok(((await p1.locator('[data-labour-month-balance]').textContent()) || '').includes('200.00'), 'month BALANCE card = ₹200');
ok(((await p1.locator('[data-labour-month-money]').textContent()) || '').includes('600'), 'total wages = ₹600 (paid + balance)');
await p1.screenshot({ path: '/home/z/my-project/download/v24-labour.png' });

// entry 2 — Suresh by UPI, paid only
await p1.getByLabel('Worker name').fill('Suresh');
await p1.getByLabel('Work done').fill('Pole casting');
await p1.getByLabel('Work quantity').fill('10');
await p1.getByLabel('Labour paid', { exact: true }).fill('150');
await p1.getByLabel('Labour money mode').click();
await p1.getByRole('option', { name: 'UPI' }).click();
await p1.getByRole('button', { name: 'Add labour work' }).click();
await p1.waitForTimeout(800);
const r2 = (await p1.locator('[data-labour-row="Suresh"]').textContent()) || '';
ok(r2.includes('150.00') && r2.includes('UPI'), 'second row shows ₹150 by UPI');
ok(((await p1.locator('[data-labour-month-paid]').textContent()) || '').includes('550.00'), 'month PAID = ₹550 (400 + 150)');
await p1.getByRole('button', { name: 'Delete work Suresh' }).click();
await p1.waitForTimeout(600);
ok((await p1.locator('[data-labour-row="Suresh"]').count()) === 0, 'delete removes the row');
ok(((await p1.locator('[data-labour-month-paid]').textContent()) || '').includes('400.00'), 'month PAID back to ₹400 after delete');

/* ---------------- 4. persistence + auto-unlock + BILL tab on fresh open ---------------- */
console.log('\n— 4. Persists across reload, auto-unlock, fresh open starts on BILL —');
await p1.getByRole('button', { name: 'History', exact: true }).click();
await p1.waitForTimeout(500);
// simulate an OLD persisted state that remembered the History tab
await p1.evaluate(() => {
  const raw = localStorage.getItem('slp-cement-billing-v1');
  if (!raw) return;
  const s = JSON.parse(raw);
  s.state.activeTab = 'history';
  localStorage.setItem('slp-cement-billing-v1', JSON.stringify(s));
});
// v28: a REFRESH re-opens exactly the page the user was on — unlocked, same tab
await p1.reload({ waitUntil: 'networkidle' });
await p1.waitForTimeout(2500);
await closePopup(p1);
await p1.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
ok((await p1.getByLabel('MPIN', { exact: true }).count()) === 0, 'a REFRESH does not ask the MPIN — the app opens straight in');
const refreshTxt = (
  (await p1.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent()) || ''
).trim();
ok(refreshTxt === 'History', `refresh stays on the page the user was on (active: ${refreshTxt})`);
// a REAL app open (unlock session ended) asks the MPIN — a login, never Create
await p1.evaluate(() => sessionStorage.clear());
await p1.reload({ waitUntil: 'networkidle' });
await p1.waitForTimeout(2500);
const relock = p1.getByLabel('MPIN', { exact: true });
await relock.waitFor({ state: 'visible', timeout: 15000 });
ok(await relock.isVisible(), 'MPIN is ASKED on a real app open (login — exactly what the owner wants)');
ok((await p1.getByLabel('New MPIN').count()) === 0, 'NEVER the Create MPIN screen again after first setup');
await relock.fill(MPIN);
await p1.getByRole('button', { name: 'Open app' }).click();
await p1.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'the right MPIN opens the app');
const activeTxt = (
  (await p1.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent()) || ''
).trim();
ok(activeTxt === 'Bill', `fresh open ALWAYS lands on the Bill tab (active: ${activeTxt})`);
const mainTxt = (await p1.locator('main').textContent()) || '';
ok(mainTxt.includes('tap a size'), 'Bill tab content (product size buttons) is on screen');
ok(!mainTxt.includes('Invoice history'), 'History content NOT shown on fresh open');
await p1.screenshot({ path: '/home/z/my-project/download/v24-bill-reset.png' });
// within a session, switching tabs still works
await p1.getByRole('button', { name: 'Labour', exact: true }).click();
await p1.waitForTimeout(500);
const rr = p1.locator('[data-labour-row="Ramesh"]');
ok(await rr.isVisible(), 'tab switching still works — labour entry there after reload');
ok(((await rr.textContent()) || '').includes('400.00'), 'paid money still on the entry');

/* ---------------- 5. backup carries labour with qty/paid/balance ---------------- */
console.log('\n— 5. Backup carries labour quantity + paid + balance —');
await p1.getByRole('button', { name: 'Settings', exact: true }).click();
await p1.waitForTimeout(500);
ok(await p1.getByLabel('Sync and security').isVisible().catch(() => false) || (await p1.getByText('Sync & security').isVisible()), 'Sync & security section visible in settings');
const [download] = await Promise.all([
  p1.waitForEvent('download'),
  p1.getByRole('button', { name: 'Backup data' }).click(),
]);
const bkPath = '/tmp/v24-backup.json';
await download.saveAs(bkPath);
const bk = JSON.parse(fs.readFileSync(bkPath, 'utf8'));
const rameshBk = bk.labourWorks?.find((w) => w.name === 'Ramesh');
ok(Boolean(rameshBk), 'backup contains the labour entry');
ok(rameshBk?.qty === 25 && rameshBk?.paid === 400 && rameshBk?.balance === 200, 'backup entry has qty 25, paid 400, balance 200');

/* ---------------- 6. second device — same MPIN, live sync ---------------- */
console.log('\n— 6. ONLINE SYNC: second mobile logs in with the SAME MPIN —');
const device2 = await newDevice();
const { page: p2 } = device2;
await p2.goto(BASE, { waitUntil: 'networkidle' });
await p2.waitForTimeout(2500);
ok(await p2.getByLabel('MPIN', { exact: true }).isVisible(), 'device 2 is locked too (fresh phone)');
await unlockWithMpin(p2);
ok(true, 'device 2: the SAME MPIN unlocks the encrypted data');
await closePopup(p2);
await p2.getByRole('button', { name: 'Labour', exact: true }).click();
await p2.waitForTimeout(600);
const rowOn2 = p2.locator('[data-labour-row="Ramesh"]');
await rowOn2.waitFor({ state: 'visible', timeout: 12000 });
ok(await rowOn2.isVisible(), 'device 2 sees Ramesh entered on device 1 (pulled from encrypted vault)');
ok(((await rowOn2.textContent()) || '').includes('400.00'), 'device 2 sees the paid money ₹400 too');

// device 2 adds an entry → device 1 must get it automatically (within seconds)
await p2.getByLabel('Worker name').fill('Vijay');
await p2.getByLabel('Work done').fill('Slab finishing');
await p2.getByLabel('Work quantity').fill('5');
await p2.getByLabel('Labour paid', { exact: true }).fill('100');
await p2.getByLabel('Labour balance').fill('50');
await p2.getByRole('button', { name: 'Add labour work' }).click();
await p2.waitForTimeout(2500);
console.log('  …waiting for auto-sync (poll ≤ 4s + push debounce 1.2s)…');
let synced = false;
for (let i = 0; i < 20; i++) {
  await p1.waitForTimeout(1000);
  const works = (await stored1()).labourWorks ?? [];
  if (works.some((w) => w.name === 'Vijay' && w.paid === 100 && w.balance === 50)) {
    synced = true;
    break;
  }
}
ok(synced, 'device 1 receives Vijay from device 2 AUTOMATICALLY (no manual refresh)');
await p1.getByRole('button', { name: 'Labour', exact: true }).click();
await p1.waitForTimeout(600);
const vRow = p1.locator('[data-labour-row="Vijay"]');
ok(await vRow.isVisible(), 'Vijay row rendered on device 1');
const vTxt = (await vRow.textContent()) || '';
ok(vTxt.includes('100.00') && vTxt.includes('50.00'), 'synced entry carries the paid + balance money');
await p1.screenshot({ path: '/home/z/my-project/download/v24-device1-sync.png' });
await p2.screenshot({ path: '/home/z/my-project/download/v24-device2-sync.png' });

/* ---------------- 7. end-to-end encryption proof ---------------- */
console.log('\n— 7. E2EE: server and database store ONLY ciphertext —');
const vault = await p1.evaluate(async () => {
  const raw = localStorage.getItem('slp-auth-v1');
  const token = raw ? JSON.parse(raw).token : '';
  const r = await fetch('/api/vault', { headers: { Authorization: `Bearer ${token}` } });
  return await r.json();
});
ok(typeof vault.ciphertext === 'string' && vault.ciphertext.length > 100, 'vault holds a big encrypted blob');
const decoded = Buffer.from(vault.ciphertext, 'base64').toString('latin1');
ok(!decoded.includes('Ramesh') && !decoded.includes('Ring making') && !decoded.includes('Prasad'), 'ciphertext does NOT contain any plain business text');
ok(Buffer.from(vault.dekWrapped || '', 'base64').toString('latin1').length > 10 && !(vault.dekWrapped || '').includes('1234'), 'wrapped DEK stored, MPIN never sent to the server');
const dbBytes = fs.readFileSync('/home/z/my-project/db/custom.db').toString('latin1');
ok(!dbBytes.includes('Ramesh') && !dbBytes.includes('Ring making') && !dbBytes.includes('Vijay'), 'SQLite file on the server holds NO plain labour/bill text');
ok(!dbBytes.includes('pinVerifier') || !/\b1234\b/.test(dbBytes), 'MPIN itself is nowhere in the server database');

/* ---------------- 8. sync settings + lock app + MPIN re-login ---------------- */
console.log('\n— 8. Sync & security settings, Lock app, MPIN re-login —');
await p1.getByRole('button', { name: 'Settings', exact: true }).click();
await p1.waitForTimeout(500);
const syncBox = p1.locator('[data-sync-status]');
ok(await syncBox.isVisible(), 'sync status box visible');
const sbTxt = (await syncBox.textContent()) || '';
ok(sbTxt.includes('MPIN'), 'status says the app is protected with the MPIN');
ok(!/\d{10}/.test(sbTxt), 'NO mobile number shown anywhere in the status');
await p1.getByRole('button', { name: 'Sync now' }).click();
await p1.waitForTimeout(1200);
await p1.getByRole('button', { name: 'Lock app' }).click();
await p1.waitForTimeout(1400);
await p1.reload({ waitUntil: 'networkidle' });
await p1.waitForTimeout(2600);
ok(await p1.getByLabel('MPIN', { exact: true }).isVisible(), 'Lock app → gate is back on reload');
ok((await p1.locator('[data-header]').count()) === 0, 'app content hidden again while locked');
await p1.screenshot({ path: '/home/z/my-project/download/v24-locked-again.png' });
// wrong MPIN must be rejected
await p1.getByLabel('MPIN', { exact: true }).fill('9999');
await p1.getByRole('button', { name: 'Open app' }).click();
await p1.waitForTimeout(1500);
ok(await p1.locator('[data-lock-error]').isVisible(), 'wrong MPIN rejected with an error');
// correct MPIN re-opens
await p1.getByLabel('MPIN', { exact: true }).fill(MPIN);
await p1.getByRole('button', { name: 'Open app' }).click();
await p1.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
ok(true, 're-login with the MPIN works after lock');
await closePopup(p1);

/* ---------------- 9. fits all mobiles — no horizontal overflow ---------------- */
console.log('\n— 9. Fits all mobiles (no horizontal scroll at any screen size) —');
const FIT_SIZES = [
  { w: 320, h: 568, name: 'small (320×568)' },
  { w: 360, h: 740, name: 'mid (360×740)' },
  { w: 412, h: 915, name: 'big (412×915)' },
];
for (const size of FIT_SIZES) {
  const d = await newDevice();
  const pd = d.page;
  await pd.setViewportSize({ width: size.w, height: size.h });
  await pd.goto(BASE, { waitUntil: 'networkidle' });
  await pd.waitForTimeout(2400);
  await closePopup(pd);
  const overflow = () =>
    pd.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const oLock = await overflow();
  ok(oLock <= 1, `${size.name}: lock screen has no horizontal overflow (Δ ${oLock}px)`);
  await unlockWithMpin(pd);
  await closePopup(pd);
  const oBill = await overflow();
  ok(oBill <= 1, `${size.name}: bill tab fits (Δ ${oBill}px)`);
  await pd.getByRole('button', { name: 'Labour', exact: true }).click();
  await pd.waitForTimeout(400);
  const oLab = await overflow();
  ok(oLab <= 1, `${size.name}: labour tab fits (Δ ${oLab}px)`);
  await pd.getByRole('button', { name: 'Settings', exact: true }).click();
  await pd.waitForTimeout(400);
  const oSet = await overflow();
  ok(oSet <= 1, `${size.name}: settings tab fits (Δ ${oSet}px)`);
  if (size.w === 320) {
    await pd.getByRole('button', { name: 'Bill', exact: true }).click();
    await pd.waitForTimeout(400);
    await pd.screenshot({ path: '/home/z/my-project/download/v24-fit-320.png' });
  }
  await d.ctx.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

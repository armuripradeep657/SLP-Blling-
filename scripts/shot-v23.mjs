import { chromium } from 'playwright';
import fs from 'fs';

/**
 * v23 verification
 *  1. FIRST-TIME LOCK: the whole app stands behind a mobile + OTP gate (no header/nav visible)
 *  2. OTP login: demo OTP shown on screen, WRONG otp rejected, correct OTP → first-time
 *     security-PIN setup → app unlocks; update popup advertises v23
 *  3. LABOUR rework: product-name field GONE; product QUANTITY + Paid now ₹ + Balance ₹;
 *     rows show qty/paid/balance; month PAID / BALANCE / entries cards add up; delete works
 *  4. Persists across reload with auto-unlock (no OTP asked again)
 *  5. Backup carries labourWorks with qty/paid/balance
 *  6. TWO-DEVICE ONLINE SYNC: a second browser logs in with the SAME number → OTP → PIN →
 *     sees device 1's labour entry; device 2 adds an entry → appears on device 1 automatically
 *  7. END-TO-END ENCRYPTION: vault ciphertext + the SQLite file contain NO plain business text
 *  8. Sync & security settings (status, Sync now) + Lock app → gate returns → OTP+PIN re-login works
 */
const BASE = 'http://localhost:3000';
const PHONE = '9876543211';
const PIN = '1234';
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

/** Full OTP login on a fresh device; returns the demo OTP handling transparently */
async function login(page, { withPin }) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Login mobile number').waitFor({ state: 'visible', timeout: 15000 });
  await page.getByLabel('Login mobile number').fill(PHONE);
  await page.getByRole('button', { name: 'Send OTP' }).click();
  const demo = page.locator('[data-demo-otp]');
  await demo.waitFor({ state: 'visible', timeout: 15000 });
  const otpCode = (await demo.getAttribute('data-demo-otp')) || '';
  ok(/^\d{6}$/.test(otpCode), `OTP delivered in demo mode (${otpCode})`);
  await page.getByLabel('OTP code').fill(otpCode);
  await page.getByRole('button', { name: 'Verify OTP' }).click();
  if (withPin === 'setup') {
    await page.getByLabel('New security PIN').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByLabel('New security PIN').fill(PIN);
    await page.getByLabel('Confirm security PIN').fill(PIN);
    await page.getByRole('button', { name: 'Save PIN' }).click();
  } else {
    await page.getByLabel('Security PIN').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByLabel('Security PIN').fill(PIN);
    await page.getByRole('button', { name: 'Unlock data' }).click();
  }
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
console.log('\n— 1. First-time use: the app is LOCKED behind mobile + OTP —');
await p1.goto(BASE, { waitUntil: 'networkidle' });
await p1.evaluate(() => localStorage.clear());
await p1.goto(BASE, { waitUntil: 'networkidle' });
await p1.waitForTimeout(2600); // let the splash finish
const lockVisible = await p1.getByLabel('Login mobile number').isVisible();
ok(lockVisible, 'lock screen shown on first open');
ok((await p1.locator('[data-header]').count()) === 0, 'NO app header visible while locked');
ok((await p1.locator('[aria-label="Main navigation"]').count()) === 0, 'NO bottom nav visible while locked');
await p1.screenshot({ path: '/home/z/my-project/download/v23-lock-phone.png' });

/* ---------------- 2. OTP login + PIN setup ---------------- */
console.log('\n— 2. OTP login + first-time security PIN —');
await p1.getByLabel('Login mobile number').fill(PHONE);
await p1.getByRole('button', { name: 'Send OTP' }).click();
const demo1 = p1.locator('[data-demo-otp]');
await demo1.waitFor({ state: 'visible', timeout: 15000 });
const otp1 = (await demo1.getAttribute('data-demo-otp')) || '';
ok(/^\d{6}$/.test(otp1), `OTP delivered in demo mode on screen (${otp1})`);
await p1.screenshot({ path: '/home/z/my-project/download/v23-lock-otp.png' });

// wrong OTP must be rejected
await p1.getByLabel('OTP code').fill('000000');
await p1.getByRole('button', { name: 'Verify OTP' }).click();
await p1.waitForTimeout(800);
ok(await p1.locator('[data-lock-error]').isVisible(), 'wrong OTP rejected with an error');
// correct OTP
await p1.getByLabel('OTP code').fill(otp1);
await p1.getByRole('button', { name: 'Verify OTP' }).click();
await p1.getByLabel('New security PIN').waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'first-time user is asked to CREATE a security PIN');
await p1.getByLabel('New security PIN').fill(PIN);
await p1.getByLabel('Confirm security PIN').fill(PIN);
await p1.getByRole('button', { name: 'Save PIN' }).click();
await p1.locator('[data-header]').waitFor({ state: 'visible', timeout: 15000 });
ok(true, 'PIN saved → app unlocks');
const popupTxt = await closePopup(p1);
ok(popupTxt.includes('v23'), `update popup advertises v23 (got: ${popupTxt.slice(0, 40)}…)`, );
const navBtns = await p1.locator('[aria-label="Main navigation"] button').allTextContents();
const ledgerIdx = navBtns.findIndex((s) => s.includes('Ledger'));
const labourIdx = navBtns.findIndex((s) => s.includes('Labour'));
ok(labourIdx === ledgerIdx + 1, `labour sits beside ledger in the bottom bar (${navBtns.join(' | ')})`);
await p1.screenshot({ path: '/home/z/my-project/download/v23-unlocked.png' });

/* ---------------- 3. labour rework ---------------- */
console.log('\n— 3. Labour: product QUANTITY + money paid now + balance —');
await p1.getByRole('button', { name: 'Ledger', exact: true }).click();
await p1.waitForTimeout(500);
await p1.getByRole('tab', { name: 'Labour work' }).click();
await p1.waitForTimeout(600);
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
await p1.screenshot({ path: '/home/z/my-project/download/v23-labour.png' });

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

/* ---------------- 4. persistence + auto-unlock ---------------- */
console.log('\n— 4. Persists across reload, auto-unlock (no OTP again) —');
await p1.reload({ waitUntil: 'networkidle' });
await p1.waitForTimeout(2500);
await closePopup(p1);
ok(await p1.locator('[data-header]').isVisible(), 'device stays unlocked after reload — no OTP asked');
await p1.getByRole('button', { name: 'Ledger', exact: true }).click();
await p1.waitForTimeout(500);
await p1.getByRole('tab', { name: 'Labour work' }).click();
await p1.waitForTimeout(600);
await p1.waitForTimeout(500);
const rr = p1.locator('[data-labour-row="Ramesh"]');
ok(await rr.isVisible(), 'labour entry still there after reload');
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
const bkPath = '/tmp/v23-backup.json';
await download.saveAs(bkPath);
const bk = JSON.parse(fs.readFileSync(bkPath, 'utf8'));
const rameshBk = bk.labourWorks?.find((w) => w.name === 'Ramesh');
ok(Boolean(rameshBk), 'backup contains the labour entry');
ok(rameshBk?.qty === 25 && rameshBk?.paid === 400 && rameshBk?.balance === 200, 'backup entry has qty 25, paid 400, balance 200');

/* ---------------- 6. second device — same number, live sync ---------------- */
console.log('\n— 6. ONLINE SYNC: second mobile logs in and stays in sync —');
const device2 = await newDevice();
const { page: p2 } = device2;
await p2.goto(BASE, { waitUntil: 'networkidle' });
await p2.waitForTimeout(2500);
ok(await p2.getByLabel('Login mobile number').isVisible(), 'device 2 is locked too (fresh phone)');
await login(p2, { withPin: 'unlock' }); // same number, same PIN → unlock
ok(true, 'device 2: OTP + SAME PIN unlocks the encrypted data');
await closePopup(p2);
await p2.getByRole('button', { name: 'Ledger', exact: true }).click();
await p2.waitForTimeout(500);
await p2.getByRole('tab', { name: 'Labour work' }).click();
await p2.waitForTimeout(600);
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
await p1.getByRole('button', { name: 'Ledger', exact: true }).click();
await p1.waitForTimeout(500);
await p1.getByRole('tab', { name: 'Labour work' }).click();
await p1.waitForTimeout(600);
await p1.waitForTimeout(600);
const vRow = p1.locator('[data-labour-row="Vijay"]');
ok(await vRow.isVisible(), 'Vijay row rendered on device 1');
const vTxt = (await vRow.textContent()) || '';
ok(vTxt.includes('100.00') && vTxt.includes('50.00'), 'synced entry carries the paid + balance money');
await p1.screenshot({ path: '/home/z/my-project/download/v23-device1-sync.png' });
await p2.screenshot({ path: '/home/z/my-project/download/v23-device2-sync.png' });

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
ok(Buffer.from(vault.dekWrapped || '', 'base64').toString('latin1').length > 10 && !(vault.dekWrapped || '').includes('1234'), 'wrapped DEK stored, PIN never sent to the server');
const dbBytes = fs.readFileSync('/home/z/my-project/db/custom.db').toString('latin1');
ok(!dbBytes.includes('Ramesh') && !dbBytes.includes('Ring making') && !dbBytes.includes('Vijay'), 'SQLite file on the server holds NO plain labour/bill text');

/* ---------------- 8. sync settings + lock app + re-login ---------------- */
console.log('\n— 8. Sync & security settings, Lock app, re-login —');
await p1.getByRole('button', { name: 'Settings', exact: true }).click();
await p1.waitForTimeout(500);
const syncBox = p1.locator('[data-sync-status]');
ok(await syncBox.isVisible(), 'sync status box visible');
ok(((await syncBox.textContent()) || '').includes(PHONE), 'status shows the logged-in mobile number');
await p1.getByRole('button', { name: 'Sync now' }).click();
await p1.waitForTimeout(1200);
await p1.getByRole('button', { name: 'Lock app' }).click();
await p1.waitForTimeout(1400);
await p1.reload({ waitUntil: 'networkidle' });
await p1.waitForTimeout(2600);
ok(await p1.getByLabel('Login mobile number').isVisible(), 'Lock app → gate is back on reload');
ok((await p1.locator('[data-header]').count()) === 0, 'app content hidden again while locked');
await p1.screenshot({ path: '/home/z/my-project/download/v23-locked-again.png' });
// the server enforces a 20s resend cooldown per number — respect it once here
console.log('  …cooldown 21s (server OTP resend limit)…');
await p1.waitForTimeout(21000);
await login(p1, { withPin: 'unlock' });
ok(true, 're-login with OTP + PIN works after lock');
await closePopup(p1);

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

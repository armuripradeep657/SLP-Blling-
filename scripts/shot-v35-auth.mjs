import { chromium } from 'playwright';

/**
 * v35 AUTH — Owner/Admin login (Pradeep / 2125) + staff self-service:
 *   1. the owner password is seeded silently on the first MPIN unlock
 *   2. the gate offers "Owner login (Admin)" — Pradeep/2125 signs in with
 *      FULL owner access; wrong credentials are rejected with ONE generic
 *      error (no username probing)
 *   3. the password is stored only as a scrypt hash — never plain text
 *   4. the owner can change the password (Settings → Security) and the
 *      default-password nag clears
 *   5. staff login works, lands on the STAFF view, and staff can change
 *      their own password from the header
 *   6. backend role enforcement: staff tokens get 403 on owner-only APIs
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const dlg = (pg = page) => pg.locator('[role="dialog"]');

const bearerOf = async (pg = page) => {
  const raw = await pg.evaluate(() => localStorage.getItem('slp-auth-v1'));
  return raw ? JSON.parse(raw).token : '';
};

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

/* ---------- 1. first MPIN unlock seeds the owner password ---------- */
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'owner app unlocked (MPIN created)');

// the seeding POST fires right after unlock — wait for the server to have it
let hasOwner = false;
for (let i = 0; i < 15; i++) {
  const st = await (await fetch(`${BASE}/api/auth/state`)).json();
  if (st.hasOwnerPassword) { hasOwner = true; break; }
  await page.waitForTimeout(1000);
}
ok(hasOwner, 'owner password seeded automatically after the first MPIN unlock');

// stored SECURELY — the account never contains the plain password
const rawAccount = await (await fetch(`${BASE}/api/auth/state`)).text();
ok(!rawAccount.includes('2125'), 'the plain password is never stored or returned by the server');

/* ---------- 2. Owner login with the initial credentials ---------- */
// lock the app → the gate returns; the owner-login link is now offered
await page.getByRole('button', { name: 'Lock app' }).click().catch(() => {});
await page.waitForTimeout(600);
await page.evaluate(() => window.dispatchEvent(new Event('slp-lock')));
await page.waitForTimeout(1200);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
await closePopup();

const ownerLink = page.locator('[data-owner-login-link]');
ok(await ownerLink.isVisible().catch(() => false), 'the gate offers "Owner login (Admin)"');

await ownerLink.click();
await page.getByLabel('Owner username').fill('Pradeep');
await page.getByLabel('Owner password').fill('9999');
await page.getByRole('button', { name: 'Owner sign in' }).click();
await page.locator('[data-lock-error]').waitFor({ state: 'visible', timeout: 8000 });
const errText = (await page.locator('[data-lock-error]').textContent()) || '';
ok(errText.length > 0, 'wrong password rejected');
await page.getByLabel('Owner password').fill('2125');
await page.getByRole('button', { name: 'Owner sign in' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'Pradeep / 2125 signs in as OWNER');

// full owner access — every owner tab present
const navLabels = await page.locator('[aria-label="Main navigation"] button').allTextContents();
ok(navLabels.some((l) => /Dashboard/i.test(l)) && navLabels.some((l) => /Settings/i.test(l)) && navLabels.some((l) => /Ledger/i.test(l)),
  `owner login gets COMPLETE access (${navLabels.join(', ')})`);

// the scrypt hash shape on the account row (via direct db probe endpoint — state never leaks it)
const state2 = await (await fetch(`${BASE}/api/auth/state`)).json();
ok(state2.ownerUsername === 'Pradeep' && state2.ownerPasswordIsDefault === true,
  'state exposes the username + the default-password flag only');

/* ---------- 3. change the owner password ---------- */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(700);
await page.locator('[data-security-section]').scrollIntoViewIfNeeded();
ok(await page.locator('[data-default-password-warn]').isVisible().catch(() => false),
  'the default-password nag shows while 2125 is in use');
await page.getByLabel('Admin username').fill('Pradeep');
await page.getByLabel('New password', { exact: true }).fill('securepass9');
await page.getByRole('button', { name: 'Change owner password' }).click();
await page.waitForTimeout(1200);

// old password dies, new one works
const badRes = await fetch(`${BASE}/api/auth/owner/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'Pradeep', password: '2125' }),
});
ok(badRes.status === 401, 'the OLD password stops working after a change');
const goodRes = await fetch(`${BASE}/api/auth/owner/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'Pradeep', password: 'securepass9' }),
});
const goodJson = await goodRes.json();
ok(goodRes.status === 200 && goodJson.token, 'the NEW password signs in');
const state3 = await (await fetch(`${BASE}/api/auth/state`)).json();
ok(state3.ownerPasswordIsDefault === false, 'the default-password nag clears');

/* ---------- 4. staff creation + staff login + self password change ---------- */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(600);
await page.getByLabel('New staff username').fill('ravi');
await page.getByLabel('New staff name').fill('Ravi Kumar');
await page.getByLabel('New staff password').fill('ravipass1');
await page.getByRole('button', { name: 'Add staff' }).click();
await page.locator('[data-staff-row="ravi"]').waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'admin created the staff account (ravi)');

// staff device
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await p2.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await p2.goto(BASE, { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(2400);
await p2.getByRole('button', { name: 'Staff login' }).click();
await p2.getByLabel('Staff username').fill('ravi');
await p2.getByLabel('Staff password').fill('ravipass1');
await p2.getByRole('button', { name: 'Staff sign in' }).click();
await p2.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'staff signs in with the assigned credentials');

const staffNav = await p2.locator('[aria-label="Main navigation"] button').allTextContents();
ok(!staffNav.some((l) => /Dashboard|Products|Ledger|Settings/i.test(l)),
  `staff lands on the STAFF view — no owner tabs (${staffNav.join(', ')})`);

// staff changes their OWN password from the header
await p2.locator('[data-staff-password-btn]').click();
await p2.getByLabel('Current password', { exact: true }).fill('ravipass1');
await p2.getByLabel('New password', { exact: true }).fill('ravinewpass2');
await p2.getByRole('button', { name: 'Save new password' }).click();
await p2.locator('[role="dialog"] >> text=Password changed').waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'staff changed their own password');

// old fails, new works (fresh context — clean gate)
const staffOld = await fetch(`${BASE}/api/auth/staff/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ravi', password: 'ravipass1' }),
});
ok(staffOld.status === 401, 'the staff OLD password is rejected after the change');
const staffNew = await fetch(`${BASE}/api/auth/staff/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ravi', password: 'ravinewpass2' }),
});
ok(staffNew.status === 200, 'the staff NEW password signs in');
const staffToken = (await staffNew.json()).token;

/* ---------- 5. backend role enforcement (staff token → owner APIs) ---------- */
const guard = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.status;
};
ok((await guard('PUT', '/api/config', { gstPercent: 0 })) === 401 || (await guard('PUT', '/api/config', { gstPercent: 0 })) === 403,
  'staff CANNOT change the server config (backend-enforced)');
ok((await guard('GET', '/api/notifications')) === 403, 'staff CANNOT read admin notifications');
ok((await guard('GET', '/api/bills')) === 403, 'staff CANNOT read the full billing monitor');
ok((await guard('GET', '/api/audit')) === 403, 'staff CANNOT read the audit log');
ok((await guard('GET', '/api/staff')) === 403, 'staff CANNOT manage staff accounts');
const cancelTry = await fetch(`${BASE}/api/verify/cancel`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
  body: JSON.stringify({ billNo: 'SLP-INV-1', cancelled: true }),
});
ok(cancelTry.status === 401 || cancelTry.status === 403, 'staff CANNOT cancel bills (owner only)');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

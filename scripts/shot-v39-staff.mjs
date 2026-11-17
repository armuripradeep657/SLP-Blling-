import { chromium } from 'playwright';

/**
 * v39 STAFF LOGINS — the owner's spec:
 *   • one staff seeded: name M.D.Najir, userId MDN, password "mdn", MPIN 123456
 *   • staff sign in with password OR MPIN; first login asks to change the
 *     password (new, or continue with the current one)
 *   • staff see ONLY Bill + History + their own Profile (photo, name, staff id,
 *     password change); history is read-only (no delete / cancel / mark-paid)
 *   • staff bills land in the SAME central database and the owner sees them
 *   • forgot password: capture a photo → enter Staff ID → set a new password
 *     (audited — the owner sees the photo in Settings → Staff)
 *   • the owner manages staff in Settings → Staff (create / remove)
 *   • the owner's own MPIN + full app are untouched
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

/** 8×8 red PNG — the forgot-flow "identity photo" (file input fixture) */
const PNG_RED = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR4nGP8z8DwnwEPYMInOTAAAC8RA5mi1Z0uAAAAAElFTkSuQmCC',
  'base64'
);

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

/** save one cash bill for `name` (works for owner and staff — same UI) */
const saveBill = async (page, name) => {
  await page.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('main button[title="2FT — ₹200"]').first().click();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'View bill' }).click();
  await page.waitForTimeout(800);
  await page.locator(DOC_DLG).getByPlaceholder('Customer name').fill(name);
  await page.locator(DOC_DLG).getByLabel('Payment mode').click();
  await page.getByRole('option', { name: 'Cash', exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator(DOC_DLG).getByRole('button', { name: /Complete Bill/ }).first().click();
  await page.locator(DOC_DLG).first().locator('[data-barcode]').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
  await page.waitForTimeout(700);
  await page.getByLabel('Search invoices').fill(name);
  await page.waitForTimeout(500);
  const rowTxt = (await page.locator('li button', { hasText: 'SLP-INV-' }).first().textContent().catch(() => '')) || '';
  await page.getByLabel('Search invoices').fill('');
  await page.waitForTimeout(300);
  return (rowTxt.match(/SLP-INV-\d+/) || [''])[0];
};

const navLabels = async (page) =>
  page.locator('[aria-label="Main navigation"] button').evaluateAll((els) => els.map((e) => e.textContent?.trim()));

/* ============ A: owner device — unlock, seeded staff visible ============ */
await pageA.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await pageA.goto(BASE, { waitUntil: 'domcontentloaded' });
await pageA.waitForTimeout(3000);
await pageA.getByLabel('New MPIN').fill(MPIN);
await pageA.getByLabel('Confirm MPIN').fill(MPIN);
await pageA.getByRole('button', { name: 'Save MPIN' }).click();
await pageA.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup();
ok(true, 'owner app unlocked, defaults seeded');

// owner saves a bill so the counter is warm before the staff one
const ownerNo = await saveBill(pageA, 'Owner First Check');
ok(/^SLP-INV-\d+$/.test(ownerNo), `owner bill saved (${ownerNo})`);

// Settings → Staff shows the seeded M.D.Najir
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await pageA.waitForTimeout(1200);
await pageA.locator('[data-settings-staff]').scrollIntoViewIfNeeded();
await pageA.waitForTimeout(600);
const staffTxt = (await pageA.locator('[data-settings-staff]').textContent().catch(() => '')) || '';
ok(staffTxt.includes('M.D.Najir') && staffTxt.includes('MDN'), 'Settings → Staff lists the seeded M.D.Najir (MDN)');

/* ============ B: staff device — login, first-login prompt, restricted nav ============ */
const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pageB = await ctxB.newPage();
pageB.on('pageerror', (e) => console.log('  PAGEERR[B]', String(e).slice(0, 100)));
await pageB.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await pageB.goto(BASE, { waitUntil: 'domcontentloaded' });
await pageB.waitForTimeout(3200);
await closePopup(pageB);
await pageB.locator('[data-staff-login-link]').waitFor({ state: 'visible', timeout: 15000 });
await pageB.locator('[data-staff-login-link]').click();
await pageB.getByLabel('Staff ID').fill('mdn');
await pageB.getByLabel('Staff password or MPIN').fill('mdn');
await pageB.getByRole('button', { name: 'Staff sign in' }).click();
await pageB.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'staff signed in with password (mdn)');

// first login: the change-password prompt appears; staff keeps the current one
const keepBtn = pageB.getByRole('button', { name: 'Continue with current password' });
await keepBtn.waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'first-login password prompt appeared');
await keepBtn.click();
await pageB.waitForTimeout(600);

// restricted navigation: Bill / History / Profile ONLY
const labelsB = await navLabels(pageB);
ok(
  labelsB.length === 3 &&
    labelsB.some((l) => l?.includes('Bill')) &&
    labelsB.some((l) => l?.includes('History')) &&
    labelsB.some((l) => l?.includes('Profile')),
  `staff nav = Bill / History / Profile only (${labelsB.join(', ')})`
);

/* staff bills on the SAME central database + same number sequence */
const staffNo = await saveBill(pageB, 'Staff Bill Check');
const num = (s) => Number((s.match(/(\d+)$/)?.[1] ?? 0));
ok(/^SLP-INV-\d+$/.test(staffNo), `staff bill saved (${staffNo})`);
ok(num(staffNo) === num(ownerNo) + 1, `staff bill CONTINUES the owner's sequence (${staffNo} after ${ownerNo})`);

/* history is read-only for staff */
await pageB.getByLabel('Search invoices').fill('Staff Bill Check');
await pageB.waitForTimeout(600);
const delCount = await pageB.locator('li button[aria-label^="Delete "]').count();
const cancelCount = await pageB.locator('li button[aria-label^="Cancel bill"]').count();
ok(delCount === 0 && cancelCount === 0, `staff sees NO delete/cancel buttons (${delCount} del, ${cancelCount} cancel)`);
await pageB.getByLabel('Search invoices').fill('');

/* profile: photo, name, staff id + password change */
await pageB.locator('[aria-label="Main navigation"] button', { hasText: 'Profile' }).first().click();
await pageB.waitForTimeout(900);
const profTxt = (await pageB.textContent('body').catch(() => '')) || '';
ok(profTxt.includes('M.D.Najir') && profTxt.includes('MDN'), 'profile shows name + Staff ID');
await pageB.getByLabel('Current password').fill('mdn');
await pageB.getByLabel('New password', { exact: true }).fill('najir2');
await pageB.getByRole('button', { name: 'Save new password' }).click();
await pageB.waitForTimeout(900);
const toastB = (await pageB.locator('[aria-label="Notifications (F8)"] li[data-state="open"]').textContent().catch(() => '')) || '';
ok(toastB.includes('Password changed'), 'password changed on the profile page');

/* logout → old password refused → MPIN login works */
await pageB.getByRole('button', { name: 'Log out' }).click();
await pageB.waitForTimeout(900);
const backToLock = (await pageB.locator('[data-staff-login-link]').count()) > 0;
ok(backToLock, 'staff logout returns to the lock screen');
await pageB.locator('[data-staff-login-link]').click();
await pageB.getByLabel('Staff ID').fill('MDN');
await pageB.getByLabel('Staff password or MPIN').fill('mdn');
await pageB.getByRole('button', { name: 'Staff sign in' }).click();
await pageB.waitForTimeout(900);
const errTxt = ((await pageB.locator('[data-lock-error]').textContent().catch(() => '')) || '');
ok(errTxt.length > 0, `old password refused after change ("${errTxt.trim().slice(0, 34)}")`);
await pageB.getByLabel('Staff password or MPIN').fill('123456');
await pageB.getByRole('button', { name: 'Staff sign in' }).click();
await pageB.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'staff MPIN (123456) opens the app');
// no first-login nag after the change
await pageB.waitForTimeout(800);
const nagCount = await pageB.getByRole('button', { name: 'Continue with current password' }).count();
ok(nagCount === 0, 'no first-login nag after the password was handled');

/* forgot password: photo → staff id → new password */
await pageB.getByRole('button', { name: 'Log out' }).click();
await pageB.waitForTimeout(900);
await pageB.locator('[data-staff-login-link]').click();
await pageB.getByRole('button', { name: 'Staff forgot password' }).click();
await pageB.getByLabel('Capture identity photo').setInputFiles({ name: 'identity.png', mimeType: 'image/png', buffer: PNG_RED });
await pageB.getByLabel('Your Staff ID').waitFor({ state: 'visible', timeout: 6000 });
await pageB.getByLabel('Your Staff ID').fill('MDN');
await pageB.getByRole('button', { name: 'Continue to new password' }).click();
await pageB.getByLabel('New password', { exact: true }).fill('najir3');
await pageB.getByRole('button', { name: 'Set new password' }).click();
await pageB.locator('[data-forgot-ok]').waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'forgot flow: photo + ID + new password accepted');
await pageB.getByRole('button', { name: 'Back to staff login' }).click();
await pageB.waitForTimeout(500);
await pageB.getByLabel('Staff ID').fill('MDN');
await pageB.getByLabel('Staff password or MPIN').fill('najir3');
await pageB.getByRole('button', { name: 'Staff sign in' }).click();
await pageB.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'staff signs in with the reset password');

/* ============ A: owner sees the staff bill, reset photo, manages staff ============ */
await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'History' }).first().click();
await pageA.waitForTimeout(800);
await pageA.getByLabel('Search invoices').fill('Staff Bill Check');
await pageA.waitForTimeout(600);
const ownerSees = (await pageA.locator('li button', { hasText: 'SLP-INV-' }).count()) === 1;
ok(ownerSees, `owner sees the staff's bill in History (${staffNo} — central database)`);
await pageA.getByLabel('Search invoices').fill('');
await pageA.waitForTimeout(300);

await pageA.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await pageA.waitForTimeout(1200);
await pageA.locator('[data-settings-staff]').scrollIntoViewIfNeeded();
await pageA.waitForTimeout(800);
const resetRow = pageA.locator('[data-reset-row]', { hasText: 'M.D.Najir' }).first();
const resetVisible = await resetRow.isVisible().catch(() => false);
const resetHasPhoto = resetVisible ? (await resetRow.locator('img').count()) > 0 : false;
ok(resetVisible && resetHasPhoto, 'owner sees the forgot-password reset WITH the captured photo');

// owner creates a second staff login
await pageA.getByRole('button', { name: 'Add staff' }).click();
await pageA.getByLabel('Staff full name').fill('Ramesh Kumar');
await pageA.getByLabel('Staff ID', { exact: true }).fill('RMS');
await pageA.getByLabel('Starting password').fill('rams1');
await pageA.getByRole('button', { name: 'Create staff login' }).click();
await pageA.waitForTimeout(900);
const rmsRow = pageA.locator('[data-staff-row]', { hasText: 'Ramesh Kumar' });
ok((await rmsRow.count()) === 1, 'owner created staff Ramesh Kumar (RMS)');

// RMS can actually sign in
await pageB.getByRole('button', { name: 'Log out' }).click();
await pageB.waitForTimeout(900);
await pageB.locator('[data-staff-login-link]').click();
await pageB.getByLabel('Staff ID').fill('RMS');
await pageB.getByLabel('Staff password or MPIN').fill('rams1');
await pageB.getByRole('button', { name: 'Staff sign in' }).click();
await pageB.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'new staff (RMS/rams1) signs in — first-login prompt shown');
await pageB.getByRole('button', { name: 'Continue with current password' }).click();
await pageB.waitForTimeout(500);

// owner removes RMS → that login dies
await pageA.locator('[data-staff-row]', { hasText: 'Ramesh Kumar' }).locator('button[aria-label^="Remove"]').click();
await pageA.waitForTimeout(500);
await pageA.locator('[role="alertdialog"]').getByRole('button', { name: 'Remove staff login' }).click();
await pageA.waitForTimeout(900);
ok((await pageA.locator('[data-staff-row]', { hasText: 'Ramesh Kumar' }).count()) === 0, 'owner removed the staff login');

await pageB.waitForTimeout(1500);
// removing a staff login revokes their sessions server-side — device B is
// force-locked back to the lock screen; log out only if still open
if ((await pageB.locator('[data-staff-login-link]').count()) === 0) {
  await pageB.getByRole('button', { name: 'Log out' }).click();
  await pageB.waitForTimeout(900);
}
await pageB.locator('[data-staff-login-link]').click();
await pageB.getByLabel('Staff ID').fill('RMS');
await pageB.getByLabel('Staff password or MPIN').fill('rams1');
await pageB.getByRole('button', { name: 'Staff sign in' }).click();
await pageB.waitForTimeout(900);
const rmsErr = ((await pageB.locator('[data-lock-error]').textContent().catch(() => '')) || '');
ok(rmsErr.length > 0, 'removed staff (RMS) can no longer sign in');

/* ============ owner flow untouched: a FRESH tab asks the MPIN again and
   opens the FULL app (a same-tab refresh stays open by design) ============ */
const pageA2 = await ctxA.newPage();
await pageA2.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '37'));
await pageA2.goto(BASE, { waitUntil: 'domcontentloaded' });
await pageA2.waitForTimeout(2500);
const mpinVisible = (await pageA2.getByLabel('MPIN').count()) > 0;
ok(mpinVisible, 'owner fresh tab → MPIN gate (owner flow untouched)');
await pageA2.getByLabel('MPIN', { exact: true }).fill(MPIN);
await pageA2.getByRole('button', { name: 'Open app' }).click();
await pageA2.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
const labelsA = await navLabels(pageA2);
ok(labelsA.length >= 6 && labelsA.some((l) => l?.includes('Settings')), `owner still has ALL tabs (${labelsA.join(', ')})`);

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);

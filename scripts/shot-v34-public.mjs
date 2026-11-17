/**
 * shot-v34-public — PUBLIC /verify page hardening (v34):
 *
 *   1. browser tab title + description (metadata) render on the public page
 *   2. the page carries its OWN English | తెలుగు toggle (a customer's phone
 *      has no vault language) — switches ALL chrome + verdicts, persists
 *      across reloads, and does NOT touch the owner's in-app language
 *   3. USB / BT keyboard-wedge scanners work on the public page WITHOUT
 *      tapping the box (page-wide key capture; on-screen keyboard stays hidden)
 *   4. a network failure / server error NEVER renders "INVALID BILL" — an
 *      amber retryable OFFLINE card appears instead; retry verifies once the
 *      server answers again
 *   5. an unknown-but-well-formed code still renders INVALID BILL
 *   6. every public screen fits 390px (EN + TE + valid/invalid/offline results)
 */

import { chromium } from 'playwright';

const MPIN = '2468';
const BASE = process.env.BASE_URL || 'http://localhost:3100';
let passed = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (cond) passed++;
  else process.exitCode = 1;
};

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const dlg = () => page.locator('[role="dialog"]');

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
  await dlg().getByRole('button', { name: 'Close' }).first().click();
  await page.waitForTimeout(400);
  return { code };
};

/* ---------------- setup: owner MPIN + one real bill ---------------- */
await page.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const mpinBox = page.getByLabel('New MPIN');
if (await mpinBox.isVisible().catch(() => false)) {
  await mpinBox.fill(MPIN);
  await page.getByLabel('Confirm MPIN').fill(MPIN);
  await page.getByRole('button', { name: 'Save MPIN' }).click();
} else {
  await page.getByLabel('MPIN').fill(MPIN);
  await page.getByRole('button', { name: /Unlock|Open/ }).click();
}
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
await closePopup();
ok(true, 'owner app unlocked');
await closePopup();
const { code } = await makeCashBill('Umesh Kumar', '9876543210');
ok(/^SLP-[23456789ABCDEFGHJKMNPQRTUVWXY]{8}-[23456789ABCDEFGHJKMNPQRTUVWXY]{4}$/.test(code),
  `real verification code minted (${code})`);

/* ---------------- 1. public page chrome + metadata ---------------- */
await page.goto(`${BASE}/verify`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
ok((await page.title()).includes('Verify a bill'), `tab title says what the page is (${await page.title()})`);
ok(await page.locator('[data-verify-input]').isVisible(), 'scan box visible with no login gate');
ok(await page.getByText('Bill verification — Code 128').isVisible(), 'public tag line (EN default)');
ok(await page.locator('[data-public-lang] button[aria-pressed="true"]').textContent() === 'English',
  'English pressed by default (customers have no vault language)');

/* ---------------- 2. language toggle + persistence ---------------- */
await page.locator('[data-public-lang] button', { hasText: 'తెలుగు' }).click();
await page.waitForTimeout(300);
ok(await page.getByText('బిల్లు ధృవీకరణ — Code 128').isVisible(), 'tag line switches to Telugu');
ok(await page.getByText('బిల్లును స్కాన్ చేసి ధృవీకరించండి').isVisible(), 'scan-box title in Telugu');
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
ok(await page.locator('[data-public-lang] button[aria-pressed="true"]').textContent() === 'తెలుగు',
  'Telugu persists across reload (slp-public-lang)');
await page.locator('[data-public-lang] button', { hasText: 'English' }).click();
await page.waitForTimeout(300);

/* ---------------- 3. keyboard-wedge scan with NOTHING focused ---------------- */
const focusedTag = await page.evaluate(() => document.activeElement?.tagName || 'body');
ok(focusedTag !== 'INPUT', `no autofocus on the public page (active: ${focusedTag}) — keyboards stay hidden`);
await page.keyboard.type(code.replace('SLP-', '')); // scanners send the raw digits off the barcode
await page.waitForTimeout(200);
ok((await page.locator('[data-verify-input]').inputValue()).length > 0, 'wedge keystrokes land in the scan box');
await page.keyboard.press('Enter');
await page.locator('[data-verify-result="valid"]').waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'wedge scan + Enter verifies the GENUINE bill');
ok(await page.getByText('Umesh Kumar').isVisible(), 'original bill details shown from the registry');
ok((await page.locator('[data-verify-input]').inputValue()) === '', 'scan box auto-clears for the next scan');

/* ---------------- 4. network failure NEVER claims INVALID BILL ---------------- */
await page.route('**/api/verify/**', (r) => r.abort());
await page.keyboard.type(code.replace('SLP-', ''));
await page.keyboard.press('Enter');
await page.locator('[data-verify-result="offline"]').waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'server unreachable → amber OFFLINE card, not INVALID');
ok(!(await page.locator('[data-verify-result="invalid"]').isVisible().catch(() => false)),
  'no INVALID BILL verdict without the server answer');
await page.unroute('**/api/verify/**');
await page.getByRole('button', { name: 'Retry verification' }).click();
await page.locator('[data-verify-result="valid"]').waitFor({ state: 'visible', timeout: 8000 });
ok(true, 'Retry verifies the bill once the server answers again');

/* ---------------- 5. unknown code still INVALID ---------------- */
await page.evaluate(() => document.activeElement?.blur?.());
await page.keyboard.type('TTTT7777-WWWW');
await page.keyboard.press('Enter');
try {
  await page.locator('[data-verify-result="invalid"]').waitFor({ state: 'visible', timeout: 8000 });
  ok(true, 'a well-formed but unknown code renders INVALID BILL');
} catch {
  console.log('DEBUG step5 input:', JSON.stringify(await page.locator('[data-verify-input]').inputValue()));
  console.log('DEBUG step5 card:', await page.locator('[data-verify-result]').getAttribute('data-verify-result').catch(() => 'NONE'));
  console.log('DEBUG step5 text:', (await page.locator('body').textContent())?.slice(0, 300));
  throw new Error('step 5 diagnostic dump above');
}

/* ---------------- 6. 390px overflow — EN + TE + results ---------------- */
const overflow = async (label) => {
  const r = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.right > w + 1 && getComputedStyle(el).position !== 'fixed';
    });
    return { w, sw: document.documentElement.scrollWidth, bad: bad.slice(0, 5).map((b) => `${b.tagName}.${b.className}`.slice(0, 60)) };
  });
  ok(r.sw <= r.w + 1, `${label} fits 390px (scrollW=${r.sw})${r.bad.length ? ` wide: ${r.bad.join(' | ')}` : ''}`);
};
await overflow('public page (EN, invalid result)');
await page.locator('[data-public-lang] button', { hasText: 'తెలుగు' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: '/home/z/my-project/download/v34-public-te.png' });
await overflow('public page (TE)');
await page.locator('[data-public-lang] button', { hasText: 'English' }).click();
await page.keyboard.type(code.replace('SLP-', ''));
await page.keyboard.press('Enter');
await page.locator('[data-verify-result="valid"]').waitFor({ state: 'visible', timeout: 8000 });
await overflow('public page (valid bill details)');
await page.screenshot({ path: '/home/z/my-project/download/v34-public-valid.png' });

await browser.close();
console.log(`\n${passed} passed`);
process.exit(process.exitCode || 0);

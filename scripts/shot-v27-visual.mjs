import { chromium } from 'playwright';

/**
 * v27 VISUAL proof — screenshots of the new UI on an ISOLATED server (port
 * 3200, throwaway DB — the owner's live data is never touched):
 *   1. lock screen in LOGIN form (the MPIN asked on every open)
 *   2. labour register with a balance row
 *   3. the EDIT dialog: entered details editable + payment history + the
 *      "balance paid / extra money" payment form
 *   4. Telugu variant of the edit dialog
 */
const BASE = process.env.BASE_URL || 'http://localhost:3200';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

/* 1. create MPIN once */
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const newPin = page.getByLabel('New MPIN');
await newPin.waitFor({ state: 'visible', timeout: 15000 });
await newPin.fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click({ force: true });
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'MPIN created once');

/* 2. lock screen in LOGIN form */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
const loginPin = page.getByLabel('MPIN', { exact: true });
await loginPin.waitFor({ state: 'visible', timeout: 15000 });
ok((await page.getByLabel('New MPIN').count()) === 0, 'login form — never Create again');
await page.screenshot({ path: '/home/z/my-project/download/v27-lock-login.png' });
await loginPin.fill(MPIN);
await page.getByRole('button', { name: 'Open app' }).click({ force: true });
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });

/* 3. labour: add an entry with paid + balance */
await page.getByRole('button', { name: 'Labour', exact: true }).click({ force: true });
await page.waitForTimeout(600);
await page.getByLabel('Worker name').fill('Suresh');
await page.getByLabel('Work done').fill('slab carrying');
await page.getByLabel('Work quantity').fill('40');
await page.getByLabel('Labour paid').fill('500');
await page.getByLabel('Labour balance').fill('300');
await page.getByRole('button', { name: 'Add labour work' }).click({ force: true });
const row = page.locator('[data-labour-row="Suresh"]');
await row.waitFor({ state: 'visible', timeout: 8000 });
await page.screenshot({ path: '/home/z/my-project/download/v27-labour-rows.png' });

/* 4. edit dialog — details + payment form */
await page.getByRole('button', { name: 'Edit work Suresh' }).click({ force: true });
await page.getByLabel('Payment amount').waitFor({ state: 'visible', timeout: 8000 });
// record a balance payment inside the dialog for the screenshot
await page.getByLabel('Payment amount').fill('200');
await page.getByLabel('Payment note').fill('balance part');
await page.getByRole('button', { name: 'Add payment' }).click({ force: true });
await page.waitForTimeout(400);
await page.screenshot({ path: '/home/z/my-project/download/v27-labour-edit.png' });
const summary = (await page.locator('[data-edit-summary]').textContent()) || '';
ok(summary.includes('800.00') && summary.includes('700.00') && summary.includes('100.00'), 'summary shows wage ₹800 · paid so far ₹700 (500+200) · balance ₹100');
ok((await page.locator('[data-payment-row]').count()) === 2, 'two payments listed (initial + balance part)');

/* 5. Telugu variant */
await page.getByRole('button', { name: 'Save labour changes' }).click({ force: true });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Settings' }).click({ force: true });
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'తెలుగు' }).click({ force: true });
await page.waitForTimeout(700);
const navLabour = page.locator('[aria-label="Main navigation"] button', { hasText: 'లేబర్' });
await navLabour.click({ force: true });
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Edit work Suresh' }).click({ force: true });
await page.getByLabel('Payment amount').waitFor({ state: 'visible', timeout: 8000 });
await page.screenshot({ path: '/home/z/my-project/download/v27-labour-edit-te.png' });
const teTitle = ((await page.locator('[role="dialog"]').first().textContent().catch(() => '')) || '').slice(0, 60);
ok(teTitle.includes('కూలీ'), `Telugu edit dialog captured (contains: ${teTitle})`);

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

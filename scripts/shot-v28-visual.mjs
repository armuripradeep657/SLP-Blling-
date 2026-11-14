import { chromium } from 'playwright';

/**
 * v28 VISUAL proof — screenshots + measurements on an ISOLATED server (port
 * 3200, throwaway DB — the owner's live data is never touched):
 *   1. lock screen with the MPIN HIDDEN (dots) + the "Forgot MPIN?" link
 *   2. the eye toggle revealing the digits
 *   3. the Forgot-MPIN form
 *   4. product cards ALIGN: image blocks and first size chips sit at the same
 *      height across a row (the "space difference" fix) — measured in px
 *   5. labour edit dialog (EN + Telugu)
 *
 * Clicks go through el.click() (evaluate): the dev server's Fast-Refresh
 * toast portal can sit on top of buttons in dev mode and swallow Playwright
 * pointer clicks — the behavioral suites prove the real click paths anyway.
 */
const BASE = process.env.BASE_URL || 'http://localhost:3200';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };
const jsClick = async (loc) => { await loc.waitFor({ state: 'attached', timeout: 8000 }); await loc.evaluate((el) => el.click()); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

/* 1. create MPIN once */
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const newPin = page.getByRole('textbox', { name: 'New MPIN', exact: true });
await newPin.waitFor({ state: 'visible', timeout: 15000 });
await newPin.fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await jsClick(page.getByRole('button', { name: 'Save MPIN' }));
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'MPIN created once');

/* 2. idle-lock → masked lock screen with the forgot link */
await page.evaluate(() => localStorage.setItem('slp-idle-ms', '5000'));
await page.waitForTimeout(5500);
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
const lockPin = page.getByLabel('MPIN', { exact: true });
await lockPin.waitFor({ state: 'visible', timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: '/home/z/my-project/download/v28-lock-login.png' });
ok((await page.getByRole('button', { name: 'Forgot MPIN' }).count()) === 1, 'lock screen shows Forgot MPIN?');

/* 3. eye toggle reveals the digits */
await lockPin.fill('1234');
await jsClick(page.getByRole('button', { name: 'Show MPIN' }));
await page.waitForTimeout(200);
await page.screenshot({ path: '/home/z/my-project/download/v28-lock-show.png' });
const secShown = await lockPin.evaluate((el) => getComputedStyle(el).webkitTextSecurity);
ok(secShown !== 'disc' && (await lockPin.inputValue()) === '1234', 'eye toggle shows the digits');

/* 4. forgot-MPIN form */
await jsClick(page.getByRole('button', { name: 'Hide MPIN' }));
await jsClick(page.getByRole('button', { name: 'Forgot MPIN' }));
await page.getByRole('textbox', { name: 'New MPIN', exact: true }).waitFor({ state: 'visible', timeout: 8000 });
await page.waitForTimeout(300);
await page.screenshot({ path: '/home/z/my-project/download/v28-forgot.png' });
ok((await page.getByRole('button', { name: 'Set new MPIN' }).count()) === 1, 'forgot form captured');
await jsClick(page.getByRole('button', { name: 'Back to MPIN entry' }));
await lockPin.waitFor({ state: 'visible', timeout: 8000 });

/* 5. unlock — product cards alignment */
await lockPin.fill(MPIN);
await jsClick(page.getByRole('button', { name: 'Open app' }));
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
// dismiss the one-time update popup so it never photobombs the dialogs
const popup = page.locator('[aria-label="Install app notification"]');
try {
  await popup.waitFor({ state: 'visible', timeout: 6000 });
  await jsClick(popup.getByRole('button', { name: 'Close install notification' }));
  await popup.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
} catch {}
await page.waitForTimeout(1200);
await page.evaluate(() => localStorage.removeItem('slp-idle-ms'));

// measure the first row of product cards: image bottoms and first-chip tops
const align = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('main .grid > .flex.flex-col')].slice(0, 2);
  if (cards.length < 2) return null;
  const img = cards.map((c) => c.querySelector('img, [class*="aspect-"]')?.getBoundingClientRect().bottom ?? 0);
  const chip = cards.map((c) => {
    const sizeBtn = [...c.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('+'));
    return sizeBtn ? sizeBtn.getBoundingClientRect().top : 0;
  });
  return { img, chip };
});
if (align) {
  ok(Math.abs(align.img[0] - align.img[1]) < 2, `image blocks align (Δ ${Math.abs(align.img[0] - align.img[1]).toFixed(1)}px)`);
  ok(Math.abs(align.chip[0] - align.chip[1]) < 2, `first size chip aligns across the row (Δ ${Math.abs(align.chip[0] - align.chip[1]).toFixed(1)}px)`);
} else {
  ok(false, 'could not measure card alignment (no cards found)');
}
await page.screenshot({ path: '/home/z/my-project/download/v28-cards.png' });

/* 6. labour edit dialog (EN) */
await jsClick(page.getByRole('button', { name: 'Labour', exact: true }));
await page.waitForTimeout(800);
await page.getByLabel('Worker name').fill('Suresh');
await page.getByLabel('Work done').fill('slab carrying');
await page.getByLabel('Work quantity').fill('40');
await page.getByLabel('Labour paid').fill('500');
await page.getByLabel('Labour balance').fill('300');
await jsClick(page.getByRole('button', { name: 'Add labour work' }));
try {
  await page.locator('[data-labour-row="Suresh"]').waitFor({ state: 'visible', timeout: 8000 });
} catch {
  await page.screenshot({ path: '/home/z/my-project/download/v28-debug-labour.png' });
  console.log('  DEBUG body:', ((await page.locator('main').textContent()) || '').replace(/\s+/g, ' ').slice(0, 400));
  throw new Error('labour row did not appear — see v28-debug-labour.png');
}
await jsClick(page.getByRole('button', { name: 'Edit work Suresh' }));
await page.getByLabel('Payment amount').waitFor({ state: 'visible', timeout: 8000 });
await page.getByLabel('Payment amount').fill('200');
await jsClick(page.getByRole('button', { name: 'Add payment' }));
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/z/my-project/download/v28-labour-edit.png' });
const summary = (await page.locator('[data-edit-summary]').textContent()) || '';
ok(summary.includes('800.00') && summary.includes('700.00') && summary.includes('100.00'), 'summary shows wage ₹800 · paid ₹700 · balance ₹100');

/* 7. Telugu labour dialog */
await jsClick(page.getByRole('button', { name: 'Save labour changes' }));
await page.waitForTimeout(400);
await jsClick(page.getByRole('button', { name: 'Settings', exact: true }));
await page.waitForTimeout(600);
await jsClick(page.getByRole('button', { name: 'తెలుగు' }));
await page.waitForTimeout(700);
await jsClick(page.locator('[aria-label="Main navigation"] button', { hasText: 'లేబర్' }));
await page.waitForTimeout(900);
await jsClick(page.getByRole('button', { name: 'Edit work Suresh' }));
try {
  await page.getByLabel('Payment amount').waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/z/my-project/download/v28-labour-edit-te.png' });
  const teDialog = ((await page.locator('[role="dialog"]', { hasText: 'Suresh' }).first().textContent().catch(() => '')) || '');
  ok(teDialog.includes('కూలీ') || teDialog.includes('లేబర్'), 'Telugu edit dialog captured (Telugu headings present)');
} catch {
  await page.screenshot({ path: '/home/z/my-project/download/v28-labour-edit-te.png' });
  ok(false, 'Telugu edit dialog did not open — see screenshot');
}

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

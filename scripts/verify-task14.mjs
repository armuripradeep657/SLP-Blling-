/* Task 14 E2E: app-language switch, bills EN/TE/both, delivery + driver slip,
   ledger (day/all-days/dues/expenses), camera photo upload, one-time update popup */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const DL = '/home/z/my-project/download';
const shot = (n) => `${DL}/v15-${n}.png`;

let page;

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
  });

  // mobile sheet + hidden desktop aside both render BillPanel — filter to visible nodes
  const V = (loc) => loc.locator('visible=true');

  const A = (cond, msg) => {
    if (!cond) throw new Error('ASSERT FAIL: ' + msg);
    console.log('  ✓', msg);
  };

  /* ---------- Phase A: one-time update popup ---------- */
  console.log('Phase A — one-time update popup');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1900);
  const popup = page.locator('[aria-label="Install app notification"]');
  A(await popup.count() === 1, 'update popup appears once on fresh visit');
  const popupText = await popup.innerText();
  A(popupText.includes('App updated') && popupText.includes('అప్‌డేట్'), 'popup is the post-update install notice (EN+TE)');
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await page.waitForTimeout(300);
  A(await popup.count() === 0, 'popup closes');
  A((await page.evaluate(() => localStorage.getItem('slp-update-notice-seen'))) === '15', 'dismiss persisted with version 15');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1900);
  A(await popup.count() === 0, 'popup NEVER shows again after closing (reload)');

  /* ---------- Phase B: app language switch ---------- */
  console.log('Phase B — app language English ↔ తెలుగు');
  await page.locator('header [aria-label="Switch app language"]').click();
  await page.waitForTimeout(400);
  const navText = await page.locator('nav[aria-label="Main navigation"]').innerText();
  A(navText.includes('లెడ్జర్') && navText.includes('బిల్లు') && navText.includes('ఉత్పత్తులు'), 'bottom nav fully Telugu');
  A((await page.locator('header h1').innerText()).includes('శ్రీ లక్ష్మీ'), 'header company name switches to Telugu');
  await page.screenshot({ path: shot('te-home'), fullPage: false });
  // settings segmented control also works
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'సెట్టింగ్‌లు' }).click();
  await page.waitForTimeout(400);
  A(await page.getByText('యాప్ భాష · App language').count() === 1, 'Settings shows app-language section in Telugu');
  await page.screenshot({ path: shot('te-settings'), fullPage: false });
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.waitForTimeout(400);
  const navText2 = await page.locator('nav[aria-label="Main navigation"]').innerText();
  A(navText2.includes('Ledger') && navText2.includes('Bill'), 'switched back to English app UI');

  /* ---------- Phase C: UPI + English bill + BOTH slip ---------- */
  console.log('Phase C — bill, language Both, bilingual slip');
  await page.locator('header [aria-label="Switch app language"]').click(); // sanity: toggle present
  await page.waitForTimeout(300);
  await page.locator('header [aria-label="Switch app language"]').click(); // back to EN
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Settings' }).click();
  await page.waitForTimeout(400);
  await page.getByPlaceholder('name@upi').fill('prasad@upi');
  await page.getByPlaceholder('98765 43210').fill('9876543210');
  await page.waitForTimeout(200);

  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Bill' }).click();
  await page.waitForTimeout(400);
  await V(page.locator('button', { hasText: '+2FT' })).first().click();
  await page.waitForTimeout(300);
  await V(page.getByRole('button', { name: 'View bill' })).click();
  await page.waitForTimeout(500);
  // 3 language chips now
  const langChips = await page.locator('[aria-label="Bill language"] button').allInnerTexts();
  A(langChips.join('|').includes('రెండూ · Both'), 'bill language offers English | తెలుగు | రెండూ · Both');
  // customer
  await V(page.getByPlaceholder('Customer name')).fill('Ravi Kumar');
  await V(page.getByPlaceholder('Mobile / WhatsApp')).fill('9876501234');
  await page.waitForTimeout(300);
  await V(page.getByRole('button', { name: /Complete Bill/ })).click();
  await page.waitForTimeout(900);
  const dialog = page.locator('[role="dialog"]').first();
  A((await dialog.innerText()).includes('AMOUNT PAID'), 'Cash-full bill shows PAID stamp (English)');
  // flip to Both — bilingual labels
  await dialog.locator('button', { hasText: 'రెండూ · Both' }).click();
  await page.waitForTimeout(700);
  const slipText = await dialog.innerText();
  A(slipText.includes('ఉపమొత్తం / Subtotal') && slipText.includes('మొత్తం / TOTAL'), 'slip re-renders BILINGUAL (Both)');
  await page.screenshot({ path: shot('slip-both') });
  // image-only direct send — capture window.open
  await page.evaluate(() => {
    window.__opened = [];
    window.open = (u) => {
      window.__opened.push(String(u));
      return null;
    };
  });
  await dialog.getByRole('button', { name: /Send Direct to Ravi Kumar/ }).click();
  await page.waitForTimeout(2500);
  const opened = await page.evaluate(() => window.__opened || []);
  A(opened.length === 1 && /^https:\/\/wa\.me\/919876501234$/.test(opened[0]), `direct send opened wa.me image-only: ${opened[0] || 'NONE'}`);
  await page.locator('[data-slot="dialog-close"]').locator('visible=true').first().click();
  await page.waitForTimeout(500);

  /* ---------- Phase D: delivery + driver slip + due bill ---------- */
  console.log('Phase D — delivery tick, driver slip, dues');
  await V(page.locator('button', { hasText: '+2FT' })).first().click();
  await page.waitForTimeout(300);
  await V(page.getByRole('button', { name: 'View bill' })).click();
  await page.waitForTimeout(500);
  await V(page.getByPlaceholder('Customer name')).fill('Suresh Babu');
  await V(page.getByPlaceholder('Mobile / WhatsApp')).fill('9000012345');
  // payment mode Due → advance 100
  await V(page.getByLabel('Payment mode')).click();
  await page.getByRole('option', { name: 'Due' }).click();
  await page.waitForTimeout(300);
  await V(page.getByLabel('Amount paid', { exact: true })).fill('100');
  // Delivered tick → driver fields
  await V(page.getByRole('checkbox')).click();
  await page.waitForTimeout(300);
  A((await V(page.getByRole('checkbox')).getAttribute('aria-checked')) === 'true', 'Delivered tick checked');
  A(await V(page.getByPlaceholder('Driver name')).count() === 1, 'Delivered tick reveals driver/vehicle/address fields');
  await V(page.getByPlaceholder('Driver name')).fill('Ramesh');
  await V(page.getByPlaceholder('Vehicle number')).fill('AP07AB 1234');
  await V(page.getByPlaceholder('Delivery address')).fill('Gandhi Street, Kurnool');
  await page.screenshot({ path: shot('delivery-form') });
  await V(page.getByRole('button', { name: /Complete Bill/ })).click();
  await page.waitForTimeout(1000);
  const dlg2 = page.locator('[role="dialog"]').first();
  const t2 = await dlg2.innerText();
  A(t2.includes('PARTIAL') || t2.includes('పాక్షికం'), 'due bill shows partial status');
  A(await dlg2.locator('img[alt="UPI QR code"]').count() === 1, 'balance UPI QR renders');
  // Driver chip visible + driver slip has NO prices
  A(await dlg2.locator('button', { hasText: 'Driver' }).count() === 1, 'Driver view chip appears');
  await dlg2.locator('button', { hasText: 'Driver' }).first().click();
  await page.waitForTimeout(600);
  const driverText = await dlg2.locator('.shadow-md').innerText();
  A(driverText.includes('DELIVERY SLIP') || driverText.includes('డెలివరీ స్లిప్'), 'driver slip title renders');
  const dLow = driverText.toLowerCase().replace(/\s/g, '');
  A(dLow.includes('ramesh') && dLow.includes('ap07ab1234'), 'driver + vehicle on driver slip');
  A(driverText.includes('x 1'), 'quantities shown on driver slip');
  A(!driverText.includes('Rs.') && !driverText.includes('₹'), 'NO prices anywhere on driver slip');
  await page.screenshot({ path: shot('driver-slip') });
  await page.locator('[data-slot="dialog-close"]').locator('visible=true').first().click();
  await page.waitForTimeout(500);

  /* ---------- Phase E: history dual/triple views ---------- */
  console.log('Phase E — history invoice/slip/driver views');
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'History' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('history-driver') });
  const row2 = page.locator('li', { hasText: 'SLP-INV-1002' }).first();
  A(await row2.locator('button', { hasText: 'Invoice' }).count() === 1, 'history row has Invoice button');
  A(await row2.locator('button', { hasText: 'Slip' }).count() === 1, 'history row has Slip button');
  A(await row2.locator('button', { hasText: 'Driver' }).count() === 1, 'history row has Driver button (delivered invoice)');
  await row2.locator('button', { hasText: 'Driver' }).click();
  await page.waitForTimeout(700);
  A((await page.locator('[role="dialog"]').first().innerText()).includes('Driver Slip — SLP-INV-1002'), 'Driver opens driver slip from history');
  await page.locator('[data-slot="dialog-close"]').locator('visible=true').first().click();
  await page.waitForTimeout(400);

  /* ---------- Phase F: ledger ---------- */
  console.log('Phase F — ledger day / expenses / dues / all-days');
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Ledger' }).click();
  await page.waitForTimeout(600);
  const ledger = page.locator('main');
  const dayTxt = await ledger.innerText();
  A(dayTxt.includes('Income') && dayTxt.includes('Spent') && dayTxt.includes('Net'), 'day view shows Income / Spent / Net');
  A(dayTxt.includes('₹300.00'), `income today = 300 (200 + 100 advance): found`);
  await page.screenshot({ path: shot('ledger-day') });

  // Expenses tab: add Diesel 120
  await page.locator('button[role="tab"]', { hasText: 'Expenses' }).click();
  await page.waitForTimeout(400);
  await V(page.getByLabel('Expense category')).click();
  await page.getByRole('option', { name: 'Diesel' }).click();
  await V(page.getByLabel('Expense amount')).fill('120');
  await V(page.getByLabel('Expense note')).fill('Auto trip');
  await V(page.getByRole('button', { name: 'Add expense' })).click();
  await page.waitForTimeout(600);
  const expTxt = await ledger.innerText();
  A(expTxt.includes('Diesel') && expTxt.includes('120.00'), 'expense added & listed (Diesel 120)');
  await page.screenshot({ path: shot('ledger-expenses') });

  // Day view again: spent 120, net 180
  await page.locator('button[role="tab"]', { hasText: /^Day/ }).click();
  await page.waitForTimeout(500);
  const dayTxt2 = await ledger.innerText();
  A(dayTxt2.includes('₹120.00') && dayTxt2.includes('₹180.00'), 'day view Spent 120 / Net 180 after expense');

  // Dues: receive 100 on SLP-INV-1002
  await page.locator('button[role="tab"]', { hasText: /Dues/ }).click();
  await page.waitForTimeout(500);
  const duesTxt = await ledger.innerText();
  A(duesTxt.includes('₹100.00') && duesTxt.includes('Suresh Babu'), 'dues list shows balance 100 for Suresh Babu');
  await V(page.getByRole('button', { name: /Receive/ })).first().click();
  await page.waitForTimeout(400);
  A(await V(page.getByLabel('Amount received')).inputValue() === '100', 'receive amount prefilled with balance');
  await V(page.getByRole('button', { name: /Receive payment/ })).click();
  await page.waitForTimeout(700);
  A((await ledger.innerText()).includes('No dues pending'), 'dues cleared after receiving');
  await page.screenshot({ path: shot('ledger-dues') });

  // All days: month table row today
  await page.locator('button[role="tab"]', { hasText: /All days/ }).click();
  await page.waitForTimeout(500);
  const allTxt = await ledger.innerText();
  A(allTxt.includes('₹400.00') && allTxt.includes('₹280.00'), 'month list: income 400 / net 280 (income counts dues on receive day)');
  await page.screenshot({ path: shot('ledger-alldays') });

  /* ---------- Phase G: product photo upload + camera option ---------- */
  console.log('Phase G — photo upload + camera');
  await page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Products' }).click();
  await page.waitForTimeout(500);
  await page.locator('li', { hasText: 'Gagulu' }).first().getByLabel('Edit Gagulu (Well Ring)').click();
  await page.waitForTimeout(500);
  A(await page.getByRole('button', { name: /Upload photo/ }).count() === 1, 'Upload photo button present');
  A(await page.getByRole('button', { name: /Take with camera/ }).count() === 1, 'Camera option present');
  // tiny red PNG generated on the fly
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 8;
    const x = c.getContext('2d');
    x.fillStyle = '#e11d48'; x.fillRect(0, 0, 8, 8);
    return c.toDataURL('image/png');
  });
  fs.writeFileSync('/tmp/probe.png', Buffer.from(png.split(',')[1], 'base64'));
  await page.setInputFiles('input[type="file"]', '/tmp/probe.png');
  await page.waitForTimeout(800);
  const previewSrc = await page.locator('[role="dialog"] img[alt="Product"]').getAttribute('src');
  A(!!previewSrc && previewSrc.startsWith('data:image'), 'uploaded photo preview renders (resized dataURL)');
  await page.screenshot({ path: shot('camera-upload') });
  await V(page.getByRole('button', { name: 'Save changes' })).click();
  await page.waitForTimeout(600);

  /* ---------- errors ---------- */
  const realErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('net::') && !e.includes('X-Frame'));
  console.log('\nConsole/page errors:', realErrors.length);
  realErrors.slice(0, 12).forEach((e) => console.log('  !', e.slice(0, 220)));

  await page.screenshot({ path: shot('final'), fullPage: false });
  await browser.close();
  console.log('\nDONE — all screenshots in download/');
  if (realErrors.length) process.exitCode = 2;
};

run().catch(async (e) => {
  console.error('FAILED:', e.message);
  try {
    const p = page;
    console.log('URL:', p.url());
    console.log('header count:', await p.locator('header [aria-label="Switch app language"]').count());
    console.log('body:', (await p.locator('body').innerText().catch(() => '')).slice(0, 300).replace(/\n/g, '|'));
    await p.screenshot({ path: '/tmp/fail-state.png' }).catch(() => {});
  } catch {}
  process.exit(1);
});

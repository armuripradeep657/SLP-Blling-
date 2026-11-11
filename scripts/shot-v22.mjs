import { chromium } from 'playwright';
import fs from 'fs';

/**
 * v22 verification
 *  1. Opening splash — company logo zooms in, then fades away into the app
 *  2. Header company name follows the app language (Telugu name in Telugu mode)
 *  3. Tap header logo → full logo view dialog opens & closes
 *  4. Settings → Appearance: background theme, header colour, custom watermark
 *     photo from device (upload + reset) — applied instantly
 *  5. Labour — its own bottom-nav tab beside Ledger: worker + date + work done +
 *     product + MONEY given that day (Cash/UPI) + month money total, delete
 *  6. Appearance & labour entry (with money) persist across reload
 *  7. Backup carries labour (with money) + appearance; restore brings them back
 */
const BASE = 'http://localhost:3000';
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
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const stored = () =>
  page.evaluate(() => {
    const raw = localStorage.getItem('slp-cement-billing-v1');
    return raw ? JSON.parse(raw)?.state ?? {} : {};
  });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: 'domcontentloaded' });

console.log('\n— 1. Opening splash: logo zoom —');
const splash = page.locator('[data-splash="logo"]');
await splash.waitFor({ state: 'visible', timeout: 10000 });
ok(true, 'splash overlay shown when the app opens');
ok((await splash.locator('img').count()) === 1, 'splash shows the company logo');
const splashAnim = await splash.locator('img').evaluate((el) => getComputedStyle(el).animationName);
ok(splashAnim.includes('slp-splash-zoom'), `logo has zoom animation (${splashAnim})`);
await page.screenshot({ path: '/home/z/my-project/download/v22-splash.png' });
await splash.waitFor({ state: 'detached', timeout: 8000 });
ok(true, 'splash fades away into the app');
await page.waitForTimeout(400);

// close one-time install/update popup (appears because storage was cleared)
const popup = page.locator('[aria-label="Install app notification"]');
if (await popup.count()) {
  const ptxt = (await popup.first().textContent()) || '';
  ok(ptxt.includes('v22'), 'update popup advertises v22');
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await page.waitForTimeout(300);
}

console.log('\n— 2. Header company name follows app language —');
const headerName = page.locator('[data-header] h1');
const enName = (await headerName.textContent()).trim();
ok(enName.length > 0, `header shows a company name in English mode (${enName})`);
await page.getByRole('button', { name: 'Switch app language' }).click();
await page.waitForTimeout(500);
const sTe = await stored();
const teName = (sTe.settings?.companyNameTe ?? '').trim();
ok(teName.length > 0, 'Telugu company name saved in settings');
ok((await headerName.textContent()).trim() === teName, `header shows Telugu name after switching to తెలుగు (${teName})`);
await page.screenshot({ path: '/home/z/my-project/download/v22-header-te.png' });
await page.getByRole('button', { name: 'Switch app language' }).click();
await page.waitForTimeout(300);
ok((await headerName.textContent()).trim() === enName, 'header back to English name');

console.log('\n— 3. Tap the header logo → logo opens —');
await page.getByRole('button', { name: 'Open logo' }).click();
await page.waitForTimeout(600);
const logoDlg = page.locator('[aria-label="Logo preview"]');
ok(await logoDlg.isVisible(), 'logo preview dialog opens');
ok((await logoDlg.locator('img[alt="Company logo full view"]').count()) === 1, 'dialog shows the full logo');
await page.screenshot({ path: '/home/z/my-project/download/v22-logo-dialog.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
ok((await logoDlg.count()) === 0 || !(await logoDlg.isVisible()), 'logo dialog closes');

console.log('\n— 4. Settings → Appearance —');
await page.getByRole('button', { name: 'Settings', exact: true }).click();
await page.waitForTimeout(500);
const rootEl = page.locator('[data-app-root]');
const headerEl = page.locator('[data-header]');

ok(await page.getByLabel('Background theme mint').isVisible(), 'background theme picker visible');
await page.getByLabel('Background theme mint').click();
await page.waitForTimeout(300);
ok((await rootEl.getAttribute('class')).includes('from-emerald-50'), 'background switched to MINT instantly');

ok(await page.getByLabel('Header colour green').isVisible(), 'header colour picker visible');
await page.getByLabel('Header colour green').click();
await page.waitForTimeout(300);
ok((await headerEl.getAttribute('class')).includes('from-emerald-700'), 'header switched to GREEN instantly');
await page.screenshot({ path: '/home/z/my-project/download/v22-appearance.png' });

// custom watermark photo from the device
const logoBytes = fs.readFileSync('/home/z/my-project/public/narasimha-logo.jpg');
await page.getByLabel('Pick watermark photo').click();
await page.getByLabel('Watermark photo file').setInputFiles({ name: 'my-photo.jpg', mimeType: 'image/jpeg', buffer: logoBytes });
await page.waitForSelector('[data-watermark-preview][src^="data:image"]', { timeout: 6000 });
ok(true, 'watermark preview shows the uploaded photo');
ok((await page.locator('[data-watermark="logo"] img').getAttribute('src')).startsWith('data:image'), 'app-centre watermark uses the uploaded photo');
ok((await page.locator('[data-header] img').getAttribute('src')).startsWith('data:image'), 'header logo uses the uploaded photo');
ok((await stored()).appearance?.watermark?.startsWith('data:image') === true, 'uploaded photo saved in store');
await page.getByRole('button', { name: 'Reset watermark' }).click();
await page.waitForTimeout(400);
ok((await page.locator('[data-watermark="logo"] img').getAttribute('src')).includes('/narasimha-logo.jpg'), 'reset brings back the default logo');

console.log('\n— 5. Labour — its own tab beside Ledger, with money —');
// Ledger no longer holds the labour register
await page.getByRole('button', { name: 'Ledger', exact: true }).click();
await page.waitForTimeout(500);
ok((await page.getByRole('tab', { name: 'Labour work', exact: true }).count()) === 0, 'ledger no longer contains a labour chip');
const navBtns = await page.locator('[aria-label="Main navigation"] button').allTextContents();
const ledgerIdx = navBtns.findIndex((s) => s.includes('Ledger'));
const labourIdx = navBtns.findIndex((s) => s.includes('Labour'));
ok(labourIdx === ledgerIdx + 1, `labour sits right beside ledger in the bottom bar (${navBtns.join(' | ')})`);

await page.getByRole('button', { name: 'Labour', exact: true }).click();
await page.waitForTimeout(500);
ok(await page.getByLabel('Work date').isVisible(), 'work DATE input visible');
ok(await page.getByLabel('Worker name').isVisible(), 'worker NAME input visible');
ok(await page.getByLabel('Work done').isVisible(), 'work-done input visible');
ok(await page.getByLabel('Work product').isVisible(), 'PRODUCT input visible');
ok(await page.getByLabel('Labour money', { exact: true }).isVisible(), 'MONEY GIVEN input visible');
ok(await page.getByLabel('Labour money mode').isVisible(), 'money MODE picker visible');

// entry 1 — Ramesh, ₹800 cash for that day's work
await page.getByLabel('Worker name').fill('Ramesh');
await page.getByLabel('Work done').fill('Ring making & moulding');
await page.getByLabel('Work product').fill('2FT well ring');
await page.getByLabel('Labour money', { exact: true }).fill('800');
await page.getByRole('button', { name: 'Add labour work' }).click();
await page.waitForTimeout(700);
const workRow = page.locator('[data-labour-row="Ramesh"]');
ok(await workRow.isVisible(), 'labour row appears');
const wTxt = (await workRow.textContent()) || '';
ok(wTxt.includes('Ramesh'), 'row shows the worker NAME');
ok(wTxt.includes('Ring making & moulding'), 'row shows WHAT they did');
ok(wTxt.includes('2FT well ring'), 'row shows the PRODUCT name');
ok(wTxt.includes('Nov'), 'row shows the DATE');
ok(wTxt.includes('800.00'), 'row shows the MONEY given (₹800)');
ok(wTxt.includes('Cash'), 'row shows the money mode CASH');
ok(((await page.locator('[data-labour-month-money]').textContent()) || '').includes('800.00'), 'month money total = ₹800');
await page.screenshot({ path: '/home/z/my-project/download/v22-labour.png' });

// entry 2 — Suresh, ₹450 by UPI — money adds up
await page.getByLabel('Worker name').fill('Suresh');
await page.getByLabel('Work done').fill('Pole casting');
await page.getByLabel('Work product').fill('Fencing pole');
await page.getByLabel('Labour money', { exact: true }).fill('450');
await page.getByLabel('Labour money mode').click();
await page.getByRole('option', { name: 'UPI' }).click();
await page.getByRole('button', { name: 'Add labour work' }).click();
await page.waitForTimeout(700);
const sTxt = (await page.locator('[data-labour-row="Suresh"]').textContent()) || '';
ok(sTxt.includes('450.00') && sTxt.includes('UPI'), 'second row shows ₹450 by UPI');
ok(((await page.locator('[data-labour-month-money]').textContent()) || '').includes('1,250.00'), 'month money total = ₹1,250 (800 + 450)');
await page.getByRole('button', { name: 'Delete work Suresh' }).click();
await page.waitForTimeout(500);
ok((await page.locator('[data-labour-row="Suresh"]').count()) === 0, 'delete removes the work row');
ok(((await page.locator('[data-labour-month-money]').textContent()) || '').includes('800.00'), 'month money total back to ₹800 after delete');

console.log('\n— 6. Persists across reload —');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2400);
const popup2 = page.locator('[aria-label="Install app notification"]');
if (await popup2.count()) {
  await popup2.getByRole('button', { name: 'Close install notification' }).click();
  await page.waitForTimeout(300);
}
ok((await page.locator('[data-app-root]').getAttribute('class')).includes('from-emerald-50'), 'mint background still applied after reload');
ok((await page.locator('[data-header]').getAttribute('class')).includes('from-emerald-700'), 'green header still applied after reload');
await page.getByRole('button', { name: 'Labour', exact: true }).click();
await page.waitForTimeout(500);
const rRow = page.locator('[data-labour-row="Ramesh"]');
ok(await rRow.isVisible(), 'labour entry still there after reload');
ok(((await rRow.textContent()) || '').includes('800.00'), 'money still on the entry after reload');

console.log('\n— 7. Backup carries labour (with money) + appearance —');
await page.getByRole('button', { name: 'Settings', exact: true }).click();
await page.waitForTimeout(500);
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Backup data' }).click(),
]);
const bkPath = '/tmp/v22-backup.json';
await download.saveAs(bkPath);
const bk = JSON.parse(fs.readFileSync(bkPath, 'utf8'));
ok(bk.backupVersion === 2, 'backup file version 2');
ok(bk.labourWorks?.some((w) => w.name === 'Ramesh' && w.amount === 800 && w.mode === 'Cash'), 'backup contains LABOUR WORKS with the money given');
ok(bk.appearance?.bgTheme === 'mint', 'backup contains background theme');
ok(bk.appearance?.headerTheme === 'green', 'backup contains header colour');

// restore it back (with a tweak) and confirm appearance + labour come back
bk.appearance.bgTheme = 'cream';
bk.labourWorks = [
  { id: 'lw-x', dateISO: new Date().toISOString(), name: 'Srinu', work: 'Pole casting', product: 'Fencing pole', amount: 500, mode: 'UPI' },
];
fs.writeFileSync('/tmp/v22-restore.json', JSON.stringify(bk));
await page.getByRole('button', { name: 'Restore backup' }).click();
await page.getByLabel('Restore backup file').setInputFiles('/tmp/v22-restore.json');
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Confirm restore' }).click();
await page.waitForTimeout(900);
ok((await page.locator('[data-app-root]').getAttribute('class')).includes('from-amber-50'), 'restored backup brings the CREAM background');
ok((await stored()).labourWorks?.some((w) => w.name === 'Srinu' && w.amount === 500), 'restored backup brings labour works with money');
await page.getByRole('button', { name: 'Labour', exact: true }).click();
await page.waitForTimeout(500);
const sRow = page.locator('[data-labour-row="Srinu"]');
ok(await sRow.isVisible(), 'restored work row visible in the labour tab');
const sRowTxt = (await sRow.textContent()) || '';
ok(sRowTxt.includes('500.00') && sRowTxt.includes('UPI'), 'restored row shows ₹500 by UPI');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

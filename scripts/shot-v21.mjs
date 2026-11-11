import { chromium } from 'playwright';
import fs from 'fs';

/**
 * v21 verification
 *  1. Settings — Business Identity: typing does NOT auto-save; "Update details"
 *     button saves company name / UPI / phone etc. and shows a toast
 *  2. Billing & Slip: same pattern with "Update bill settings" (note + slip width)
 *  3. Updated values persist across a page reload
 *  4. "Backup data" downloads a JSON containing company settings, products,
 *     invoices, expenses & incomes
 *  5. "Restore backup" replaces company details + products + bills (with confirm)
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
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// close one-time install/update popup (appears because storage was cleared)
const popup = page.locator('[aria-label="Install app notification"]');
if (await popup.count()) {
  const ptxt = (await popup.first().textContent()) || '';
  ok(ptxt.includes('v22'), 'update popup advertises the current version (v22)');
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await page.waitForTimeout(300);
}

// go to Settings
await page.getByRole('button', { name: 'Settings', exact: true }).click();
await page.waitForTimeout(600);

console.log('\n— 1. Business Identity: draft until Update —');
const nameInput = page.getByLabel('Company name', { exact: true });
const oldName = (await nameInput.inputValue()).trim();
ok(oldName.length > 0, 'company name field shows current value');
const updBtn = page.getByRole('button', { name: 'Update details' });
ok(await updBtn.isDisabled(), 'Update details disabled while nothing changed');

await nameInput.fill('Sri Lakshmi Cement Works UPDATED');
await page.getByLabel('UPI ID').fill('prasad@oksbi');
await page.waitForTimeout(400);
let s = await stored();
ok(s.settings?.companyName !== 'Sri Lakshmi Cement Works UPDATED', 'typing does NOT auto-save company name');
ok(s.settings?.upiId !== 'prasad@oksbi', 'typing does NOT auto-save UPI ID');
ok(await updBtn.isEnabled(), 'Update details enabled after edits');
await page.screenshot({ path: '/home/z/my-project/download/v21-settings-draft.png' });

await updBtn.click();
await page.waitForTimeout(700);
ok(await page.getByText('Details updated').first().isVisible(), 'toast: Details updated');
s = await stored();
ok(s.settings?.companyName === 'Sri Lakshmi Cement Works UPDATED', 'Update details saved company name');
ok(s.settings?.upiId === 'prasad@oksbi', 'Update details saved UPI ID');
ok(await updBtn.isDisabled(), 'Update details disabled again (no pending changes)');
await page.screenshot({ path: '/home/z/my-project/download/v21-settings-saved.png' });

console.log('\n— 2. Billing & Slip: draft until Update —');
await page.getByLabel('Thank-you note').fill('Thank you! Visit again');
await page.getByRole('button', { name: /80 mm/ }).click();
const billBtn = page.getByRole('button', { name: 'Update bill settings' });
ok(await billBtn.isEnabled(), 'Update bill settings enabled after edits');
s = await stored();
ok(s.settings?.thankYouNote !== 'Thank you! Visit again', 'billing edits not saved while typing');
await billBtn.click();
await page.waitForTimeout(700);
s = await stored();
ok(s.settings?.thankYouNote === 'Thank you! Visit again', 'Update bill settings saved thank-you note');
ok(s.settings?.slipWidthMm === 80, 'Update bill settings saved slip width 80mm');
ok(await billBtn.isDisabled(), 'Update bill settings disabled again');

console.log('\n— 3. Persist across reload —');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1600);
const popup2 = page.locator('[aria-label="Install app notification"]');
if (await popup2.count()) {
  await popup2.getByRole('button', { name: 'Close install notification' }).click();
  await page.waitForTimeout(300);
}
await page.getByRole('button', { name: 'Settings', exact: true }).click();
await page.waitForTimeout(500);
ok(
  (await page.getByLabel('Company name', { exact: true }).inputValue()).trim() === 'Sri Lakshmi Cement Works UPDATED',
  'updated company name still shown after reload (persisted)'
);

console.log('\n— 4. Backup data —');
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Backup data' }).click(),
]);
const backupPath = '/tmp/v21-backup.json';
await download.saveAs(backupPath);
const bk = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
ok(bk.app === 'slp-billing', 'backup file marked as slp-billing');
ok(bk.settings?.companyName === 'Sri Lakshmi Cement Works UPDATED', 'backup contains COMPANY NAME');
ok(Array.isArray(bk.products) && bk.products.length >= 5, `backup contains PRODUCTS (${bk.products?.length})`);
ok(Array.isArray(bk.invoices), 'backup contains invoices');
ok(Array.isArray(bk.expenses), 'backup contains expenses');
ok(Array.isArray(bk.incomes), 'backup contains incomes');
ok(typeof download.suggestedFilename() === 'string' && download.suggestedFilename().startsWith('slp-backup-'), 'backup filename slp-backup-…');
await page.screenshot({ path: '/home/z/my-project/download/v21-backup.png' });

console.log('\n— 5. Restore backup —');
bk.settings.companyName = 'Restored Cement Works';
bk.settings.upiId = 'restored@upi';
bk.products = [
  ...bk.products,
  { id: 'p-restored', name: 'Test Product X', category: 'Custom', price: 123, sizes: ['1FT'] },
];
bk.invoices = [];
bk.expenses = [];
bk.incomes = [];
fs.writeFileSync('/tmp/v21-restore.json', JSON.stringify(bk));

await page.getByRole('button', { name: 'Restore backup' }).click();
await page.getByLabel('Restore backup file').setInputFiles('/tmp/v21-restore.json');
await page.waitForTimeout(500);
ok(await page.getByText('Restore this backup?').isVisible(), 'confirm dialog opens with backup summary');
ok(await page.getByText('Restored Cement Works').first().isVisible(), 'dialog shows company name from file');
await page.getByRole('button', { name: 'Confirm restore' }).click();
await page.waitForTimeout(900);
ok(await page.getByText('Backup restored').first().isVisible(), 'toast: Backup restored');

s = await stored();
ok(s.settings?.companyName === 'Restored Cement Works', 'company name restored');
ok(s.settings?.upiId === 'restored@upi', 'UPI ID restored');
ok((s.products ?? []).length === bk.products.length, 'products replaced with backup list');
ok((s.invoices ?? []).length === 0, 'bills replaced with backup (0)');
ok((s.products ?? []).some((p) => p.name === 'Test Product X'), 'restored product present');
const headerTxt = (await page.locator('header').first().textContent()) || '';
ok(headerTxt.includes('Restored Cement Works'), 'header shows restored company name');
ok(
  (await page.getByLabel('Company name', { exact: true }).inputValue()).trim() === 'Restored Cement Works',
  'settings form re-synced to restored values'
);
await page.screenshot({ path: '/home/z/my-project/download/v21-restored.png' });

console.log('\n— 6. Invalid file rejected —');
fs.writeFileSync('/tmp/v21-bad.json', JSON.stringify({ hello: 'world' }));
await page.getByRole('button', { name: 'Restore backup' }).click();
await page.getByLabel('Restore backup file').setInputFiles('/tmp/v21-bad.json');
await page.waitForTimeout(600);
ok(await page.getByText('not a valid app backup').first().isVisible(), 'invalid file shows error toast');
ok((await page.getByText('Restore this backup?').count()) === 0, 'no confirm dialog for invalid file');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

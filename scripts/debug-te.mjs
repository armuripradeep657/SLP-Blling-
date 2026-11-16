import { chromium } from 'playwright';

/**
 * Telugu visual diagnosis — walks the app in తెలుగు and screenshots every
 * key screen, reporting horizontal overflow / clipped text so layout bugs
 * (especially in the new v29 screens) are visible in one pass.
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const dlg = () => page.locator('[role="dialog"]');

const report = [];
/** overflow check for the current screen */
const check = async (name, path) => {
  await page.waitForTimeout(700);
  const m = await page.evaluate(() => {
    const d = document.documentElement;
    const wide = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > d.clientWidth + 2 && el.children.length === 0 && el.textContent?.trim()) {
        wide.push(`${el.tagName}.${String(el.className).slice(0, 40)} "${el.textContent.trim().slice(0, 30)}" right=${Math.round(r.right)}`);
      }
    });
    return {
      scrollW: d.scrollWidth,
      clientW: d.clientWidth,
      overflow: d.scrollWidth > d.clientWidth + 2,
      wide: wide.slice(0, 4),
    };
  });
  report.push({ name, ...m });
  await page.screenshot({ path });
};

/* ---- lock screen (English default) ---- */
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await check('lock-screen', '/home/z/my-project/download/v29-te-0-lock.png');
await page.getByLabel('New MPIN').fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
const popup = page.locator('[aria-label="Install app notification"]');
try {
  await popup.waitFor({ state: 'visible', timeout: 8000 });
  await popup.getByRole('button', { name: 'Close install notification' }).click();
} catch {}

/* ---- switch to Telugu ---- */
await page.getByRole('button', { name: 'Switch app language' }).click();
await page.waitForTimeout(900);

/* ---- main tabs in Telugu ---- */
await check('bill-tab-te', '/home/z/my-project/download/v29-te-1-bill.png');

await page.locator('[aria-label="Main navigation"] button', { hasText: 'ఉత్పత్తులు' }).click();
await check('products-tab-te', '/home/z/my-project/download/v29-te-2-products.png');

await page.locator('[aria-label="Main navigation"] button', { hasText: 'లెడ్జర్' }).click();
await page.getByRole('tab', { name: 'లేబర్ పనులు' }).click();
await check('labour-entries-te', '/home/z/my-project/download/v29-te-3-labour.png');

/* add one labour entry, open the notebook (new v29 UI in Telugu) */
// the form inputs carry English aria-labels by design
await page.getByLabel('Worker name').fill('రమేష్');
await page.getByLabel('Work done').fill('రింగ్ తయారీ');
await page.getByLabel('Work quantity').fill('25');
await page.getByLabel('Labour paid').fill('300');
await page.getByLabel('Labour balance').fill('200');
await page.getByRole('button', { name: 'Add labour work' }).click();
await page.locator('[data-labour-row="రమేష్"]').waitFor({ state: 'visible', timeout: 8000 });
await page.locator('[data-view-notebook]').click();
await page.waitForTimeout(700);
await check('labour-notebook-te', '/home/z/my-project/download/v29-te-4-notebook.png');

/* UPI payment screen in Telugu (new v29 UI) */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'బిల్లు' }).click();
await page.waitForTimeout(600);
await page.locator('main button:has-text("FT")').first().click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(800);
await dlg().getByPlaceholder('కస్టమర్ పేరు').fill('ఉమేష్');
await dlg().getByPlaceholder('మొబైల్ / WhatsApp').fill('9876543210');
await dlg().getByLabel('Payment mode').click();
await page.getByRole('option', { name: 'UPI', exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Complete Bill|బిల్లు పూర్తి/ }).first().click();
await page.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 10000 });
await check('payment-qr-te', '/home/z/my-project/download/v29-te-5-payment.png');
await page.getByRole('button', { name: 'Cancel payment' }).click();
await page.waitForTimeout(500);

/* settings in Telugu */
await page.locator('[aria-label="Main navigation"] button', { hasText: 'సెట్టింగ్‌లు' }).click();
await check('settings-te', '/home/z/my-project/download/v29-te-6-settings.png');

/* ---- report ---- */
console.log('\n=== Telugu layout report (390px viewport) ===');
let bad = 0;
for (const r of report) {
  const flag = r.overflow ? 'OVERFLOW' : 'ok';
  if (r.overflow) bad++;
  console.log(`${flag.padEnd(9)} ${r.name.padEnd(20)} scrollW=${r.scrollW} clientW=${r.clientW}`);
  for (const w of r.wide) console.log(`          · ${w}`);
}
console.log(bad === 0 ? '\nAll screens fit — no horizontal overflow.' : `\n${bad} screen(s) overflow — see the clipped elements above.`);
await browser.close();
process.exit(bad ? 1 : 0);

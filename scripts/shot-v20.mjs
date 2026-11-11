import { chromium } from 'playwright';

/**
 * v20 verification
 *  1. Company-logo watermark centred behind the whole app (fixed, subtle, no touch block)
 *  2. Bill page: no inline bill — only the View Bill bar; sheet shows FRESH customer fields every time
 *  3. Ledger → Expenses: direct Date + Time, Person, Purpose, Amount (+ category & mode)
 *     — row shows person as name, category + purpose as detail, mode chip
 *  4. Ledger → Income: Time picker too; day view rows show picked times
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

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// close one-time install/update popup (appears because storage was cleared)
const popup = page.locator('[aria-label="Install app notification"]');
if (await popup.count()) {
  const ptxt = (await popup.first().textContent()) || '';
  ok(ptxt.includes('v20'), 'update popup advertises v20');
  await popup.getByRole('button', { name: 'Close install notification' }).click();
  await page.waitForTimeout(300);
}

console.log('\n— 1. Watermark —');
const wm = page.locator('[data-watermark="logo"] img');
ok((await wm.count()) === 1, 'watermark img present');
const wmStyle = await wm.evaluate((el) => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const wrap = getComputedStyle(el.parentElement);
  const main = getComputedStyle(document.querySelector('main'));
  const header = getComputedStyle(document.querySelector('header'));
  return {
    opacity: cs.opacity,
    position: wrap.position,
    pointer: wrap.pointerEvents,
    zWrap: parseInt(wrap.zIndex),
    zMain: parseInt(main.zIndex),
    zHeader: parseInt(header.zIndex),
    dx: Math.abs(r.left + r.width / 2 - innerWidth / 2),
    dy: Math.abs(r.top + r.height / 2 - innerHeight / 2),
    w: r.width,
  };
});
ok(wmStyle.opacity === '0.06', `watermark subtle opacity 0.06 (got ${wmStyle.opacity})`);
ok(wmStyle.position === 'fixed', 'watermark wrapper is fixed (whole app)');
ok(wmStyle.pointer === 'none', 'watermark never blocks touches');
ok(wmStyle.zWrap > wmStyle.zMain && wmStyle.zWrap < wmStyle.zHeader, `watermark over content (${wmStyle.zWrap}) but under header (${wmStyle.zHeader})`);
ok(wmStyle.dx < 8 && wmStyle.dy < 8, `watermark centred (dx=${wmStyle.dx.toFixed(1)} dy=${wmStyle.dy.toFixed(1)})`);
ok(wmStyle.w > 250, `watermark big enough to read as logo (w=${Math.round(wmStyle.w)})`);
await page.screenshot({ path: '/home/z/my-project/download/v20-home-watermark.png' });

console.log('\n— 2. Bill page: only View Bill —');
await page.locator('button', { hasText: '+2FT' }).first().click();
await page.waitForTimeout(250);
await page.locator('button', { hasText: '+3FT' }).first().click();
await page.waitForTimeout(400);
ok((await page.locator('#current-bill').count()) === 0, 'no inline current-bill panel on the bill page');
const viewBtn = page.getByRole('button', { name: 'View bill' });
ok(await viewBtn.isVisible(), 'View Bill sticky bar is the only bill UI');
await page.screenshot({ path: '/home/z/my-project/download/v20-billpage.png' });

console.log('\n— 3. Sheet: FRESH customer every time —');
// scope to the VISIBLE dialog (the hidden desktop aside also has these fields in the DOM)
const dlg = () => page.locator('[role="dialog"]:visible').last();
await viewBtn.click();
await page.waitForTimeout(700);
const nameInput = dlg().getByPlaceholder('Customer name');
const mobInput = dlg().getByPlaceholder('Mobile / WhatsApp');
ok(await nameInput.isVisible(), 'sheet opens with customer name field');
ok((await nameInput.inputValue()) === '', 'customer name EMPTY (fresh)');
ok((await mobInput.inputValue()) === '', 'mobile EMPTY (fresh)');
await page.screenshot({ path: '/home/z/my-project/download/v20-sheet-fresh.png' });

await nameInput.fill('Suresh');
await mobInput.fill('9876543210');
await dlg().getByRole('button', { name: /Complete Bill/ }).click();
await page.waitForTimeout(1800);
ok((await page.locator('[role="dialog"]').count()) >= 1, 'invoice modal opened after completing');
await page.keyboard.press('Escape');
await page.waitForTimeout(700);

// next bill — fields must be blank again
await page.locator('button', { hasText: '+2FT' }).first().click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'View bill' }).click();
await page.waitForTimeout(700);
ok((await dlg().getByPlaceholder('Customer name').inputValue()) === '', 'next bill: customer name EMPTY again (new every time)');
ok((await dlg().getByPlaceholder('Mobile / WhatsApp').inputValue()) === '', 'next bill: mobile EMPTY again');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

console.log('\n— 4. Ledger → Expenses: date + time + person + purpose + amount —');
await page.getByRole('button', { name: 'Ledger', exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole('tab', { name: 'Expenses', exact: true }).click();
await page.waitForTimeout(400);
ok(await page.getByLabel('Expense date').isVisible(), 'expense DATE input visible');
ok(await page.getByLabel('Expense time').isVisible(), 'expense TIME input visible (direct)');
ok(await page.getByLabel('Expense person').isVisible(), 'expense PERSON input visible');
ok(await page.getByLabel('Expense purpose').isVisible(), 'expense PURPOSE input visible');
ok(await page.getByLabel('Expense amount').isVisible(), 'expense AMOUNT input visible');
await page.getByLabel('Expense time').fill('15:45');
await page.getByLabel('Expense person').fill('Ramesh');
await page.getByLabel('Expense purpose').fill('Site labour');
await page.getByLabel('Expense amount').fill('250');
await page.getByLabel('Expense payment mode').click();
await page.waitForTimeout(350);
await page.getByRole('option', { name: 'UPI' }).click();
await page.waitForTimeout(250);
await page.getByRole('button', { name: 'Add expense' }).click();
await page.waitForTimeout(700);
const expRow = page.locator('li', { hasText: 'Ramesh' }).first();
const expTxt = (await expRow.textContent()) || '';
ok(expTxt.includes('Ramesh'), 'month row named after PERSON (Ramesh)');
ok(expTxt.includes('Labour wages'), 'month row shows category too');
ok(expTxt.includes('Site labour'), 'month row shows PURPOSE');
ok(expTxt.includes('250'), 'month row shows amount');
ok(expTxt.includes('UPI'), 'month row shows UPI chip');
ok(expTxt.includes('15:45'), 'month row shows picked TIME');
await page.screenshot({ path: '/home/z/my-project/download/v20-expense-row.png' });

console.log('\n— 5. Day view shows the expense with time —');
await page.getByRole('tab', { name: 'Day', exact: true }).click();
await page.waitForTimeout(400);
const dayTxt = (await page.locator('ul li', { hasText: 'Ramesh' }).first().textContent()) || '';
ok(dayTxt.includes('Ramesh') && dayTxt.includes('− ₹250'), 'day row: Ramesh − ₹250');
ok(dayTxt.includes('15:45'), 'day row shows picked time 15:45');
ok(dayTxt.includes('Labour wages') && dayTxt.includes('Site labour'), 'day row detail: category · purpose');
ok(dayTxt.includes('UPI'), 'day row shows UPI chip');
await page.screenshot({ path: '/home/z/my-project/download/v20-day-rows.png' });

console.log('\n— 6. Income with time —');
await page.getByRole('tab', { name: 'Income', exact: true }).click();
await page.waitForTimeout(400);
ok(await page.getByLabel('Income time').isVisible(), 'income TIME input visible (direct)');
await page.getByLabel('Income time').fill('10:30');
await page.getByLabel('Income name').fill('Stone sale');
await page.getByLabel('Income amount').fill('500');
await page.getByRole('button', { name: 'Add income' }).click();
await page.waitForTimeout(700);
await page.getByRole('tab', { name: 'Day', exact: true }).click();
await page.waitForTimeout(400);
const incTxt = (await page.locator('ul li', { hasText: 'Stone sale' }).first().textContent()) || '';
ok(incTxt.includes('Stone sale') && incTxt.includes('+ ₹500'), 'day row: Stone sale + ₹500');
ok(incTxt.includes('10:30'), 'day row shows picked income time 10:30');

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

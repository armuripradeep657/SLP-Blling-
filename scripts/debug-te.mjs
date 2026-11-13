import { chromium } from 'playwright';
const BASE = process.env.BASE_URL || 'http://localhost:3200';
const MPIN = '1234';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const newPin = page.getByLabel('New MPIN');
await newPin.waitFor({ state: 'visible', timeout: 15000 });
await newPin.fill(MPIN);
await page.getByLabel('Confirm MPIN').fill(MPIN);
await page.getByRole('button', { name: 'Save MPIN' }).click({ force: true });
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
console.log('unlocked, active tab:', await page.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent());

// straight to Labour, add entry, open edit dialog in ENGLISH first
await page.getByRole('button', { name: 'Labour', exact: true }).click({ force: true });
await page.waitForTimeout(600);
await page.getByLabel('Worker name').fill('Suresh');
await page.getByLabel('Work done').fill('slab carrying');
await page.getByLabel('Labour paid').fill('500');
await page.getByLabel('Labour balance').fill('300');
await page.getByRole('button', { name: 'Add labour work' }).click({ force: true });
await page.locator('[data-labour-row="Suresh"]').waitFor({ state: 'visible', timeout: 8000 });
console.log('row added');

// switch language from settings
await page.getByRole('button', { name: 'Settings' }).click({ force: true });
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'తెలుగు' }).click({ force: true });
await page.waitForTimeout(800);
console.log('lang switched; nav buttons:', await page.locator('[aria-label="Main navigation"] button').allTextContents());
console.log('current tab:', await page.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent());

const navLabour = page.locator('[aria-label="Main navigation"] button', { hasText: 'లేబర్' });
await navLabour.click({ force: true });
await page.waitForTimeout(1200);
console.log('after nav click, current tab:', await page.locator('[aria-label="Main navigation"] button[aria-current="page"]').textContent());
console.log('rows visible:', await page.locator('[data-labour-row]').count());

const editBtn = page.getByRole('button', { name: 'Edit work Suresh' });
console.log('edit buttons:', await editBtn.count());
await editBtn.click({ force: true });
await page.waitForTimeout(1200);
console.log('dialog count:', await page.locator('[role="dialog"]').count());
const dlg = await page.locator('[role="dialog"]').first().textContent().catch(() => 'NONE');
console.log('dialog text head:', (dlg || '').slice(0, 120).replace(/\s+/g, ' '));
await page.screenshot({ path: '/home/z/my-project/download/v27-labour-edit-te.png' });
await browser.close();

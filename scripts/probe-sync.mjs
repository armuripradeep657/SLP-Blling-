import { chromium } from 'playwright';

/**
 * SYNC PROBE — localize where cross-device product propagation breaks:
 *  owner adds a product; we log the owner's vault pushes (versions) and the
 *  staff device's vault pulls (kinds + versions) plus staff catalog DOM.
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const mkPage = async (tag) => {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await p.addInitScript(() => localStorage.setItem('slp-update-notice-seen', '35'));
  p.on('request', (r) => {
    const u = r.url();
    if (u.includes('/api/vault') || u.includes('/api/auth/staff/login') || u.includes('/api/config')) {
      console.log(`[${tag} REQ ] ${r.method()} ${u.replace(BASE, '')}`);
    }
  });
  p.on('requestfinished', (r) => {
    if (r.url().includes('/api/vault') && r.method() === 'PUT') console.log(`[${tag} PUT-FINISHED]`);
  });
  p.on('requestfailed', (r) => {
    if (r.url().includes('/api/vault')) console.log(`[${tag} REQ-FAILED] ${r.method()} ${r.failure()?.errorText}`);
  });
  p.on('response', async (r) => {
    const u = r.url();
    try {
      if (u.includes('/api/auth/staff/login')) {
        const j = await r.json();
        console.log(`[${tag} LOGIN] ok=${j.ok} dekSalt=${!!j.dekSalt} dekIv=${!!j.dekIv} dekWrapped=${!!j.dekWrapped} name=${j.name}`);
      } else if (u.includes('/api/vault') && r.request().method() === 'GET') {
        const j = await r.json();
        console.log(`[${tag} PULL] kind=${j.empty ? 'empty' : j.ciphertext ? 'data' : '?'} v=${j.dataVersion ?? '-'} cipherLen=${(j.ciphertext || '').length}`);
      } else if (u.includes('/api/vault') && r.request().method() === 'PUT') {
        const j = await r.json();
        console.log(`[${tag} PUSH] ok=${j.ok} v=${j.dataVersion ?? '-'}`);
      } else if (u.includes('/api/config')) {
        const j = await r.json().catch(() => ({}));
        console.log(`[${tag} CONF] ${r.request().method()} exists=${j.exists} upi=${j.upiId || '-'}`);
      }
    } catch {
      /* non-json */
    }
  });
  return p;
};

const owner = await mkPage('OWNER');
await owner.goto(BASE, { waitUntil: 'domcontentloaded' });
await owner.waitForTimeout(5200);
await owner.getByLabel('New MPIN').fill(MPIN);
await owner.getByLabel('Confirm MPIN').fill(MPIN);
await owner.getByRole('button', { name: 'Save MPIN' }).click();
await owner.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
console.log('--- owner unlocked');

await owner.locator('[aria-label="Main navigation"] button', { hasText: 'Settings' }).first().click();
await owner.waitForTimeout(700);
await owner.getByLabel('New staff username').fill('ravi');
await owner.getByLabel('New staff name').fill('Ravi Kumar');
await owner.getByLabel('New staff password').fill('ravipass1');
await owner.getByRole('button', { name: 'Add staff' }).click();
await owner.locator('[data-staff-row="ravi"]').waitFor({ state: 'visible', timeout: 8000 });
console.log('--- staff ravi created');

const ravi = await mkPage('STAFF');
await ravi.goto(BASE, { waitUntil: 'domcontentloaded' });
await ravi.waitForTimeout(2600);
await ravi.getByRole('button', { name: 'Staff login' }).click();
await ravi.getByLabel('Staff username').fill('ravi');
await ravi.getByLabel('Staff password').fill('ravipass1');
await ravi.getByRole('button', { name: 'Staff sign in' }).click();
await ravi.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
console.log('--- staff signed in');

await ravi.locator('[aria-label="Main navigation"] button', { hasText: 'Bill' }).first().click();
await ravi.waitForTimeout(600);
const before = await ravi.locator('main button').allTextContents();
console.log('--- staff catalog BEFORE:', JSON.stringify(before.slice(0, 12)));

await owner.locator('[aria-label="Main navigation"] button', { hasText: 'Products' }).first().click();
await owner.waitForTimeout(600);
await owner.getByRole('button', { name: 'Add', exact: true }).first().click();
await owner.waitForTimeout(500);
await owner.getByPlaceholder('Product name').fill('Probe Cement');
await owner.getByPlaceholder('0').first().fill('425');
await owner.getByRole('button', { name: 'Add product' }).last().click();
await owner.waitForTimeout(1000);
console.log('--- owner added Probe Cement; watching for 30 s');

for (let i = 0; i < 10; i++) {
  await ravi.waitForTimeout(3000);
  const txts = await ravi.locator('main button').allTextContents();
  const hit = txts.find((t) => t.includes('Probe Cement'));
  if (hit) break;
}
console.log('--- product visible on staff device; now the OFFLINE REGISTER test');
const ownerToken = async () => {
  const raw = await owner.evaluate(() => localStorage.getItem('slp-auth-v1'));
  return raw ? JSON.parse(raw).token : '';
};

// capture register traffic on the staff page
ravi.on('request', (r) => {
  if (r.url().includes('/api/verify/register')) console.log('[STAFF REG-REQ]', r.method());
});
const pendingIds = () =>
  ravi.evaluate(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('slp-cement-billing-v1') || '{}');
      return { pending: raw?.state?.pendingRegIds ?? null, invoices: (raw?.state?.invoices || []).map((i) => `${i.no}:${(i.customer?.name || '').slice(0, 12)}:${!!i.verifyCode}`) };
    } catch (e) {
      return { err: String(e).slice(0, 60) };
    }
  });

// complete a bill with register aborted
await ravi.route('**/api/verify/register', (route) => route.abort('failed'));
await ravi.locator('main .rounded-xl.border', { hasText: 'Probe Cement' }).first().waitFor({ state: 'visible', timeout: 8000 });
await ravi.locator('main .rounded-xl.border', { hasText: 'Probe Cement' }).first().getByRole('button', { name: '+Standard' }).click();
await ravi.waitForTimeout(600);
await ravi.getByRole('button', { name: 'View bill' }).click();
await ravi.waitForTimeout(700);
await ravi.locator('[role="dialog"]').getByPlaceholder('Customer name').fill('Probe Offline');
await ravi.locator('[role="dialog"]').getByLabel('Payment mode').click();
await ravi.getByRole('option', { name: 'UPI', exact: true }).click();
await ravi.waitForTimeout(400);
await ravi.locator('[role="dialog"]').getByRole('button', { name: /Complete Bill/ }).first().click();
await ravi.locator('[data-payment-screen]').waitFor({ state: 'visible', timeout: 15000 });
await ravi.waitForTimeout(800);
console.log('pending after offline save:', JSON.stringify(await pendingIds()));

await ravi.unroute('**/api/verify/register');
for (let i = 0; i < 10; i++) {
  await ravi.waitForTimeout(3000);
  const st = await pendingIds();
  const res = await fetch(`${BASE}/api/bills?limit=50`, { headers: { Authorization: `Bearer ${await ownerToken()}` } }).catch(() => null);
  const rows = res && res.ok ? (await res.json()).bills || [] : [];
  console.log(`  t+${(i + 1) * 3}s pending=${JSON.stringify(st.pending)} rows=${rows.length} ${rows.map((b) => b.customerName).join(',') || ''}`);
  if (rows.length > 0) break;
}
console.log('probe done');
await browser.close();
process.exit(0);

import { chromium } from 'playwright';
import { webcrypto } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

/**
 * LEGACY MIGRATION — the owner's LIVE account was created by the old app
 * whose verifier was broken (every proof hashed to all zeros). This test
 * builds exactly that account on the server, then proves that with v27:
 *   1. a fresh device sees a LOGIN screen (never "Create MPIN")
 *   2. the correct MPIN is verified by unwrapping the stored key locally
 *   3. the server verifier is repaired to the REAL proof — same MPIN kept
 *   4. a wrong MPIN is rejected
 *   5. after repair the normal login flow works and data syncs
 */
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const MPIN = '1234';
let pass = 0;
let fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS', n); } else { fail++; console.log('  FAIL', n); } };

const ZERO = '0'.repeat(64);
const db = new PrismaClient();

/* ---- rebuild the owner's legacy account exactly as the old app created it ---- */
const enc = new TextEncoder();
const deriveBits = async (mpin, saltB64) => {
  const base = await webcrypto.subtle.importKey('raw', enc.encode(`slp-cement|mpin|${mpin}`), 'PBKDF2', false, ['deriveBits']);
  const salt = Uint8Array.from(Buffer.from(saltB64, 'base64'));
  return webcrypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, base, 256);
};
const proofHex = async (mpin, saltB64) =>
  Buffer.from(await webcrypto.subtle.digest('SHA-256', await deriveBits(mpin, saltB64))).toString('hex');

const salt = Buffer.from(webcrypto.getRandomValues(new Uint8Array(16))).toString('base64');
const expectedProof = await proofHex(MPIN, salt);
const dekRaw = webcrypto.getRandomValues(new Uint8Array(32));
const kek = await webcrypto.subtle.importKey('raw', await deriveBits(MPIN, salt), { name: 'AES-GCM' }, false, ['encrypt']);
const iv = webcrypto.getRandomValues(new Uint8Array(12));
const ct = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, dekRaw);
const wrapped = `${Buffer.from(iv).toString('base64')}.${Buffer.from(ct).toString('base64')}`;

await db.syncAccount.deleteMany();
await db.session.deleteMany();
await db.syncAccount.create({
  data: {
    slot: 'owner',
    dekSalt: salt,
    dekWrapped: wrapped,
    pinVerifier: ZERO, // the broken pre-fix verifier
    dataVersion: 0,
  },
});
ok(true, 'legacy account created on the server (all-zero verifier, real wrapped key)');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

/* ---- 1. fresh device with a legacy account sees a LOGIN, not Create ---- */
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const loginPin = page.getByLabel('MPIN', { exact: true });
await loginPin.waitFor({ state: 'visible', timeout: 15000 });
ok((await page.getByLabel('New MPIN').count()) === 0, 'legacy account → LOGIN screen, NEVER "Create your MPIN"');

/* ---- 2. wrong MPIN rejected (local unwrap proof) ---- */
await loginPin.fill('9999');
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-lock-error]').waitFor({ state: 'visible', timeout: 15000 });
ok(((await page.locator('[data-lock-error]').textContent()) || '').includes('Wrong'), 'wrong MPIN rejected on the legacy account');

/* ---- 3. correct MPIN → local unwrap proof → server repaired → app opens ---- */
await loginPin.fill(MPIN);
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'the SAME MPIN opens the app — no re-create asked');

const acc = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
ok(acc?.pinVerifier === expectedProof, 'server verifier REPAIRED to the real proof (same MPIN kept)');
ok(acc?.pinVerifier !== ZERO, 'all-zero verifier is gone');
ok(Boolean(acc?.ciphertext), 'device data pushed to the repaired vault');

const mat = await page.evaluate(() => localStorage.getItem('slp-recover-v1')?.slice(0, 40) ?? null);
ok(Boolean(mat), 'device saved its credential copy — the create screen can never return');

/* ---- 4. next open: normal login (repaired verifier) ---- */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
const loginPin2 = page.getByLabel('MPIN', { exact: true });
await loginPin2.waitFor({ state: 'visible', timeout: 15000 });
ok((await page.getByLabel('New MPIN').count()) === 0, 'after repair: still just a login on every open');
await loginPin2.fill(MPIN);
await page.getByRole('button', { name: 'Open app' }).click();
await page.locator('[data-header]').waitFor({ state: 'visible', timeout: 20000 });
ok(true, 'repaired account logs in normally');

console.log(`\n${pass} passed, ${fail} failed`);
await db.$disconnect();
await browser.close();
process.exit(fail ? 1 : 0);

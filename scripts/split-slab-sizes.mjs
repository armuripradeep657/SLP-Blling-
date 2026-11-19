/**
 * v51 catalogue split — the owner wants the 23-size Kitchen Slab split
 * WIDTH-WISE into separate items (screenshot 2026-11-19: one product was
 * carrying 2ft + 14in + 18in + 9in + 1ft sizes all together):
 *   - Kitchen Slab 4x2 keeps ONLY the 2ft-width sizes (3-7 + halves)
 *   - NEW: Selupu Ralu - 14 Inch Slab  (3x14 ... 6x14)
 *   - NEW: Selupu Ralu - 18 Inch Slab  (3x18, 4x18, 5x18)
 *   - NEW: Selupu Ralu - 9 Inch Slab   (3x9, 4x9, 5x9)
 *   - NEW: Selupu Ralu - 1 FT Slab     (4x1, 5x1)
 * Prices are carried over unchanged from the v50 list (owner adjusts in Edit).
 * BizState rev bumped so every device pulls the split catalogue.
 */
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('db/custom.db');
const now = new Date().toISOString();

const kitchen = db.prepare(`SELECT id, sizesJson, sizePricesJson FROM BizProduct WHERE name = 'Selupu Ralu - Kitchen Slab 4x2'`).get();
if (!kitchen) throw new Error('Kitchen Slab not found');
const sizes = JSON.parse(kitchen.sizesJson);
const prices = JSON.parse(kitchen.sizePricesJson);

const keep2ft = sizes.filter((s) => s.endsWith('x2 FT'));
const moved = sizes.filter((s) => !keep2ft.includes(s));
if (keep2ft.length !== 8 || moved.length !== 15) {
  throw new Error(`unexpected Kitchen Slab state: ${keep2ft.length} kept / ${moved.length} moved`);
}

// 1. trim the Kitchen Slab down to the 2ft-width sizes
db.prepare(`UPDATE BizProduct SET sizesJson = ?, updatedAt = ? WHERE id = ?`)
  .run(JSON.stringify(keep2ft), now, kitchen.id);
console.log(`✓ Kitchen Slab 4x2: now ${keep2ft.length} sizes (${keep2ft.join(', ')})`);

// 2. one new product per width — sizes + prices carried over from v50
function newSlab(name, nameTe, sizeNames, image) {
  const exists = db.prepare(`SELECT id FROM BizProduct WHERE name = ?`).get(name);
  if (exists) throw new Error(`already exists: ${name}`);
  const rows = sizeNames.map((s) => [s, prices[s]]);
  if (rows.some(([, p]) => p === undefined)) throw new Error(`missing price for ${name}: ${JSON.stringify(rows)}`);
  const id = 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  db.prepare(`INSERT INTO BizProduct (id, name, nameTe, category, price, sizesJson, sizePricesJson, image, stock, createdAt, updatedAt)
              VALUES (?, ?, ?, 'Selupu Ralu Slabs', ?, ?, ?, ?, NULL, ?, ?)`)
    .run(id, name, nameTe, rows[0][1], JSON.stringify(sizeNames), JSON.stringify(Object.fromEntries(rows)), image, now, now);
  console.log(`✓ NEW ${name}: ${sizeNames.join(' | ')} [${image}]`);
}

newSlab('Selupu Ralu - 14 Inch Slab', 'సెలుపు రాళ్లు 14 ఇంచ్',
  ['3x14 inch', '3.5x14 inch', '4x14 inch', '4.5x14 inch', '5x14 inch', '5.5x14 inch', '6x14 inch'],
  '/products/slabs-2.jpg');
newSlab('Selupu Ralu - 18 Inch Slab', 'సెలుపు రాళ్లు 18 ఇంచ్',
  ['3x18 inch', '4x18 inch', '5x18 inch'],
  '/products/slabs.jpg');
newSlab('Selupu Ralu - 9 Inch Slab', 'సెలుపు రాళ్లు 9 ఇంచ్',
  ['3x9 inch', '4x9 inch', '5x9 inch'],
  '/products/slabs-2.jpg');
newSlab('Selupu Ralu - 1 FT Slab', 'సెలుపు రాళ్లు 1 FT',
  ['4x1 FT', '5x1 FT'],
  '/products/slabs.jpg');

// 3. bump rev so every device pulls the split on its next poll
const st = db.prepare(`SELECT rev FROM BizState WHERE id = 'owner'`).get();
db.prepare(`UPDATE BizState SET rev = rev + 1 WHERE id = 'owner'`).run();
console.log(`✓ rev ${st.rev} -> ${st.rev + 1}`);

console.log('\n=== Selupu Ralu family now ===');
const fam = db.prepare(`SELECT name, sizesJson FROM BizProduct WHERE category = 'Selupu Ralu Slabs' ORDER BY createdAt DESC, name ASC`).all();
for (const r of fam) console.log(`• ${r.name} [${JSON.parse(r.sizesJson).length} sizes]`);
db.close();

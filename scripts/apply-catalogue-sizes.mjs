/**
 * v50 catalogue update — applies the owner's size list (Nov 18 2026 message)
 * to db/custom.db:
 *  - adds the requested sizes (with estimated prices) to existing products
 *  - creates the 6 new product lines the owner named (Kodada Ketikilu,
 *    Darwaja, Kodada Darwaja, Tulasikota, Adjust Fan, Machine Ventilator)
 *    with AI-generated catalogue images in public/products/
 *  - fills the empty Telugu names for every product
 *  - bumps BizState.rev so every device pulls the new catalogue on its next poll
 *
 * All NEW sizes carry ESTIMATED prices (interpolated from each product's
 * existing curve) — the owner reviews/adjusts them in the edit dialog.
 */
import { DatabaseSync } from 'node:sqlite';

const DB = 'db/custom.db';
const db = new DatabaseSync(DB);

const now = new Date().toISOString();
const get = (name) => db.prepare(`SELECT id, name, nameTe, sizesJson, sizePricesJson FROM BizProduct WHERE name = ?`).get(name);

function addSizes(name, adds) {
  const row = get(name);
  if (!row) throw new Error(`product not found: ${name}`);
  const sizes = JSON.parse(row.sizesJson);
  const prices = JSON.parse(row.sizePricesJson);
  let added = 0;
  for (const [size, price] of adds) {
    if (!sizes.includes(size)) { sizes.push(size); added++; }
    prices[size] = price; // existing size -> price untouched? NO: explicit set only for NEW sizes
  }
  // revert price overwrites for sizes that already existed (keep owner's price)
  const sizes0 = JSON.parse(row.sizesJson);
  for (const [size, price] of adds) if (sizes0.includes(size)) prices[size] = JSON.parse(row.sizePricesJson)[size];
  db.prepare(`UPDATE BizProduct SET sizesJson = ?, sizePricesJson = ?, updatedAt = ? WHERE id = ?`)
    .run(JSON.stringify(sizes), JSON.stringify(prices), now, row.id);
  console.log(`✓ ${name}: +${added} sizes (total ${sizes.length})`);
}

function setNameTe(name, te) {
  const row = get(name);
  if (!row) throw new Error(`product not found: ${name}`);
  if (row.nameTe) return; // never overwrite an owner-written Telugu name
  db.prepare(`UPDATE BizProduct SET nameTe = ?, updatedAt = ? WHERE id = ?`).run(te, now, row.id);
  console.log(`✓ ${name}: nameTe = ${te}`);
}

function newProduct({ name, nameTe, category, base, sizes, image }) {
  if (get(name)) throw new Error(`product already exists: ${name}`);
  const id = 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const prices = Object.fromEntries(sizes.map(([s, p]) => [s, p]));
  db.prepare(`INSERT INTO BizProduct (id, name, nameTe, category, price, sizesJson, sizePricesJson, image, stock, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`)
    .run(id, name, nameTe, category, base, JSON.stringify(sizes.map(([s]) => s)), JSON.stringify(prices), image, now, now);
  console.log(`✓ NEW ${name} (${category}): ${sizes.length} sizes, image ${image}`);
}

// ---------- 1. existing products: add the owner's new sizes ----------
addSizes('Gunja (Fencing Pole)', [['6FT', 330], ['7FT', 360]]);
addSizes('Gunja Cement Pool', [['6FT', 390]]);
addSizes('Gunja Pool', [['6FT', 440]]);
addSizes('Gunja 8FT Pole', [['6FT', 350]]);
addSizes('Heavy Duty Pool 12FT', [['6FT', 470]]);
addSizes('Ketikelu - Ventilator 2x2', [['1.5x1 FT', 380], ['2x1 FT', 420]]);
addSizes('Ketikelu - Single Frame 3x4', [['2x2 FT', 600], ['2.5x3 FT', 850], ['4x3 FT', 1450], ['4x4 FT', 1600]]);
addSizes('Ketikelu - Double Frame 4x3', [['2x2 FT', 600], ['2.5x3 FT', 850]]);
addSizes('Selupu Ralu - Kitchen Slab 4x2', [
  ['6x2 FT', 780], ['7x2 FT', 880],
  ['3.5x2 FT', 530], ['4.5x2 FT', 630], ['5.5x2 FT', 730],
  ['4x14 inch', 450], ['4.5x14 inch', 500], ['5x14 inch', 550], ['5.5x14 inch', 600], ['6x14 inch', 650], ['3x14 inch', 350], ['3.5x14 inch', 400],
  ['3x18 inch', 420], ['4x18 inch', 520], ['5x18 inch', 620],
  ['3x9 inch', 300], ['4x9 inch', 380], ['5x9 inch', 450],
  ['4x1 FT', 300], ['5x1 FT', 350],
]);

// ---------- 2. new product lines the owner named ----------
newProduct({
  name: 'Kodada Ketikilu', nameTe: 'కొడద కెటికిలు', category: 'Ketikelu Frames', base: 1100,
  sizes: [['2x2 FT', 600], ['2.5x3 FT', 850], ['3x3 FT', 1000], ['3x4 FT', 1100], ['4x3 FT', 1450], ['4x4 FT', 1600]],
  image: '/products/kodada-ketikilu.jpg',
});
newProduct({
  name: 'Darwaja', nameTe: 'దర్వాజా', category: 'Darwaja', base: 1800,
  sizes: [['6FT', 1800], ['6½FT', 1950], ['6⅛FT', 1880]],
  image: '/products/darwaja.jpg',
});
newProduct({
  name: 'Kodada Darwaja', nameTe: 'కొడద దర్వాజా', category: 'Darwaja', base: 2000,
  sizes: [['6FT', 2000], ['6½FT', 2150], ['6⅛FT', 2080]],
  image: '/products/kodada-darwaja.jpg',
});
newProduct({
  name: 'Tulasikota', nameTe: 'తులసికోట', category: 'Tulasikota', base: 500,
  sizes: [['Small', 350], ['Medium', 500], ['Large', 700]],
  image: '/products/tulasikota.jpg',
});
newProduct({
  name: 'Adjust Fan', nameTe: 'అజస్ట్ ఫ్యాన్', category: 'Ventilators & Fans', base: 150,
  sizes: [['4 inch', 150], ['9 inch', 250]],
  image: '/products/adjust-fan.jpg',
});
newProduct({
  name: 'Machine Ventilator', nameTe: 'మెషిన్ వెంటిలేటర్', category: 'Ventilators & Fans', base: 900,
  sizes: [['1 Door', 700], ['2 Doors', 900], ['3 Doors', 1100]],
  image: '/products/machine-ventilator.jpg',
});

// ---------- 3. Telugu names for the existing catalogue ----------
setNameTe('Gagulu (Well Ring)', 'గగులు');
setNameTe('Galulu Billalu (Well Lid)', 'గలులు బిల్లాలు');
setNameTe('Gunja (Fencing Pole)', 'గుంజ ఫెన్సింగ్ పోలు');
setNameTe('Gunja Cement Pool', 'గుంజ సిమెంట్ పోలు');
setNameTe('Gunja Pool', 'గుంజ పోలు');
setNameTe('Gunja 8FT Pole', 'గుంజ 8FT పోలు');
setNameTe('Heavy Duty Pool 12FT', 'హెవీ డ్యూటీ పోలు');
setNameTe('Ketikelu - Ventilator 2x2', 'కెటికిలు వెంటిలేటర్');
setNameTe('Ketikelu - Single Frame 3x4', 'కెటికిలు సింగిల్ ఫ్రేమ్');
setNameTe('Ketikelu - Double Frame 4x3', 'కెటికిలు డబుల్ ఫ్రేమ్');
setNameTe('Selupu Ralu - Standard Slab 4x1.5', 'సెలుపు రాళ్లు స్టాండర్డ్');
setNameTe('Selupu Ralu - Kitchen Slab 4x2', 'సెలుపు రాళ్లు కిచెన్');
setNameTe('Selupu Ralu - Heavy Slab 5x1.5', 'సెలుపు రాళ్లు హెవీ');
setNameTe('Selupu Ralu - Cupboard Slab 3x1.5', 'సెలుపు రాళ్లు కప్పర్డ్');

// ---------- 4. bump the state rev so every device pulls the new catalogue ----------
const st = db.prepare(`SELECT id, rev FROM BizState WHERE id = 'owner'`).get();
if (!st) throw new Error('BizState owner row missing');
db.prepare(`UPDATE BizState SET rev = rev + 1 WHERE id = 'owner'`).run();
console.log(`✓ rev ${st.rev} -> ${st.rev + 1}`);

// ---------- 5. final catalogue ----------
console.log('\n=== FINAL CATALOGUE ===');
const rows = db.prepare(`SELECT name, nameTe, category, sizesJson, image FROM BizProduct ORDER BY createdAt DESC, name ASC`).all();
for (const r of rows) {
  const s = JSON.parse(r.sizesJson);
  console.log(`• ${r.name} (${r.category}) [${s.length} sizes] img:${r.image ? 'yes' : 'NO'}`);
  console.log('   ', s.join(' | '));
}
db.close();
console.log('\ntotal products:', rows.length);

import { teluguFromEnglish } from '../src/lib/telugu';

const cases = [
  'Well Ring 24 inch',
  'Cement Pole 12 Feet',
  'Well Lid',
  'Slab 4x2',
  'Window Frame',
  'Cover Block',
  'Stone Dust',
  'ACC Cement 50 Kg',
  'Narasimha',
  'Tandoor Pan',
  'Jelly Stone',
  'Fancy Slab 36 Inches',
  '2 inch Pipe',
  '',
];

for (const c of cases) {
  console.log(JSON.stringify(c), '->', teluguFromEnglish(c) || '(empty)');
}

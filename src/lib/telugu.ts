/* v44 — Telugu auto-fill for product names.
 *
 * The owner types the English name ("Well Ring 24 inch") and the Telugu name
 * field fills itself ("బావి రింగ్ 24 ఇంచ్"). Two layers:
 *   1. a dictionary of the shop's actual vocabulary (cement products, units,
 *      materials) — longest phrase first, so "well ring" beats "ring";
 *   2. a phonetic English→Telugu transliteration for words the dictionary
 *      doesn't know (brand names etc.).
 * The result is always EDITABLE — the owner's correction wins and stops the
 * auto-fill until they clear the field. No network, no API, deterministic.
 */

/** shop vocabulary — longest phrases FIRST (bigrams/trigrams win) */
const DICT: Array<[string, string]> = [
  // multi-word product names the shop sells
  ['well ring', 'బావి రింగ్'],
  ['window frame', 'కిటికీ ఫ్రేమ్'],
  ['door frame', 'డోర్ ఫ్రేమ్'],
  ['cover block', 'కవర్ బ్లాక్'],
  ['cement pole', 'సిమెంటు పోలు'],
  ['cement ring', 'సిమెంటు రింగ్'],
  ['stone dust', 'స్టోన్ డస్ట్'],
  ['jelly stone', 'జెల్లీ స్టోన్'],
  ['tandoor pan', 'తందూర్ పాన్'],
  ['water tank', 'నీళ్ల ట్యాంక్'],
  ['ventilator', 'వెంటిలేటర్'],
  // products & materials
  ['cement', 'సిమెంటు'],
  ['concrete', 'కాంక్రీట్'],
  ['ring', 'రింగ్'],
  ['rings', 'రింగ్స్'],
  ['gagulu', 'గగులు'],
  ['slab', 'స్లాబ్'],
  ['slabs', 'స్లాబ్స్'],
  ['pole', 'పోలు'],
  ['poles', 'పోల్స్'],
  ['lid', 'లిడ్'],
  ['lids', 'లిడ్స్'],
  ['well', 'బావి'],
  ['window', 'కిటికీ'],
  ['frame', 'ఫ్రేమ్'],
  ['frames', 'ఫ్రేమ్స్'],
  ['door', 'డోర్'],
  ['doors', 'డోర్స్'],
  ['brick', 'బ్రిక్'],
  ['bricks', 'బ్రిక్స్'],
  ['block', 'బ్లాక్'],
  ['blocks', 'బ్లాక్స్'],
  ['tile', 'టైల్'],
  ['tiles', 'టైల్స్'],
  ['pipe', 'పైపు'],
  ['pipes', 'పైపులు'],
  ['cover', 'కవర్'],
  ['covers', 'కవర్లు'],
  ['pillar', 'పిల్లర్'],
  ['beam', 'బీమ్'],
  ['jali', 'జాలీ'],
  ['gate', 'గేట్'],
  ['grill', 'గ్రిల్'],
  ['mesh', 'మెష్'],
  ['fence', 'ఫెన్స్'],
  ['post', 'పోస్ట్'],
  ['chamber', 'ఛాంబర్'],
  ['tank', 'ట్యాంక్'],
  ['tandoor', 'తందూర్'],
  ['pan', 'పాన్'],
  ['tub', 'టబ్'],
  ['bucket', 'బక్కెట్'],
  ['trolley', 'ట్రాలీ'],
  ['stone', 'స్టోన్'],
  ['dust', 'డస్ట్'],
  ['jelly', 'జెల్లీ'],
  ['metal', 'మెటల్'],
  ['sand', 'ఇసుక'],
  ['steel', 'స్టీల్'],
  ['iron', 'ఐరన్'],
  ['gravel', 'గ్రావెల్'],
  ['solid', 'సాలిడ్'],
  ['hollow', 'హోలో'],
  ['curved', 'కర్వ్డ్'],
  ['round', 'రౌండ్'],
  ['square', 'స్క్వేర్'],
  ['small', 'చిన్న'],
  ['big', 'పెద్ద'],
  ['heavy', 'హెవీ'],
  ['fancy', 'ఫాన్సీ'],
  ['plain', 'ప్లెయిన్'],
  ['standard', 'స్టాండర్డ్'],
  ['premium', 'ప్రీమియం'],
  // units & measures
  ['inch', 'ఇంచ్'],
  ['inches', 'ఇంచ్‌లు'],
  ['feet', 'అడుగులు'],
  ['foot', 'అడుగు'],
  ['mm', 'మిమీ'],
  ['cm', 'సెంమీ'],
  ['kg', 'కిలో'],
  ['bag', 'బ్యాగ్'],
  ['bags', 'బ్యాగ్లు'],
  ['ton', 'టన్ను'],
  ['tons', 'టన్నులు'],
  ['ltr', 'లీటరు'],
  ['litre', 'లీటరు'],
  ['size', 'సైజ్'],
  ['pair', 'జత'],
  ['set', 'సెట్'],
];

/** consonant cluster → Telugu letter (bare; halant added when no vowel follows) */
const CONS: Array<[string, string]> = [
  ['chh', 'ఛ'], ['shr', 'శ్ర'], ['th', 'థ'], ['ph', 'ఫ'], ['bh', 'భ'], ['dh', 'ధ'],
  ['kh', 'ఖ'], ['gh', 'ఘ'], ['jh', 'ఝ'], ['ch', 'చ'], ['sh', 'ష'], ['ng', 'ఙ'],
  ['gn', 'జ్ఞ'], ['tr', 'ట్ర'], ['dr', 'డ్ర'], ['kr', 'క్ర'], ['gr', 'గ్ర'], ['pr', 'ప్ర'],
  ['br', 'బ్ర'], ['fr', 'ఫ్ర'], ['q', 'క'], ['k', 'క'], ['g', 'గ'], ['c', 'క'],
  ['j', 'జ'], ['t', 'ట'], ['d', 'డ'], ['n', 'న'], ['p', 'ప'], ['b', 'బ'],
  ['m', 'మ'], ['y', 'య'], ['r', 'ర'], ['l', 'ల'], ['v', 'వ'], ['w', 'వ'],
  ['s', 'స'], ['h', 'హ'], ['f', 'ఫ'], ['z', 'జ'], ['x', 'క్స'],
];

/** vowel after a consonant → matra sign ('' = inherent 'a') */
const MATRA: Array<[string, string]> = [
  ['aa', 'ా'], ['ai', 'ై'], ['au', 'ౌ'], ['ee', 'ీ'], ['ii', 'ీ'], ['oo', 'ూ'],
  ['uu', 'ూ'], ['ou', 'ౌ'], ['a', ''], ['i', 'ి'], ['e', 'ె'], ['o', 'ొ'], ['u', 'ు'],
];

/** standalone vowel → full letter */
const VOWEL: Array<[string, string]> = [
  ['aa', 'ఆ'], ['ai', 'ఐ'], ['au', 'ఔ'], ['ee', 'ఈ'], ['ii', 'ఈ'], ['oo', 'ఊ'],
  ['uu', 'ఊ'], ['ou', 'ఔ'], ['a', 'అ'], ['i', 'ఇ'], ['e', 'ఎ'], ['o', 'ఒ'], ['u', 'ఉ'],
];

/** transliterate one English word into Telugu script (phonetic) */
function transliterate(word: string): string {
  const w = word.toLowerCase();
  let out = '';
  let i = 0;
  while (i < w.length) {
    // numbers and punctuation pass through
    if (/[0-9.\-/]/.test(w[i])) {
      out += w[i];
      i += 1;
      continue;
    }
    // "x" between digits (4x2) stays latin — "ఎక్స్" would be nonsense there
    if (w[i] === 'x' && /\d/.test(w[i - 1] ?? '') && /\d/.test(w[i + 1] ?? '')) {
      out += 'x';
      i += 1;
      continue;
    }
    const cons = CONS.find(([en]) => w.startsWith(en, i));
    if (cons) {
      i += cons[0].length;
      const mat = MATRA.find(([en]) => w.startsWith(en, i));
      if (mat) {
        i += mat[0].length;
        out += cons[1] + mat[1];
      } else {
        out += cons[1] + '్'; // consonant with no vowel → halant
      }
      continue;
    }
    const vow = VOWEL.find(([en]) => w.startsWith(en, i));
    if (vow) {
      i += vow[0].length;
      out += vow[1];
      continue;
    }
    // unknown character — keep it
    out += w[i];
    i += 1;
  }
  // a trailing consonant without a vowel gets the halant stripped → just the letter
  return out.replace(/్(?=[క-హ]*$)/g, '');
}

/** "Well Ring 24 inch" → "బావి రింగ్ 24 ఇంచ్" */
export function teluguFromEnglish(input: string): string {
  const text = input.trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  // dictionary pass — longest phrase first; consumed spans become Telugu,
  // untouched words get transliterated
  const parts: Array<{ en: string; te?: string }> = [];
  let rest = lower;
  outer: while (rest.length) {
    const m = /^\s+/.exec(rest);
    if (m) {
      rest = rest.slice(m[0].length);
      continue;
    }
    for (const [en, te] of DICT) {
      if (rest.startsWith(en + ' ') || rest === en || rest.startsWith(en + ',') || rest.startsWith(en + '-')) {
        parts.push({ en, te });
        rest = rest.slice(en.length);
        continue outer;
      }
    }
    const word = /^\S+/.exec(rest)![0];
    parts.push({ en: word });
    rest = rest.slice(word.length);
  }
  const out = parts
    .map((p) => p.te ?? transliterate(p.en))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return out;
}

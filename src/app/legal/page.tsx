'use client';

/**
 * /legal — Privacy Policy, License and Copyright for the shop's billing app.
 * Standalone page (works on any device, also linked from the lock screen,
 * owner Settings and staff Profile). English / తెలుగు toggle, app-styled.
 */

import { useState } from 'react';

type Lang = 'en' | 'te';

const SHOP_EN = 'Sri Lakshmi Penchil Narasimha Swamy Cement Works';
const SHOP_TE = 'శ్రీ లక్ష్మీ పెంచిల్ నరసింహ స్వామి సిమెంట్ వర్క్స్';
const OWNER_EN = 'ARMURI PRASAD';
const OWNER_TE = 'ఆర్మురి ప్రసాద్';
const LAST_UPDATED_EN = '19 November 2026';
const LAST_UPDATED_TE = '19 నవంబర్ 2026';

const CONTENT = {
  en: {
    title: 'Privacy • License • Copyright',
    subtitle: `${SHOP_EN} — Proprietor: ${OWNER_EN}`,
    chips: [
      { id: 'privacy', label: 'Privacy Policy' },
      { id: 'license', label: 'License' },
      { id: 'copyright', label: 'Copyright' },
    ],
    privacy: {
      heading: 'Privacy Policy',
      intro: `This app is the private billing tool of ${SHOP_EN} ("the shop", "we"), Velagatoor to Jagitala road, Velagtoor. This policy explains, in plain language, what the app stores, who can see it and what we never do with it.`,
      blocks: [
        {
          h: 'What we store',
          p: 'Products (names, sizes, prices and product photos), bills (customer name, phone number, address, items, payment mode and notes), the labour register, and shop settings (business name, owner name, UPI ID for the payment QR code, GST rate). Staff accounts hold a name, Staff ID, profile photo and mobile number. Passwords and MPINs are stored only as salted one-way hashes (scrypt) — nobody, including us, can read them back.',
        },
        {
          h: 'Where it is stored',
          p: 'On the shop\u2019s own app server (prasad.space-z.ai) and as an offline copy on each signed-in device. There are no advertising networks, no analytics trackers and no third-party data brokers involved anywhere in this app.',
        },
        {
          h: 'Who can see it',
          p: 'The owner (everything, including cost and profit figures) and signed-in staff members (only what their work needs — cost and profit data are filtered out for staff). No one else. We do not sell, rent or share your data with anyone.',
        },
        {
          h: 'When data leaves the app',
          p: 'Only when someone taps Share — for example sending a bill to a customer on WhatsApp, or saving a bill image to the device. Nothing is ever sent automatically, and no customer list is exported anywhere.',
        },
        {
          h: 'How long we keep it, and deleting it',
          p: 'Bills, products and staff accounts are kept while the shop needs them for its records. The owner can delete any item — a deletion syncs to every device and cannot come back. If you are a customer or a staff member and want your data removed, contact the shop owner below and it will be deleted.',
        },
        {
          h: 'Your choices',
          p: 'Staff members can change their password, MPIN, photo and mobile number themselves in the Profile tab. Customers can ask for a bill copy or a correction at the shop counter.',
        },
        {
          h: 'Contact',
          p: `${OWNER_EN} — phone 99121 79771 (WhatsApp 90591 79771) — Velagatoor to Jagitala road, Velagtoor, Prasad cement work.`,
        },
        {
          h: 'Changes to this policy',
          p: 'If the policy changes, the new version ships with an app update and the "last updated" date below changes.',
        },
      ],
    },
    license: {
      heading: 'License',
      intro: `This software is proprietary. It is licensed (not sold) to the shop owner ${OWNER_EN} / ${SHOP_EN} for use in this single business.`,
      blocks: [
        {
          h: 'You may',
          p: 'Use the app on the owner\u2019s and staff members\u2019 devices for the shop\u2019s own work, and keep device-local offline copies that the app makes by itself.',
        },
        {
          h: 'You may not',
          p: 'Copy, redistribute, resell or sublicense the app or its source code; use it for any other business; publish it; or remove the copyright and legal notices. Reverse engineering is allowed only to the extent the law permits.',
        },
        {
          h: 'Third-party software',
          p: 'The app is built on open-source components (Next.js, React, Prisma and others), which remain under their own licenses, mainly MIT. The Noto Sans / Noto Sans Telugu fonts are used under the SIL Open Font License. Nothing in this license restricts those components\u2019 own terms.',
        },
        {
          h: 'Warranty and liability',
          p: 'The app is provided "as is", without warranty of any kind. The shop owner is responsible for the business data entered into the app and for keeping device access safe. To the maximum extent permitted by law, liability is limited to the license fee paid for the app.',
        },
      ],
    },
    copyright: {
      heading: 'Copyright',
      intro: `© 2026 ${SHOP_EN} (Proprietor: ${OWNER_EN}). All rights reserved.`,
      blocks: [
        {
          h: 'What is protected',
          p: 'The app\u2019s design, code and text are for the exclusive use of this shop. The business data in it — products, product photos, bills, customer and staff records — belongs to the shop owner.',
        },
        {
          h: 'Permission granted to staff',
          p: 'A staff account grants permission to use the app for shop work only, while that person works for the shop. The permission ends when the staff account is removed or deactivated.',
        },
        {
          h: 'Other names',
          p: 'WhatsApp, Android, Google Play and other product names belong to their respective owners and are mentioned only where the app connects to those services at your request.',
        },
      ],
    },
    footer: 'Last updated',
    langBtn: 'తెలుగు',
    back: '← Back to app',
  },
  te: {
    title: 'గోప్యతా విధానం • లైసెన్స్ • కాపీరైట్',
    subtitle: `${SHOP_TE} — యజమాని: ${OWNER_TE}`,
    chips: [
      { id: 'privacy', label: 'గోప్యతా విధానం' },
      { id: 'license', label: 'లైసెన్స్' },
      { id: 'copyright', label: 'కాపీరైట్' },
    ],
    privacy: {
      heading: 'గోప్యతా విధానం',
      intro: `ఈ యాప్ ${SHOP_TE} ("మా షాపు") సొంత బిల్లింగ్ సాధనం — వెలగటూర్ టు జగిత్యాల రోడ్, వెలగటూర్. యాప్‌లో ఏమి నిల్వ ఉంటుందో, ఎవరు చూడగలరో, మేము ఏం చేయమో సరళంగా ఇక్కడ ఉంది.`,
      blocks: [
        {
          h: 'మేము ఏమి నిల్వ ఉంచుతాము',
          p: 'ఉత్పత్తులు (పేర్లు, సైజులు, ధరలు, ఫోటోలు), బిల్లులు (కస్టమర్ పేరు, ఫోన్ నంబర్, చిరునామా, ఐటమ్‌లు, చెల్లింపు విధానం, నోట్స్), లేబర్ రిజిస్టర్, షాప్ సెట్టింగ్‌లు (వ్యాపార పేరు, యజమాని పేరు, పేమెంట్ QR కోసం UPI ID, GST రేటు). స్టాఫ్ ఖాతాల్లో పేరు, స్టాఫ్ ID, ఫోటో, మొబైల్ నంబర్ ఉంటాయి. పాస్‌వర్డ్‌లు, MPIN లు సంకేతీకరించిన (salted scrypt hash) రూపంలో మాత్రమే నిల్వ ఉంటాయి — ఎవరూ, మేమే కూడా, వాటిని చదవలేరు.',
        },
        {
          h: 'ఎక్కడ నిల్వ ఉంటుంది',
          p: 'షాప్ సొంత యాప్ సర్వర్‌లో (prasad.space-z.ai) మరియు లాగిన్ అయిన ప్రతి ఫోన్‌లో ఆఫ్‌లైన్ కాపీగా. ఈ యాప్‌లో ప్రకటనల నెట్‌వర్క్‌లు లేవు, ట్రాకింగ్ లేదు, మూడో పక్షం డేటా కంపెనీలు లేవు.',
        },
        {
          h: 'ఎవరు చూడగలరు',
          p: 'యజమాని (అంతా — ఖరీదు, లాభం సహా) మరియు సైన్ ఇన్ అయిన స్టాఫ్ (తమ పనికి కావాల్సినవి మాత్రమే — స్టాఫ్‌కి ఖరీదు/లాభం కనబడదు). ఇంకెవరూ కాదు. మేము మీ డేటాను ఎవరికీ అమ్మము, అద్దెకు ఇవ్వము, పంచము.',
        },
        {
          h: 'డేటా యాప్ బయటకు వెళ్ళేది ఎప్పుడు',
          p: 'మీరు షేర్ బటన్ నొక్కినప్పుడు మాత్రమే — ఉదాహరణకు WhatsApp లో కస్టమర్‌కు బిల్లు పంపడం, లేదా బిల్లు ఇమేజ్‌ను ఫోన్‌లో సేవ్ చేయడం. స్వయంచాలకంగా ఏమీ పంపబడదు; కస్టమర్ లిస్ట్ ఎక్కడికీ ఎగుమతి చేయబడదు.',
        },
        {
          h: 'ఎంత కాలం ఉంచుతాము, తొలగింపు',
          p: 'బిల్లులు, ఉత్పత్తులు, స్టాఫ్ ఖాతాలు — షాప్ రికార్డుల కోసం అవసరమైనంత కాలం ఉంటాయి. యజమాని ఏదైనా తొలగిస్తే అది అన్ని ఫోన్ల నుండి తొలగి, తిరిగి రాదు. మీరు కస్టమర్ లేదా స్టాఫ్ అయి ఉండి, మీ డేటా తొలగించాలనుకుంటే — కింద ఉన్న నంబర్‌లో యజమానిని సంప్రదించండి, తొలగించబడుతుంది.',
        },
        {
          h: 'మీ ఎంపికలు',
          p: 'స్టాఫ్ సభ్యులు తమ పాస్‌వర్డ్, MPIN, ఫోటో, మొబైల్ నంబర్ తామే మార్చుకోవచ్చు (Profile ట్యాబ్). కస్టమర్లు షాప్ కౌంటర్‌లో బిల్లు కాపీ లేదా సరిదిద్దుబాటు అడగవచ్చు.',
        },
        {
          h: 'సంప్రదింపు',
          p: `${OWNER_TE} — ఫోన్ 99121 79771 (WhatsApp 90591 79771) — వెలగటూర్ టు జగిత్యాల రోడ్, వెలగటూర్, ప్రసాద్ సిమెంట్ వర్క్.`,
        },
        {
          h: 'ఈ విధానంలో మార్పులు',
          p: 'విధానం మారితే, కొత్త యాప్ అప్‌డేట్‌తో అది అందుతుంది — కింద ఉన్న "చివరిగా నవీకరించిన తేదీ" మారుతుంది.',
        },
      ],
    },
    license: {
      heading: 'లైసెన్స్',
      intro: `ఈ సాఫ్ట్‌వేర్ ప్రైవేట్‌ది. ఇది అమ్మకం కాదు — షాప్ యజమాని ${OWNER_TE} / ${SHOP_TE} ఒక్క ఈ వ్యాపారంలో వాడుకోవడానికి మాత్రమే ఇచ్చిన వాడుక హక్కు.`,
      blocks: [
        {
          h: 'చేయవచ్చు',
          p: 'యజమాని, స్టాఫ్ ఫోన్లలో షాప్ పని కోసం యాప్ వాడుకోవచ్చు; యాప్ తానే చేసుకునే ఆఫ్‌లైన్ కాపీ ఫోన్‌లో ఉంచుకోవచ్చు.',
        },
        {
          h: 'చేయకూడదు',
          p: 'యాప్‌ను లేదా దాని కోడ్‌ను కాపీ చేసి పంపిణీ చేయడం, తిరిగి అమ్మడం, ఎవరికీ అద్దెకు ఇవ్వడం; వేరే వ్యాపారంలో వాడటం; బహిర్ంగపరచడం; కాపీరైట్/చట్టపరమైన నోటీసులు తీసేయడం — చేయకూడదు. చట్టం అనుమతించినంత వరకే రివర్స్ ఇంజనీరింగ్ అనుమతి.',
        },
        {
          h: 'ఓపెన్ సోర్స్ భాగాలు',
          p: 'యాప్ Next.js, React, Prisma వంటి ఓపెన్ సోర్స్ భాగాలపై నిర్మించబడింది — అవి వాటి సొంత లైసెన్స్‌లలో (ప్రధానంగా MIT) కొనసాగుతాయి. Noto Sans / Noto Sans Telugu ఫాంట్లు SIL Open Font License కింద వాడబడ్డాయి. ఈ లైసెన్స్ ఆ భాగాల సొంత నిబంధనలను పరిమితం చేయదు.',
        },
        {
          h: 'వారంటీ, బాధ్యత',
          p: 'యాప్ "అలాగే" (as is) అందించబడింది — ఎలాంటి వారంటీ లేదు. యాప్‌లో చేర్చిన వ్యాపార డేటా, ఫోన్ యాక్సెస్ భద్రత — షాప్ యజమాని బాధ్యత. చట్టం అనుమతించిన గరిష్ఠ పరిధి వరకే బాధ్యత పరిమితం.',
        },
      ],
    },
    copyright: {
      heading: 'కాపీరైట్',
      intro: `© 2026 ${SHOP_TE} (యజమాని: ${OWNER_TE}). అన్ని హక్కులు రిజర్వ్ చేయబడినవి.`,
      blocks: [
        {
          h: 'రక్షించబడేవి',
          p: 'యాప్ రూపకల్పన, కోడ్, పాఠ్యం — ఈ షాప్ వాడకానికి మాత్రమే. లోపలి వ్యాపార డేటా (ఉత్పత్తులు, ఫోటోలు, బిల్లులు, కస్టమర్, స్టాఫ్ రికార్డులు) — షాప్ యజమాని ఆస్తి.',
        },
        {
          h: 'స్టాఫ్‌కి ఇచ్చిన అనుమతి',
          p: 'స్టాఫ్ ఖాతా అంటే — ఆ వ్యక్తి షాప్‌లో పనిచేస్తున్నంత కాలం, షాప్ పని కోసం మాత్రమే యాప్ వాడే అనుమతి. ఖాతా తొలగించబడితే లేదా నిలిపివేయబడితే ఆ అనుమతి ముగింపులోకి వస్తుంది.',
        },
        {
          h: 'ఇతర పేర్లు',
          p: 'WhatsApp, Android, Google Play వంటి పేర్లు వాటి యజమానులవి — మీ అభ్యర్థన మేరకు యాప్ ఆ సేవలతో కలిసి పనిచేసే చోట్ల మాత్రమే ప్రస్తావించబడ్డాయి.',
        },
      ],
    },
    footer: 'చివరిగా నవీకరించబడింది',
    langBtn: 'English',
    back: '← యాప్‌కి తిరిగి',
  },
} as const;

export default function LegalPage() {
  const [lang, setLang] = useState<Lang>('en');
  const c = CONTENT[lang];

  const Section = ({ id, heading, intro, blocks }: { id: string; heading: string; intro: string; blocks: readonly { h: string; p: string }[] }) => (
    <section id={id} className="scroll-mt-16 space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{heading}</h2>
      <p className="text-sm leading-relaxed text-neutral-700">{intro}</p>
      {blocks.map((b) => (
        <div key={b.h} className="space-y-1">
          <h3 className="text-sm font-bold text-blue-800">{b.h}</h3>
          <p className="text-sm leading-relaxed text-neutral-700">{b.p}</p>
        </div>
      ))}
    </section>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-blue-50/40 px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{c.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{c.subtitle}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
            className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50"
          >
            {c.langBtn}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {c.chips.map((ch) => (
            <a
              key={ch.id}
              href={`#${ch.id}`}
              className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              {ch.label}
            </a>
          ))}
        </div>

        <Section id="privacy" heading={c.privacy.heading} intro={c.privacy.intro} blocks={c.privacy.blocks} />
        <Section id="license" heading={c.license.heading} intro={c.license.intro} blocks={c.license.blocks} />
        <Section id="copyright" heading={c.copyright.heading} intro={c.copyright.intro} blocks={c.copyright.blocks} />

        <p className="pb-6 text-center text-[11px] text-muted-foreground">
          {c.footer}: {lang === 'en' ? LAST_UPDATED_EN : LAST_UPDATED_TE} • v56 •{' '}
          <a href="/" className="font-bold text-blue-700 hover:underline">
            {c.back}
          </a>
        </p>
      </div>
    </div>
  );
}

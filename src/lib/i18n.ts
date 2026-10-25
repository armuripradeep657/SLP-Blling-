// Bill language labels — English + Telugu (thermal slip, WhatsApp text, SMS)
import type { BillLanguage } from './types';

export interface SlipLabels {
  proprietor: string;
  itemSize: string;
  amount: string;
  size: string;
  lessDiscount: string; // shown as "<lessDiscount> - Rs. X"
  subtotal: string;
  itemDiscounts: string;
  discount: string;
  labour: string;
  auto: string;
  total: string;
  payment: string;
  paid: string;
  balanceDue: string;
  balance: string;
  amountPaid: string; // PAID stamp text
  receivedThanks: string; // template {rs} {mode}
  scanPay: string; // template {rs} {upi}
  scanChat: string;
  statusDue: string;
  statusPartial: string;
  modes: Record<string, string>;
  thankYou: string;
  policy: string;
  powered: string;
  // message-builder words
  mInvoice: string;
  mDate: string;
  mCustomer: string;
  mMobile: string;
  mSubtotal: string;
  mDiscount: string;
  mPaidBal: string; // template "{paid} | {balance}"
  mThanks: string;
  mImageSeparately: string;
  capAttachedDue: string;
  capAttachedPaid: string;
}

export const EN_LABELS: SlipLabels = {
  proprietor: 'Proprietor',
  itemSize: 'ITEM / SIZE',
  amount: 'AMOUNT',
  size: 'Size',
  lessDiscount: 'less discount',
  subtotal: 'Subtotal',
  itemDiscounts: 'Item Discounts',
  discount: 'Discount',
  labour: 'Labour Charges',
  auto: 'Auto Charges',
  total: 'TOTAL',
  payment: 'Payment',
  paid: 'Paid',
  balanceDue: 'Balance Due',
  balance: 'Balance',
  amountPaid: 'AMOUNT PAID',
  receivedThanks: 'Received with thanks — Rs. {rs} ({mode})',
  scanPay: 'Scan to Pay Balance Rs. {rs} · UPI: {upi}',
  scanChat: 'Scan to chat on WhatsApp',
  statusDue: 'DUE',
  statusPartial: 'PARTIAL',
  modes: { Cash: 'Cash', UPI: 'UPI', Card: 'Card', Due: 'Due' },
  thankYou: 'Thank you! Visit Again',
  policy: 'Goods once sold will not be taken back',
  powered: 'Powered by SLP Billing App',
  mInvoice: 'INVOICE',
  mDate: 'Date',
  mCustomer: 'Customer',
  mMobile: 'Mobile',
  mSubtotal: 'Subtotal',
  mDiscount: 'Discount',
  mPaidBal: '{paid} | Balance: {balance}',
  mThanks: 'Thank you! Visit Again',
  mImageSeparately: 'Bill image shared separately',
  capAttachedDue: 'Bill image attached — scan the UPI QR in it to pay the balance',
  capAttachedPaid: 'Bill image attached — amount fully paid, thank you',
};

export const TE_LABELS: SlipLabels = {
  proprietor: 'యజమాని',
  itemSize: 'వస్తువు / సైజ్',
  amount: 'మొత్తం',
  size: 'సైజ్',
  lessDiscount: 'తగ్గింపు',
  subtotal: 'ఉపమొత్తం',
  itemDiscounts: 'వస్తువుల తగ్గింపు',
  discount: 'తగ్గింపు',
  labour: 'కూలి చార్జీలు',
  auto: 'ఆటో చార్జీలు',
  total: 'మొత్తం',
  payment: 'చెల్లింపు',
  paid: 'చెల్లించినది',
  balanceDue: 'బాకీ',
  balance: 'బాకీ',
  amountPaid: 'మొత్తం చెల్లించబడింది',
  receivedThanks: 'ధన్యవాదాలతో అందుకున్నాము — రూ. {rs} ({mode})',
  scanPay: 'బాకీ రూ. {rs} చెల్లించడానికి స్కాన్ చేయండి · UPI: {upi}',
  scanChat: 'WhatsApp చాట్ కోసం స్కాన్ చేయండి',
  statusDue: 'బాకీ',
  statusPartial: 'పాక్షికం',
  modes: { Cash: 'నగదు', UPI: 'UPI', Card: 'కార్డ్', Due: 'బాకీ' },
  thankYou: 'ధన్యవాదాలు! మళ్ళీ రండి',
  policy: 'అమ్మిన వస్తువులు తిరిగి తీసుకోబడవు',
  powered: 'SLP బిల్లింగ్ యాప్ ద్వారా',
  mInvoice: 'బిల్లు',
  mDate: 'తేదీ',
  mCustomer: 'కస్టమర్',
  mMobile: 'మొబైల్',
  mSubtotal: 'ఉపమొత్తం',
  mDiscount: 'తగ్గింపు',
  mPaidBal: 'చెల్లించినది: {paid} | బాకీ: {balance}',
  mThanks: 'ధన్యవాదాలు! మళ్ళీ రండి',
  mImageSeparately: 'బిల్లు ఇమేజ్ విడిగా పంపబడుతుంది',
  capAttachedDue: 'బిల్లు ఇమేజ్ జోడించబడింది — బాకీ చెల్లించడానికి UPI QR స్కాన్ చేయండి',
  capAttachedPaid: 'బిల్లు ఇమేజ్ జోడించబడింది — మొత్తం చెల్లింపు పూర్తి, ధన్యవాదాలు',
};

export function labels(lang: BillLanguage | undefined): SlipLabels {
  return lang === 'te' ? TE_LABELS : EN_LABELS;
}

/** Fill {tokens} in a label template */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

/** UI chips for the language selector */
export const BILL_LANGUAGES: { value: BillLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'తెలుగు' },
];

/** Font stack for the thermal slip — Telugu glyphs need the bundled Noto Sans Telugu */
export function slipFontFamily(lang: BillLanguage | undefined): string {
  return lang === 'te'
    ? '"Noto Sans Telugu", "Courier New", Courier, ui-monospace, monospace'
    : '"Courier New", Courier, ui-monospace, SFMono-Regular, Menlo, monospace';
}

// Bill language labels — English + Telugu + Both (bilingual)
// + App UI language labels (English / తెలుగు) for the whole app chrome.
import type { AppLanguage, BillLanguage } from './types';

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
  mPaidBal: string; // template "{paid} {balance}"
  mThanks: string;
  mImageSeparately: string;
  capAttachedDue: string;
  capAttachedPaid: string;
  // formal invoice document
  billTo: string;
  tSno: string;
  tItem: string;
  tQty: string;
  tRate: string;
  sigFor: string; // template "{company}"
  invoiceNoLabel: string;
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
  scanPay: 'Scan to Pay Balance Rs. {rs}',
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
  billTo: 'Bill To',
  tSno: 'S.No',
  tItem: 'Item',
  tQty: 'Qty',
  tRate: 'Rate',
  sigFor: 'For {company}',
  invoiceNoLabel: 'Invoice No.',
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
  scanPay: 'బాకీ రూ. {rs} చెల్లించడానికి స్కాన్ చేయండి',
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
  billTo: 'కస్టమర్ వివరాలు',
  tSno: 'వరుస',
  tItem: 'వస్తువు',
  tQty: 'సంఖ్య',
  tRate: 'రేటు',
  sigFor: '{company} తరఫున',
  invoiceNoLabel: 'బిల్లు నంబర్',
};

/** Bilingual labels — Telugu first, English second (used when bill language = Both) */
export const BOTH_LABELS: SlipLabels = (() => {
  const out = {} as SlipLabels;
  (Object.keys(EN_LABELS) as (keyof SlipLabels)[]).forEach((k) => {
    const en = EN_LABELS[k];
    const te = TE_LABELS[k];
    if (k === 'modes') {
      out.modes = { Cash: 'నగదు / Cash', UPI: 'UPI', Card: 'కార్డ్ / Card', Due: 'బాకీ / Due' };
    } else if (typeof en === 'string' && typeof te === 'string') {
      (out as unknown as Record<string, string>)[k] = `${te} / ${en}`;
    } else {
      (out as unknown as Record<string, unknown>)[k] = en;
    }
  });
  return out;
})();

export function labels(lang: BillLanguage | undefined): SlipLabels {
  return lang === 'te' ? TE_LABELS : lang === 'both' ? BOTH_LABELS : EN_LABELS;
}

/** Currency prefix on bill amounts — Telugu bills use రూ., English/Both keep Rs. */
export function cur(lang: BillLanguage | undefined): string {
  return lang === 'te' ? 'రూ.' : 'Rs.';
}

/** Company name in the bill language — Telugu name when set, English otherwise */
export function companyNameFor(
  s: { companyName: string; companyNameTe?: string },
  lang: BillLanguage | undefined
): string {
  return lang === 'te' && s.companyNameTe && s.companyNameTe.trim() ? s.companyNameTe : s.companyName;
}

/**
 * Company name lines for printed documents — "Both" prints the Telugu name
 * above the English name.
 */
export function companyLines(
  s: { companyName: string; companyNameTe?: string },
  lang: BillLanguage | undefined
): string[] {
  const te = (s.companyNameTe ?? '').trim();
  const en = (s.companyName ?? '').trim();
  if (lang === 'te') return [te || en];
  if (lang === 'both') {
    const lines = te && te !== en ? [te, en] : [en || te];
    return lines.filter(Boolean);
  }
  return [en || te];
}

/** Item name in the bill language — Telugu product name when set, otherwise the English one */
export function itemLabel(it: { name: string; nameTe?: string }, lang: BillLanguage | undefined): string {
  const te = (it.nameTe ?? '').trim();
  if (lang === 'te') return te || it.name;
  if (lang === 'both') return te && te !== it.name ? `${te} / ${it.name}` : it.name;
  return it.name;
}

/** Fill {tokens} in a label template */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

/** UI chips for the bill language selector — English, Telugu or Both */
export const BILL_LANGUAGES: { value: BillLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'both', label: 'రెండూ · Both' },
];

/** Font stack for the thermal slip — Telugu glyphs need the bundled Noto Sans Telugu */
export function slipFontFamily(lang: BillLanguage | undefined): string {
  return lang === 'en'
    ? '"Courier New", Courier, ui-monospace, SFMono-Regular, Menlo, monospace'
    : '"Noto Sans Telugu", "Courier New", Courier, ui-monospace, monospace';
}

/* ------------------------------------------------------------------ */
/* Driver slip labels (items + quantities only — no prices)            */
/* ------------------------------------------------------------------ */

export interface DriverLabels {
  title: string;
  deliverTo: string;
  driver: string;
  vehicle: string;
  address: string;
  date: string;
  invoiceNo: string;
  customer: string;
  mobile: string;
  item: string;
  qty: string;
  totalQty: string;
  note: string;
  driverSign: string;
}

export const EN_DRIVER: DriverLabels = {
  title: 'DELIVERY SLIP',
  deliverTo: 'Deliver To',
  driver: 'Driver',
  vehicle: 'Vehicle No.',
  address: 'Address',
  date: 'Date',
  invoiceNo: 'Invoice No.',
  customer: 'Customer',
  mobile: 'Mobile',
  item: 'ITEM',
  qty: 'QTY',
  totalQty: 'Total Quantity',
  note: 'No prices on this slip — items and quantities only',
  driverSign: 'Driver Signature',
};

export const TE_DRIVER: DriverLabels = {
  title: 'డెలివరీ స్లిప్',
  deliverTo: 'పంపే చోటు',
  driver: 'డ్రైవర్',
  vehicle: 'వాహనం నంబర్',
  address: 'చిరునామా',
  date: 'తేదీ',
  invoiceNo: 'బిల్లు నంబర్',
  customer: 'కస్టమర్',
  mobile: 'మొబైల్',
  item: 'వస్తువు',
  qty: 'సంఖ్య',
  totalQty: 'మొత్తం సంఖ్య',
  note: 'ఈ స్లిప్‌పై ధరలు లేవు — వస్తువులు, సంఖ్యలు మాత్రమే',
  driverSign: 'డ్రైవర్ సంతకం',
};

export const BOTH_DRIVER: DriverLabels = {
  title: 'డెలివరీ స్లిప్ / DELIVERY SLIP',
  deliverTo: 'పంపే చోటు / Deliver To',
  driver: 'డ్రైవర్ / Driver',
  vehicle: 'వాహనం నంబర్ / Vehicle No.',
  address: 'చిరునామా / Address',
  date: 'తేదీ / Date',
  invoiceNo: 'బిల్లు నంబర్ / Invoice No.',
  customer: 'కస్టమర్ / Customer',
  mobile: 'మొబైల్ / Mobile',
  item: 'వస్తువు / ITEM',
  qty: 'సంఖ్య / QTY',
  totalQty: 'మొత్తం సంఖ్య / Total Quantity',
  note: 'ఈ స్లిప్‌పై ధరలు లేవు / No prices on this slip',
  driverSign: 'డ్రైవర్ సంతకం / Driver Signature',
};

export function driverLabels(lang: BillLanguage | undefined): DriverLabels {
  return lang === 'te' ? TE_DRIVER : lang === 'both' ? BOTH_DRIVER : EN_DRIVER;
}

/* ------------------------------------------------------------------ */
/* App UI language — the whole app switches between English and Telugu */
/* ------------------------------------------------------------------ */

export const APP_EN = {
  // nav
  'nav.bill': 'Bill',
  'nav.products': 'Products',
  'nav.ledger': 'Ledger',
  'nav.labour': 'Labour',
  'nav.history': 'History',
  'nav.settings': 'Settings',
  'nav.newBill': 'New Bill',
  'nav.invoiceHistory': 'Invoice History',
  'nav.switchLang': 'Switch app language',
  'header.proprietor': 'Proprietor',
  'header.offline': 'Offline',
  // common bill panel
  'bill.customer': 'Customer',
  'bill.customerName': 'Customer name',
  'bill.mobile': 'Mobile / WhatsApp',
  'bill.addressOptional': 'Address (optional)',
  'bill.language': 'Bill language · బిల్లు భాష',
  'bill.items': 'Items',
  'bill.clear': 'Clear',
  'bill.priceUnit': 'Price ₹ (unit)',
  'bill.discountItem': 'Discount ₹',
  'bill.size': 'Size',
  'bill.discount': 'Discount',
  'bill.labour': 'Labour charges (if any)',
  'bill.auto': 'Auto charges (if any)',
  'bill.paymentMode': 'Payment mode',
  'bill.amountPaid': 'Amount paid',
  'bill.advance': '(advance)',
  'bill.full': 'Full',
  'bill.subtotal': 'Subtotal',
  'bill.itemDiscounts': 'Item discounts',
  'bill.grandTotal': 'Grand Total',
  'bill.balanceDue': 'Balance due',
  'bill.complete': 'Complete Bill — Thermal Slip',
  'bill.invoiceNumbered': 'Invoice will be numbered',
  'bill.noItems': 'No items in the bill',
  'bill.noItemsHint': 'Tap a size button on any product to add it.',
  // delivery
  'delivery.title': 'Delivery',
  'delivery.delivered': 'Delivered — add driver, vehicle & address',
  'delivery.driver': 'Driver name',
  'delivery.vehicle': 'Vehicle number',
  'delivery.address': 'Delivery address',
  'delivery.driverSlipNote': 'Driver slip: items & quantities only — no prices.',
  // catalog / products
  'cat.search': 'Search products…',
  'cat.custom': 'Custom',
  'cat.noProducts': 'No products found. Add products in the Products tab.',
  'cat.outOfStock': 'Out of stock',
  'cat.stock': 'Stock',
  'cat.from': 'from',
  'cat.customItem': 'Add custom item',
  'cat.customItemDesc': 'Added to the bill now — and saved to your product list with this name, size & price for next time.',
  'cat.itemName': 'Item name *',
  'cat.itemNameTe': 'Item name in Telugu (optional — తెలుగు పేరు)',
  'cat.sizePh': 'Size (e.g. 10FT)',
  'cat.pricePh': 'Price ₹ *',
  'cat.qty': 'Quantity',
  'cat.addToBill': 'Add to Bill',
  'products.catalog': 'Product Catalog',
  'products.add': 'Add',
  'products.edit': 'Edit',
  'products.editProduct': 'Edit product',
  'products.addProduct': 'Add product',
  'products.formDesc': 'Set name, image, price, sizes & stock.',
  'products.uploadPhoto': 'Upload photo',
  'products.takePhoto': 'Take with camera',
  'products.removePhoto': 'Remove photo',
  'products.sampleImage': 'Or pick a sample image',
  'products.name': 'Product name *',
  'products.nameTe': 'Product name in Telugu (తెలుగు పేరు) — printed on Telugu bills',
  'products.category': 'Category',
  'products.basePrice': 'Base price ₹ *',
  'products.sizes': 'Sizes (tap to add or type custom)',
  'products.customSize': 'Custom size (e.g. 4x3 FT)',
  'products.stock': 'Stock (optional)',
  'products.saveChanges': 'Save changes',
  'products.noProductsYet': 'No products yet — tap Add to create your first product.',
  'products.tapSize': 'Products — tap a size to bill',
  // history
  'history.totalBilled': 'Total billed',
  'history.balanceDue': 'Balance due',
  'history.invoices': 'invoices',
  'history.pending': 'pending',
  'history.search': 'Search by invoice, customer or phone…',
  'history.markPaid': 'Mark Paid',
  'history.invoice': 'Invoice',
  'history.slip': 'Slip',
  'history.driver': 'Driver',
  'history.delete': 'Delete',
  'history.deleteTitle': 'Delete invoice?',
  'history.deleteDesc': 'will be removed permanently.',
  'history.cancel': 'Cancel',
  'history.walkin': 'Walk-in customer',
  'history.noBills': 'No bills yet. Complete your first bill from the Bill tab.',
  'history.noMatch': 'No invoices match your search.',
  'history.items': 'items',
  // ledger
  'ledger.title': 'Ledger',
  'ledger.day': 'Day',
  'ledger.allDays': 'All days',
  'ledger.dues': 'Dues',
  'ledger.expenses': 'Expenses',
  'ledger.income': 'Income',
  'ledger.spent': 'Spent',
  'ledger.net': 'Net',
  'ledger.date': 'Date',
  'ledger.month': 'Month',
  'ledger.noActivity': 'No income or expenses on this day.',
  'ledger.receivedFrom': 'Received from',
  'ledger.totalDue': 'Total balance due',
  'ledger.receive': 'Receive',
  'ledger.receiveAmount': 'Amount received ₹',
  'ledger.receiveMode': 'Payment mode',
  'ledger.receiveConfirm': 'Receive payment',
  'ledger.receiveDone': 'Balance payment received — counted as income today',
  'ledger.noDues': 'No dues pending — all bills are fully paid.',
  'ledger.expCategory': 'Expense category',
  'ledger.expAmount': 'Amount ₹',
  'ledger.expNote': 'Note (optional)',
  'ledger.time': 'Time',
  'ledger.person': 'Person name',
  'ledger.personPlaceholder': 'e.g. Ramesh (labour)',
  'ledger.purpose': 'Purpose',
  'ledger.purposePlaceholder': 'e.g. site labour, diesel…',
  'ledger.addExpense': 'Add expense',
  'ledger.expAdded': 'Expense added',
  'ledger.monthSpent': 'Spent this month',
  'ledger.noExpenses': 'No expenses yet. Add wages, diesel or raw-material costs above.',
  'ledger.incName': 'Name / details',
  'ledger.incPlaceholder': 'e.g. Ramesh · stone sale',
  'ledger.addIncome': 'Add income',
  'ledger.incAdded': 'Income added',
  'ledger.monthIncome': 'Income this month',
  'ledger.noIncomes': 'No manual income yet. Add cash or UPI receipts above.',
  'ledger.noDuesSelected': 'No dues',
  'ledger.dayTotal': 'Day total',
  'ledger.monthTotal': 'Month total',
  'ledger.todayIncome': "Today's income",
  // labour work — own tab beside the ledger (who · when · what · product QUANTITY · money paid now + balance)
  'labour.title': 'Labour work',
  'labour.paidMonth': 'Paid this month',
  'labour.balanceMonth': 'Balance to pay',
  'labour.worksMonth': 'Work entries',
  'labour.name': 'Worker name',
  'labour.namePlaceholder': 'e.g. Ramesh',
  'labour.work': 'What work they did',
  'labour.workPlaceholder': 'e.g. ring making, moulding…',
  'labour.qty': 'Product quantity (nos)',
  'labour.qtyPlaceholder': 'e.g. 25',
  'labour.qtyUnit': 'nos',
  'labour.paid': 'Paid now ₹',
  'labour.balance': 'Balance ₹ (to pay)',
  'labour.mode': 'How the money was given',
  'labour.wagesTotal': 'Total wages',
  'labour.rowPaid': 'Paid',
  'labour.rowBalance': 'Balance',
  'labour.add': 'Add labour work',
  'labour.added': 'Labour work added',
  'labour.empty': 'No labour work yet. Add who worked, the date, what they did, the product quantity and the money — paid now and balance.',
  // lock screen — MPIN login (the only login) & MPIN unlock
  'lock.subtitle': 'Locked — enter your MPIN',
  'lock.checking': 'Checking…',
  'lock.retry': 'Try again',
  'lock.setPinTitle': 'Create your MPIN',
  'lock.setPinDesc': 'Your MPIN locks all your data end-to-end. You enter it whenever you open the app after locking, or on a new phone. Do not share it.',
  'lock.unlockTitle': 'Enter your MPIN',
  'lock.unlockDesc': 'Your data is encrypted with this MPIN — without it the saved cloud data cannot be opened.',
  'lock.pinLabel': 'MPIN (4–8 digits)',
  'lock.pinConfirm': 'Confirm MPIN',
  'lock.saveBtn': 'Save MPIN',
  'lock.unlockBtn': 'Open app',
  'lock.verifying': 'Opening…',
  'lock.secureNote': 'End-to-end encrypted — the server stores only encrypted data, only your MPIN can open it.',
  'lock.errPin': 'MPIN must be 4–8 digits.',
  'lock.errPinMatch': 'The two MPINs do not match.',
  'lock.errWrongPin': 'Wrong MPIN — try again.',
  'lock.errNetwork': 'Cannot reach the server — check your internet and try again.',
  'lock.errTooMany': 'Too many attempts. Please wait a minute and try again.',
  'lock.errExists': 'This app already has an MPIN — enter it to open.',
  // settings — sync & security
  'sync.title': 'Sync & security',
  'sync.desc': 'Bills, products, labour and ledger sync encrypted across all your phones. Login is your MPIN only — no OTP needed.',
  'sync.mpinOn': 'Protected with your MPIN',
  'sync.statusOn': 'Online — auto-sync is on',
  'sync.statusOff': 'Offline — changes will sync when internet returns',
  'sync.lastSync': 'Last synced: {time}',
  'sync.never': 'Not synced yet',
  'sync.now': 'Sync now',
  'sync.syncing': 'Syncing…',
  'sync.syncedToast': 'Data synced across your phones',
  'sync.syncFailedToast': 'Sync failed — check internet and try again',
  'sync.lockNow': 'Lock app',
  'sync.lockDesc': 'Locks this device: your data goes behind the MPIN gate. Data already on this phone stays but cannot be opened until you enter the MPIN.',
  'sync.lockedToast': 'App locked',
  'sync.e2eeNote': 'End-to-end encrypted: data is locked with your MPIN before it leaves this phone. The server keeps only encrypted data — nobody (not even the server) can read your bills.',
  // payment modes on UI
  'mode.cash': 'Cash',
  'mode.upi': 'UPI',
  'mode.card': 'Card',
  'mode.due': 'Due',
  // status
  'status.paid': 'Paid',
  'status.partial': 'Partial',
  'status.due': 'Due',
  // settings
  'settings.title': 'Settings',
  'settings.appLang': 'App language · యాప్ భాష',
  'settings.appLangDesc': 'Switch the whole app between English and తెలుగు.',
  'settings.businessIdentity': 'Business Identity',
  'settings.companyName': 'Company name',
  'settings.companyNameTe': 'Company name in Telugu (బిల్లు పేరు — తెలుగు)',
  'settings.ownerName': 'Owner / Proprietor name',
  'settings.phone': 'Phone',
  'settings.whatsapp': 'WhatsApp number',
  'settings.address': 'Shop address',
  'settings.upi': 'UPI ID (for balance QR)',
  'settings.billingSlip': 'Billing & Slip',
  'settings.invoicePrefix': 'Invoice prefix',
  'settings.nextInvoiceNo': 'Next invoice no.',
  'settings.slipWidth': 'Thermal slip width',
  'settings.thankYouNote': 'Thank-you note',
  'settings.returnPolicy': 'Terms / return policy',
  'settings.data': 'Data',
  'settings.resetCatalog': 'Reset products to factory catalog',
  'settings.eraseAll': 'Erase all data',
  'settings.checkUpdates': 'Check for updates now',
  'settings.updateHint': 'Edit any detail, then press the Update button to save it.',
  'settings.updateDetails': 'Update details',
  'settings.updatedToast': 'Details updated',
  'settings.updateBilling': 'Update bill settings',
  'settings.billingUpdatedToast': 'Bill settings updated',
  'settings.backup': 'Backup & restore',
  'settings.backupDesc':
    'Save a copy of everything — company details, products, bills, expenses & incomes — as one file. Keep it in Google Drive or send it to yourself on WhatsApp, and restore it on any phone.',
  'settings.backupBtn': 'Backup data',
  'settings.backupDone': 'Backup downloaded',
  'settings.backupProducts': 'products',
  'settings.backupBills': 'bills',
  'settings.backupFailed': 'Backup failed — please try again',
  'settings.restoreBtn': 'Restore backup',
  'settings.restoreConfirmTitle': 'Restore this backup?',
  'settings.restoreConfirmDesc':
    'Company details, products, bills and ledger on this phone will be replaced with the backup file. This cannot be undone.',
  'settings.restore': 'Restore',
  'settings.restoredToast': 'Backup restored',
  'settings.backupInvalid': 'That file is not a valid app backup',
  'settings.appearance': 'Appearance',
  'settings.appearanceDesc': 'Change the background, the header colour and your own watermark photo.',
  'settings.bgTheme': 'Background theme',
  'settings.headerColour': 'Header colour',
  'settings.watermark': 'Watermark photo',
  'settings.watermarkDesc': 'Pick a photo from your device — it shows faintly in the middle of the app and on the opening screen.',
  'settings.watermarkPick': 'Choose photo from device',
  'settings.watermarkReset': 'Use default logo',
  'settings.watermarkDone': 'Watermark photo updated',
  'settings.watermarkFailed': 'Could not use that photo',
  // page headings
  'page.currentBill': 'Current Bill',
  'page.viewBill': 'View Bill',
  'page.viewBillDesc': 'Review items, customer & payment — then generate the thermal slip.',
  'page.loading': 'Loading…',
  // install / update popup
  'install.title': 'App updated — Install it on your phone',
  'install.titleTe': 'యాప్ అప్‌డేట్ అయ్యింది — మీ ఫోన్‌లో ఇన్‌స్టాల్ చేయండి',
  'install.desc': 'The app just updated to the latest version. Install it now — free, works offline.',
  'install.benefitOffline': 'Works offline — no internet needed to bill',
  'install.benefitFast': 'Opens instantly, full-screen like a real app',
  'install.benefitSave': 'All bills saved safely on this device',
  'install.installApp': 'Install App',
  'install.howTo': 'How to Install',
  'install.notNow': 'Close',
} as const;

export type AppLangKey = keyof typeof APP_EN;

export const APP_TE: Record<AppLangKey, string> = {
  'nav.bill': 'బిల్లు',
  'nav.products': 'ఉత్పత్తులు',
  'nav.ledger': 'లెడ్జర్',
  'nav.labour': 'లేబర్',
  'nav.history': 'చరిత్ర',
  'nav.settings': 'సెట్టింగ్‌లు',
  'nav.newBill': 'కొత్త బిల్లు',
  'nav.invoiceHistory': 'బిల్లుల చరిత్ర',
  'nav.switchLang': 'యాప్ భాష మార్చు',
  'header.proprietor': 'యజమాని',
  'header.offline': 'ఆఫ్‌లైన్',
  'bill.customer': 'కస్టమర్',
  'bill.customerName': 'కస్టమర్ పేరు',
  'bill.mobile': 'మొబైల్ / WhatsApp',
  'bill.addressOptional': 'చిరునామా (ఐచ్ఛికం)',
  'bill.language': 'బిల్లు భాష · Bill language',
  'bill.items': 'వస్తువులు',
  'bill.clear': 'తొలగించు',
  'bill.priceUnit': 'ధర ₹ (యూనిట్)',
  'bill.discountItem': 'తగ్గింపు ₹',
  'bill.size': 'సైజ్',
  'bill.discount': 'తగ్గింపు',
  'bill.labour': 'కూలి చార్జీలు (ఉంటే)',
  'bill.auto': 'ఆటో చార్జీలు (ఉంటే)',
  'bill.paymentMode': 'చెల్లింపు విధానం',
  'bill.amountPaid': 'చెల్లించిన మొత్తం',
  'bill.advance': '(అడ్వాన్స్)',
  'bill.full': 'పూర్తి',
  'bill.subtotal': 'ఉపమొత్తం',
  'bill.itemDiscounts': 'వస్తువుల తగ్గింపు',
  'bill.grandTotal': 'గ్రాండ్ టోటల్',
  'bill.balanceDue': 'బాకీ',
  'bill.complete': 'బిల్లు పూర్తి — థర్మల్ స్లిప్',
  'bill.invoiceNumbered': 'బిల్లు నంబర్',
  'bill.noItems': 'బిల్లులో వస్తువులు లేవు',
  'bill.noItemsHint': 'వస్తువు జోడించడానికి ఏదైనా సైజ్ బటన్ నొక్కండి.',
  'delivery.title': 'డెలివరీ',
  'delivery.delivered': 'డెలివరీ — డ్రైవర్, వాహనం, చిరునామా జోడించు',
  'delivery.driver': 'డ్రైవర్ పేరు',
  'delivery.vehicle': 'వాహనం నంబర్',
  'delivery.address': 'డెలివరీ చిరునామా',
  'delivery.driverSlipNote': 'డ్రైవర్ స్లిప్: వస్తువులు & సంఖ్యలు మాత్రమే — ధరలు లేవు.',
  'cat.search': 'ఉత్పత్తులు వెతకండి…',
  'cat.custom': 'కస్టమ్',
  'cat.noProducts': 'ఉత్పత్తులు కనబడలేదు. ఉత్పత్తుల ట్యాబ్‌లో జోడించండి.',
  'cat.outOfStock': 'స్టాక్ లేదు',
  'cat.stock': 'స్టాక్',
  'cat.from': 'నుండి',
  'cat.customItem': 'కస్టమ్ వస్తువు జోడించు',
  'cat.customItemDesc': 'ఇప్పుడు బిల్లులో చేరుతుంది — ఈ పేరు, సైజ్, ధరతో మీ ఉత్పత్తుల జాబితాలో సేవ్ అవుతుంది.',
  'cat.itemName': 'వస్తువు పేరు *',
  'cat.itemNameTe': 'తెలుగులో వస్తువు పేరు (ఐచ్ఛికం)',
  'cat.sizePh': 'సైజ్ (ఉదా: 10FT)',
  'cat.pricePh': 'ధర ₹ *',
  'cat.qty': 'సంఖ్య',
  'cat.addToBill': 'బిల్లులో చేర్చు',
  'products.catalog': 'ఉత్పత్తుల జాబితా',
  'products.add': 'జోడించు',
  'products.edit': 'మార్చు',
  'products.editProduct': 'ఉత్పత్తి మార్చు',
  'products.addProduct': 'ఉత్పత్తి జోడించు',
  'products.formDesc': 'పేరు, ఫోటో, ధర, సైజులు, స్టాక్ సెట్ చేయండి.',
  'products.uploadPhoto': 'ఫోటో అప్‌లోడ్',
  'products.takePhoto': 'కెమెరాతో తీయు',
  'products.removePhoto': 'ఫోటో తొలగించు',
  'products.sampleImage': 'లేదా సాంపిల్ ఇమేజ్ ఎంచుకోండి',
  'products.name': 'ఉత్పత్తి పేరు *',
  'products.nameTe': 'తెలుగులో ఉత్పత్తి పేరు — తెలుగు బిల్లులపై అచ్చు అవుతుంది',
  'products.category': 'వర్గం',
  'products.basePrice': 'బేస్ ధర ₹ *',
  'products.sizes': 'సైజులు (నొక్కి జోడించండి లేదా టైప్ చేయండి)',
  'products.customSize': 'కస్టమ్ సైజ్ (ఉదా: 4x3 FT)',
  'products.stock': 'స్టాక్ (ఐచ్ఛికం)',
  'products.saveChanges': 'మార్పులు సేవ్ చేయు',
  'products.noProductsYet': 'ఇంకా ఉత్పత్తులు లేవు — మొదటిది జోడించడానికి జోడించు నొక్కండి.',
  'products.tapSize': 'ఉత్పత్తులు — బిల్లు చేయడానికి సైజ్ నొక్కండి',
  'history.totalBilled': 'మొత్తం బిల్లులు',
  'history.balanceDue': 'బాకీ మొత్తం',
  'history.invoices': 'బిల్లులు',
  'history.pending': 'పెండింగ్',
  'history.search': 'బిల్లు నంబర్, కస్టమర్ లేదా ఫోన్‌తో వెతకండి…',
  'history.markPaid': 'చెల్లించారు',
  'history.invoice': 'ఇన్వాయిస్',
  'history.slip': 'స్లిప్',
  'history.driver': 'డ్రైవర్',
  'history.delete': 'తొలగించు',
  'history.deleteTitle': 'బిల్లు తొలగించాలా?',
  'history.deleteDesc': 'శాశ్వతంగా తొలగించబడుతుంది.',
  'history.cancel': 'రద్దు',
  'history.walkin': 'నామవాచక కస్టమర్',
  'history.noBills': 'ఇంకా బిల్లులు లేవు. బిల్లు ట్యాబ్ నుండి మొదటి బిల్లు పూర్తి చేయండి.',
  'history.noMatch': 'మీ వెతుకులాటకు బిల్లులు లేవు.',
  'history.items': 'వస్తువులు',
  'ledger.title': 'లెడ్జర్',
  'ledger.day': 'రోజు',
  'ledger.allDays': 'అన్ని రోజులు',
  'ledger.dues': 'బాకీలు',
  'ledger.expenses': 'ఖర్చులు',
  'ledger.income': 'ఆదాయం',
  'ledger.spent': 'ఖర్చు',
  'ledger.net': 'నికరం',
  'ledger.date': 'తేదీ',
  'ledger.month': 'నెల',
  'ledger.noActivity': 'ఈ రోజు ఆదాయం లేదా ఖర్చు లేదు.',
  'ledger.receivedFrom': 'స్వీకరించిన వారు',
  'ledger.totalDue': 'మొత్తం బాకీ',
  'ledger.receive': 'స్వీకరించు',
  'ledger.receiveAmount': 'అందుకున్న మొత్తం ₹',
  'ledger.receiveMode': 'చెల్లింపు విధానం',
  'ledger.receiveConfirm': 'చెల్లింపు స్వీకరించు',
  'ledger.receiveDone': 'బాకీ చెల్లింపు అందుకున్నారు — ఈ రోజు ఆదాయంగా లెక్క',
  'ledger.noDues': 'బాకీలు లేవు — అన్ని బిల్లులు చెల్లించబడ్డాయి.',
  'ledger.expCategory': 'ఖర్చు వర్గం',
  'ledger.expAmount': 'మొత్తం ₹',
  'ledger.expNote': 'గమనిక (ఐచ్ఛికం)',
  'ledger.time': 'సమయం',
  'ledger.person': 'వ్యక్తి పేరు',
  'ledger.personPlaceholder': 'ఉదా: రమేష్ (కూలీ)',
  'ledger.purpose': 'ఉద్దేశం',
  'ledger.purposePlaceholder': 'ఉదా: సైటు కూలీ, డీజిల్…',
  'ledger.addExpense': 'ఖర్చు జోడించు',
  'ledger.expAdded': 'ఖర్చు జోడించబడింది',
  'ledger.monthSpent': 'ఈ నెల ఖర్చు',
  'ledger.noExpenses': 'ఇంకా ఖర్చులు లేవు. పైన వేతనాలు, డీజిల్, ముడి పదార్థం ఖర్చులు జోడించండి.',
  'ledger.incName': 'పేరు / వివరాలు',
  'ledger.incPlaceholder': 'ఉదా: రమేష్ · రాయి అమ్మకం',
  'ledger.addIncome': 'ఆదాయం జోడించు',
  'ledger.incAdded': 'ఆదాయం జోడించబడింది',
  'ledger.monthIncome': 'ఈ నెల ఆదాయం',
  'ledger.noIncomes': 'ఇంకా ఆదాయం లేదు. పైన నగదు లేదా UPI లో వచ్చిన డబ్బు జోడించండి.',
  'ledger.noDuesSelected': 'బాకీలు లేవు',
  'ledger.dayTotal': 'రోజు మొత్తం',
  'ledger.monthTotal': 'నెల మొత్తం',
  'ledger.todayIncome': 'ఈ రోజు ఆదాయం',
  // labour work — own tab beside the ledger
  'labour.title': 'కూలీ పనులు',
  'labour.paidMonth': 'ఈ నెల చెల్లింపు',
  'labour.balanceMonth': 'ఇవ్వాల్సిన బాకీ',
  'labour.worksMonth': 'పనులు',
  'labour.name': 'కూలీ పేరు',
  'labour.namePlaceholder': 'ఉదా: రమేష్',
  'labour.work': 'చేసిన పని',
  'labour.workPlaceholder': 'ఉదా: రింగ్ తయారీ, అచ్చు పని…',
  'labour.qty': 'ఉత్పత్తి సంఖ్య',
  'labour.qtyPlaceholder': 'ఉదా: 25',
  'labour.qtyUnit': 'సం',
  'labour.paid': 'ఇప్పుడు చెల్లించినది ₹',
  'labour.balance': 'బాకీ ₹ (ఇవ్వాల్సినది)',
  'labour.mode': 'డబ్బు ఇచ్చిన విధానం',
  'labour.wagesTotal': 'మొత్తం కూలీ',
  'labour.rowPaid': 'చెల్లింపు',
  'labour.rowBalance': 'బాకీ',
  'labour.add': 'కూలీ పని జోడించు',
  'labour.added': 'కూలీ పని జోడించబడింది',
  'labour.empty': 'ఇంకా కూలీ పనులు లేవు. ఎవరు, ఏ తేదీన, ఏ పని, ఎన్ని ఉత్పత్తులు, ఎంత చెల్లించారు, ఎంత బాకీ ఉందో జోడించండి.',
  // lock screen
  'lock.subtitle': 'లాక్ అయ్యి ఉంది — మీ MPIN నమోదు చేయండి',
  'lock.checking': 'చూస్తోంది…',
  'lock.retry': 'మళ్లీ ప్రయత్నించండి',
  'lock.setPinTitle': 'మీ MPIN సెట్ చేయండి',
  'lock.setPinDesc': 'ఈ MPIN తోనే మీ డేటా అంతా ఎన్‌క్రిప్ట్ అవుతుంది. లాక్ తీసిన తర్వాత లేదా కొత్త ఫోన్‌లో యాప్ తెరిచినప్పుడు అడుగుతారు. ఎవరికీ చెప్పకండి.',
  'lock.unlockTitle': 'మీ MPIN నమోదు చేయండి',
  'lock.unlockDesc': 'మీ డేటా ఈ MPIN తో ఎన్‌క్రిప్ట్ అయ్యి ఉంది — సరైన MPIN లేకుండా సేవ్ చేసిన డేటా తెరవదు.',
  'lock.pinLabel': 'MPIN (4–8 అంకెలు)',
  'lock.pinConfirm': 'MPIN ధృవీకరణ',
  'lock.saveBtn': 'MPIN సేవ్ చేయండి',
  'lock.unlockBtn': 'యాప్ తెరవు',
  'lock.verifying': 'తెరుస్తోంది…',
  'lock.secureNote': 'ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్షన్ — సర్వర్‌లో ఎన్‌క్రిప్ట్ అయిన డేటా మాత్రమే ఉంటుంది, మీ MPIN తోనే తెరుచుకుంటుంది.',
  'lock.errPin': 'MPIN 4–8 అంకెలు ఉండాలి.',
  'lock.errPinMatch': 'రెండు MPIN లు ఒకటి కావు.',
  'lock.errWrongPin': 'MPIN తప్పు — మళ్లీ ప్రయత్నించండి.',
  'lock.errNetwork': 'సర్వర్ అందట్లేదు — ఇంటర్నెట్ చెక్ చేసి మళ్లీ ప్రయత్నించండి.',
  'lock.errTooMany': 'చాలాసార్లు ప్రయత్నించారు. ఒక నిమిషం ఆగి మళ్లీ ప్రయత్నించండి.',
  'lock.errExists': 'ఈ యాప్‌కు ఇప్పటికే MPIN ఉంది — దాన్ని నమోదు చేసి తెరవండి.',
  // settings — sync & security
  'sync.title': 'సింక్ & భద్రత',
  'sync.desc': 'బిల్లులు, ఉత్పత్తులు, కూలీ, లెడ్జర్ — అన్నీ ఎన్‌క్రిప్ట్ అయ్యి మీ ఫోన్లన్నింటిలోనూ సింక్ అవుతాయి. లాగిన్ = మీ MPIN మాత్రమే, OTP అవసరం లేదు.',
  'sync.mpinOn': 'మీ MPIN తో రక్షితం',
  'sync.statusOn': 'ఆన్‌లైన్ — ఆటో-సింక్ ఆన్',
  'sync.statusOff': 'ఆఫ్‌లైన్ — ఇంటర్నెట్ వచ్చాక సింక్ అవుతుంది',
  'sync.lastSync': 'చివరి సింక్: {time}',
  'sync.never': 'ఇంకా సింక్ కాలేదు',
  'sync.now': 'ఇప్పుడే సింక్ చేయు',
  'sync.syncing': 'సింక్ అవుతోంది…',
  'sync.syncedToast': 'డేటా మీ ఫోన్లన్నింటికీ సింక్ అయింది',
  'sync.syncFailedToast': 'సింక్ విఫలమైంది — ఇంటర్నెట్ చెక్ చేసి మళ్లీ ప్రయత్నించండి',
  'sync.lockNow': 'యాప్ లాక్ చేయు',
  'sync.lockDesc': 'ఈ డివైస్ లాక్ అవుతుంది: MPIN గేట్ వెనుక డేటా ఉంటుంది. MPIN నమోదు చేసేవరకు తెరవదు.',
  'sync.lockedToast': 'యాప్ లాక్ అయింది',
  'sync.e2eeNote': 'ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్షన్: ఈ ఫోన్ నుండి బయటకు వెళ్లే ముందే డేటా మీ MPIN తో లాక్ అవుతుంది. సర్వర్‌లో ఎన్‌క్రిప్ట్ డేటా మాత్రమే — సర్వర్‌కు కూడా మీ బిల్లులు చదవడం తెలియదు.',
  'mode.cash': 'నగదు',
  'mode.upi': 'UPI',
  'mode.card': 'కార్డ్',
  'mode.due': 'బాకీ',
  'status.paid': 'చెల్లించారు',
  'status.partial': 'పాక్షికం',
  'status.due': 'బాకీ',
  'settings.title': 'సెట్టింగ్‌లు',
  'settings.appLang': 'యాప్ భాష · App language',
  'settings.appLangDesc': 'మొత్తం యాప్‌ను English మరియు తెలుగు మధ్య మార్చండి.',
  'settings.businessIdentity': 'వ్యాపార వివరాలు',
  'settings.companyName': 'కంపెనీ పేరు',
  'settings.companyNameTe': 'తెలుగులో కంపెనీ పేరు (బిల్లు పేరు)',
  'settings.ownerName': 'యజమాని పేరు',
  'settings.phone': 'ఫోన్',
  'settings.whatsapp': 'WhatsApp నంబర్',
  'settings.address': 'షాప్ చిరునామా',
  'settings.upi': 'UPI ID (బాకీ QR కోసం)',
  'settings.billingSlip': 'బిల్లింగ్ & స్లిప్',
  'settings.invoicePrefix': 'బిల్లు ప్రీఫిక్స్',
  'settings.nextInvoiceNo': 'తదుపరి బిల్లు నంబర్',
  'settings.slipWidth': 'థర్మల్ స్లిప్ వెడల్పు',
  'settings.thankYouNote': 'ధన్యవాద గమనిక',
  'settings.returnPolicy': 'నిబంధనలు / రిటర్న్',
  'settings.data': 'డేటా',
  'settings.resetCatalog': 'ఉత్పత్తులను ఫ్యాక్టరీ జాబితాకు రీసెట్ చేయు',
  'settings.eraseAll': 'మొత్తం డేటా తొలగించు',
  'settings.checkUpdates': 'ఇప్పుడే అప్‌డేట్‌లు చెక్ చేయు',
  'settings.updateHint': 'ఏదైనా వివరాలు మార్చి, Update బటన్ నొక్కి సేవ్ చేయండి.',
  'settings.updateDetails': 'వివరాలు అప్‌డేట్ చేయు',
  'settings.updatedToast': 'వివరాలు అప్‌డేట్ అయ్యాయి',
  'settings.updateBilling': 'బిల్లు సెట్టింగ్‌లు అప్‌డేట్ చేయు',
  'settings.billingUpdatedToast': 'బిల్లు సెట్టింగ్‌లు అప్‌డేట్ అయ్యాయి',
  'settings.backup': 'బ్యాకప్ & రీస్టోర్',
  'settings.backupDesc':
    'కంపెనీ వివరాలు, ఉత్పత్తులు, బిల్లులు, ఖర్చులు & ఆదాయాలు — అంతా ఒకే ఫైల్‌లో సేవ్ చేయండి. Google Drive లో ఉంచండి లేదా WhatsApp లో మీకే పంపండి — ఏ ఫోన్‌లోనైనా రీస్టోర్ చేయవచ్చు.',
  'settings.backupBtn': 'డేటా బ్యాకప్',
  'settings.backupDone': 'బ్యాకప్ డౌన్‌లోడ్ అయింది',
  'settings.backupProducts': 'ఉత్పత్తులు',
  'settings.backupBills': 'బిల్లులు',
  'settings.backupFailed': 'బ్యాకప్ విఫలమైంది — మళ్లీ ప్రయత్నించండి',
  'settings.restoreBtn': 'బ్యాకప్ రీస్టోర్',
  'settings.restoreConfirmTitle': 'ఈ బ్యాకప్ రీస్టోర్ చేయాలా?',
  'settings.restoreConfirmDesc':
    'ఈ ఫోన్‌లోని కంపెనీ వివరాలు, ఉత్పత్తులు, బిల్లులు మరియు లెడ్జర్ బ్యాకప్ ఫైల్‌తో మార్చబడతాయి. ఇది తిరిగి రాదు.',
  'settings.restore': 'రీస్టోర్',
  'settings.restoredToast': 'బ్యాకప్ రీస్టోర్ అయింది',
  'settings.backupInvalid': 'ఈ ఫైల్ సరైన యాప్ బ్యాకప్ కాదు',
  'settings.appearance': 'రూపం',
  'settings.appearanceDesc': 'నేపథ్యం, పై పట్టీ రంగు మరియు మీ సొంత వాటర్‌మార్క్ ఫోటో మార్చండి.',
  'settings.bgTheme': 'నేపథ్య థీమ్',
  'settings.headerColour': 'పై పట్టీ రంగు',
  'settings.watermark': 'వాటర్‌మార్క్ ఫోటో',
  'settings.watermarkDesc': 'మీ పరికరం నుండి ఫోటో ఎంచుకోండి — అది యాప్ మధ్యలో మరియు ఓపెనింగ్ స్క్రీన్ మీద వెలుతుగా కనిపిస్తుంది.',
  'settings.watermarkPick': 'పరికరం నుండి ఫోటో ఎంచుకోండి',
  'settings.watermarkReset': 'డిఫాల్ట్ లోగో వాడు',
  'settings.watermarkDone': 'వాటర్‌మార్క్ ఫోటో మార్చబడింది',
  'settings.watermarkFailed': 'ఆ ఫోటో వాడలేకపోయాం',
  'page.currentBill': 'ప్రస్తుత బిల్లు',
  'page.viewBill': 'బిల్లు చూడు',
  'page.viewBillDesc': 'వస్తువులు, కస్టమర్, చెల్లింపు సరిచూసి — థర్మల్ స్లిప్ జనరేట్ చేయండి.',
  'page.loading': 'లోడ్ అవుతోంది…',
  'install.title': 'యాప్ అప్‌డేట్ అయ్యింది — మీ ఫోన్‌లో ఇన్‌స్టాల్ చేయండి',
  'install.titleTe': 'App updated — Install it on your phone',
  'install.desc': 'యాప్ ఇప్పుడే కొత్త వెర్షన్‌కు అప్‌డేట్ అయ్యింది. ఇప్పుడే ఇన్‌స్టాల్ చేయండి — ఉచితం, ఆఫ్‌లైన్‌లో పనిచేస్తుంది.',
  'install.benefitOffline': 'ఆఫ్‌లైన్‌లో పనిచేస్తుంది — బిల్లింగ్‌కు ఇంటర్నెట్ అవసరం లేదు',
  'install.benefitFast': 'వెంటనే తెరుచుకుంటుంది, నిజమైన యాప్ లాగా ఫుల్-స్క్రీన్',
  'install.benefitSave': 'అన్ని బిల్లులు ఈ డివైస్‌లో సురక్షితంగా సేవ్ అవుతాయి',
  'install.installApp': 'యాప్ ఇన్‌స్టాల్',
  'install.howTo': 'ఇన్‌స్టాల్ ఎలా?',
  'install.notNow': 'మూసివేయి',
};

/** Translate an app-UI string */
export function appT(lang: AppLanguage, key: AppLangKey): string {
  return lang === 'te' ? APP_TE[key] : APP_EN[key];
}

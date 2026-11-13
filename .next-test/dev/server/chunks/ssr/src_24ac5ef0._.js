module.exports = [
"[project]/src/lib/defaultData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_PRODUCTS",
    ()=>DEFAULT_PRODUCTS,
    "DEFAULT_SETTINGS",
    ()=>DEFAULT_SETTINGS,
    "PRODUCT_CATEGORIES",
    ()=>PRODUCT_CATEGORIES
]);
const DEFAULT_SETTINGS = {
    companyName: 'Sri Lakshmi Penchil Narasimha Swamy Cement Works',
    companyNameTe: 'శ్రీ లక్ష్మీ పెంచిల నరసింహ స్వామి సిమెంట్ వర్క్స్',
    ownerName: 'A. Prasad',
    phone: '',
    whatsappNumber: '',
    address: '',
    upiId: '',
    invoicePrefix: 'SLP-INV-',
    nextInvoiceNo: 1001,
    slipWidthMm: 80,
    thankYouNote: 'Thank you! Visit Again',
    returnPolicy: 'Goods once sold will not be taken back',
    appLang: 'en'
};
const ft = (from, to)=>{
    const out = [];
    for(let i = from; i <= to; i++)out.push(`${i}FT`);
    return out;
};
const DEFAULT_PRODUCTS = [
    {
        id: 'p-gagulu',
        name: 'Gagulu (Well Ring)',
        nameTe: 'గగులు (బావి రింగ్)',
        category: 'Well Rings & Lids',
        price: 200,
        sizes: [
            '2FT',
            '2.5FT',
            '3FT',
            '3.5FT',
            '4FT',
            '5FT'
        ],
        sizePrices: {
            '2FT': 200,
            '2.5FT': 250,
            '3FT': 320,
            '3.5FT': 400,
            '4FT': 480,
            '5FT': 600
        },
        image: '/products/well-rings.jpg',
        stock: 100
    },
    {
        id: 'p-billalu',
        name: 'Galulu Billalu (Well Lid)',
        nameTe: 'గలులు బిళ్లాలు (బావి మూత)',
        category: 'Well Rings & Lids',
        price: 220,
        sizes: [
            '2FT',
            '2.5FT',
            '3FT',
            '4FT'
        ],
        sizePrices: {
            '2FT': 220,
            '2.5FT': 280,
            '3FT': 350,
            '4FT': 450
        },
        image: '/products/well-lids.jpg',
        stock: 50
    },
    {
        id: 'p-gunja-pole',
        name: 'Gunja (Fencing Pole)',
        nameTe: 'గుంజ (కంచె స్తంభం)',
        category: 'Poles & Fencing',
        price: 560,
        sizes: ft(8, 12),
        sizePrices: {
            '8FT': 380,
            '9FT': 440,
            '10FT': 480,
            '11FT': 520,
            '12FT': 560
        },
        image: '/products/poles.jpg',
        stock: 60
    },
    {
        id: 'p-gunja-cement-pool',
        name: 'Gunja Cement Pool',
        nameTe: 'గుంజ సిమెంట్ పోల్',
        category: 'Poles & Fencing',
        price: 420,
        sizes: ft(8, 12),
        sizePrices: {
            '8FT': 420,
            '9FT': 450,
            '10FT': 480,
            '11FT': 510,
            '12FT': 540
        },
        image: '/products/poles-2.jpg',
        stock: 50
    },
    {
        id: 'p-gunja-pool',
        name: 'Gunja Pool',
        nameTe: 'గుంజ పోల్',
        category: 'Poles & Fencing',
        price: 470,
        sizes: ft(8, 12),
        sizePrices: {
            '8FT': 470,
            '9FT': 500,
            '10FT': 530,
            '11FT': 560,
            '12FT': 590
        },
        image: '/products/poles.jpg',
        stock: 50
    },
    {
        id: 'p-gunja-8ft',
        name: 'Gunja 8FT Pole',
        nameTe: 'గుంజ 8FT పోల్',
        category: 'Poles & Fencing',
        price: 380,
        sizes: ft(8, 12),
        sizePrices: {
            '8FT': 380,
            '9FT': 410,
            '10FT': 440,
            '11FT': 470,
            '12FT': 500
        },
        image: '/products/poles-2.jpg',
        stock: 40
    },
    {
        id: 'p-heavy-pool',
        name: 'Heavy Duty Pool 12FT',
        nameTe: 'హెవీ డ్యూటీ పోల్ 12FT',
        category: 'Poles & Fencing',
        price: 620,
        sizes: ft(8, 12),
        sizePrices: {
            '8FT': 500,
            '9FT': 530,
            '10FT': 560,
            '11FT': 590,
            '12FT': 620
        },
        image: '/products/rings-2.jpg',
        stock: 30
    },
    {
        id: 'p-keti-double',
        name: 'Ketikelu - Double Frame 4x3',
        nameTe: 'కెటికెలు - డబుల్ ఫ్రేమ్ 4x3',
        category: 'Ketikelu Frames',
        price: 1450,
        sizes: [
            '4x3 FT',
            '3x4 FT',
            '4x4 FT',
            '5x3 FT'
        ],
        sizePrices: {
            '4x3 FT': 1450,
            '3x4 FT': 1450,
            '4x4 FT': 1600,
            '5x3 FT': 1700
        },
        image: '/products/window-frames.jpg',
        stock: 20
    },
    {
        id: 'p-keti-single',
        name: 'Ketikelu - Single Frame 3x4',
        nameTe: 'కెటికెలు - సింగిల్ ఫ్రేమ్ 3x4',
        category: 'Ketikelu Frames',
        price: 1100,
        sizes: [
            '3x4 FT',
            '3x3 FT',
            '2.5x4 FT'
        ],
        sizePrices: {
            '3x4 FT': 1100,
            '3x3 FT': 1000,
            '2.5x4 FT': 950
        },
        image: '/products/window-frames-2.jpg',
        stock: 20
    },
    {
        id: 'p-keti-vent',
        name: 'Ketikelu - Ventilator 2x2',
        nameTe: 'కెటికెలు - వెంటిలేటర్ 2x2',
        category: 'Ketikelu Frames',
        price: 550,
        sizes: [
            '2x2 FT',
            '2.5x1.5 FT',
            '2x1.5 FT'
        ],
        sizePrices: {
            '2x2 FT': 550,
            '2.5x1.5 FT': 480,
            '2x1.5 FT': 450
        },
        image: '/products/window-frames.jpg',
        stock: 25
    },
    {
        id: 'p-selupu-cupboard',
        name: 'Selupu Ralu - Cupboard Slab 3x1.5',
        nameTe: 'సెలుపు రాళ్లు - కప్పుబోర్డు స్లాబ్ 3x1.5',
        category: 'Selupu Ralu Slabs',
        price: 320,
        sizes: [
            '3x1.5 FT',
            '4x1.5 FT',
            '5x1.5 FT'
        ],
        sizePrices: {
            '3x1.5 FT': 320,
            '4x1.5 FT': 420,
            '5x1.5 FT': 520
        },
        image: '/products/slabs.jpg',
        stock: 40
    },
    {
        id: 'p-selupu-standard',
        name: 'Selupu Ralu - Standard Slab 4x1.5',
        nameTe: 'సెలుపు రాళ్లు - స్టాండర్డ్ స్లాబ్ 4x1.5',
        category: 'Selupu Ralu Slabs',
        price: 420,
        sizes: [
            '3x1.5 FT',
            '4x1.5 FT',
            '5x1.5 FT'
        ],
        sizePrices: {
            '3x1.5 FT': 320,
            '4x1.5 FT': 420,
            '5x1.5 FT': 520
        },
        image: '/products/slabs-2.jpg',
        stock: 40
    },
    {
        id: 'p-selupu-kitchen',
        name: 'Selupu Ralu - Kitchen Slab 4x2',
        nameTe: 'సెలుపు రాళ్లు - కిచెన్ స్లాబ్ 4x2',
        category: 'Selupu Ralu Slabs',
        price: 580,
        sizes: [
            '3x2 FT',
            '4x2 FT',
            '5x2 FT'
        ],
        sizePrices: {
            '3x2 FT': 480,
            '4x2 FT': 580,
            '5x2 FT': 680
        },
        image: '/products/slabs.jpg',
        stock: 30
    },
    {
        id: 'p-selupu-heavy',
        name: 'Selupu Ralu - Heavy Slab 5x1.5',
        nameTe: 'సెలుపు రాళ్లు - హెవీ స్లాబ్ 5x1.5',
        category: 'Selupu Ralu Slabs',
        price: 540,
        sizes: [
            '4x1.5 FT',
            '5x1.5 FT',
            '6x1.5 FT'
        ],
        sizePrices: {
            '4x1.5 FT': 540,
            '5x1.5 FT': 620,
            '6x1.5 FT': 700
        },
        image: '/products/slabs-2.jpg',
        stock: 25
    }
];
const PRODUCT_CATEGORIES = [
    'All',
    'Well Rings & Lids',
    'Poles & Fencing',
    'Ketikelu Frames',
    'Selupu Ralu Slabs',
    'Custom'
];
}),
"[project]/src/lib/billing.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyPayment",
    ()=>applyPayment,
    "computeTotals",
    ()=>computeTotals,
    "fmt",
    ()=>fmt,
    "fmtShort",
    ()=>fmtShort,
    "getStatus",
    ()=>getStatus,
    "labourMoney",
    ()=>labourMoney,
    "lineNet",
    ()=>lineNet,
    "localDateKey",
    ()=>localDateKey,
    "localMonthKey",
    ()=>localMonthKey,
    "normalizePhone",
    ()=>normalizePhone,
    "paymentsOf",
    ()=>paymentsOf,
    "priceForSize",
    ()=>priceForSize,
    "smsLink",
    ()=>smsLink,
    "upiUri",
    ()=>upiUri,
    "waChatLink",
    ()=>waChatLink,
    "waLink",
    ()=>waLink
]);
const fmt = (n)=>{
    const v = Math.round(n * 100) / 100;
    return v.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};
const fmtShort = (n)=>{
    const v = Math.round(n * 100) / 100;
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
};
function lineNet(it) {
    const gross = it.price * it.qty;
    const d = Math.min(Math.max(it.discount || 0, 0), gross);
    return Math.round((gross - d) * 100) / 100;
}
function computeTotals(items, cfg) {
    const subtotal = items.reduce((s, it)=>s + it.price * it.qty, 0);
    const itemDiscounts = items.reduce((s, it)=>s + (it.price * it.qty - lineNet(it)), 0);
    const base = subtotal - itemDiscounts;
    const discount = cfg.discountType === 'percent' ? Math.min(base, base * (cfg.discountValue || 0) / 100) : Math.min(base, cfg.discountValue || 0);
    const labourCharge = cfg.labourCharge || 0;
    const autoCharge = cfg.autoCharge || 0;
    // Exact total — round off removed
    const total = Math.round((base - discount + labourCharge + autoCharge) * 100) / 100;
    const paid = Math.min(cfg.paidAmount || 0, total);
    const balance = Math.max(total - paid, 0);
    return {
        subtotal,
        itemDiscounts,
        discount,
        labourCharge,
        autoCharge,
        roundOff: 0,
        total,
        paid,
        balance
    };
}
function getStatus(total, paid) {
    if (paid >= total) return 'Paid';
    if (paid <= 0) return 'Due';
    return 'Partial';
}
function priceForSize(price, sizePrices, size) {
    if (sizePrices && sizePrices[size] !== undefined && sizePrices[size] !== null) return sizePrices[size];
    return price;
}
function normalizePhone(raw) {
    const digits = (raw || '').replace(/\D/g, '');
    // strip leading country code 91 if the rest is 10 digits
    if (digits.length > 10 && digits.startsWith('91')) return digits.slice(-10);
    return digits.slice(-10);
}
function waLink(phone, message) {
    const p = normalizePhone(phone);
    const text = encodeURIComponent(message);
    return p ? `https://wa.me/91${p}?text=${text}` : `https://wa.me/?text=${text}`;
}
function waChatLink(phone) {
    const p = normalizePhone(phone);
    return p ? `https://wa.me/91${p}` : 'https://wa.me/';
}
function smsLink(phone, message) {
    const p = normalizePhone(phone);
    const body = encodeURIComponent(message);
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        return p ? `sms:${p}&body=${body}` : `sms:&body=${body}`;
    }
    return p ? `sms:${p}?body=${body}` : `sms:?body=${body}`;
}
function upiUri(upiId, amount, note) {
    // QR is based on the UPI ID only — no payee name (company name) so every
    // UPI app resolves the handle directly without name-mismatch warnings.
    const params = new URLSearchParams({
        pa: upiId,
        am: fmtShort(amount),
        cu: 'INR'
    });
    if (note) params.set('tn', note);
    return `upi://pay?${params.toString()}`;
}
function localDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function localMonthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function paymentsOf(inv) {
    if (inv.payments && inv.payments.length > 0) return inv.payments;
    if (inv.totals.paid > 0) {
        return [
            {
                id: 'init',
                dateISO: inv.dateISO,
                amount: inv.totals.paid,
                mode: inv.paymentMode === 'Due' ? 'Cash' : inv.paymentMode
            }
        ];
    }
    return [];
}
function applyPayment(inv, amount, mode, dateISO, pid) {
    const add = Math.round(Math.min(Math.max(amount, 0), inv.totals.balance) * 100) / 100;
    if (add <= 0) return null;
    const paid = Math.round((inv.totals.paid + add) * 100) / 100;
    const payments = [
        ...paymentsOf(inv),
        {
            id: pid ?? `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dateISO,
            amount: add,
            mode
        }
    ];
    return {
        ...inv,
        status: getStatus(inv.totals.total, paid),
        totals: {
            ...inv.totals,
            paid,
            balance: Math.max(inv.totals.total - paid, 0)
        },
        payments
    };
}
const r2 = (n)=>Math.round(n * 100) / 100;
function labourMoney(e) {
    const legacyPaid = r2(e.paid ?? e.amount ?? 0);
    const legacyBal = r2(e.balance ?? 0);
    if (e.payments && e.payments.length > 0) {
        const paid = r2(e.payments.reduce((s, p)=>s + p.amount, 0));
        const wage = r2(e.wage ?? legacyPaid + legacyBal);
        return {
            wage,
            paid,
            balance: Math.max(0, r2(wage - paid)),
            extra: Math.max(0, r2(paid - wage))
        };
    }
    // legacy row — only paid/balance/amount fields exist
    return {
        wage: r2(legacyPaid + legacyBal),
        paid: legacyPaid,
        balance: legacyBal,
        extra: 0
    };
}
}),
"[project]/src/lib/store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStore",
    ()=>useStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$defaultData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/defaultData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/billing.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const EMPTY_DELETED = {
    invoices: [],
    expenses: [],
    incomes: [],
    labours: [],
    products: []
};
/** Helper: mark an id deleted (tombstone) so sync never resurrects it */ function tomb(all, key, id) {
    const list = all[key];
    return list.includes(id) ? all : {
        ...all,
        [key]: [
            id,
            ...list
        ]
    };
}
/** Helper: bump the sync LWW clock (config-level changes) */ function touch(now = Date.now()) {
    return now;
}
const r2 = (n)=>Math.round(n * 100) / 100;
/**
 * Normalise a labour entry: guarantees the wage + payments list exist (legacy
 * rows are converted once) and keeps the stored paid/balance fields in sync
 * so older views and merged devices always agree.
 */ function normalizeLabourWork(e) {
    const legacyPaid = r2(e.paid ?? e.amount ?? 0);
    const legacyBal = r2(e.balance ?? 0);
    const wage = r2(e.wage ?? legacyPaid + legacyBal);
    const payments = e.payments ? e.payments : legacyPaid > 0 ? [
        {
            id: `${e.id}-pay0`,
            dateISO: e.dateISO,
            amount: legacyPaid,
            mode: e.mode
        }
    ] : [];
    const paid = r2(payments.reduce((s, p)=>s + p.amount, 0));
    const balance = Math.max(0, r2(wage - paid));
    return {
        ...e,
        wage,
        payments,
        paid: paid > 0 ? paid : undefined,
        balance: balance > 0 ? balance : undefined
    };
}
const DEFAULT_CONFIG = {
    discountType: 'amount',
    discountValue: 0,
    labourCharge: 0,
    autoCharge: 0,
    paymentMode: 'Cash',
    paidAmount: 0,
    language: 'en',
    delivery: {
        delivered: false,
        driver: '',
        vehicle: '',
        address: ''
    }
};
const useStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        hydrated: false,
        settings: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$defaultData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_SETTINGS"],
        products: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$defaultData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_PRODUCTS"],
        cart: [],
        invoices: [],
        billConfig: DEFAULT_CONFIG,
        customer: {
            name: '',
            phone: '',
            address: ''
        },
        activeTab: 'bill',
        lastInvoice: null,
        expenses: [],
        incomes: [],
        labourWorks: [],
        appearance: {
            bgTheme: 'blue',
            headerTheme: 'blue',
            watermark: ''
        },
        deletedIds: EMPTY_DELETED,
        dataUpdatedAt: 0,
        setActiveTab: (t)=>set({
                activeTab: t
            }),
        saveSettings: (s)=>set((st)=>({
                    settings: {
                        ...st.settings,
                        ...s
                    },
                    dataUpdatedAt: touch()
                })),
        addProduct: (p)=>set((st)=>({
                    products: [
                        p,
                        ...st.products
                    ],
                    dataUpdatedAt: touch()
                })),
        updateProduct: (id, p)=>set((st)=>({
                    products: st.products.map((x)=>x.id === id ? {
                            ...x,
                            ...p
                        } : x),
                    dataUpdatedAt: touch()
                })),
        deleteProduct: (id)=>set((st)=>({
                    products: st.products.filter((x)=>x.id !== id),
                    deletedIds: tomb(st.deletedIds, 'products', id),
                    dataUpdatedAt: touch()
                })),
        addToCart: (product, size)=>{
            const price = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["priceForSize"])(product.price, product.sizePrices, size);
            const key = `${product.id}::${size}`;
            set((st)=>{
                const existing = st.cart.find((c)=>c.key === key);
                if (existing) {
                    return {
                        cart: st.cart.map((c)=>c.key === key ? {
                                ...c,
                                qty: c.qty + 1
                            } : c)
                    };
                }
                return {
                    cart: [
                        ...st.cart,
                        {
                            key,
                            productId: product.id,
                            name: product.name,
                            nameTe: product.nameTe,
                            size,
                            price,
                            qty: 1
                        }
                    ]
                };
            });
        },
        addCustomItem: (name, size, price, qty, nameTe)=>{
            const norm = size.trim() || 'Standard';
            const key = `custom::${Date.now()}::${Math.random().toString(36).slice(2, 7)}`;
            const teName = nameTe?.trim() || undefined;
            set((st)=>{
                const cart = [
                    ...st.cart,
                    {
                        key,
                        productId: 'custom',
                        name,
                        nameTe: teName,
                        size: norm,
                        price,
                        qty
                    }
                ];
                // Auto-save the custom item into the product catalog — matched by
                // name (case-insensitive); new size/price merges into the product so
                // it can be billed again with one tap from the catalog.
                const nameL = name.trim().toLowerCase();
                const idx = st.products.findIndex((p)=>p.name.toLowerCase() === nameL);
                let products = st.products;
                if (idx >= 0) {
                    const p = st.products[idx];
                    const sizes = p.sizes.includes(norm) ? p.sizes : [
                        ...p.sizes,
                        norm
                    ];
                    products = [
                        ...st.products
                    ];
                    products[idx] = {
                        ...p,
                        nameTe: p.nameTe ?? teName,
                        sizes,
                        sizePrices: {
                            ...p.sizePrices,
                            [norm]: price
                        }
                    };
                } else {
                    products = [
                        {
                            id: `p-${Date.now()}`,
                            name: name.trim(),
                            nameTe: teName,
                            category: 'Custom',
                            price,
                            sizes: [
                                norm
                            ],
                            sizePrices: {
                                [norm]: price
                            }
                        },
                        ...st.products
                    ];
                }
                return {
                    cart,
                    products
                };
            });
        },
        // Owner edits while billing: change the unit price directly on the line
        // and/or apply a discount for that specific item (catalog stays untouched)
        updateCartItem: (key, patch)=>set((st)=>({
                    cart: st.cart.map((c)=>c.key === key ? {
                            ...c,
                            ...patch
                        } : c)
                })),
        incQty: (key)=>set((st)=>({
                    cart: st.cart.map((c)=>c.key === key ? {
                            ...c,
                            qty: c.qty + 1
                        } : c)
                })),
        decQty: (key)=>set((st)=>({
                    cart: st.cart.map((c)=>c.key === key ? {
                            ...c,
                            qty: c.qty - 1
                        } : c).filter((c)=>c.qty > 0)
                })),
        removeFromCart: (key)=>set((st)=>({
                    cart: st.cart.filter((c)=>c.key !== key)
                })),
        clearCart: ()=>set({
                cart: []
            }),
        setCustomer: (c)=>set((st)=>({
                    customer: {
                        ...st.customer,
                        ...c
                    }
                })),
        setBillConfig: (c)=>set((st)=>({
                    billConfig: {
                        ...st.billConfig,
                        ...c
                    }
                })),
        resetBillConfig: ()=>set((st)=>({
                    // keep the chosen bill language sticky across bills; delivery details reset
                    billConfig: {
                        ...DEFAULT_CONFIG,
                        language: st.billConfig.language
                    }
                })),
        completeInvoice: ()=>{
            const { cart, customer, billConfig, settings, products } = get();
            if (cart.length === 0) return null;
            const totals = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeTotals"])(cart, billConfig);
            const no = `${settings.invoicePrefix}${settings.nextInvoiceNo}`;
            const dateISO = new Date().toISOString();
            // Delivery / driver details only when the bill is marked Delivered
            const delivery = billConfig.delivery?.delivered ? {
                ...billConfig.delivery,
                dateISO
            } : undefined;
            // Money received at bill time counts as income on the bill date
            // (Due-mode advances were received in cash)
            const payments = totals.paid > 0 ? [
                {
                    id: `pay-${Date.now()}`,
                    dateISO,
                    amount: totals.paid,
                    mode: billConfig.paymentMode === 'Due' ? 'Cash' : billConfig.paymentMode
                }
            ] : undefined;
            const invoice = {
                id: `inv-${Date.now()}`,
                no,
                dateISO,
                customer: {
                    ...customer
                },
                items: cart.map((c)=>({
                        ...c
                    })),
                totals,
                discountType: billConfig.discountType,
                discountValue: billConfig.discountValue,
                labourCharge: billConfig.labourCharge || 0,
                autoCharge: billConfig.autoCharge || 0,
                paymentMode: billConfig.paymentMode,
                language: billConfig.language,
                status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatus"])(totals.total, totals.paid),
                delivery,
                payments
            };
            // deduct stock where tracked
            const updatedProducts = products.map((p)=>{
                const sold = cart.filter((c)=>c.productId === p.id).reduce((s, c)=>s + c.qty, 0);
                if (sold > 0 && typeof p.stock === 'number') return {
                    ...p,
                    stock: Math.max(p.stock - sold, 0)
                };
                return p;
            });
            set((st)=>({
                    invoices: [
                        invoice,
                        ...st.invoices
                    ],
                    products: updatedProducts,
                    cart: [],
                    lastInvoice: invoice,
                    // fresh customer for the next bill — name & mobile are entered new every time
                    customer: {
                        name: '',
                        phone: '',
                        address: ''
                    },
                    // fresh config for the next bill (Cash mode, no leftover discount/charges;
                    // chosen bill language stays sticky)
                    billConfig: {
                        ...DEFAULT_CONFIG,
                        language: billConfig.language
                    },
                    settings: {
                        ...st.settings,
                        nextInvoiceNo: st.settings.nextInvoiceNo + 1
                    },
                    dataUpdatedAt: touch()
                }));
            return invoice;
        },
        clearLastInvoice: ()=>set({
                lastInvoice: null
            }),
        deleteInvoice: (id)=>set((st)=>({
                    invoices: st.invoices.filter((i)=>i.id !== id),
                    deletedIds: tomb(st.deletedIds, 'invoices', id)
                })),
        // Marking paid records the newly-received amount as income today
        updateInvoiceStatus: (id, paidAmount)=>set((st)=>{
                const patchOne = (i)=>{
                    if (i.id !== id) return i;
                    const paid = Math.min(paidAmount, i.totals.total);
                    const added = Math.round((paid - i.totals.paid) * 100) / 100;
                    if (added <= 0) return i;
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyPayment"])(i, added, 'Cash', new Date().toISOString()) ?? i;
                };
                return {
                    invoices: st.invoices.map(patchOne),
                    lastInvoice: st.lastInvoice ? patchOne(st.lastInvoice) : st.lastInvoice,
                    dataUpdatedAt: touch()
                };
            }),
        // Flip the bill language (also from the invoice modal while sharing) —
        // updates the saved invoice so History re-shares in the same language
        updateInvoiceLanguage: (id, language)=>set((st)=>({
                    invoices: st.invoices.map((i)=>i.id === id ? {
                            ...i,
                            language
                        } : i),
                    lastInvoice: st.lastInvoice && st.lastInvoice.id === id ? {
                        ...st.lastInvoice,
                        language
                    } : st.lastInvoice,
                    dataUpdatedAt: touch()
                })),
        // Dues list: receive a balance payment — counts as income TODAY
        receiveDuePayment: (id, amount, mode)=>set((st)=>{
                const now = new Date().toISOString();
                const patchOne = (i)=>i.id === id ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyPayment"])(i, amount, mode, now) ?? i : i;
                return {
                    invoices: st.invoices.map(patchOne),
                    lastInvoice: st.lastInvoice ? patchOne(st.lastInvoice) : st.lastInvoice,
                    dataUpdatedAt: touch()
                };
            }),
        addExpense: (e)=>set((st)=>({
                    expenses: [
                        {
                            ...e,
                            id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
                        },
                        ...st.expenses
                    ]
                })),
        deleteExpense: (id)=>set((st)=>({
                    expenses: st.expenses.filter((x)=>x.id !== id),
                    deletedIds: tomb(st.deletedIds, 'expenses', id)
                })),
        addIncome: (e)=>set((st)=>({
                    incomes: [
                        {
                            ...e,
                            id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
                        },
                        ...st.incomes
                    ]
                })),
        deleteIncome: (id)=>set((st)=>({
                    incomes: st.incomes.filter((x)=>x.id !== id),
                    deletedIds: tomb(st.deletedIds, 'incomes', id)
                })),
        addLabourWork: (e)=>set((st)=>({
                    labourWorks: [
                        normalizeLabourWork({
                            ...e,
                            id: `lw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
                        }),
                        ...st.labourWorks
                    ]
                })),
        deleteLabourWork: (id)=>set((st)=>({
                    labourWorks: st.labourWorks.filter((x)=>x.id !== id),
                    deletedIds: tomb(st.deletedIds, 'labours', id)
                })),
        updateLabourWork: (id, patch)=>set((st)=>({
                    labourWorks: st.labourWorks.map((x)=>x.id === id ? normalizeLabourWork({
                            ...x,
                            ...patch
                        }) : x)
                })),
        addLabourPayment: (id, p)=>set((st)=>({
                    labourWorks: st.labourWorks.map((x)=>{
                        if (x.id !== id) return x;
                        const base = normalizeLabourWork(x);
                        const pay = {
                            id: `lwp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                            dateISO: p.dateISO ?? new Date().toISOString(),
                            amount: p.amount,
                            mode: p.mode,
                            note: p.note
                        };
                        return normalizeLabourWork({
                            ...base,
                            payments: [
                                ...base.payments ?? [],
                                pay
                            ]
                        });
                    })
                })),
        deleteLabourPayment: (id, paymentId)=>set((st)=>({
                    labourWorks: st.labourWorks.map((x)=>{
                        if (x.id !== id) return x;
                        const base = normalizeLabourWork(x);
                        return normalizeLabourWork({
                            ...base,
                            payments: (base.payments ?? []).filter((p)=>p.id !== paymentId)
                        });
                    })
                })),
        setAppearance: (a)=>set((st)=>({
                    appearance: {
                        ...st.appearance,
                        ...a
                    },
                    dataUpdatedAt: touch()
                }))
    }), {
    name: 'slp-cement-billing-v1',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    // Rehydrate manually after mount (page.tsx) — prevents SSR hydration mismatch
    skipHydration: true,
    // Deep-merge persisted slices over defaults so partial/old saved data
    // never wipes new fields (e.g. companyName, upiId)
    merge: (persisted, current)=>{
        const p = persisted ?? {};
        return {
            ...current,
            ...p,
            settings: {
                ...current.settings,
                ...p.settings ?? {}
            },
            billConfig: {
                ...current.billConfig,
                ...p.billConfig ?? {}
            },
            customer: {
                ...current.customer,
                ...p.customer ?? {}
            },
            appearance: {
                ...current.appearance,
                ...p.appearance ?? {}
            }
        };
    },
    partialize: (st)=>({
            settings: st.settings,
            products: st.products,
            cart: st.cart,
            invoices: st.invoices,
            billConfig: st.billConfig,
            customer: st.customer,
            // activeTab intentionally NOT persisted — a fresh app open always lands on Bill
            expenses: st.expenses,
            incomes: st.incomes,
            labourWorks: st.labourWorks,
            appearance: st.appearance,
            deletedIds: st.deletedIds,
            dataUpdatedAt: st.dataUpdatedAt
        }),
    onRehydrateStorage: ()=>(state)=>{
            if (state) state.hydrated = true;
        }
}));
}),
"[project]/src/lib/i18n.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Bill language labels — English + Telugu + Both (bilingual)
// + App UI language labels (English / తెలుగు) for the whole app chrome.
__turbopack_context__.s([
    "APP_EN",
    ()=>APP_EN,
    "APP_TE",
    ()=>APP_TE,
    "BILL_LANGUAGES",
    ()=>BILL_LANGUAGES,
    "BOTH_DRIVER",
    ()=>BOTH_DRIVER,
    "BOTH_LABELS",
    ()=>BOTH_LABELS,
    "EN_DRIVER",
    ()=>EN_DRIVER,
    "EN_LABELS",
    ()=>EN_LABELS,
    "TE_DRIVER",
    ()=>TE_DRIVER,
    "TE_LABELS",
    ()=>TE_LABELS,
    "appT",
    ()=>appT,
    "companyLines",
    ()=>companyLines,
    "companyNameFor",
    ()=>companyNameFor,
    "cur",
    ()=>cur,
    "driverLabels",
    ()=>driverLabels,
    "fill",
    ()=>fill,
    "itemLabel",
    ()=>itemLabel,
    "labels",
    ()=>labels,
    "slipFontFamily",
    ()=>slipFontFamily
]);
const EN_LABELS = {
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
    modes: {
        Cash: 'Cash',
        UPI: 'UPI',
        Card: 'Card',
        Due: 'Due'
    },
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
    invoiceNoLabel: 'Invoice No.'
};
const TE_LABELS = {
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
    modes: {
        Cash: 'నగదు',
        UPI: 'UPI',
        Card: 'కార్డ్',
        Due: 'బాకీ'
    },
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
    invoiceNoLabel: 'బిల్లు నంబర్'
};
const BOTH_LABELS = (()=>{
    const out = {};
    Object.keys(EN_LABELS).forEach((k)=>{
        const en = EN_LABELS[k];
        const te = TE_LABELS[k];
        if (k === 'modes') {
            out.modes = {
                Cash: 'నగదు / Cash',
                UPI: 'UPI',
                Card: 'కార్డ్ / Card',
                Due: 'బాకీ / Due'
            };
        } else if (typeof en === 'string' && typeof te === 'string') {
            out[k] = `${te} / ${en}`;
        } else {
            out[k] = en;
        }
    });
    return out;
})();
function labels(lang) {
    return lang === 'te' ? TE_LABELS : lang === 'both' ? BOTH_LABELS : EN_LABELS;
}
function cur(lang) {
    return lang === 'te' ? 'రూ.' : 'Rs.';
}
function companyNameFor(s, lang) {
    return lang === 'te' && s.companyNameTe && s.companyNameTe.trim() ? s.companyNameTe : s.companyName;
}
function companyLines(s, lang) {
    const te = (s.companyNameTe ?? '').trim();
    const en = (s.companyName ?? '').trim();
    if (lang === 'te') return [
        te || en
    ];
    if (lang === 'both') {
        const lines = te && te !== en ? [
            te,
            en
        ] : [
            en || te
        ];
        return lines.filter(Boolean);
    }
    return [
        en || te
    ];
}
function itemLabel(it, lang) {
    const te = (it.nameTe ?? '').trim();
    if (lang === 'te') return te || it.name;
    if (lang === 'both') return te && te !== it.name ? `${te} / ${it.name}` : it.name;
    return it.name;
}
function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, k)=>vars[k] ?? '');
}
const BILL_LANGUAGES = [
    {
        value: 'en',
        label: 'English'
    },
    {
        value: 'te',
        label: 'తెలుగు'
    },
    {
        value: 'both',
        label: 'రెండూ · Both'
    }
];
function slipFontFamily(lang) {
    return lang === 'en' ? '"Courier New", Courier, ui-monospace, SFMono-Regular, Menlo, monospace' : '"Noto Sans Telugu", "Courier New", Courier, ui-monospace, monospace';
}
const EN_DRIVER = {
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
    driverSign: 'Driver Signature'
};
const TE_DRIVER = {
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
    driverSign: 'డ్రైవర్ సంతకం'
};
const BOTH_DRIVER = {
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
    driverSign: 'డ్రైవర్ సంతకం / Driver Signature'
};
function driverLabels(lang) {
    return lang === 'te' ? TE_DRIVER : lang === 'both' ? BOTH_DRIVER : EN_DRIVER;
}
const APP_EN = {
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
    'labour.editTitle': 'Edit labour entry',
    'labour.wage': 'Total wage ₹',
    'labour.paidSoFar': 'Paid so far',
    'labour.extra': 'Extra given',
    'labour.payments': 'Payments',
    'labour.noPayments': 'No payments recorded yet.',
    'labour.payAmount': 'Payment amount ₹',
    'labour.payNote': 'Note — balance paid / extra…',
    'labour.addPayment': 'Add payment',
    'labour.save': 'Save changes',
    'labour.updated': 'Labour entry updated',
    'labour.paymentAdded': 'Payment recorded',
    // lock screen — MPIN login (the only login) & MPIN unlock
    'lock.subtitle': 'Locked — enter your MPIN',
    'lock.checking': 'Checking…',
    'lock.retry': 'Try again',
    'lock.setPinTitle': 'Create your MPIN',
    'lock.setPinDesc': 'Your MPIN locks all your data end-to-end. You set it ONCE — after that the app asks this MPIN every time it opens. Do not share it.',
    'lock.unlockTitle': 'Enter your MPIN',
    'lock.unlockDesc': 'Enter the MPIN you created to open the app. It also opens your encrypted cloud data.',
    'lock.pinLabel': 'MPIN (4–8 digits)',
    'lock.pinConfirm': 'Confirm MPIN',
    'lock.saveBtn': 'Save MPIN',
    'lock.unlockBtn': 'Open app',
    'lock.verifying': 'Opening…',
    'lock.saving': 'Saving…',
    'lock.secureNote': 'End-to-end encrypted — the server stores only encrypted data, only your MPIN can open it.',
    'lock.errPin': 'MPIN must be 4–8 digits.',
    'lock.errPinMatch': 'The two MPINs do not match.',
    'lock.errWrongPin': 'Wrong MPIN — try again.',
    'lock.errNetwork': 'Cannot reach the server — check your internet and try again.',
    'lock.errTooMany': 'Too many attempts. Please wait a minute and try again.',
    'lock.errExists': 'This app already has an MPIN — enter it to open.',
    'reauth.banner': 'Encrypted sync paused — enter your MPIN to re-connect',
    'reauth.btn': 'Re-connect',
    'reauth.title': 'Re-connect encrypted sync',
    'reauth.desc': 'Your data is safe on this phone — the MPIN re-connects syncing with your other phones.',
    'reauth.note': 'Nothing is created or changed — one MPIN entry and sync continues.',
    // settings — sync & security
    'sync.title': 'Sync & security',
    'sync.desc': 'Bills, products, labour and ledger sync encrypted across all your phones. Login is your MPIN only — the app asks it every time it opens.',
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
    'settings.backupDesc': 'Save a copy of everything — company details, products, bills, expenses & incomes — as one file. Keep it in Google Drive or send it to yourself on WhatsApp, and restore it on any phone.',
    'settings.backupBtn': 'Backup data',
    'settings.backupDone': 'Backup downloaded',
    'settings.backupProducts': 'products',
    'settings.backupBills': 'bills',
    'settings.backupFailed': 'Backup failed — please try again',
    'settings.restoreBtn': 'Restore backup',
    'settings.restoreConfirmTitle': 'Restore this backup?',
    'settings.restoreConfirmDesc': 'Company details, products, bills and ledger on this phone will be replaced with the backup file. This cannot be undone.',
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
    'install.notNow': 'Close'
};
const APP_TE = {
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
    'labour.editTitle': 'కూలీ పని మార్చండి',
    'labour.wage': 'మొత్తం కూలీ ₹',
    'labour.paidSoFar': 'ఇప్పటివరకు చెల్లింపు',
    'labour.extra': 'అదనంగా ఇచ్చినది',
    'labour.payments': 'చెల్లింపులు',
    'labour.noPayments': 'ఇంకా చెల్లింపులు లేవు.',
    'labour.payAmount': 'చెల్లింపు మొత్తం ₹',
    'labour.payNote': 'గమనిక — బాకీ చెల్లింపు / అదనం…',
    'labour.addPayment': 'చెల్లింపు జోడించు',
    'labour.save': 'మార్పులు సేవ్ చేయండి',
    'labour.updated': 'కూలీ పని మార్చబడింది',
    'labour.paymentAdded': 'చెల్లింపు నమోదైంది',
    // lock screen
    'lock.subtitle': 'లాక్ అయ్యి ఉంది — మీ MPIN నమోదు చేయండి',
    'lock.checking': 'చూస్తోంది…',
    'lock.retry': 'మళ్లీ ప్రయత్నించండి',
    'lock.setPinTitle': 'మీ MPIN సెట్ చేయండి',
    'lock.setPinDesc': 'ఈ MPIN తోనే మీ డేటా అంతా ఎన్‌క్రిప్ట్ అవుతుంది. ఒకసారి మాత్రమే సెట్ చేయండి — తర్వాత యాప్ తెరిచే ప్రతిసారి ఈ MPIN అడుగుతుంది. ఎవరికీ చెప్పకండి.',
    'lock.unlockTitle': 'మీ MPIN నమోదు చేయండి',
    'lock.unlockDesc': 'యాప్ తెరవడానికి మీరు సెట్ చేసిన MPIN నమోదు చేయండి. ఇదే ఎన్‌క్రిప్టెడ్ క్లౌడ్ డేటాను కూడా తెరుస్తుంది.',
    'lock.pinLabel': 'MPIN (4–8 అంకెలు)',
    'lock.pinConfirm': 'MPIN ధృవీకరణ',
    'lock.saveBtn': 'MPIN సేవ్ చేయండి',
    'lock.unlockBtn': 'యాప్ తెరవు',
    'lock.verifying': 'తెరుస్తోంది…',
    'lock.saving': 'సేవ్ అవుతోంది…',
    'lock.secureNote': 'ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్షన్ — సర్వర్‌లో ఎన్‌క్రిప్ట్ అయిన డేటా మాత్రమే ఉంటుంది, మీ MPIN తోనే తెరుచుకుంటుంది.',
    'lock.errPin': 'MPIN 4–8 అంకెలు ఉండాలి.',
    'lock.errPinMatch': 'రెండు MPIN లు ఒకటి కావు.',
    'lock.errWrongPin': 'MPIN తప్పు — మళ్లీ ప్రయత్నించండి.',
    'lock.errNetwork': 'సర్వర్ అందట్లేదు — ఇంటర్నెట్ చెక్ చేసి మళ్లీ ప్రయత్నించండి.',
    'lock.errTooMany': 'చాలాసార్లు ప్రయత్నించారు. ఒక నిమిషం ఆగి మళ్లీ ప్రయత్నించండి.',
    'lock.errExists': 'ఈ యాప్‌కు ఇప్పటికే MPIN ఉంది — దాన్ని నమోదు చేసి తెరవండి.',
    'reauth.banner': 'సింక్ ఆగిపెట్టింది — మళ్ళీ కలపడానికి మీ MPIN నమోదు చేయండి',
    'reauth.btn': 'మళ్ళీ కలుపు',
    'reauth.title': 'ఎన్‌క్రిప్టెడ్ సింక్‌ను మళ్ళీ కలపండి',
    'reauth.desc': 'మీ డేటా ఈ ఫోన్‌లో సురక్షితంగా ఉంది — మీ MPIN తో సింకింగ్ మళ్ళీ మొదలవుతుంది.',
    'reauth.note': 'ఏమీ కొత్తగా సృష్టించబడదు — ఒకసారి MPIN నమోదు చేస్తే సింక్ కొనసాగుతుంది.',
    // settings — sync & security
    'sync.title': 'సింక్ & భద్రత',
    'sync.desc': 'బిల్లులు, ఉత్పత్తులు, కూలీ, లెడ్జర్ — అన్నీ ఎన్‌క్రిప్ట్ అయ్యి మీ ఫోన్లన్నింటిలోనూ సింక్ అవుతాయి. లాగిన్ = మీ MPIN మాత్రమే — యాప్ తెరిచే ప్రతిసారి అడుగుతుంది, OTP అవసరం లేదు.',
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
    'settings.backupDesc': 'కంపెనీ వివరాలు, ఉత్పత్తులు, బిల్లులు, ఖర్చులు & ఆదాయాలు — అంతా ఒకే ఫైల్‌లో సేవ్ చేయండి. Google Drive లో ఉంచండి లేదా WhatsApp లో మీకే పంపండి — ఏ ఫోన్‌లోనైనా రీస్టోర్ చేయవచ్చు.',
    'settings.backupBtn': 'డేటా బ్యాకప్',
    'settings.backupDone': 'బ్యాకప్ డౌన్‌లోడ్ అయింది',
    'settings.backupProducts': 'ఉత్పత్తులు',
    'settings.backupBills': 'బిల్లులు',
    'settings.backupFailed': 'బ్యాకప్ విఫలమైంది — మళ్లీ ప్రయత్నించండి',
    'settings.restoreBtn': 'బ్యాకప్ రీస్టోర్',
    'settings.restoreConfirmTitle': 'ఈ బ్యాకప్ రీస్టోర్ చేయాలా?',
    'settings.restoreConfirmDesc': 'ఈ ఫోన్‌లోని కంపెనీ వివరాలు, ఉత్పత్తులు, బిల్లులు మరియు లెడ్జర్ బ్యాకప్ ఫైల్‌తో మార్చబడతాయి. ఇది తిరిగి రాదు.',
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
    'install.notNow': 'మూసివేయి'
};
function appT(lang, key) {
    return lang === 'te' ? APP_TE[key] : APP_EN[key];
}
}),
"[project]/src/lib/imageResize.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fileToResizedDataUrl",
    ()=>fileToResizedDataUrl
]);
'use client';
async function fileToResizedDataUrl(file, max = 640, quality = 0.78) {
    const dataUrl = await new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(String(reader.result));
        reader.onerror = ()=>reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
    const img = await new Promise((resolve, reject)=>{
        const i = new Image();
        i.onload = ()=>resolve(i);
        i.onerror = ()=>reject(new Error('Invalid image'));
        i.src = dataUrl;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
}
}),
"[project]/src/lib/cloud.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiAuthState",
    ()=>apiAuthState,
    "apiMpinRepair",
    ()=>apiMpinRepair,
    "apiMpinSetup",
    ()=>apiMpinSetup,
    "apiMpinUnlock",
    ()=>apiMpinUnlock,
    "apiPullVault",
    ()=>apiPullVault,
    "apiPushVault",
    ()=>apiPushVault,
    "clearRecoverMaterial",
    ()=>clearRecoverMaterial,
    "getAuth",
    ()=>getAuth,
    "getDeviceDek",
    ()=>getDeviceDek,
    "getRecoverMaterial",
    ()=>getRecoverMaterial,
    "isUnlocked",
    ()=>isUnlocked,
    "lockApp",
    ()=>lockApp,
    "setAuth",
    ()=>setAuth,
    "setDeviceDek",
    ()=>setDeviceDek,
    "setRecoverMaterial",
    ()=>setRecoverMaterial
]);
/* ------------------------------------------------------------------ */ /* Cloud sync client — talks to /api/auth/* and /api/vault.            */ /* Login = the owner's MPIN only. The session token (30 days) and the  */ /* device DEK live in localStorage on THIS device only.                */ /* ------------------------------------------------------------------ */ const AUTH_KEY = 'slp-auth-v1'; // { token } — 30-day session
const DEK_KEY = 'slp-dek-v1'; // raw DEK (b64) — device keeps itself unlocked
const RECOVER_KEY = 'slp-recover-v1'; // { salt, verifier, wrapped } — unlock material
function getRecoverMaterial() {
    try {
        const raw = localStorage.getItem(RECOVER_KEY);
        if (!raw) return null;
        const m = JSON.parse(raw);
        if (m?.salt && m?.verifier && m?.wrapped) {
            return {
                salt: m.salt,
                verifier: m.verifier,
                wrapped: m.wrapped
            };
        }
        return null;
    } catch  {
        return null;
    }
}
function setRecoverMaterial(m) {
    try {
        localStorage.setItem(RECOVER_KEY, JSON.stringify(m));
    } catch  {
    /* storage unavailable */ }
}
function clearRecoverMaterial() {
    localStorage.removeItem(RECOVER_KEY);
}
function getAuth() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return null;
        const a = JSON.parse(raw);
        return a?.token ? {
            token: a.token
        } : null;
    } catch  {
        return null;
    }
}
function setAuth(token) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({
        token
    }));
}
function getDeviceDek() {
    return localStorage.getItem(DEK_KEY);
}
function setDeviceDek(b64) {
    localStorage.setItem(DEK_KEY, b64);
}
function isUnlocked() {
    return Boolean(getAuth() && getDeviceDek());
}
function lockApp() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(DEK_KEY);
}
/* ------------------------------ API ------------------------------ */ async function postJson(url, body) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            ...body ? {
                body: JSON.stringify(body)
            } : {},
            signal: AbortSignal.timeout(15000)
        });
        const data = await res.json().catch(()=>({}));
        return {
            status: res.status,
            data
        };
    } catch  {
        return {
            status: 0,
            data: {
                error: 'network'
            }
        };
    }
}
async function authedFetch(url, method, body) {
    const auth = getAuth();
    if (!auth) return {
        status: 401,
        data: {
            error: 'unauthorized'
        }
    };
    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth.token}`
            },
            ...body ? {
                body: JSON.stringify(body)
            } : {},
            signal: AbortSignal.timeout(15000)
        });
        const data = await res.json().catch(()=>({}));
        return {
            status: res.status,
            data
        };
    } catch  {
        return {
            status: 0,
            data: {
                error: 'network'
            }
        };
    }
}
async function apiAuthState() {
    try {
        const res = await fetch('/api/auth/state', {
            signal: AbortSignal.timeout(15000)
        });
        const data = await res.json().catch(()=>({}));
        if (res.status === 200) {
            return {
                ok: true,
                hasMpin: Boolean(data.hasMpin),
                dekSalt: data.dekSalt ?? null,
                legacy: Boolean(data.legacy),
                dekWrapped: data.dekWrapped ?? null
            };
        }
        return {
            ok: false,
            error: data.error ?? 'network'
        };
    } catch  {
        return {
            ok: false,
            error: 'network'
        };
    }
}
async function apiMpinSetup(dekWrapped, dekSalt, kekProof) {
    const { status, data } = await postJson('/api/auth/setup', {
        dekWrapped,
        dekSalt,
        kekProof
    });
    if (status === 200) return {
        ok: true,
        token: data.token
    };
    return {
        ok: false,
        error: data.error ?? 'network'
    };
}
async function apiMpinUnlock(kekProof) {
    const { status, data } = await postJson('/api/auth/unlock', {
        kekProof
    });
    if (status === 200) return {
        ok: true,
        token: data.token
    };
    return {
        ok: false,
        error: data.error ?? 'network'
    };
}
async function apiMpinRepair(kekProof, dekSalt, dekWrapped) {
    const { status, data } = await postJson('/api/auth/repair', {
        kekProof,
        dekSalt,
        dekWrapped
    });
    if (status === 200) return {
        ok: true,
        token: data.token
    };
    return {
        ok: false,
        error: data.error ?? 'network'
    };
}
async function apiPullVault() {
    const { status, data } = await authedFetch('/api/vault', 'GET');
    if (status === 200) {
        if (data.empty) {
            return {
                kind: 'empty',
                dekWrapped: data.dekWrapped ?? '',
                dekSalt: data.dekSalt ?? ''
            };
        }
        return {
            kind: 'data',
            ciphertext: data.ciphertext,
            dataIv: data.dataIv,
            dataVersion: data.dataVersion ?? 0,
            dekWrapped: data.dekWrapped ?? '',
            dekSalt: data.dekSalt ?? ''
        };
    }
    return status === 0 ? {
        kind: 'offline'
    } : {
        kind: 'auth'
    };
}
async function apiPushVault(ciphertext, dataIv) {
    const { status, data } = await authedFetch('/api/vault', 'PUT', {
        ciphertext,
        dataIv
    });
    if (status === 200) return {
        ok: true,
        dataVersion: data.dataVersion
    };
    return {
        ok: false,
        error: data.error ?? 'network'
    };
}
}),
"[project]/src/lib/crypto.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "b64ToBuf",
    ()=>b64ToBuf,
    "bufToB64",
    ()=>bufToB64,
    "decryptJson",
    ()=>decryptJson,
    "deriveKek",
    ()=>deriveKek,
    "encryptJson",
    ()=>encryptJson,
    "exportDek",
    ()=>exportDek,
    "generateDek",
    ()=>generateDek,
    "importDek",
    ()=>importDek,
    "randomB64",
    ()=>randomB64,
    "unwrapDek",
    ()=>unwrapDek,
    "wrapDek",
    ()=>wrapDek
]);
/* ------------------------------------------------------------------ */ /* End-to-end encryption for cloud sync (WebCrypto, browser only).     */ /*                                                                     */ /*  DEK  — random AES-256-GCM key that encrypts the business data.     */ /*  KEK  — derived from the MPIN (PBKDF2-SHA256, 210k rounds) and      */ /*         used only to wrap/unwrap the DEK.                           */ /*                                                                     */ /*  The MPIN and the raw DEK never leave the device: the server only   */ /*  ever receives (a) the wrapped DEK + public salt, (b) SHA-256 of    */ /*  the derived key as a login verifier, and (c) the AES-GCM           */ /*  ciphertext of the data. Wrong MPIN → unwrap fails.                 */ /* ------------------------------------------------------------------ */ const PBKDF2_ITERATIONS = 210_000;
const enc = new TextEncoder();
function bufToB64(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for(let i = 0; i < bytes.length; i++)s += String.fromCharCode(bytes[i]);
    return btoa(s);
}
function b64ToBuf(b64) {
    const s = atob(b64);
    const out = new Uint8Array(new ArrayBuffer(s.length));
    for(let i = 0; i < s.length; i++)out[i] = s.charCodeAt(i);
    return out;
}
function randomB64(bytes) {
    const b = new Uint8Array(new ArrayBuffer(bytes));
    crypto.getRandomValues(b);
    return bufToB64(b);
}
async function generateDek() {
    return crypto.subtle.generateKey({
        name: 'AES-GCM',
        length: 256
    }, true, [
        'encrypt',
        'decrypt'
    ]);
}
async function exportDek(dek) {
    const raw = await crypto.subtle.exportKey('raw', dek);
    return bufToB64(raw);
}
async function importDek(b64) {
    return crypto.subtle.importKey('raw', b64ToBuf(b64), {
        name: 'AES-GCM'
    }, true, [
        'encrypt',
        'decrypt'
    ]);
}
async function deriveKek(mpin, saltB64) {
    const base = await crypto.subtle.importKey('raw', enc.encode(`slp-cement|mpin|${mpin}`), 'PBKDF2', false, [
        'deriveBits'
    ]);
    const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt: b64ToBuf(saltB64),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
    }, base, 256);
    const proofBuf = await crypto.subtle.digest('SHA-256', bits);
    const hex = [
        ...new Uint8Array(proofBuf)
    ].map((b)=>b.toString(16).padStart(2, '0')).join('');
    const kek = await crypto.subtle.importKey('raw', bits, {
        name: 'AES-GCM'
    }, false, [
        'encrypt',
        'decrypt'
    ]);
    return {
        kek,
        proof: hex
    };
}
async function wrapDek(dek, kek) {
    const raw = await crypto.subtle.exportKey('raw', dek);
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const ct = await crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv
    }, kek, raw);
    return {
        wrapped: bufToB64(ct),
        iv: bufToB64(iv)
    };
}
async function unwrapDek(wrappedB64, ivB64, kek) {
    const raw = await crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: b64ToBuf(ivB64)
    }, kek, b64ToBuf(wrappedB64));
    return crypto.subtle.importKey('raw', raw, {
        name: 'AES-GCM'
    }, true, [
        'encrypt',
        'decrypt'
    ]);
}
async function encryptJson(dek, data) {
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const msg = new TextEncoder().encode(JSON.stringify(data));
    const pt = new Uint8Array(new ArrayBuffer(msg.length));
    pt.set(msg);
    const ct = await crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv
    }, dek, pt);
    return {
        ciphertext: bufToB64(ct),
        dataIv: bufToB64(iv)
    };
}
async function decryptJson(dek, ciphertextB64, ivB64) {
    const pt = await crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: b64ToBuf(ivB64)
    }, dek, b64ToBuf(ciphertextB64));
    return JSON.parse(new TextDecoder().decode(pt));
}
}),
"[project]/src/lib/sync.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildPayload",
    ()=>buildPayload,
    "getSyncStatus",
    ()=>getSyncStatus,
    "mergeSync",
    ()=>mergeSync,
    "mergeVaultBlob",
    ()=>mergeVaultBlob,
    "pushVaultNow",
    ()=>pushVaultNow,
    "startSyncEngine",
    ()=>startSyncEngine,
    "syncNow",
    ()=>syncNow
]);
/* ------------------------------------------------------------------ */ /* Cloud sync engine — "update on one mobile → appears on all mobiles". */ /*                                                                     */ /* Local-first: the app always works offline from localStorage. When   */ /* the owner is logged in, every change is encrypted (AES-GCM with the */ /* device DEK) and pushed to the vault; every device polls the vault   */ /* and MERGES what it receives:                                        */ /*   • bills / expenses / incomes / labour / products → union by id     */ /*     (tombstoned deletes stay deleted)                               */ /*   • settings & appearance → newest change wins (nextInvoiceNo       */ /*     takes the max so no two phones ever print the same bill no.)    */ /* Server stores ciphertext only — end-to-end encrypted.               */ /* ------------------------------------------------------------------ */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/crypto.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cloud.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const PUSH_DEBOUNCE_MS = 1200;
const PULL_INTERVAL_MS = 4000;
let started = false;
let applyingRemote = false;
let pushTimer = null;
let pushing = false;
let pushQueued = false;
let lastVersion = 0;
let lastSyncAt = 0;
let lastError = null;
let lastPushedSig = null;
let lastReauthAt = 0;
/** Tell the UI the session needs the owner's MPIN again (server lost it / expired) */ function maybeNotifyReauth() {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const now = undefined;
}
let healing = false;
let lastHealAt = 0;
/**
 * Silent self-heal of the encrypted sync. The device keeps its own copy of
 * the credentials (slp-recover-v1), so when the server lost the account
 * (deploy / restart / wiped vault) or the session expired, the SAME account
 * is re-registered with the SAME key — no MPIN prompt, no banner, no data
 * movement. The owner never notices; the MPIN is never created again.
 */ async function silentReauth() {
    if (healing) return 'inflight'; // a heal is already running — give it a moment
    const mat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRecoverMaterial"])();
    if (!mat?.salt || !mat?.verifier || !mat?.wrapped) return 'failed';
    if (Date.now() - lastHealAt < 20_000) return 'inflight'; // just tried recently
    healing = true;
    lastHealAt = Date.now();
    try {
        // 1) session expired? the stored verifier logs straight back in
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiMpinUnlock"])(mat.verifier);
        if (res.ok && res.token) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setAuth"])(res.token);
            return 'healed';
        }
        // 2) server lost the whole account? re-register it with the SAME key
        if (res.error === 'noMpin') {
            const setup = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiMpinSetup"])(mat.wrapped, mat.salt, mat.verifier);
            if (setup.ok && setup.token) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setAuth"])(setup.token);
                return 'healed';
            }
            return 'failed';
        }
        // wrongMpin → the vault belongs to a different account; the banner offers
        // a manual re-connect (owner's call — never clobber silently)
        return 'failed';
    } catch  {
        return 'failed';
    } finally{
        healing = false;
    }
}
function buildPayload(state) {
    return {
        v: 1,
        settings: state.settings,
        products: state.products,
        invoices: state.invoices,
        expenses: state.expenses,
        incomes: state.incomes,
        labourWorks: state.labourWorks,
        appearance: state.appearance,
        deletedIds: state.deletedIds,
        dataUpdatedAt: state.dataUpdatedAt
    };
}
function emptyDeleted() {
    return {
        invoices: [],
        expenses: [],
        incomes: [],
        labours: [],
        products: []
    };
}
function mergeSync(a, b) {
    const newer = b.dataUpdatedAt > a.dataUpdatedAt; // remote is newer?
    const tomb = {
        invoices: [
            ...new Set([
                ...a.deletedIds.invoices,
                ...b.deletedIds.invoices
            ])
        ],
        expenses: [
            ...new Set([
                ...a.deletedIds.expenses,
                ...b.deletedIds.expenses
            ])
        ],
        incomes: [
            ...new Set([
                ...a.deletedIds.incomes,
                ...b.deletedIds.incomes
            ])
        ],
        labours: [
            ...new Set([
                ...a.deletedIds.labours,
                ...b.deletedIds.labours
            ])
        ],
        products: [
            ...new Set([
                ...a.deletedIds.products,
                ...b.deletedIds.products
            ])
        ]
    };
    const first = newer ? b : a; // same-id conflicts resolve to the newer side
    const second = newer ? a : b;
    const union = (firstArr, secondArr, tombIds)=>{
        const seen = new Set();
        const out = [];
        for (const item of [
            ...firstArr,
            ...secondArr
        ]){
            if (seen.has(item.id) || tombIds.includes(item.id)) continue;
            seen.add(item.id);
            out.push(item);
        }
        return out;
    };
    // settings: newest wins, except the invoice counter which takes the max
    const settings = {
        ...newer ? b.settings : a.settings,
        nextInvoiceNo: Math.max(a.settings.nextInvoiceNo, b.settings.nextInvoiceNo)
    };
    return {
        v: 1,
        settings,
        products: union(first.products, second.products, tomb.products),
        invoices: union(first.invoices, second.invoices, tomb.invoices),
        expenses: union(first.expenses, second.expenses, tomb.expenses),
        incomes: union(first.incomes, second.incomes, tomb.incomes),
        labourWorks: union(first.labourWorks, second.labourWorks, tomb.labours),
        appearance: newer ? b.appearance : a.appearance,
        deletedIds: tomb,
        dataUpdatedAt: Math.max(a.dataUpdatedAt, b.dataUpdatedAt)
    };
}
function sanitize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const p = raw;
    if (p.v !== 1) return null;
    return {
        v: 1,
        settings: p.settings,
        products: Array.isArray(p.products) ? p.products : [],
        invoices: Array.isArray(p.invoices) ? p.invoices : [],
        expenses: Array.isArray(p.expenses) ? p.expenses : [],
        incomes: Array.isArray(p.incomes) ? p.incomes : [],
        labourWorks: Array.isArray(p.labourWorks) ? p.labourWorks : [],
        appearance: p.appearance,
        deletedIds: p.deletedIds ?? emptyDeleted(),
        dataUpdatedAt: typeof p.dataUpdatedAt === 'number' ? p.dataUpdatedAt : 0
    };
}
function applyMerged(remote) {
    const local = buildPayload(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"].getState());
    const merged = mergeSync(local, remote);
    applyingRemote = true;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"].setState({
        settings: merged.settings,
        products: merged.products,
        invoices: merged.invoices,
        expenses: merged.expenses,
        incomes: merged.incomes,
        labourWorks: merged.labourWorks,
        appearance: merged.appearance,
        deletedIds: merged.deletedIds,
        dataUpdatedAt: merged.dataUpdatedAt
    });
    applyingRemote = false;
}
/* ------------------------- push / pull ------------------------- */ async function pushNow() {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isUnlocked"])()) return;
    const dekB64 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDeviceDek"])();
    if (!dekB64) return;
    // a push already in flight? queue one right after it instead of dropping
    if (pushing) {
        pushQueued = true;
        return;
    }
    pushing = true;
    try {
        const payload = buildPayload(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"].getState());
        const sig = JSON.stringify(payload);
        if (sig === lastPushedSig) {
            lastSyncAt = Date.now();
            lastError = null;
            return;
        }
        const dek = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["importDek"])(dekB64);
        const { ciphertext, dataIv } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["encryptJson"])(dek, payload);
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiPushVault"])(ciphertext, dataIv);
        if (res.ok) {
            lastVersion = res.dataVersion ?? lastVersion + 1;
            lastPushedSig = sig;
            lastSyncAt = Date.now();
            lastError = null;
        } else {
            lastError = res.error ?? 'pushFailed';
            if (res.error === 'unauthorized') {
                const h = await silentReauth();
                if (h === 'healed' || h === 'inflight') {
                    lastError = null;
                    pushQueued = true; // retry with the fresh session right after this unwinds
                } else {
                    maybeNotifyReauth();
                }
            }
        }
    } catch (err) {
        lastError = err instanceof Error ? err.message : 'pushFailed';
    } finally{
        pushing = false;
        if (pushQueued) {
            pushQueued = false;
            setTimeout(()=>void pushNow(), 250);
        }
    }
}
async function pullOnce() {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isUnlocked"])() || applyingRemote || pushing) return;
    const dekB64 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDeviceDek"])();
    if (!dekB64) return;
    try {
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiPullVault"])();
        if (res.kind === 'auth') {
            const h = await silentReauth();
            if (h === 'healed' || h === 'inflight') {
                setTimeout(()=>void pullOnce(), 1500); // retry with the fresh session
                return;
            }
            lastError = 'unauthorized';
            maybeNotifyReauth(); // the device keeps working locally — the MPIN re-connects sync
            return;
        }
        if (res.kind === 'offline') {
            lastError = 'offline';
            return;
        }
        if (res.kind === 'empty') {
            // fresh vault — upload whatever this device already has
            await pushNow();
            return;
        }
        if (res.dataVersion > lastVersion) {
            const dek = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["importDek"])(dekB64);
            const raw = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["decryptJson"])(dek, res.ciphertext, res.dataIv);
            const remote = sanitize(raw);
            if (remote) applyMerged(remote);
            lastVersion = res.dataVersion;
            lastSyncAt = Date.now();
            lastError = null;
        }
    } catch (err) {
        // wrong key / corrupt blob — surface but never wipe local data
        lastError = err instanceof Error ? err.message : 'pullFailed';
    }
}
function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(()=>{
        pushTimer = null;
        void pushNow();
    }, PUSH_DEBOUNCE_MS);
}
function startSyncEngine() {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
async function syncNow() {
    await pushNow();
    await pullOnce();
    return !lastError;
}
async function mergeVaultBlob(ciphertext, dataIv, dek) {
    try {
        const raw = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["decryptJson"])(dek, ciphertext, dataIv);
        const p = sanitize(raw);
        if (!p) return false;
        applyMerged(p);
        lastSyncAt = Date.now();
        lastError = null;
        return true;
    } catch  {
        return false;
    }
}
async function pushVaultNow() {
    lastPushedSig = null; // force a real push
    await pushNow();
    return !lastError;
}
function getSyncStatus() {
    return {
        lastSyncAt,
        error: lastError
    };
}
}),
"[project]/src/lib/invoiceImage.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "canShareFiles",
    ()=>canShareFiles,
    "captureSlipPng",
    ()=>captureSlipPng,
    "downloadBlob",
    ()=>downloadBlob,
    "printImage",
    ()=>printImage,
    "shareImage",
    ()=>shareImage,
    "slipFileName",
    ()=>slipFileName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html$2d$to$2d$image$2f$es$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/html-to-image/es/index.js [app-ssr] (ecmascript)");
'use client';
;
async function captureSlipPng(node, pixelRatio = 3) {
    const dataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html$2d$to$2d$image$2f$es$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toPng"])(node, {
        pixelRatio,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: false
    });
    const res = await fetch(dataUrl);
    return await res.blob();
}
function slipFileName(invoiceNo) {
    const safe = invoiceNo.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `${safe}.png`;
}
function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 4000);
}
function canShareFiles(files) {
    try {
        return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({
            files
        });
    } catch  {
        return false;
    }
}
async function shareImage(blob, fileName, text) {
    const file = new File([
        blob
    ], fileName, {
        type: 'image/png'
    });
    if (canShareFiles([
        file
    ])) {
        await navigator.share({
            files: [
                file
            ],
            text
        });
        return 'shared';
    }
    return 'unsupported';
}
function printImage(blob) {
    const url = URL.createObjectURL(blob);
    const w = window.open('', '_blank', 'width=420,height=680');
    if (!w) return false;
    w.document.write(`<html><head><title>Print Bill</title><style>
      @page { margin: 4mm; }
      body { margin:0; display:flex; justify-content:center; }
      img { max-width:100%; }
    </style></head><body><img src="${url}" onload="window.focus();window.print();" /></body></html>`);
    w.document.close();
    return true;
}
}),
"[project]/src/lib/messages.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "smsMessage",
    ()=>smsMessage,
    "whatsappCaption",
    ()=>whatsappCaption,
    "whatsappMessage",
    ()=>whatsappMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/billing.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/i18n.ts [app-ssr] (ecmascript)");
;
;
function whatsappMessage(inv, s) {
    const d = new Date(inv.dateISO);
    const dateStr = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const L = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["labels"])(inv.language);
    const rupee = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cur"])(inv.language);
    const lines = [];
    // Company name — Telugu bills print the Telugu name, "Both" prints both lines
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["companyLines"])(s, inv.language).forEach((line, i)=>{
        lines.push(i === 0 ? `*${line}*` : line);
    });
    if (s.phone) lines.push(`${inv.language === 'te' ? 'ఫోన్' : 'Ph'}: ${s.phone}`);
    lines.push('');
    lines.push(`*${L.mInvoice}:* ${inv.no}`);
    lines.push(`${L.mDate}: ${dateStr}, ${timeStr}`);
    if (inv.customer.name) lines.push(`${L.mCustomer}: ${inv.customer.name}`);
    if (inv.customer.phone) lines.push(`${L.mMobile}: ${inv.customer.phone}`);
    lines.push('------------------------------');
    inv.items.forEach((it, i)=>{
        lines.push(`${i + 1}. ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["itemLabel"])(it, inv.language)}`);
        lines.push(`   ${L.size}: ${it.size} | ${it.qty} x ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(it.price)} = *${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(it.price * it.qty)}*`);
        if ((it.discount || 0) > 0) lines.push(`   ${L.mDiscount}: -${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(it.discount || 0)}`);
    });
    lines.push('------------------------------');
    lines.push(`${L.mSubtotal}: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.subtotal)}`);
    if ((inv.totals.itemDiscounts || 0) > 0) lines.push(`${L.itemDiscounts}: -${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.itemDiscounts)}`);
    if (inv.totals.discount > 0) lines.push(`${L.mDiscount}: -${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.discount)}`);
    if ((inv.labourCharge || 0) > 0) lines.push(`${L.labour}: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.labourCharge)}`);
    if ((inv.autoCharge || 0) > 0) lines.push(`${L.auto}: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.autoCharge)}`);
    lines.push(`*${L.total}: ${rupee} ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.total)}*`);
    lines.push(`${L.payment}: ${L.modes[inv.paymentMode] || inv.paymentMode}`);
    lines.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fill"])(L.mPaidBal, {
        paid: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.paid),
        balance: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.balance)
    }));
    if (inv.status === 'Paid') lines.push('');
    lines.push('');
    // UPI ID is intentionally NOT printed — the balance QR in the bill image carries it
    lines.push(inv.language === 'en' ? s.returnPolicy || L.policy : L.policy);
    lines.push('');
    lines.push(`${L.mThanks} \u{1F64F}`);
    lines.push(`- ${s.ownerName || ''}`);
    lines.push(`${inv.language === 'en' ? 'Proprietor' : L.proprietor}, ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["companyNameFor"])(s, inv.language)}`);
    lines.push('');
    lines.push(`_${L.mImageSeparately}_`);
    return lines.join('\n');
}
function whatsappCaption(inv, s) {
    const d = new Date(inv.dateISO);
    const dateStr = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const L = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["labels"])(inv.language);
    const rupee = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cur"])(inv.language);
    const te = inv.language === 'te';
    const lines = [];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["companyLines"])(s, inv.language).forEach((line, i)=>{
        lines.push(i === 0 ? `*${line}*` : line);
    });
    lines.push(`${L.mInvoice} *${inv.no}* · ${L.mDate} ${dateStr}`);
    if (inv.customer.name) lines.push(`${L.mCustomer}: ${inv.customer.name}`);
    lines.push(`*${L.total}: ${rupee} ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.total)}*${inv.totals.balance > 0 ? ` (${te ? 'బాకీ' : 'Balance'}: ${rupee} ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.balance)})` : ` (${te ? 'చెల్లించారు' : 'Paid'})`}`);
    lines.push('');
    lines.push(inv.totals.balance > 0 ? `${L.capAttachedDue} \u{1F9FE} \u{1F64F}` : `${L.capAttachedPaid} \u{1F9FE} \u{1F64F}`);
    lines.push(`- ${s.ownerName || ''}`);
    return lines.join('\n');
}
function smsMessage(inv, s) {
    const d = new Date(inv.dateISO);
    const dateStr = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
    });
    const L = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["labels"])(inv.language);
    const te = inv.language === 'te';
    const rupee = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cur"])(inv.language);
    const companyFull = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["companyNameFor"])(s, inv.language);
    const company = companyFull.split(' ').slice(0, 4).join(' ');
    const items = inv.items.map((it)=>`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["itemLabel"])(it, inv.language)} ${it.size} x${it.qty}=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(it.price * it.qty)}`).join('; ');
    const extras = (inv.totals.itemDiscounts || 0) > 0 || (inv.labourCharge || 0) > 0 || (inv.autoCharge || 0) > 0 ? ` (${te ? 'త' : 'D'}:${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(inv.totals.itemDiscounts || 0)}, ${te ? 'కూ' : 'L'}:${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(inv.labourCharge || 0)}, ${te ? 'ఆ' : 'A'}:${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(inv.autoCharge || 0)})` : '';
    const totals = ` ${te ? 'ఉప' : 'Sub'}:${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(inv.totals.subtotal)}${extras} ${te ? 'మొత్తం' : 'TOTAL'}:${rupee}${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(inv.totals.total)}. ${L.modes[inv.paymentMode] || inv.paymentMode}, ${te ? 'చెల్లించినది' : 'Paid'}:${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(inv.totals.paid)}, ${te ? 'బాకీ' : 'Bal'}:${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtShort"])(inv.totals.balance)}.`;
    const tail = ` ${L.mThanks} - ${s.ownerName || ''}`;
    return `${company}${inv.customer.name ? ` ${te ? 'కస్టమర్' : 'Cust'}: ${inv.customer.name}.` : ''} ${te ? 'బిల్లు' : 'Inv'} ${inv.no} (${dateStr})\n${items}\n${totals}${tail}`;
}
}),
"[project]/src/lib/version.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** App release version — bump together with sw.js CACHE when an update ships */ __turbopack_context__.s([
    "APP_VERSION",
    ()=>APP_VERSION
]);
const APP_VERSION = '27';
}),
"[project]/src/hooks/use-app-lang.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppLang",
    ()=>useAppLang,
    "useT",
    ()=>useT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/i18n.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function useAppLang() {
    const lang = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"])((s)=>s.settings.appLang);
    return lang === 'te' ? 'te' : 'en';
}
function useT() {
    const lang = useAppLang();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appT"])(lang, key), [
        lang
    ]);
}
}),
"[project]/src/hooks/use-qr.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useQrDataUrl",
    ()=>useQrDataUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$qrcode$2f$lib$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/qrcode/lib/index.js [app-ssr] (ecmascript)");
'use client';
;
;
function useQrDataUrl(value) {
    const [url, setUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // empty value → nothing to render (callers guard with `qr && value`)
        if (!value) return;
        let alive = true;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$qrcode$2f$lib$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].toDataURL(value, {
            margin: 1,
            width: 240,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
        }).then((u)=>{
            if (alive) setUrl(u);
        }).catch(()=>undefined);
        return ()=>{
            alive = false;
        };
    }, [
        value
    ]);
    return url;
}
}),
"[project]/src/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navigation$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Navigation.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BillTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BillTab.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProductsView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProductsView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LedgerView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/LedgerView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LabourView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/LabourView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$HistoryView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/HistoryView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SettingsView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SettingsView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BillPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BillPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$InvoiceModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/InvoiceModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PwaInstall$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PwaInstall.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ConnectivityToast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ConnectivityToast.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SyncReauth$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SyncReauth.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LockScreen$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/LockScreen.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$app$2d$lang$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-app-lang.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/billing.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sync$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sync.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const subscribeNoop = ()=>()=>undefined;
/** Background themes — applied to the whole app from Settings → Appearance */ const BG_STYLES = {
    blue: 'from-blue-50/70 to-neutral-100',
    cream: 'from-amber-50/90 to-stone-100',
    mint: 'from-emerald-50/80 to-neutral-100',
    lavender: 'from-violet-50/80 to-neutral-100',
    slate: 'from-slate-200/80 to-slate-100'
};
/**
 * Opening splash — the company logo zooms in for a moment when the app starts,
 * then the overlay fades away into the app.
 */ function Splash({ logoSrc, name }) {
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('in');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const t1 = setTimeout(()=>setPhase('out'), 1600);
        const t2 = setTimeout(()=>setPhase('gone'), 2100);
        return ()=>{
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);
    if (phase === 'gone') return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-splash": "logo",
        "aria-hidden": true,
        className: `pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-white via-blue-50 to-blue-100 ${phase === 'out' ? 'anim-splash-fade' : ''}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                src: logoSrc,
                alt: "",
                className: "anim-splash-zoom size-44 rounded-full object-cover shadow-2xl ring-4 ring-white"
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "anim-fade-up max-w-xs px-6 text-center text-lg font-extrabold leading-snug text-blue-900",
                style: {
                    animationDelay: '250ms'
                },
                children: name
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
function Home() {
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$app$2d$lang$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useT"])();
    const appLang = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$app$2d$lang$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppLang"])();
    const activeTab = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"])((s)=>s.activeTab);
    const setActiveTab = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"])((s)=>s.setActiveTab);
    const cart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"])((s)=>s.cart);
    const cfg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"])((s)=>s.billConfig);
    const bgTheme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"])((s)=>s.appearance.bgTheme);
    const watermark = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"])((s)=>s.appearance.watermark);
    const settings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"])((s)=>s.settings);
    const [modalInvoice, setModalInvoice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [modalOpen, setModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [modalView, setModalView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('slip');
    const [showSplash, setShowSplash] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true); // opening zoom — plays once per app open
    /** app gate: the MPIN stands in front of the app on EVERY open (owner's request) */ const [gate, setGate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('locked');
    // Rehydrate persisted store AFTER mount (skipHydration) — avoids SSR mismatch.
    // Fresh open ALWAYS lands on the Bill tab (so product selection is one tap away),
    // even though the rest of the state (bills, settings, cart) is restored.
    // The gate starts 'locked': the owner asked for the MPIN to be asked EVERY
    // time the app opens. It is created once — afterwards it is only ever ASKED
    // (login), never created again: the device verifies it on the phone
    // (offline-proof) and the sync account silently heals itself if the server
    // ever loses it.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        Promise.resolve(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"].persist.rehydrate()).then(()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"].setState({
                activeTab: 'bill'
            });
        });
    }, []);
    const handleUnlocked = ()=>{
        setGate('ready');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sync$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["startSyncEngine"])();
    };
    // true on client after hydration, false on the server (avoids SSR mismatch)
    const mounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(subscribeNoop, ()=>true, ()=>false);
    const totals = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeTotals"])(cart, cfg);
    // company name follows the app language (same rule as the header)
    const companyName = appLang === 'te' && settings.companyNameTe ? settings.companyNameTe : settings.companyName;
    const logoSrc = watermark || '/narasimha-logo.jpg';
    const openInvoice = (inv, view = 'slip')=>{
        setModalInvoice(inv);
        setModalView(view);
        setModalOpen(true);
    };
    const onBillCompleted = ()=>{
        const inv = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStore"].getState().lastInvoice;
        if (inv) openInvoice(inv);
    };
    /* ----- gate: the MPIN lock stands in front of the whole app ----- */ if (gate === 'locked') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                showSplash && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Splash, {
                    logoSrc: logoSrc,
                    name: companyName
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 135,
                    columnNumber: 24
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LockScreen$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    onUnlocked: handleUnlocked
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 136,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-app-root": true,
        className: `relative min-h-dvh bg-gradient-to-b ${BG_STYLES[bgTheme]}`,
        children: [
            showSplash && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Splash, {
                logoSrc: logoSrc,
                name: companyName
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 143,
                columnNumber: 22
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": true,
                "data-watermark": "logo",
                className: "pointer-events-none fixed inset-0 z-20 flex items-center justify-center overflow-hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: logoSrc,
                    alt: "",
                    className: "w-[74vmin] max-w-[420px] min-w-[260px] select-none rounded-full object-cover opacity-[0.06]"
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 151,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PwaInstall$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ServiceWorkerRegister"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navigation$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Header"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PwaInstall$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ConnectivityToast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 160,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SyncReauth$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 161,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "relative z-10 mx-auto max-w-5xl px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 lg:pb-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navigation$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DesktopTabs"], {}, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 164,
                        columnNumber: 9
                    }, this),
                    !mounted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-center py-24 text-sm text-muted-foreground",
                        children: t('page.loading')
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 167,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "anim-fade-up",
                        children: [
                            activeTab === 'bill' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 lg:items-start",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "mb-3 text-base font-bold text-neutral-800",
                                                children: t('products.tapSize')
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 173,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BillTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                onCompleted: onBillCompleted
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 174,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 172,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                                        className: "sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border bg-card p-4 shadow-sm lg:block",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "mb-3 text-base font-bold text-neutral-800",
                                                children: t('page.currentBill')
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 178,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BillPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                onComplete: onBillCompleted
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 179,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 177,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 171,
                                columnNumber: 15
                            }, this),
                            activeTab === 'products' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mx-auto max-w-2xl",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "mb-3 text-base font-bold text-neutral-800",
                                        children: t('products.catalog')
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 186,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProductsView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 187,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 185,
                                columnNumber: 15
                            }, this),
                            activeTab === 'ledger' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mx-auto max-w-2xl",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "mb-3 text-base font-bold text-neutral-800",
                                        children: t('ledger.title')
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 193,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LedgerView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 194,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 192,
                                columnNumber: 15
                            }, this),
                            activeTab === 'labour' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mx-auto max-w-2xl",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "mb-3 text-base font-bold text-neutral-800",
                                        children: t('labour.title')
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 200,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LabourView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 201,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 199,
                                columnNumber: 15
                            }, this),
                            activeTab === 'history' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mx-auto max-w-2xl",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "mb-3 text-base font-bold text-neutral-800",
                                        children: t('nav.invoiceHistory')
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 207,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$HistoryView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        onOpenInvoice: openInvoice
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 208,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 206,
                                columnNumber: 15
                            }, this),
                            activeTab === 'settings' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mx-auto max-w-2xl pb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "mb-3 text-base font-bold text-neutral-800",
                                        children: t('nav.settings')
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 214,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SettingsView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 215,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 213,
                                columnNumber: 15
                            }, this)
                        ]
                    }, activeTab, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 169,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 163,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navigation$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BottomNav"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 222,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$InvoiceModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                invoice: modalInvoice,
                open: modalOpen,
                view: modalView,
                onOpenChange: setModalOpen
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 224,
                columnNumber: 7
            }, this),
            activeTab !== 'bill' && cart.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setActiveTab('bill'),
                className: "fixed right-4 top-[4.5rem] z-40 rounded-full bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg lg:hidden",
                children: [
                    cart.length,
                    " ",
                    t('bill.items'),
                    " · ₹",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmt"])(totals.total)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 228,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 142,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_24ac5ef0._.js.map
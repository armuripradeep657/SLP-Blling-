(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/LedgerView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LedgerView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/label.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/select.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-down-right.js [app-client] (ecmascript) <export default as ArrowDownRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-up-right.js [app-client] (ecmascript) <export default as ArrowUpRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-days.js [app-client] (ecmascript) <export default as CalendarDays>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$indian$2d$rupee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__IndianRupee$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/indian-rupee.js [app-client] (ecmascript) <export default as IndianRupee>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-client] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wallet.js [app-client] (ecmascript) <export default as Wallet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/billing.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$app$2d$lang$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-app-lang.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
const EXPENSE_CATEGORIES = [
    'Labour wages',
    'Diesel',
    'Raw material',
    'Other'
];
const CATEGORY_TE = {
    'Labour wages': 'కూలీ వేతనాలు',
    Diesel: 'డీజిల్',
    'Raw material': 'ముడి పదార్థం',
    Other: 'ఇతర'
};
const MODES = [
    'Cash',
    'UPI',
    'Card'
];
/** 24-hour HH:MM — matches the direct time inputs picked by the owner */ function fmtTime(d) {
    return d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
/** Current local time as HH:MM — default value for the direct time inputs */ function nowHM() {
    return fmtTime(new Date());
}
function categoryLabel(c, appLang) {
    return appLang === 'te' ? CATEGORY_TE[c] : c;
}
function modeLabel(m, appLang) {
    if (appLang !== 'te') return m;
    return m === 'Cash' ? 'నగదు' : m === 'Card' ? 'కార్డ్' : m === 'Due' ? 'బాకీ' : 'UPI';
}
/** Cash / UPI / Card chip — on income and spent rows alike */ function ModeChip({ mode, appLang }) {
    if (!mode) return null;
    const cls = mode === 'Cash' ? 'bg-green-100 text-green-800' : mode === 'UPI' ? 'bg-blue-100 text-blue-800' : mode === 'Due' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cls}`,
        children: modeLabel(mode, appLang)
    }, void 0, false, {
        fileName: "[project]/src/components/LedgerView.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
_c = ModeChip;
/** Stat card used across ledger tabs (module-level — never created during render) */ function StatCard({ label, value, kind }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "anim-pop rounded-xl border bg-card p-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "flex items-center gap-1 text-xs text-muted-foreground",
                children: [
                    kind === 'in' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"], {
                        className: "size-3.5 text-green-700"
                    }, void 0, false, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 102,
                        columnNumber: 11
                    }, this) : kind === 'out' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownRight$3e$__["ArrowDownRight"], {
                        className: "size-3.5 text-red-600"
                    }, void 0, false, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 104,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                        className: "size-3.5 text-blue-700"
                    }, void 0, false, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 106,
                        columnNumber: 11
                    }, this),
                    label
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `mt-0.5 text-lg font-extrabold tabular-nums ${kind === 'in' ? 'text-green-700' : kind === 'out' ? 'text-red-600' : value < 0 ? 'text-red-600' : 'text-blue-800'}`,
                children: [
                    "₹",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(value)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/LedgerView.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, this);
}
_c1 = StatCard;
/** Row used by the day view AND the expandable all-days detail */ function LedgerRowItem({ r, appLang, i }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        className: "anim-fade-up flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2",
        style: {
            animationDelay: `${Math.min(i, 10) * 40}ms`
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex min-w-0 items-center gap-2.5",
                children: [
                    r.kind === 'in' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"], {
                            className: "size-4"
                        }, void 0, false, {
                            fileName: "[project]/src/components/LedgerView.tsx",
                            lineNumber: 131,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 130,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownRight$3e$__["ArrowDownRight"], {
                            className: "size-4"
                        }, void 0, false, {
                            fileName: "[project]/src/components/LedgerView.tsx",
                            lineNumber: 135,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 134,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "flex items-center gap-1.5 truncate text-sm font-medium",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "truncate",
                                        children: r.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 140,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeChip, {
                                        mode: r.mode,
                                        appLang: appLang
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 141,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "truncate text-[11px] text-muted-foreground",
                                children: [
                                    r.time,
                                    r.sub ? ` · ${r.sub}` : ''
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 143,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 128,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `shrink-0 text-sm font-bold tabular-nums ${r.kind === 'in' ? 'text-green-700' : 'text-red-600'}`,
                children: [
                    r.kind === 'in' ? '+' : '−',
                    " ₹",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(r.amount)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 149,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/LedgerView.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, this);
}
_c2 = LedgerRowItem;
function LedgerView() {
    _s();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$app$2d$lang$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"])();
    const appLang = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$app$2d$lang$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppLang"])();
    const invoices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"])({
        "LedgerView.useStore[invoices]": (s)=>s.invoices
    }["LedgerView.useStore[invoices]"]);
    const expenses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"])({
        "LedgerView.useStore[expenses]": (s)=>s.expenses
    }["LedgerView.useStore[expenses]"]);
    const incomes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"])({
        "LedgerView.useStore[incomes]": (s)=>s.incomes
    }["LedgerView.useStore[incomes]"]);
    const receiveDuePayment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"])({
        "LedgerView.useStore[receiveDuePayment]": (s)=>s.receiveDuePayment
    }["LedgerView.useStore[receiveDuePayment]"]);
    const addExpense = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"])({
        "LedgerView.useStore[addExpense]": (s)=>s.addExpense
    }["LedgerView.useStore[addExpense]"]);
    const deleteExpense = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"])({
        "LedgerView.useStore[deleteExpense]": (s)=>s.deleteExpense
    }["LedgerView.useStore[deleteExpense]"]);
    const addIncome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"])({
        "LedgerView.useStore[addIncome]": (s)=>s.addIncome
    }["LedgerView.useStore[addIncome]"]);
    const deleteIncome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"])({
        "LedgerView.useStore[deleteIncome]": (s)=>s.deleteIncome
    }["LedgerView.useStore[deleteIncome]"]);
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const today = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localDateKey"])(new Date());
    const thisMonth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localMonthKey"])(new Date());
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('day');
    const [day, setDay] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(today);
    const [month, setMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(thisMonth);
    const [expandedDay, setExpandedDay] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    /* ---------------- Money aggregation ---------------- */ // Every income / spent entry grouped by local day — feeds the day view,
    // the all-days list AND each day's expandable detail (name + Cash/UPI)
    const rowsByDay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LedgerView.useMemo[rowsByDay]": ()=>{
            const map = new Map();
            const push = {
                "LedgerView.useMemo[rowsByDay].push": (k, r)=>{
                    const list = map.get(k);
                    if (list) list.push(r);
                    else map.set(k, [
                        r
                    ]);
                }
            }["LedgerView.useMemo[rowsByDay].push"];
            invoices.forEach({
                "LedgerView.useMemo[rowsByDay]": (inv)=>{
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["paymentsOf"])(inv).forEach({
                        "LedgerView.useMemo[rowsByDay]": (p)=>{
                            const d = new Date(p.dateISO);
                            push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localDateKey"])(d), {
                                time: fmtTime(d),
                                ts: d.getTime(),
                                label: `${t('ledger.receivedFrom')} ${inv.customer.name || inv.no}`,
                                sub: inv.no,
                                amount: p.amount,
                                kind: 'in',
                                mode: p.mode
                            });
                        }
                    }["LedgerView.useMemo[rowsByDay]"]);
                }
            }["LedgerView.useMemo[rowsByDay]"]);
            expenses.forEach({
                "LedgerView.useMemo[rowsByDay]": (e)=>{
                    const d = new Date(e.dateISO);
                    push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localDateKey"])(d), {
                        time: fmtTime(d),
                        ts: d.getTime(),
                        // person is the row name when given — else the category
                        label: e.person ? e.person : categoryLabel(e.category, appLang),
                        sub: [
                            e.person ? categoryLabel(e.category, appLang) : '',
                            e.note || ''
                        ].filter(Boolean).join(' · '),
                        amount: e.amount,
                        kind: 'out',
                        mode: e.mode
                    });
                }
            }["LedgerView.useMemo[rowsByDay]"]);
            // manual income entries — money received outside a bill, with its own name
            incomes.forEach({
                "LedgerView.useMemo[rowsByDay]": (e)=>{
                    const d = new Date(e.dateISO);
                    push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localDateKey"])(d), {
                        time: fmtTime(d),
                        ts: d.getTime(),
                        label: e.name,
                        sub: '',
                        amount: e.amount,
                        kind: 'in',
                        mode: e.mode
                    });
                }
            }["LedgerView.useMemo[rowsByDay]"]);
            // newest first within each day (by real timestamp — safe across am/pm)
            map.forEach({
                "LedgerView.useMemo[rowsByDay]": (list, k)=>map.set(k, [
                        ...list
                    ].sort({
                        "LedgerView.useMemo[rowsByDay]": (a, b)=>b.ts - a.ts
                    }["LedgerView.useMemo[rowsByDay]"]))
            }["LedgerView.useMemo[rowsByDay]"]);
            return map;
        }
    }["LedgerView.useMemo[rowsByDay]"], [
        invoices,
        expenses,
        incomes,
        t,
        appLang
    ]);
    const dayRows = rowsByDay.get(day) ?? [];
    const moneyByDay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LedgerView.useMemo[moneyByDay]": ()=>{
            const map = new Map();
            rowsByDay.forEach({
                "LedgerView.useMemo[moneyByDay]": (rows, k)=>{
                    const acc = {
                        income: 0,
                        spent: 0
                    };
                    rows.forEach({
                        "LedgerView.useMemo[moneyByDay]": (r)=>r.kind === 'in' ? acc.income += r.amount : acc.spent += r.amount
                    }["LedgerView.useMemo[moneyByDay]"]);
                    map.set(k, {
                        income: Math.round(acc.income * 100) / 100,
                        spent: Math.round(acc.spent * 100) / 100
                    });
                }
            }["LedgerView.useMemo[moneyByDay]"]);
            return map;
        }
    }["LedgerView.useMemo[moneyByDay]"], [
        rowsByDay
    ]);
    const dayMoney = (k)=>moneyByDay.get(k) ?? {
            income: 0,
            spent: 0
        };
    const dues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LedgerView.useMemo[dues]": ()=>invoices.filter({
                "LedgerView.useMemo[dues]": (i)=>i.totals.balance > 0
            }["LedgerView.useMemo[dues]"]).sort({
                "LedgerView.useMemo[dues]": (a, b)=>b.dateISO.localeCompare(a.dateISO)
            }["LedgerView.useMemo[dues]"])
    }["LedgerView.useMemo[dues]"], [
        invoices
    ]);
    const totalDue = dues.reduce((s, i)=>s + i.totals.balance, 0);
    // all-days rows for the selected month
    const monthDays = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LedgerView.useMemo[monthDays]": ()=>[
                ...moneyByDay.keys()
            ].filter({
                "LedgerView.useMemo[monthDays]": (k)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localMonthKey"])(new Date(`${k}T12:00:00`)) === month
            }["LedgerView.useMemo[monthDays]"]).sort({
                "LedgerView.useMemo[monthDays]": (a, b)=>b.localeCompare(a)
            }["LedgerView.useMemo[monthDays]"]).map({
                "LedgerView.useMemo[monthDays]": (k)=>({
                        key: k,
                        ...moneyByDay.get(k)
                    })
            }["LedgerView.useMemo[monthDays]"])
    }["LedgerView.useMemo[monthDays]"], [
        moneyByDay,
        month
    ]);
    const monthIncome = monthDays.reduce((s, d)=>s + d.income, 0);
    const monthSpent = monthDays.reduce((s, d)=>s + d.spent, 0);
    const monthExpenses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LedgerView.useMemo[monthExpenses]": ()=>expenses.filter({
                "LedgerView.useMemo[monthExpenses]": (e)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localMonthKey"])(new Date(e.dateISO)) === month
            }["LedgerView.useMemo[monthExpenses]"]).sort({
                "LedgerView.useMemo[monthExpenses]": (a, b)=>b.dateISO.localeCompare(a.dateISO)
            }["LedgerView.useMemo[monthExpenses]"])
    }["LedgerView.useMemo[monthExpenses]"], [
        expenses,
        month
    ]);
    const monthIncomes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LedgerView.useMemo[monthIncomes]": ()=>incomes.filter({
                "LedgerView.useMemo[monthIncomes]": (e)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localMonthKey"])(new Date(e.dateISO)) === month
            }["LedgerView.useMemo[monthIncomes]"]).sort({
                "LedgerView.useMemo[monthIncomes]": (a, b)=>b.dateISO.localeCompare(a.dateISO)
            }["LedgerView.useMemo[monthIncomes]"])
    }["LedgerView.useMemo[monthIncomes]"], [
        incomes,
        month
    ]);
    /* ---------------- Receive-due inline panel ---------------- */ const [receiving, setReceiving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [recvAmount, setRecvAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [recvMode, setRecvMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Cash');
    const openReceive = (id, balance)=>{
        setReceiving(id);
        setRecvAmount(String((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtShort"])(balance)));
        setRecvMode('Cash');
    };
    const confirmReceive = ()=>{
        if (!receiving) return;
        const amt = Number(recvAmount) || 0;
        if (amt <= 0) return;
        receiveDuePayment(receiving, amt, recvMode);
        setReceiving(null);
        toast({
            title: t('ledger.receiveDone'),
            description: `₹${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(amt)} · ${modeLabel(recvMode, appLang)}`
        });
    };
    /* ---------------- Expense form ---------------- */ const [expDate, setExpDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(today);
    const [expTime, setExpTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "LedgerView.useState": ()=>nowHM()
    }["LedgerView.useState"]);
    const [expCat, setExpCat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Labour wages');
    const [expPerson, setExpPerson] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [expAmount, setExpAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [expPurpose, setExpPurpose] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [expMode, setExpMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Cash');
    /** Combine the picked date + time into a local ISO stamp (falls back to now) */ const stampFrom = (d, hm)=>{
        const dt = new Date(`${d || today}T${hm || '12:00'}:00`);
        return (isNaN(dt.getTime()) ? new Date() : dt).toISOString();
    };
    const submitExpense = ()=>{
        const amt = Number(expAmount) || 0;
        if (amt <= 0) return;
        const person = expPerson.trim();
        const purpose = expPurpose.trim();
        // date + time inputs give local values — combine them directly
        addExpense({
            dateISO: stampFrom(expDate, expTime),
            category: expCat,
            amount: amt,
            person: person || undefined,
            note: purpose || undefined,
            mode: expMode
        });
        setExpPerson('');
        setExpAmount('');
        setExpPurpose('');
        setExpTime(nowHM());
        toast({
            title: t('ledger.expAdded'),
            description: `${person ? `${person} · ` : ''}₹${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(amt)} · ${categoryLabel(expCat, appLang)} · ${modeLabel(expMode, appLang)}`
        });
    };
    /* ---------------- Manual income form ---------------- */ const [incDate, setIncDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(today);
    const [incTime, setIncTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "LedgerView.useState": ()=>nowHM()
    }["LedgerView.useState"]);
    const [incName, setIncName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [incAmount, setIncAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [incMode, setIncMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Cash');
    const submitIncome = ()=>{
        const amt = Number(incAmount) || 0;
        if (amt <= 0 || !incName.trim()) return;
        addIncome({
            dateISO: stampFrom(incDate, incTime),
            name: incName.trim(),
            amount: amt,
            mode: incMode
        });
        setIncName('');
        setIncAmount('');
        setIncTime(nowHM());
        toast({
            title: t('ledger.incAdded'),
            description: `₹${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(amt)} · ${incName.trim()} · ${modeLabel(incMode, appLang)}`
        });
    };
    const tabs = [
        {
            id: 'day',
            label: t('ledger.day')
        },
        {
            id: 'allDays',
            label: t('ledger.allDays')
        },
        {
            id: 'income',
            label: t('ledger.income')
        },
        {
            id: 'expenses',
            label: t('ledger.expenses')
        },
        {
            id: 'dues',
            label: `${t('ledger.dues')}${totalDue > 0 ? ` (${dues.length})` : ''}`
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-1.5 overflow-x-auto pb-1",
                role: "tablist",
                "aria-label": "Ledger sections",
                children: tabs.map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        role: "tab",
                        "aria-selected": tab === x.id,
                        onClick: ()=>setTab(x.id),
                        className: `shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${tab === x.id ? 'bg-blue-600 text-white' : 'border bg-card hover:bg-accent'}`,
                        children: x.label
                    }, x.id, false, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 382,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 380,
                columnNumber: 7
            }, this),
            tab === 'day' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"], {
                                className: "size-4 shrink-0 text-blue-700"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 400,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                type: "date",
                                value: day,
                                max: today,
                                onChange: (e)=>setDay(e.target.value),
                                className: "h-11 max-w-44",
                                "aria-label": "Ledger day"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 401,
                                columnNumber: 13
                            }, this),
                            day !== today && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                variant: "ghost",
                                size: "sm",
                                className: "h-9",
                                onClick: ()=>setDay(today),
                                children: appLang === 'te' ? 'ఈ రోజు' : 'Today'
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 403,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 399,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-3 gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: t('ledger.income'),
                                value: dayMoney(day).income,
                                kind: "in"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 409,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: t('ledger.spent'),
                                value: dayMoney(day).spent,
                                kind: "out"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 410,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: t('ledger.net'),
                                value: dayMoney(day).income - dayMoney(day).spent,
                                kind: "net"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 411,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 408,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "space-y-1.5",
                        children: [
                            dayRows.map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LedgerRowItem, {
                                    r: r,
                                    appLang: appLang,
                                    i: i
                                }, `${r.time}-${r.label}-${i}`, false, {
                                    fileName: "[project]/src/components/LedgerView.tsx",
                                    lineNumber: 415,
                                    columnNumber: 15
                                }, this)),
                            dayRows.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "py-10 text-center text-sm text-muted-foreground",
                                children: t('ledger.noActivity')
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 418,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 413,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 398,
                columnNumber: 9
            }, this),
            tab === 'allDays' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"], {
                                className: "size-4 shrink-0 text-blue-700"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 428,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                type: "month",
                                value: month,
                                onChange: (e)=>setMonth(e.target.value || thisMonth),
                                className: "h-11 max-w-44",
                                "aria-label": "Ledger month"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 429,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 427,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-3 gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: t('ledger.income'),
                                value: monthIncome,
                                kind: "in"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 432,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: t('ledger.spent'),
                                value: monthSpent,
                                kind: "out"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 433,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: t('ledger.net'),
                                value: monthIncome - monthSpent,
                                kind: "net"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 434,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 431,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-hidden rounded-xl border bg-card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-[1fr_auto_auto_auto] gap-x-3 bg-blue-600 px-3 py-2 text-[11px] font-bold text-white",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t('ledger.date')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 438,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-20 text-right",
                                        children: t('ledger.income')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 439,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-20 text-right",
                                        children: t('ledger.spent')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 440,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-20 text-right",
                                        children: t('ledger.net')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 441,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 437,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "max-h-96 divide-y overflow-y-auto",
                                children: [
                                    monthDays.map((d)=>{
                                        const net = Math.round((d.income - d.spent) * 100) / 100;
                                        const dt = new Date(`${d.key}T12:00:00`);
                                        const open = expandedDay === d.key;
                                        const rows = rowsByDay.get(d.key) ?? [];
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: open ? 'bg-blue-50/50' : undefined,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setExpandedDay(open ? null : d.key),
                                                    "aria-expanded": open,
                                                    className: "grid w-full grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 text-xs tabular-nums transition-colors hover:bg-accent/60",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "flex items-center gap-1 font-medium",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                                    className: `size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 457,
                                                                    columnNumber: 25
                                                                }, this),
                                                                dt.toLocaleDateString('en-IN', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: '2-digit'
                                                                })
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 456,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "w-20 text-right font-semibold text-green-700",
                                                            children: [
                                                                "₹",
                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtShort"])(d.income)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 460,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "w-20 text-right font-semibold text-red-600",
                                                            children: [
                                                                "₹",
                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtShort"])(d.spent)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 461,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `w-20 text-right font-bold ${net < 0 ? 'text-red-600' : 'text-blue-800'}`,
                                                            children: [
                                                                "₹",
                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtShort"])(net)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 462,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 451,
                                                    columnNumber: 21
                                                }, this),
                                                open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "anim-fade-up space-y-1 px-2.5 pb-2.5",
                                                    children: rows.map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center justify-between gap-2 rounded-lg border bg-card px-2.5 py-1.5",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex min-w-0 items-center gap-1.5",
                                                                    children: [
                                                                        r.kind === 'in' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"], {
                                                                            className: "size-3.5 shrink-0 text-green-700"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                                            lineNumber: 471,
                                                                            columnNumber: 33
                                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownRight$3e$__["ArrowDownRight"], {
                                                                            className: "size-3.5 shrink-0 text-red-600"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                                            lineNumber: 473,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "truncate text-[11px] font-medium",
                                                                            children: r.label
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                                            lineNumber: 475,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        r.sub ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "shrink-0 text-[10px] text-muted-foreground",
                                                                            children: [
                                                                                "· ",
                                                                                r.sub
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                                            lineNumber: 476,
                                                                            columnNumber: 40
                                                                        }, this) : null,
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeChip, {
                                                                            mode: r.mode,
                                                                            appLang: appLang
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                                            lineNumber: 477,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 469,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `shrink-0 text-[11px] font-bold tabular-nums ${r.kind === 'in' ? 'text-green-700' : 'text-red-600'}`,
                                                                    children: [
                                                                        r.kind === 'in' ? '+' : '−',
                                                                        " ₹",
                                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtShort"])(r.amount)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 479,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, i, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 468,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 466,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, d.key, true, {
                                            fileName: "[project]/src/components/LedgerView.tsx",
                                            lineNumber: 450,
                                            columnNumber: 19
                                        }, this);
                                    }),
                                    monthDays.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "py-10 text-center text-sm text-muted-foreground",
                                        children: t('ledger.noActivity')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 490,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 443,
                                columnNumber: 13
                            }, this),
                            monthDays.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-t bg-neutral-50 px-3 py-2 text-xs font-bold tabular-nums",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t('ledger.monthTotal')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 495,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-20 text-right text-green-700",
                                        children: [
                                            "₹",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtShort"])(monthIncome)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 496,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-20 text-right text-red-600",
                                        children: [
                                            "₹",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtShort"])(monthSpent)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 497,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-20 text-right text-blue-800",
                                        children: [
                                            "₹",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtShort"])(monthIncome - monthSpent)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 498,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 494,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 436,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 426,
                columnNumber: 9
            }, this),
            tab === 'income' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2.5 rounded-xl border bg-card p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-bold text-green-800",
                                children: [
                                    t('ledger.monthIncome'),
                                    ": ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "tabular-nums",
                                        children: [
                                            "₹",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(monthIncome)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 510,
                                        columnNumber: 42
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 509,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.date')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 514,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "date",
                                                value: incDate,
                                                max: today,
                                                onChange: (e)=>setIncDate(e.target.value),
                                                className: "h-10",
                                                "aria-label": "Income date"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 515,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 513,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.time')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 518,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "time",
                                                value: incTime,
                                                onChange: (e)=>setIncTime(e.target.value),
                                                className: "h-10",
                                                "aria-label": "Income time"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 519,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 517,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 512,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        className: "text-[11px] text-muted-foreground",
                                        children: t('ledger.incName')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 523,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        value: incName,
                                        onChange: (e)=>setIncName(e.target.value),
                                        placeholder: t('ledger.incPlaceholder'),
                                        className: "h-10",
                                        "aria-label": "Income name"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 524,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 522,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.expAmount')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 528,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "number",
                                                inputMode: "decimal",
                                                min: 0,
                                                value: incAmount,
                                                onChange: (e)=>setIncAmount(e.target.value),
                                                placeholder: "0",
                                                className: "h-10",
                                                "aria-label": "Income amount"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 529,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 527,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.receiveMode')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 532,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                                value: incMode,
                                                onValueChange: (v)=>setIncMode(v),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectTrigger"], {
                                                        className: "h-10",
                                                        "aria-label": "Income payment mode",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectValue"], {}, void 0, false, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 535,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 534,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectContent"], {
                                                        children: MODES.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectItem"], {
                                                                value: m,
                                                                children: modeLabel(m, appLang)
                                                            }, m, false, {
                                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                                lineNumber: 539,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 537,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 533,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 531,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 526,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                onClick: submitIncome,
                                className: "h-11 w-full bg-green-700 text-white hover:bg-green-800",
                                disabled: !(Number(incAmount) > 0) || !incName.trim(),
                                children: t('ledger.addIncome')
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 547,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 508,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "space-y-1.5",
                        children: [
                            monthIncomes.map((e, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    className: "anim-fade-up flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2",
                                    style: {
                                        animationDelay: `${Math.min(i, 10) * 40}ms`
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex min-w-0 items-center gap-2.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"], {
                                                        className: "size-4"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 560,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 559,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "flex items-center gap-1.5 truncate text-sm font-medium",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "truncate",
                                                                    children: e.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 564,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeChip, {
                                                                    mode: e.mode,
                                                                    appLang: appLang
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 565,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 563,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "truncate text-[11px] text-muted-foreground",
                                                            children: [
                                                                new Date(e.dateISO).toLocaleDateString('en-IN', {
                                                                    day: '2-digit',
                                                                    month: 'short'
                                                                }),
                                                                ' · ',
                                                                fmtTime(new Date(e.dateISO))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 567,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 562,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/LedgerView.tsx",
                                            lineNumber: 558,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex shrink-0 items-center gap-1.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm font-bold tabular-nums text-green-700",
                                                    children: [
                                                        "+ ₹",
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(e.amount)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 575,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    variant: "ghost",
                                                    size: "icon",
                                                    className: "size-8 text-muted-foreground hover:text-destructive",
                                                    onClick: ()=>deleteIncome(e.id),
                                                    "aria-label": `Delete income ${e.name}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                        className: "size-3.5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 577,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 576,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/LedgerView.tsx",
                                            lineNumber: 574,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, e.id, true, {
                                    fileName: "[project]/src/components/LedgerView.tsx",
                                    lineNumber: 553,
                                    columnNumber: 15
                                }, this)),
                            monthIncomes.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "py-10 text-center text-sm text-muted-foreground",
                                children: t('ledger.noIncomes')
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 583,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 551,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 507,
                columnNumber: 9
            }, this),
            tab === 'dues' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between rounded-xl border bg-red-50 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "flex items-center gap-1 text-xs text-muted-foreground",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"], {
                                                className: "size-3.5"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 595,
                                                columnNumber: 17
                                            }, this),
                                            " ",
                                            t('ledger.totalDue')
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 594,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xl font-extrabold tabular-nums text-red-600",
                                        children: [
                                            "₹",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(totalDue)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 597,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 593,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge2, {
                                children: dues.length
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 599,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 592,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "space-y-2",
                        children: [
                            dues.map((inv)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    className: "rounded-xl border bg-card p-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm font-bold",
                                                            children: [
                                                                inv.customer.name || t('history.walkin'),
                                                                " ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-xs font-normal text-muted-foreground",
                                                                    children: [
                                                                        "· ",
                                                                        inv.no
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 607,
                                                                    columnNumber: 66
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 606,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-[11px] text-muted-foreground",
                                                            children: [
                                                                new Date(inv.dateISO).toLocaleDateString('en-IN', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: '2-digit'
                                                                }),
                                                                " · ",
                                                                inv.paymentMode
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 609,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 605,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "shrink-0 text-right",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-base font-extrabold tabular-nums text-red-600",
                                                            children: [
                                                                "₹",
                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(inv.totals.balance)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 614,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            size: "sm",
                                                            className: "mt-1 h-8 bg-green-700 text-white text-xs hover:bg-green-800",
                                                            onClick: ()=>openReceive(inv.id, inv.totals.balance),
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$indian$2d$rupee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__IndianRupee$3e$__["IndianRupee"], {
                                                                    className: "size-3.5"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 616,
                                                                    columnNumber: 23
                                                                }, this),
                                                                " ",
                                                                t('ledger.receive')
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 615,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 613,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/LedgerView.tsx",
                                            lineNumber: 604,
                                            columnNumber: 17
                                        }, this),
                                        receiving === inv.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "anim-fade-up mt-2.5 space-y-2 rounded-lg border border-green-200 bg-green-50/60 p-2.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "space-y-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                    className: "text-[11px] text-muted-foreground",
                                                                    children: t('ledger.receiveAmount')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 624,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                    type: "number",
                                                                    inputMode: "decimal",
                                                                    min: 0,
                                                                    max: inv.totals.balance,
                                                                    value: recvAmount,
                                                                    onChange: (e)=>setRecvAmount(e.target.value),
                                                                    className: "h-10",
                                                                    "aria-label": "Amount received"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 625,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 623,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "space-y-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                    className: "text-[11px] text-muted-foreground",
                                                                    children: t('ledger.receiveMode')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 637,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                                                    value: recvMode,
                                                                    onValueChange: (v)=>setRecvMode(v),
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectTrigger"], {
                                                                            className: "h-10",
                                                                            "aria-label": "Payment mode",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectValue"], {}, void 0, false, {
                                                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                                                lineNumber: 640,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                                            lineNumber: 639,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectContent"], {
                                                                            children: MODES.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectItem"], {
                                                                                    value: m,
                                                                                    children: modeLabel(m, appLang)
                                                                                }, m, false, {
                                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                                    lineNumber: 644,
                                                                                    columnNumber: 31
                                                                                }, this))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                                            lineNumber: 642,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 638,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 636,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 622,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            size: "sm",
                                                            className: "h-9 flex-1 bg-green-700 text-white hover:bg-green-800",
                                                            onClick: confirmReceive,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"], {
                                                                    className: "size-4"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 654,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " ",
                                                                t('ledger.receiveConfirm')
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 653,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            size: "sm",
                                                            variant: "outline",
                                                            className: "h-9",
                                                            onClick: ()=>setReceiving(null),
                                                            children: t('history.cancel')
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 656,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 652,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/LedgerView.tsx",
                                            lineNumber: 621,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, inv.id, true, {
                                    fileName: "[project]/src/components/LedgerView.tsx",
                                    lineNumber: 603,
                                    columnNumber: 15
                                }, this)),
                            dues.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "py-10 text-center text-sm text-muted-foreground",
                                children: t('ledger.noDues')
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 665,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 601,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 591,
                columnNumber: 9
            }, this),
            tab === 'expenses' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2.5 rounded-xl border bg-card p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-bold text-blue-800",
                                children: [
                                    t('ledger.monthSpent'),
                                    ": ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "tabular-nums",
                                        children: [
                                            "₹",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(monthSpent)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 676,
                                        columnNumber: 41
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 675,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.date')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 680,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "date",
                                                value: expDate,
                                                max: today,
                                                onChange: (e)=>setExpDate(e.target.value),
                                                className: "h-10",
                                                "aria-label": "Expense date"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 681,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 679,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.time')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 684,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "time",
                                                value: expTime,
                                                onChange: (e)=>setExpTime(e.target.value),
                                                className: "h-10",
                                                "aria-label": "Expense time"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 685,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 683,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 678,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.expCategory')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 690,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                                value: expCat,
                                                onValueChange: (v)=>setExpCat(v),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectTrigger"], {
                                                        className: "h-10",
                                                        "aria-label": "Expense category",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectValue"], {}, void 0, false, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 693,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 692,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectContent"], {
                                                        children: EXPENSE_CATEGORIES.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectItem"], {
                                                                value: c,
                                                                children: categoryLabel(c, appLang)
                                                            }, c, false, {
                                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                                lineNumber: 697,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 695,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 691,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 689,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.expAmount')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 705,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "number",
                                                inputMode: "decimal",
                                                min: 0,
                                                value: expAmount,
                                                onChange: (e)=>setExpAmount(e.target.value),
                                                placeholder: "0",
                                                className: "h-10",
                                                "aria-label": "Expense amount"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 706,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 704,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 688,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.person')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 711,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                value: expPerson,
                                                onChange: (e)=>setExpPerson(e.target.value),
                                                placeholder: t('ledger.personPlaceholder'),
                                                className: "h-10",
                                                "aria-label": "Expense person"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 712,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 710,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-[11px] text-muted-foreground",
                                                children: t('ledger.receiveMode')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 715,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                                value: expMode,
                                                onValueChange: (v)=>setExpMode(v),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectTrigger"], {
                                                        className: "h-10",
                                                        "aria-label": "Expense payment mode",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectValue"], {}, void 0, false, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 718,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 717,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectContent"], {
                                                        children: MODES.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectItem"], {
                                                                value: m,
                                                                children: modeLabel(m, appLang)
                                                            }, m, false, {
                                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                                lineNumber: 722,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 720,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/LedgerView.tsx",
                                                lineNumber: 716,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 714,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 709,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        className: "text-[11px] text-muted-foreground",
                                        children: t('ledger.purpose')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 731,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        value: expPurpose,
                                        onChange: (e)=>setExpPurpose(e.target.value),
                                        placeholder: t('ledger.purposePlaceholder'),
                                        className: "h-10",
                                        "aria-label": "Expense purpose"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LedgerView.tsx",
                                        lineNumber: 732,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 730,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                onClick: submitExpense,
                                className: "h-11 w-full bg-blue-600 text-white hover:bg-blue-700",
                                disabled: !(Number(expAmount) > 0),
                                children: t('ledger.addExpense')
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 734,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 674,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "space-y-1.5",
                        children: [
                            monthExpenses.map((e, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    className: "anim-fade-up flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2",
                                    style: {
                                        animationDelay: `${Math.min(i, 10) * 40}ms`
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex min-w-0 items-center gap-2.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownRight$3e$__["ArrowDownRight"], {
                                                        className: "size-4"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 747,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 746,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "flex items-center gap-1.5 truncate text-sm font-medium",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "truncate",
                                                                    children: e.person || categoryLabel(e.category, appLang)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 751,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeChip, {
                                                                    mode: e.mode,
                                                                    appLang: appLang
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                                    lineNumber: 752,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 750,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "truncate text-[11px] text-muted-foreground",
                                                            children: [
                                                                new Date(e.dateISO).toLocaleDateString('en-IN', {
                                                                    day: '2-digit',
                                                                    month: 'short'
                                                                }),
                                                                ' · ',
                                                                fmtTime(new Date(e.dateISO)),
                                                                e.person ? ` · ${categoryLabel(e.category, appLang)}` : '',
                                                                e.note ? ` · ${e.note}` : ''
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/LedgerView.tsx",
                                                            lineNumber: 754,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 749,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/LedgerView.tsx",
                                            lineNumber: 745,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex shrink-0 items-center gap-1.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm font-bold tabular-nums text-red-600",
                                                    children: [
                                                        "− ₹",
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$billing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmt"])(e.amount)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 764,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    variant: "ghost",
                                                    size: "icon",
                                                    className: "size-8 text-muted-foreground hover:text-destructive",
                                                    onClick: ()=>deleteExpense(e.id),
                                                    "aria-label": `Delete expense ${e.person || e.category}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                        className: "size-3.5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LedgerView.tsx",
                                                        lineNumber: 766,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/LedgerView.tsx",
                                                    lineNumber: 765,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/LedgerView.tsx",
                                            lineNumber: 763,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, e.id, true, {
                                    fileName: "[project]/src/components/LedgerView.tsx",
                                    lineNumber: 740,
                                    columnNumber: 15
                                }, this)),
                            monthExpenses.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "py-10 text-center text-sm text-muted-foreground",
                                children: t('ledger.noExpenses')
                            }, void 0, false, {
                                fileName: "[project]/src/components/LedgerView.tsx",
                                lineNumber: 772,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LedgerView.tsx",
                        lineNumber: 738,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LedgerView.tsx",
                lineNumber: 673,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/LedgerView.tsx",
        lineNumber: 378,
        columnNumber: 5
    }, this);
}
_s(LedgerView, "ZbV9S0/fw7FvzDRmV80X29yEL2o=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$app$2d$lang$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$app$2d$lang$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppLang"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c3 = LedgerView;
function Badge2({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "anim-badge rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold tabular-nums text-white",
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/LedgerView.tsx",
        lineNumber: 784,
        columnNumber: 5
    }, this);
}
_c4 = Badge2;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "ModeChip");
__turbopack_context__.k.register(_c1, "StatCard");
__turbopack_context__.k.register(_c2, "LedgerRowItem");
__turbopack_context__.k.register(_c3, "LedgerView");
__turbopack_context__.k.register(_c4, "Badge2");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_LedgerView_tsx_d9d887a3._.js.map
module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        'query'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/server/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MAX_CIPHERTEXT_BYTES",
    ()=>MAX_CIPHERTEXT_BYTES,
    "SESSION_TTL_MS",
    ()=>SESSION_TTL_MS,
    "bearerToken",
    ()=>bearerToken,
    "clientIp",
    ()=>clientIp,
    "createSession",
    ()=>createSession,
    "genToken",
    ()=>genToken,
    "pruneSessions",
    ()=>pruneSessions,
    "rateLimit",
    ()=>rateLimit,
    "safeEqual",
    ()=>safeEqual,
    "sessionSlot",
    ()=>sessionSlot,
    "sha256",
    ()=>sha256
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
;
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // stay logged in a full year
const MAX_CIPHERTEXT_BYTES = 6 * 1024 * 1024; // ~6 MB encrypted blob
/** Brute-force guard on /api/auth/setup and /api/auth/unlock, per IP */ const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const ATTEMPT_MAX = 30;
const attempts = new Map();
function rateLimit(key) {
    const now = Date.now();
    const cur = attempts.get(key);
    if (!cur || cur.resetAt < now) {
        attempts.set(key, {
            count: 1,
            resetAt: now + ATTEMPT_WINDOW_MS
        });
        return true;
    }
    cur.count += 1;
    return cur.count <= ATTEMPT_MAX;
}
function clientIp(req) {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}
function sha256(s) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHash('sha256').update(s).digest('hex');
}
function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    try {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch  {
        return false;
    }
}
function genToken() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(32).toString('hex');
}
function bearerToken(req) {
    const h = req.headers.get('authorization') || '';
    return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}
async function sessionSlot(token) {
    if (!token || token.length < 32) return null;
    const session = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].session.findUnique({
        where: {
            tokenHash: sha256(token)
        }
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].session.delete({
            where: {
                id: session.id
            }
        }).catch(()=>undefined);
        return null;
    }
    return session.slot;
}
async function createSession(slot) {
    const token = genToken();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].session.create({
        data: {
            tokenHash: sha256(token),
            slot,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS)
        }
    });
    return token;
}
async function pruneSessions(slot) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].session.deleteMany({
        where: {
            slot,
            expiresAt: {
                lt: new Date()
            }
        }
    }).catch(()=>undefined);
}
}),
"[project]/src/app/api/auth/setup/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/server/auth.ts [app-route] (ecmascript)");
;
;
async function POST(req) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rateLimit"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clientIp"])(req))) {
        return Response.json({
            error: 'rateLimited'
        }, {
            status: 429
        });
    }
    let body;
    try {
        body = await req.json();
    } catch  {
        return Response.json({
            error: 'badRequest'
        }, {
            status: 400
        });
    }
    const dekWrapped = body.dekWrapped ?? '';
    const dekSalt = body.dekSalt ?? '';
    const kekProof = body.kekProof ?? '';
    if (!dekWrapped || dekWrapped.length > 512 || !dekSalt || dekSalt.length > 64 || !/^[0-9a-f]{64}$/.test(kekProof)) {
        return Response.json({
            error: 'badRequest'
        }, {
            status: 400
        });
    }
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].syncAccount.findUnique({
        where: {
            slot: 'owner'
        }
    });
    if (existing?.pinVerifier) {
        // another device already created the MPIN — this device must enter it instead
        return Response.json({
            error: 'exists'
        }, {
            status: 409
        });
    }
    if (existing) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].syncAccount.update({
            where: {
                slot: 'owner'
            },
            data: {
                pinVerifier: kekProof,
                dekWrapped,
                dekSalt
            }
        });
    } else {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].syncAccount.create({
            data: {
                slot: 'owner',
                pinVerifier: kekProof,
                dekWrapped,
                dekSalt
            }
        });
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pruneSessions"])('owner');
    const token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createSession"])('owner');
    return Response.json({
        ok: true,
        token
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5d399f81._.js.map
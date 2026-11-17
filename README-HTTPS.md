# SLP Billing — Security & HTTPS Guide (v39)

This release turns the billing app into a hardened, HTTPS-only deployment.
Everything below is already wired into the app — the owner only runs two
commands to switch it on.

## What is hardened in v39

| Layer | What changed |
| --- | --- |
| **Transport** | Optional real HTTPS with automatic HTTP→HTTPS redirect (TLS terminated by the standalone supervisor, no extra software). |
| **Headers** | Every response now carries `Content-Security-Policy` (self-only, no framing, no object/embed), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. Clickjacking, hotlink framing and content injection are blocked at the browser. |
| **Brute force** | All login gates (owner password, owner MPIN unlock, staff login, staff forgot-password) accept **10 attempts per 5 minutes per IP**; answers are generic so usernames can't be enumerated; password hashes are scrypt, session tokens are random 256-bit values stored only as SHA-256. |
| **Global API throttle** | New middleware: every `/api` route is capped at **300 requests/min/IP**, auth endpoints at **20 req/min/IP**, and any request declaring a body over **25 MB is rejected** (413). Even if the per-IP header is spoofed, the total rate stays bounded. |
| **Sessions** | Unchanged (already strong): opaque bearer tokens in HttpOnly-free localStorage by design (LAN app), 1-year TTL, server-side revocation — removing a staff member kills their session instantly. |

## Switching HTTPS on (owner, one time)

```bash
bash scripts/gen-tls.sh          # creates tls/slp-cert.pem + tls/slp-key.pem
SLP_TLS_CERT=tls/slp-cert.pem SLP_TLS_KEY=tls/slp-key.pem npm start
```

- The app is then served at **https://\<server-ip\>:3000** (certificate covers
  localhost, the hostname and every LAN IP found at generation time).
- Plain **http://\<server-ip\>:3080** automatically 301-redirects to HTTPS.
- The Android app (v1.1+) and browsers work with the same address.
- Without `SLP_TLS_CERT`/`SLP_TLS_KEY` the server starts exactly as before
  (plain HTTP on :3000) — the z.ai platform deploy path is untouched.

## Phones: one-time certificate install

Because the shop runs on a LAN address (no public domain), the certificate is
self-signed. To get the green lock with no warnings on every phone:

1. Open `https://<server-ip>:3000/ca.crt` in Chrome on the phone
   (accept the warning once — it's the certificate itself being downloaded).
2. Open the downloaded file → **Install certificate** → name it `SLP Billing`.
3. Reopen the billing app — no warning, encrypted all the way.

The Android APK (v1.1+) trusts user-installed certificates via its network
security config, so step 2 is all it needs. iOS Safari needs the profile
installed *and* trusted in Settings → General → About → Certificate Trust.

## Changing the server's IP?

Re-run `bash scripts/gen-tls.sh` (it picks up the new IP), restart the server,
and re-install the new `/ca.crt` on the phones.

## Keeping it safe — operating rules

- `tls/slp-key.pem` never leaves the server; it is chmod 600 and gitignored.
- The APK signing keystore (`download/SLP-BILLING-SIGNING.keystore`) stays
  with the owner — updates must be signed with the same key.
- Staff accounts: give every staff member their own login; remove leavers
  immediately from Settings → Staff (sessions die instantly).
- Backups: `db/custom.db` is the single source of truth — copy it somewhere
  safe regularly; it contains everything (bills, staff, settings).

## Known limits (documented, accepted for v1)

- Session tokens live in the device's localStorage (survives restarts, no
  cookie work needed) — protected by the CSP above which blocks any external
  origin from receiving them; the app is LAN-only.
- The CSP keeps `'unsafe-inline'` for scripts/styles because Next.js injects
  them; the trade-off is documented rather than pretending otherwise.
- The platform deploy (z.ai) keeps running plain HTTP behind its own load
  balancer; TLS mode is for the owner's own server / LAN deployments.

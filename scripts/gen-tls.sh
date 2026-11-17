#!/usr/bin/env bash
# Generate the TLS certificate + key for the SLP Billing server (v39 HTTPS).
#
#   bash scripts/gen-tls.sh
#
# Creates:
#   tls/slp-cert.pem  — self-signed cert, 10 years, SANs for this machine
#                       (localhost, hostname, every LAN IP)
#   tls/slp-key.pem   — private key (chmod 600, NEVER copy anywhere)
#   public/ca.crt     — copy of the cert for phones to download & install
#                       (served at https://<server>:3000/ca.crt)
#
# Then start the server with TLS:
#   SLP_TLS_CERT=tls/slp-cert.pem SLP_TLS_KEY=tls/slp-key.pem npm start
#
# Re-run any time the server's IP changes — then restart the server and
# re-install the new /ca.crt on phones that installed the old one.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TLS_DIR="$ROOT/tls"
DAYS=3650

mkdir -p "$TLS_DIR"

# every address this machine is reachable on
IPS=$(hostname -I 2>/dev/null || true)
HOSTNAME=$(hostname 2>/dev/null || echo slp-server)

SANS="DNS:localhost,DNS:$HOSTNAME,IP:127.0.0.1"
for ip in $IPS; do
  # skip ipv6 link-local noise; keep v4 + global v6
  SANS="$SANS,IP:$ip"
done

echo "Generating self-signed cert valid $DAYS days with SANs:"
echo "  $SANS"

openssl req -x509 -newkey rsa:2048 -sha256 -days "$DAYS" -nodes \
  -keyout "$TLS_DIR/slp-key.pem" \
  -out "$TLS_DIR/slp-cert.pem" \
  -subj "/CN=SLP Billing/O=SLP Cement Works" \
  -addext "subjectAltName=$SANS" \
  -addext "keyUsage=digitalSignature,keyEncipherment" \
  -addext "extendedKeyUsage=serverAuth" \
  -addext "basicConstraints=critical,CA:FALSE"

chmod 600 "$TLS_DIR/slp-key.pem"
cp "$TLS_DIR/slp-cert.pem" "$ROOT/public/ca.crt"
# the standalone deploy serves the build-time public/ snapshot — refresh it
# too when a build already exists (otherwise /ca.crt would be stale)
if [ -d "$ROOT/.next/standalone/public" ]; then
  cp "$TLS_DIR/slp-cert.pem" "$ROOT/.next/standalone/public/ca.crt"
fi

echo ""
echo "DONE."
echo "  cert: $TLS_DIR/slp-cert.pem"
echo "  key:  $TLS_DIR/slp-key.pem  (keep secret)"
echo "  phone-install copy: $ROOT/public/ca.crt  → served at /ca.crt"
echo ""
echo "Start the server with HTTPS:"
echo "  cd $ROOT"
echo "  SLP_TLS_CERT=tls/slp-cert.pem SLP_TLS_KEY=tls/slp-key.pem npm start"
echo ""
echo "Phones then use:  https://<this-machine-ip>:3000"
echo "(HTTP on :3080 redirects to HTTPS automatically.)"
echo ""
echo "One-time per phone: open https://<this-machine-ip>:3000/ca.crt in Chrome"
echo "→ install the certificate → the app then opens WITHOUT warnings."

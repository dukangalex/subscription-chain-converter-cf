#!/usr/bin/env bash
# One-click deploy of the Cloudflare Workers variant of the
# subscription converter (Worker + KV short links + KV rule mirror).
#
# Usage:
#   bash deploy.sh [custom-domain]
#
# What it does: installs dependencies, creates the KV namespace,
# writes its id into wrangler.toml, generates and stores the
# REFRESH_TOKEN secret, deploys the Worker, fills the rule mirror
# via POST /admin/refresh, and smoke-tests the result (shorten ->
# chain config with detour, one mirrored rule file). Re-running is
# safe: existing KV data is kept, a NEW refresh token is generated
# (save the one printed at the end).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

CUSTOM_DOMAIN="${1:-}"

log() { printf '[deploy] %s\n' "$*"; }
die() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

# ------------------------------------------------------------ preflight
command -v node >/dev/null || die "node not found (need Node.js 18+)"
command -v npm >/dev/null || die "npm not found"
command -v openssl >/dev/null || die "openssl not found"
command -v curl >/dev/null || die "curl not found"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "Node.js 18+ required, found $(node --version)"
log "node $(node --version)"

# ------------------------------------------------------------- install
log "installing dependencies"
npm install --no-audit --no-fund

WR="npx wrangler"

# --------------------------------------------------------- KV namespace
# Create the KV namespace (and its preview sibling) unless the real
# ids are already written into wrangler.toml.
if grep -q "REPLACE_WITH_KV_ID" wrangler.toml; then
  log "creating KV namespace"
  OUT="$($WR kv namespace create KV 2>&1)" \
    || die "KV create failed (are you logged in? run: npx wrangler login)
$OUT"
  KV_ID="$(printf '%s' "$OUT" | grep -oE '"[0-9a-f]{32}"' | head -1 | tr -d '"')"
  [ -n "$KV_ID" ] || die "could not parse KV id from wrangler output:
$OUT"
  sed -i.bak "s/REPLACE_WITH_KV_ID/$KV_ID/" wrangler.toml
  log "KV id written to wrangler.toml"
fi
if grep -q "REPLACE_WITH_KV_PREVIEW_ID" wrangler.toml; then
  OUT="$($WR kv namespace create KV --preview 2>&1 || true)"
  PV_ID="$(printf '%s' "$OUT" | grep -oE '"[0-9a-f]{32}"' | head -1 | tr -d '"')"
  if [ -n "$PV_ID" ]; then
    sed -i.bak "s/REPLACE_WITH_KV_PREVIEW_ID/$PV_ID/" wrangler.toml
    log "KV preview id written to wrangler.toml"
  else
    sed -i.bak "s/REPLACE_WITH_KV_PREVIEW_ID/$KV_ID/" wrangler.toml
    log "no separate preview namespace; reusing the production id"
  fi
fi
rm -f wrangler.toml.bak

# --------------------------------------------------------------- secret
TOKEN="$(openssl rand -hex 24)"
log "storing a fresh REFRESH_TOKEN secret"
printf '%s' "$TOKEN" | $WR secret put REFRESH_TOKEN >/dev/null

# --------------------------------------------------------------- deploy
log "deploying the Worker"
OUT="$($WR deploy 2>&1)" || die "wrangler deploy failed:
$OUT"
printf '%s\n' "$OUT" | tail -3

if [ -n "$CUSTOM_DOMAIN" ]; then
  BASE="https://$CUSTOM_DOMAIN"
else
  BASE="$(printf '%s' "$OUT" | grep -oE 'https://[A-Za-z0-9.-]+\.workers\.dev' | head -1 || true)"
  [ -n "$BASE" ] || die "could not detect the workers.dev URL; rerun as: bash deploy.sh <your-custom-domain>"
fi
log "base URL: $BASE"

# ------------------------------------------------------ fill rule mirror
log "filling the rule mirror (76 files, this can take a minute)"
STATUS="$(curl -fsS -m 600 -X POST "$BASE/admin/refresh" \
  -H "Authorization: Bearer $TOKEN")" \
  || die "rule refresh request failed; check $BASE/version and the token"
log "refresh status: $STATUS"
printf '%s' "$STATUS" | grep -q '"ok":' || die "unexpected refresh response: $STATUS"

# ------------------------------------------------------------ smoke test
DUMMY_ENTRY="vless://00000000-0000-0000-0000-000000000000@entry.example.com:443?security=none#entry-node"
DUMMY_EXIT="vless://11111111-1111-1111-1111-111111111111@exit.example.com:443?security=none#exit-node"
SHORT_URL="$(curl -fsS -m 30 -X POST "$BASE/shorten" -H 'Content-Type: application/json' \
  -d "{\"target\":\"singbox\",\"entry\":\"$DUMMY_ENTRY\",\"exit\":\"$DUMMY_EXIT\"}")" \
  || die "smoke test failed: /shorten did not return a short link"
CODE="${SHORT_URL##*/}"
[ -n "$CODE" ] && [ "$CODE" != "$SHORT_URL" ] \
  || die "smoke test failed: could not parse short code from: $SHORT_URL"
curl -fsS -m 60 "$BASE/s/$CODE" | grep -q "detour" \
  || die "smoke test failed: generated sing-box config has no chain detour"
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' -m 30 "$BASE/rules/clash/private.mrs")"
[ "$HTTP_CODE" = "200" ] \
  || die "smoke test failed: /rules/clash/private.mrs returned $HTTP_CODE"
log "smoke test passed: chain generation via short link /s/$CODE, rule mirror serving"

# -------------------------------------------------------------- summary
cat <<EOF

Done. The converter is running at $BASE

  Converter page : $BASE/
  Version probe  : $BASE/version
  Rule status    : stored in KV key meta:rules_status

REFRESH_TOKEN (save it somewhere safe; it authorizes POST /admin/refresh
and is NOT shown again — rerunning this script generates a new one):
  $TOKEN

Manual refresh:
  curl -X POST $BASE/admin/refresh -H "Authorization: Bearer <token>"

Next step (optional): bind your own domain in the Cloudflare
dashboard (Workers & Pages -> subscription-converter -> Settings ->
Domains & Routes). Generated configs always use the origin they were
requested through, so no code change is needed after binding.
EOF

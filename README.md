# Subscription Converter with Chain Proxy — Cloudflare Workers

A fully self-hosted subscription converter for Mihomo (Clash) and
sing-box, running entirely on **your own** Cloudflare account. Paste
nodes or subscription URLs, get chained-proxy configurations
(entry hop → exit hop) through opaque short links. Rule files come
only from the official sources (MetaCubeX, SagerNet), are mirrored
into your KV on a daily schedule, and your original subscription
URLs never leave your account.

> 中文说明见下方「快速上手」。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dukangalex/subscription-chain-converter-cf)

## Quick start

### Option A — one-click deploy (recommended)

1. Click the **Deploy to Cloudflare** button above and follow the
   flow: it clones this repo into your GitHub, creates the KV
   namespace, and deploys the Worker.
2. Open your Worker URL. The converter page is live immediately;
   only the rule mirror still needs its first fill.
3. Fill the rule mirror once (no token needed on first run):

   ```bash
   curl -X POST https://<your-worker-domain>/admin/refresh
   ```

   It returns a JSON status like `{"ok":76,"failed":[]}`. From
   then on a daily Cron Trigger (04:35 CST) keeps the mirror
   current, and this endpoint requires a token (see below).
4. Optional — set a refresh token for later manual refreshes:
   Cloudflare dashboard → Workers & Pages → your Worker →
   Settings → Variables and Secrets → add secret `REFRESH_TOKEN`
   with a random value. Manual refresh then works with
   `-H "Authorization: Bearer <REFRESH_TOKEN>"`.
5. Optional — bind a custom domain under the Worker's
   Settings → Domains & Routes.

### Option B — one command from a clone

Prerequisites: a Cloudflare account, Node.js 18+, and a wrangler
login (`npx wrangler login`).

```bash
git clone https://github.com/dukangalex/subscription-chain-converter-cf
cd subscription-chain-converter-cf
bash deploy.sh                # or: bash deploy.sh sub.example.com
```

The script installs dependencies, creates the KV namespace and
writes its id into `wrangler.toml`, generates a `REFRESH_TOKEN`
and stores it as a Worker secret, deploys, fills the rule mirror,
and smoke-tests the deployment. It prints the token at the end —
save it; rerunning generates a new one.

### Option C — manual wrangler

```bash
npm install
npx wrangler kv namespace create KV            # note the id
npx wrangler kv namespace create KV --preview  # note the preview id
# put both ids into wrangler.toml (replacing the placeholders)
npx wrangler secret put REFRESH_TOKEN          # paste a random token
npx wrangler deploy
curl -X POST https://<your-worker-domain>/admin/refresh \
  -H "Authorization: Bearer <REFRESH_TOKEN>"
```

## 快速上手（中文）

1. 点页面上方的 **Deploy to Cloudflare** 按钮，按向导走完：
   它会把仓库克隆到你的 GitHub、自动创建 KV 并部署 Worker。
2. 打开分配给你的 Worker 域名，转换页面即刻可用，只差规则
   镜像的首次填充。
3. 首次填充规则（第一次调用不需要令牌）：

   ```bash
   curl -X POST https://<你的 Worker 域名>/admin/refresh
   ```

   返回 `{"ok":76,"failed":[]}` 即完成。此后每天北京时间
   04:35 自动刷新；想手动刷新需先在控制台给 Worker 添加
   `REFRESH_TOKEN` 密钥（设置 → 变量和机密），再带
   `Authorization: Bearer <令牌>` 调用同一接口。
4. 也可以不用按钮：克隆仓库后执行 `bash deploy.sh`，一条
   命令完成建 KV、部署、填充与自检。

## Using the page

Open the Worker root in a browser — no setup beyond deploying:

- **Paste and go.** Two tabs (plain conversion / chain proxy) take
  node URIs and subscription URLs mixed line by line; the result
  area shows the short link in all three letter forms (`/c/`,
  `/m/`, `/s/`) with per-link copy buttons. The letter selects the
  output format, so one code serves both clients.
- **One-click client import.** For Clash and sing-box targets the
  matching link row carries an import button (`clash://` /
  `sing-box://` deep link) that hands the subscription straight to
  the client app.
- **Restore a previous generation.** Every short link's inputs are
  kept in KV; paste a code (or a full link) into the restore box
  and the form refills exactly as it was, ready to tweak and
  regenerate.
- If the short-link service is unavailable, the page falls back to
  a long `/conv`, `/sub` or `/chain` URL instead of failing.

## How it works

Everything runs in a single Worker; storage lives in one KV
namespace:

| Concern | Implementation |
|---|---|
| Short-link records | KV keys `link:<code>` |
| Content dedupe index | KV keys `idx:<sha256>` (same inputs → same code) |
| Rule mirror | KV keys `rule:<dst>`, served at `GET /rules/<path>` |
| Refresh state | KV key `meta:rules_status` |
| Rule refresh | Cron Trigger `35 20 * * *` UTC + `POST /admin/refresh` |
| Config skeletons | Bundled in `src/`; `__PUBLIC_ORIGIN__` is replaced per request with the request's own origin |

Endpoints: `GET /` (page), `GET /chain`, `GET /conv`, `GET /sub`,
`GET /version`, `POST /shorten`, `GET /c|m|s/<code>`,
`GET /rules/<path>`, `GET /api/link/<code>` (returns the stored
record as JSON for the page's restore box; the code is the bearer
credential for its record), `POST /admin/refresh`.

Generated chain configs were verified deep-equal (parsed
JSON/YAML) against the reference Python implementation's outputs
for the same inputs. The full implementation spec lives in the
sibling VPS repository:
<https://github.com/dukangalex/subscription-chain-converter>

## Free-tier feasibility

KV free tier: 1 GB storage, 100k reads/day, 1k writes/day. One
full rule refresh writes ~77 keys (76 files + status), well under
a tenth of the daily write budget. The largest single value,
`clash/geoip.dat` at about 16.5 MB, fits under the 25 MB KV value
limit, and the whole mirror is well under 1 GB.

One caveat: the Workers **free plan allows 50 subrequests per
invocation**, while a full refresh fetches 76 files. On the free
plan a single refresh run therefore fills the mirror
incrementally — entries that fail keep their previous copy and
later runs (cron or manual) top them up. For a guaranteed
one-shot refresh, the Workers Paid plan raises the subrequest
limit. Everything else (generation, short links, rule serving)
fits comfortably in the free tier.

## Differences and limits

- **Two formats are built natively** (clash, sing-box). The
  v2ray/surge/loon/quanx targets of `/sub` are proxied to an
  external subconverter you provide via
  `EXTERNAL_SUBCONVERTER_URL`; unset, those requests return 501.
- **No script fallback.** If the built-in builder cannot build a
  config, the request fails with 502 instead of degrading to a
  secondary path.
- **YAML formatting** comes from js-yaml; line folding/quoting can
  differ cosmetically from other generators. Parsed content is
  what was verified equal.
- **KV is eventually consistent**: a freshly created short link
  is normally readable immediately, but propagation can lag
  briefly in some regions.
- **ECH**: for ECH-carrying entries, the ECHConfigList is fetched
  from AliDNS DoH at generation time and inlined (PEM label
  `ECH CONFIGS`), with a dedicated `ech-dns` route as fallback.
- **First-run bootstrap**: `POST /admin/refresh` accepts a
  tokenless call only while the mirror has never been refreshed.
  The refresh downloads only the bundled manifest's official
  URLs; after the first success the token is always required.

## Data flow

Short-link records — including the original subscription URLs
with their tokens — are stored only in **your own** Cloudflare KV
namespace. Generation runs on Cloudflare's edge; subscription
sources, official rule files and ECH lookups are fetched from
Cloudflare egress IPs. Clients pull configs and rule files from
your Worker domain. Nothing is sent to any third-party converter,
and request URLs are not written to any log by the Worker.

## Files

```
package.json          name, js-yaml + wrangler pins, scripts
wrangler.toml         worker config (KV binding, cron, vars)
deploy.sh             one-command deploy + smoke test
src/worker.js         the Worker (page, ingestion, builders, KV, HTTP)
src/skeleton_clash.json    config skeleton (groups, rules, DNS)
src/skeleton_singbox.json  config skeleton
src/rules_manifest.json    the 76 official rule sources mirrored daily
test/smoke.mjs        stubbed-KV/fetch test harness: node test/smoke.mjs
```

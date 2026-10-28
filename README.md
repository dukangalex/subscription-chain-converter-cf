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

**Fork-friendly:** the button clones this repo into your account
automatically. If you prefer a fork you can push changes back to,
fork the repo first and deploy from your fork instead — every
path below works identically from a fork: change the clone URL,
or select your fork in the Pages Git integration. Nothing in the
repo is tied to the original account (all ids in `wrangler.toml`
are placeholders the deploy flows replace).

## Quick start

### Option A — one-click deploy (recommended)

1. Click the **Deploy to Cloudflare** button above and follow the
   flow: it clones this repo into your GitHub, creates the KV
   namespace, the R2 bucket and the D1 database, and deploys the
   Worker.
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

The script installs dependencies, creates the KV namespace, the
R2 bucket and the D1 database and writes their ids into
`wrangler.toml`, generates a `REFRESH_TOKEN` and stores it as a
Worker secret, deploys, fills the rule mirror, and smoke-tests
the deployment. It prints the token at the end — save it;
rerunning generates a new one.

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

## Deploy to Pages

The same code also deploys to **Cloudflare Pages** (Pages
Functions, advanced mode): `npm run build:pages` bundles the
Worker into a single `dist-pages/_worker.js`, which the smoke
suite verifies with the same 37 assertions as the source module.
Two ways in:

**A. Pages Git integration (best from your fork).**

1. Fork this repo, then in the Cloudflare dashboard:
   Pages → Create → Connect to Git → select your fork.
2. Build settings: build command `npm run build:pages`, build
   output directory `dist-pages`. Deploy.
3. Add the bindings under the Pages project's Settings →
   Functions: KV namespace as `KV`, R2 bucket as `RULES`, D1
   database as `DB` (create them inline if they don't exist),
   and a secret `REFRESH_TOKEN` under Settings → Environment
   variables. Redeploy once so the bindings take effect.
4. Fill the rule mirror with the tokenless first-run call from
   Quick start step 3.

**B. Wrangler CLI.**

```bash
npm install
npm run deploy:pages   # builds, then: wrangler pages deploy dist-pages
```

The first run asks you to create/select the Pages project; the
bindings declared in `wrangler.toml` are applied to it.

**One real difference: Pages has no Cron Triggers**, so the
daily rule refresh needs an external trigger. Easiest is a
GitHub Actions workflow in your fork — copy this to
`.github/workflows/refresh-rules.yml`, and set two repository
secrets (`PAGES_URL` = your deployment URL, `REFRESH_TOKEN`):

```yaml
name: refresh-rules
on:
  schedule:
    - cron: "35 20 * * *"
  workflow_dispatch:
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST "$PAGES_URL/admin/refresh" \
            -H "Authorization: Bearer $REFRESH_TOKEN"
        env:
          PAGES_URL: ${{ secrets.PAGES_URL }}
          REFRESH_TOKEN: ${{ secrets.REFRESH_TOKEN }}
```

Any external cron service hitting the same endpoint works too,
as do manual refreshes. Workers deployments are unaffected —
they keep the native Cron Trigger.

## 快速上手（中文）

1. 点页面上方的 **Deploy to Cloudflare** 按钮，按向导走完：
   它会把仓库克隆到你的 GitHub、自动创建 KV、R2 存储桶与
   D1 数据库并部署 Worker（R2 存规则镜像、D1 存短链记录，
   均为进阶存储，细节见 Advanced storage 一节）。
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
5. Fork 与 Pages：可以直接 fork 本仓库再部署（按钮会自动克隆
   到你账号，fork 后从自己的 fork 部署也完全一样）。部署到
   Cloudflare Pages 亦可：构建命令 `npm run build:pages`、
   输出目录 `dist-pages`，绑定同名 KV/R2/D1 即可；唯一差别
   是 Pages 没有定时触发器，每日规则刷新需外部触发（可用
   GitHub Actions，完整 YAML 在上方 Deploy to Pages 一节）。

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

Everything runs in a single Worker. KV is the baseline store;
R2 and D1 form an optional advanced tier that the Worker uses
automatically when the bindings exist (see the next section):

| Concern | Implementation |
|---|---|
| Short-link records | D1 `links` table when bound, else KV keys `link:<code>` |
| Content dedupe | D1 hash lookup (same inputs → same code), else KV keys `idx:<sha256>` |
| Rule mirror | R2 objects when bound, else KV keys `rule:<dst>`; served at `GET /rules/<path>` |
| Refresh state | KV key `meta:rules_status`, plus a D1 `refresh_log` row when bound |
| Rule refresh | Cron Trigger `35 20 * * *` UTC + `POST /admin/refresh` |
| Config skeletons | Bundled in `src/`; `__PUBLIC_ORIGIN__` is replaced per request with the request's own origin |

## Advanced storage: R2 + D1

Fresh one-click and `deploy.sh` deployments start on this tier
automatically; nothing to configure. What each service holds:

- **R2 — the rule mirror.** Object storage is the natural home
  for 76 rule files including a ~16.5 MB `geoip.dat`: no KV
  25 MB value ceiling to grow into, and reads/writes stop
  counting against the KV quotas. R2's free tier (10 GB storage,
  egress free) covers the mirror many times over.
- **D1 — the link store.** Short-link records are structured
  data: a `links` table (code, kind, target, inputs, content
  hash, creation time) makes dedupe a single indexed lookup,
  counts every served fetch in a `hits` column (visible in the
  `GET /api/link/<code>` JSON), and a `refresh_log` table keeps
  an audit history of rule refreshes. The schema is created
  lazily by the Worker on first use — no migration step.
  D1's free tier (5M row reads / 100k row writes per day) is far
  beyond a personal converter's traffic.

Compatibility is deliberate: the bindings are optional. A
KV-only deployment (an older install, or the bindings removed)
keeps working exactly as before, reads fall back D1 → KV and
R2 → KV, rule files mirrored into KV before the R2 tier was
enabled keep serving, and a D1 failure on any single call falls
back to KV for that call. Enabling the tier on an existing
deployment only takes binding the bucket/database — links
created afterwards live in D1, and the next rule refresh lands
the mirror in R2.

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

KV free tier: 1 GB storage, 100k reads/day, 1k writes/day. On a
KV-only deployment one full rule refresh writes ~77 keys (76
files + status), well under a tenth of the daily write budget;
the largest single value, `clash/geoip.dat` at about 16.5 MB,
fits under the 25 MB KV value limit, and the whole mirror is
well under 1 GB. On the advanced tier the mirror lives in R2
instead (10 GB free storage, no egress fees), so refreshes cost
a single KV write for the status key, and D1 absorbs the link
traffic (5M row reads / 100k row writes per day free).

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
package.json          name, js-yaml + wrangler + esbuild pins, scripts (incl. Pages build/deploy)
wrangler.toml         worker config (KV + R2 + D1 bindings, cron, vars)
deploy.sh             one-command deploy + smoke test
src/worker.js         the Worker (page, ingestion, builders, KV, HTTP)
src/skeleton_clash.json    config skeleton (groups, rules, DNS)
src/skeleton_singbox.json  config skeleton
src/rules_manifest.json    the 76 official rule sources mirrored daily
test/smoke.mjs        stubbed-KV/fetch test harness: node test/smoke.mjs
```

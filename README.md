<p align="center"><img src="logo.svg" width="96" alt="Subscription Converter logo"></p>

# Subscription Converter with Chain Proxy — Cloudflare Workers

A fully self-hosted subscription converter for Mihomo (Clash) and
sing-box, running entirely on **your own** Cloudflare account. Paste
nodes or subscription URLs, get chained-proxy configurations
(entry hop → exit hop) through opaque short links. Rule files come
only from the official sources (MetaCubeX, SagerNet), are mirrored
into your KV on a daily schedule, and your original subscription
URLs never leave your account.

> 完整中文版见文末「中文说明」。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dukangalex/subscription-chain-converter-cf)

**Fork-friendly:** the button clones this repo into your account
automatically. If you prefer a fork you can push changes back to,
fork the repo first and deploy from your fork instead — every
path below works identically from a fork: change the clone URL,
or select your fork in the Pages Git integration. Nothing in the
repo is tied to the original account (no account-specific ids
are baked into `wrangler.toml`; the deploy flows provision the
storage and fill the ids in).

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
# put both ids into wrangler.toml (uncomment the id lines and fill them in)
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

- **All six formats are built natively** (clash, sing-box,
  v2ray, surge, loon, quanx) — no external converter is involved.
  A `/sub` target outside those six can optionally be proxied to
  your own external subconverter by setting the
  `EXTERNAL_SUBCONVERTER_URL` variable; unset, those requests
  return 501. The variable is deliberately not predeclared, so
  the one-click deploy never asks for it.
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

## Acknowledgments

This project stands on the following third-party work:

- **Rule data** — the rule files mirrored daily come from the
  official sources only:
  [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)
  for mihomo, and SagerNet's
  [sing-geosite](https://github.com/SagerNet/sing-geosite) and
  [sing-geoip](https://github.com/SagerNet/sing-geoip) for
  sing-box. The mirror exists so a deployment serves these files
  from its own storage, unchanged.
- **js-yaml** ([nodeca/js-yaml](https://github.com/nodeca/js-yaml))
  — the only runtime dependency, used for YAML parsing and
  generation.
- **Format references** — the native Surge, Loon and Quantumult X
  renderers were written against the generators of
  [subconverter](https://github.com/tindy2013/subconverter) and
  the clients' own documentation and sample configs (the Surge
  manual, the Loon sample configs, Quantumult X `sample.conf`).
  The output formats themselves belong to the mihomo and sing-box
  projects and their client ecosystems.
- **Deployment form** — the presentation of this edition (the
  Worker project at the repo root, the one-click deploy button,
  the quick-start layout) follows the shape popularized by
  [sublink-worker](https://github.com/7Sageer/sublink-worker).
- **AliDNS DoH** — queried at generation time to resolve ECH
  configurations.
- **Build tooling** — wrangler and esbuild are used to bundle
  and deploy; they are development tools and ship no code inside
  the Worker.

Everything else — the builders, the chain assembly, the short
links, the page — is original to this project.

---

# 中文说明

一个完全自托管的订阅转换器（Mihomo / Clash 与 sing-box），整体
运行在**你自己的** Cloudflare 账号上。粘贴节点或订阅链接，即可
通过不透明的短链接得到链式代理配置（入口一跳 → 出口一跳）。
规则文件只取官方来源（MetaCubeX、SagerNet），每日镜像进你自己
的 KV，你的原始订阅链接不会离开你的账号。

**对 fork 友好：** 上方的 Deploy to Cloudflare 按钮会自动把
仓库克隆到你的账号。如果你更想用一个能往回推改动的 fork，
先 fork 再从 fork 部署也可以——下面每条路径从 fork 走完全一样：
改克隆地址，或在 Pages 的 Git 集成里选你的 fork。本仓库不与
原账号绑定（`wrangler.toml` 里没有写死任何账号专属的 ID，部署
流程会自己开通存储并填入 ID）。

## 快速上手

### 方式 A —— 一键部署（推荐）

1. 点上方的 **Deploy to Cloudflare** 按钮，按向导走完：它会把
   仓库克隆到你的 GitHub、创建 KV 命名空间、R2 存储桶与 D1
   数据库，并部署 Worker。
2. 打开你的 Worker 域名。转换页面即刻可用，只差规则镜像的
   首次填充。
3. 首次填充规则镜像（第一次调用不需要令牌）：

   ```bash
   curl -X POST https://<你的 Worker 域名>/admin/refresh
   ```

   返回形如 `{"ok":76,"failed":[]}` 的 JSON 状态即完成。此后
   每天由 Cron 触发器（北京时间 04:35）保持镜像更新，之后再
   调用这个接口就需要令牌（见下）。
4. 可选——给后续手动刷新设一个令牌：Cloudflare 控制台 →
   Workers & Pages → 你的 Worker → 设置 → 变量和机密 → 添加
   机密 `REFRESH_TOKEN`，值填一段随机字符串。之后手动刷新带
   `-H "Authorization: Bearer <REFRESH_TOKEN>"` 即可。
5. 可选——在 Worker 的设置 → 域名和路由里绑定自定义域名。

### 方式 B —— 克隆后一条命令

前置条件：一个 Cloudflare 账号、Node.js 18+、已登录 wrangler
（`npx wrangler login`）。

```bash
git clone https://github.com/dukangalex/subscription-chain-converter-cf
cd subscription-chain-converter-cf
bash deploy.sh                # 或：bash deploy.sh sub.example.com
```

脚本会安装依赖、创建 KV 命名空间、R2 存储桶与 D1 数据库并把
ID 写进 `wrangler.toml`，生成 `REFRESH_TOKEN` 并存为 Worker
机密，然后部署、填充规则镜像并做冒烟测试。令牌会打印在结尾
——请保存好；重跑脚本会生成新令牌。

### 方式 C —— 手动 wrangler

```bash
npm install
npx wrangler kv namespace create KV            # 记下 id
npx wrangler kv namespace create KV --preview  # 记下 preview id
# 把两个 id 填进 wrangler.toml（取消 id 行的注释再填入）
npx wrangler secret put REFRESH_TOKEN          # 粘贴一段随机令牌
npx wrangler deploy
curl -X POST https://<你的 Worker 域名>/admin/refresh \
  -H "Authorization: Bearer <REFRESH_TOKEN>"
```

## 部署到 Pages

同一份代码也能部署到 **Cloudflare Pages**（Pages Functions
高级模式）：`npm run build:pages` 把 Worker 打包成单个
`dist-pages/_worker.js`，冒烟测试对它跑与源码模块相同的 37 项
断言。两种进法：

**A. Pages Git 集成（从 fork 部署时最合适）。**

1. Fork 本仓库，然后在 Cloudflare 控制台：
   Pages → 创建 → 连接到 Git → 选你的 fork。
2. 构建设置：构建命令 `npm run build:pages`，构建输出目录
   `dist-pages`。部署。
3. 在 Pages 项目的设置 → 函数里加绑定：KV 命名空间绑为 `KV`、
   R2 桶绑为 `RULES`、D1 数据库绑为 `DB`（没有就当场新建），
   再在设置 → 环境变量里加机密 `REFRESH_TOKEN`。重新部署一次
   让绑定生效。
4. 用快速上手第 3 步那个免令牌的首次调用填充规则镜像。

**B. Wrangler 命令行。**

```bash
npm install
npm run deploy:pages   # 先构建，再 wrangler pages deploy dist-pages
```

第一次运行会让你创建或选择 Pages 项目；`wrangler.toml` 里
声明的绑定会应用到这个项目上。

**一个真实差别：Pages 没有定时触发器**，所以每日规则刷新需要
外部触发。最省事的是在你的 fork 里放一个 GitHub Actions
工作流——把下面的内容存为 `.github/workflows/refresh-rules.yml`，
并设两个仓库机密（`PAGES_URL` = 你的部署地址，`REFRESH_TOKEN`）：

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

任何能定时打这个接口的外部 cron 服务也可以，手动刷新同理。
Workers 部署不受影响——它们保留原生的定时触发器。

## 使用页面

在浏览器打开 Worker 根地址即可，不需要任何额外设置：

- **粘贴即用。** 两个页签（普通转换 / 链式代理）逐行接受节点
  URI 与订阅链接混合输入；结果区给出短链接的三种字母形态
  （`/c/`、`/m/`、`/s/`），每条带复制按钮。字母决定输出格式，
  所以同一个短码能同时服务两种客户端。
- **一键导入客户端。** Clash 与 sing-box 目标的链接行带导入
  按钮（`clash://` / `sing-box://` 深链），把订阅直接递给
  客户端 App。
- **恢复之前的生成。** 每条短链接的输入都存在 KV 里；把短码
  （或完整链接）粘进恢复框，表单会原样回填，可以微调后
  重新生成。
- 短链服务不可用时，页面会退回到长的 `/conv`、`/sub` 或
  `/chain` 链接，而不是直接失败。

## 工作原理

一切都在单个 Worker 里运行。KV 是基线存储；R2 与 D1 组成
可选的进阶层，绑定存在时 Worker 自动使用（见下一节）：

| 事项 | 实现 |
|---|---|
| 短链记录 | 绑定了 D1 时存 D1 `links` 表，否则存 KV 键 `link:<code>` |
| 内容去重 | D1 哈希查询（同输入 → 同短码），否则 KV 键 `idx:<sha256>` |
| 规则镜像 | 绑定了 R2 时存 R2 对象，否则 KV 键 `rule:<dst>`；经 `GET /rules/<path>` 提供 |
| 刷新状态 | KV 键 `meta:rules_status`，绑定 D1 时另加一行 `refresh_log` |
| 规则刷新 | Cron 触发器 `35 20 * * *` UTC + `POST /admin/refresh` |
| 配置骨架 | 打包在 `src/` 里；`__PUBLIC_ORIGIN__` 在生成时按请求替换为请求自身的来源 |

## 进阶存储：R2 + D1

全新的一键部署与 `deploy.sh` 部署自动从这一层起步，无需
配置。每个服务存什么：

- **R2 —— 规则镜像。** 对象存储是 76 个规则文件的天然归宿，
  其中包括约 16.5 MB 的 `geoip.dat`：不用再惦记 KV 单值
  25 MB 的上限，读写也不再占用 KV 的配额。R2 免费层
  （10 GB 存储、出站免费）覆盖这份镜像绰绰有余。
- **D1 —— 短链存储。** 短链记录是结构化数据：`links` 表
  （短码、种类、目标、输入、内容哈希、创建时间）让去重变成
  一次索引查询，在 `hits` 列里统计每次取用（`GET /api/link/<code>`
  的 JSON 里可见），`refresh_log` 表保存规则刷新的审计历史。
  表结构由 Worker 首次使用时懒创建——没有迁移步骤。D1 免费层
  （每天 500 万行读 / 10 万行写）远超个人转换器的流量。

兼容性是刻意设计：绑定是可选的。只有 KV 的部署（老安装，
或绑定被移除）照常工作，读取按 D1 → KV、R2 → KV 回退，
启用 R2 层之前镜像进 KV 的规则文件继续提供服务，某一次
调用里 D1 失败就为那一次回退 KV。给现有部署启用这一层
只需绑上桶和数据库——之后创建的链接进 D1，下一次规则
刷新把镜像落进 R2。

接口：`GET /`（页面）、`GET /chain`、`GET /conv`、`GET /sub`、
`GET /version`、`POST /shorten`、`GET /c|m|s/<code>`、
`GET /rules/<path>`、`GET /api/link/<code>`（把存下的记录以
JSON 返回给页面的恢复框；短码就是它那条记录的持有凭证）、
`POST /admin/refresh`。

生成的链式配置已与参考 Python 实现的输出做过深度相等校验
（解析后的 JSON/YAML）。完整的实现规格在姊妹 VPS 仓库：
<https://github.com/dukangalex/subscription-chain-converter>

## 免费额度可行性

KV 免费层：1 GB 存储、每天 10 万次读、1000 次写。只有 KV 的
部署里，一次完整的规则刷新写约 77 个键（76 个文件 + 状态），
不到每日写预算的十分之一；最大的单值 `clash/geoip.dat` 约
16.5 MB，在 KV 单值 25 MB 上限之内，整个镜像远小于 1 GB。
在进阶层，镜像住在 R2 里（10 GB 免费存储、出站不收费），
一次刷新只剩 KV 的一个状态键写入，D1 接住短链流量（每天
500 万行读 / 10 万行写，免费）。

一个注意事项：Workers **免费计划每次调用只允许 50 个
子请求**，而一次完整刷新要拉 76 个文件。所以在免费计划上，
单次刷新会增量式填镜像——失败的条目保留上次的副本，后续
运行（定时或手动）会把缺口补上。想要保证一次填满，Workers
付费计划会提高子请求上限。其余一切（生成、短链、规则提供）
都稳稳落在免费层之内。

## 差异与限制

- **六种格式全部原生生成**（clash、sing-box、v2ray、surge、
  loon、quanx）——不涉及任何外部转换器。六种之外的 `/sub`
  目标可以选用你自己的外部 subconverter 承接：设置变量
  `EXTERNAL_SUBCONVERTER_URL` 后转发过去；没设，这类请求
  返回 501。这个变量刻意没有预声明，所以一键部署永远不会
  向你索要它。
- **没有脚本兜底。** 内置构建器建不出来时，请求以 502 失败，
  不降级到第二条路径。
- **YAML 格式**来自 js-yaml；折行与引号风格可能与其他生成器
  有外观差异。校验过的是解析后的内容相等。
- **KV 是最终一致**：新建的短链通常立即可读，但个别地区
  传播可能短暂滞后。
- **ECH**：带 ECH 的条目在生成时从阿里 DNS 的 DoH 拉取
  ECHConfigList 并内联（PEM 标签 `ECH CONFIGS`），另有专用
  的 `ech-dns` 路由兜底。
- **首次启动**：`POST /admin/refresh` 只在镜像从未刷新过时
  接受免令牌调用。刷新只下载打包清单里的官方地址；第一次
  成功之后，令牌永远必填。

## 数据流向

短链记录——包括带令牌的原始订阅链接——只存在**你自己的**
Cloudflare KV 命名空间里。生成在 Cloudflare 边缘完成；订阅
源、官方规则文件与 ECH 查询都从 Cloudflare 的出口 IP 发出。
客户端从你的 Worker 域名拉配置和规则文件。没有任何东西会
发给第三方转换器，Worker 也不会把请求链接写进任何日志。

## 文件

```
package.json          名称、js-yaml + wrangler + esbuild 锁定版本、脚本（含 Pages 构建/部署）
wrangler.toml         Worker 配置（KV + R2 + D1 绑定、定时、变量）
deploy.sh             一条命令部署 + 冒烟测试
src/worker.js         Worker 本体（页面、摄入、构建器、KV、HTTP）
src/skeleton_clash.json    配置骨架（分组、规则、DNS）
src/skeleton_singbox.json  配置骨架
src/rules_manifest.json    每日镜像的 76 个官方规则来源
test/smoke.mjs        打桩 KV/fetch 的测试台：node test/smoke.mjs
```

## 致谢

本项目建立在以下第三方成果之上：

- **规则数据** —— 每日镜像的规则文件只取官方来源：mihomo 用
  [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)，
  sing-box 用 SagerNet 的
  [sing-geosite](https://github.com/SagerNet/sing-geosite) 与
  [sing-geoip](https://github.com/SagerNet/sing-geoip)。镜像的
  意义就是让每个部署从自己的存储里原样提供这些文件。
- **js-yaml**（[nodeca/js-yaml](https://github.com/nodeca/js-yaml)）
  ——唯一的运行时依赖，用于 YAML 的解析与生成。
- **格式参考** —— Surge、Loon、Quantumult X 的原生渲染器是
  对照 [subconverter](https://github.com/tindy2013/subconverter)
  的生成器与各客户端自己的文档、示例配置写成的（Surge 手册、
  Loon 示例配置、Quantumult X 的 `sample.conf`）。输出格式
  本身属于 mihomo 与 sing-box 项目及其客户端生态。
- **部署形态** —— 本版的呈现方式（仓库根即 Worker 工程、一键
  部署按钮、快速上手的编排）借鉴了
  [sublink-worker](https://github.com/7Sageer/sublink-worker)
  的形态。
- **阿里 DNS 的 DoH** —— 生成时查询它来解析 ECH 配置。
- **构建工具** —— wrangler 与 esbuild 用于打包与部署；它们
  是开发工具，没有代码进入 Worker 本体。

其余一切——构建器、链式组装、短链接、页面——均为本项目原创。

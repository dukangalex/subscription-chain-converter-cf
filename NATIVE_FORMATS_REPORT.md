# 四种输出格式原生渲染器 — 实施报告

日期：2026-11-01
范围：在 `~/workspace/sub-converter-native/`（`~/workspace/sub-converter-cf` 的完整副本）中开发；
原目录、整合构建目录、整合仓库均未改动。未推送、未部署。

## 实现了什么

在转换器核心 `src/worker.js` 中新增四个原生渲染器，接入既有 target 分发，
使六种 target（clash / sing-box / v2ray / surge / loon / quanx）全部本地渲染，
**零外部依赖**：不再需要 `EXTERNAL_SUBCONVERTER_URL` 透传外部 subconverter。

接入点：

- `buildConfig()`：文本类 target（v2ray/surge/loon/quanx）走 `buildTextPlain()`；
  clash/sing-box 路径不变。
- `buildChainFor(target, entryItems, exitItems, origin)`：统一链式分发，
  sing-box/clash 走原有 merge，文本类走 `mergeTextChain()`。`/chain`、
  短链 `/c/<code>` 均改走此分发。
- target 门禁放宽：`/sub`、`/conv`、`/chain`、`/shorten`（含链式记录）
  均接受全部六种 target；未知 target 在无外部后端时仍返回 501 并说明
  六种原生格式。`proxyToConverter()` 仅剩未知 target 的兜底。
- 网页表单：普通转换本就列出六种；链式选项新增 surge / loon / quanx
  （v2ray 不列入链式，见下）。

渲染器消费的仍是既有中间表示（clash 式节点字典）与已筛选/已命名的 items；
链式改名复用 clash 版的 `clashPrefixedName()`（入口-/出口- 前缀、旗帜保留），
组命名与 clash 骨架对齐：`⛓ 入口优选`、`⛓ 出口优选`、`Proxy`、`自动测速`，
测速参数与定版一致（generate_204、interval 30、tolerance 100）。

规则段按任务要求只搬策略意图，不搬全量规则集：私有网段直连
（10/8、100.64/10、127/8、172.16/12、192.168/16、::1/128）+ 中国直连
（GEOIP,CN）+ FINAL 走 Proxy 组，与 clash 骨架的默认意图一致。

## 协议 × 格式支持矩阵

渲染 = ●，跳过 = —（跳过时不输出错误行，整单全跳过则返回 502 并说明原因）。

| 协议 | v2ray 链接 | Surge | Loon | QuanX | 跳过原因 |
|---|---|---|---|---|---|
| ss | ● SIP002 | ●（obfs-plugin） | ●（obfs 位置参数） | ●（obfs/tls 插件） | |
| vmess | ● base64 JSON | ●（tcp/ws） | ●（tcp/ws） | ●（tcp/ws，obfs=ws/wss/ws） | grpc 三家均跳过（见缺口） |
| vless | ● | — | ●（含 Reality） | ●（含 Reality） | Surge 无原生 VLESS（官方确认） |
| trojan | ● | ●（tcp/ws） | ●（tcp/ws） | ●（tcp/ws，obfs=wss） | |
| hysteria2 | ● | ●（含 obfs） | ●（含 obfs） | — | QuanX 不支持 hysteria2 |
| tuic | ● | — | ● | — | Surge、QuanX 均不支持 TUIC |
| anytls | ● | ●（Reality 除外） | ● | ● | Surge anytls 无 Reality 参数位 |
| snell | — | ● | ● | — | 无标准分享链接；QuanX 不支持 snell |
| ssr | — | — | ● | ● | 无标准分享链接；Surge 不支持 SSR |
| socks5 | — | ● | ● | ● | 无标准分享链接 |
| http(s) | — | ● | ● | ● | 无标准分享链接 |

## 链式在各格式的实现方式

- **Surge**：出口节点行追加 `underlying-proxy=⛓ 入口优选`
  （Surge 官方的节点级上层代理参数）；入口/出口各成 url-test 组，
  `Proxy` 手动组首位放出口组。
- **Loon**：Loon 没有节点级上层代理参数，其链式机制是独立的
  `[Proxy Chain]` 段（Loon 3.1+）：生成
  `⛓ 链式代理 = ⛓ 入口优选,⛓ 出口优选,udp=true`，
  跳数按列出顺序（入口在前）；链条目本身可被 `[Proxy Group]` 引用，
  `Proxy` 组首位即链式组。任务书所说「节点参数里的上层代理指定」
  在 Loon 中并不存在，已按 Loon 实际文档机制实现，此点请留意。
- **Quantumult X**：出口 server 行在 `tag=` 之前追加
  `via-server=⛓ 入口优选`（按任务书指定实现）。
  **注意（核查结论）**：`via-server` 未出现在 Quantumult X 官方
  sample.conf（v1.5.5 build 914）中，无法从官方文档证实其语义；
  若该客户端版本不识别，它会忽略未知参数、链式不生效但不报错。
  整合 2.0 上线前建议在真机 Quantumult X 上验证一次。
- **V2Ray**：分享链接没有链式/策略组概念。链式请求退化为
  **只输出出口层节点的普通链接集合**（入口层连抓取都不做），
  代码注释已写明：导入后即普通单跳节点，不是链式代理。

## 与任务书的一处命名更正（Quantumult X）

任务书写的 `[proxy_local]` / `[proxy_group]` 在 Quantumult X 中不存在，
写错会被客户端整段静默忽略。实际段名（官方 sample.conf 核实）为：

- server 行段：`[server_local]`（行式为
  `type=host:port, key=value, ..., tag=节点名`，首个 `=` 两侧无空格）
- 策略组段：`[policy]`（`static=` / `url-latency-benchmark=` 语法）
- 规则段：`[filter_local]`（任务书此名正确，规则为小写
  `geoip, cn, direct` / `final, Proxy` 风格）

已按真实段名实现。

## 自检结果

新增 `test/native-formats.mjs`（与 `test/smoke.mjs` 同款 harness：
Map 版 KV stub + fetch stub；fetch stub 只服务一份 clash YAML fixture，
其余一律 404，且全程 `EXTERNAL_SUBCONVERTER_URL=""`——若任何格式
偷偷走外部后端，测试会直接失败，以此证明零外部依赖）。

- fixture：8 条 URI（ss、vmess-ws、vless-reality、vless-ws、trojan、
  hysteria2-obfs、tuic、anytls）+ YAML 订阅 4 节点（snell、ssr、
  socks5、vmess-grpc），共 12 节点；链式 fixture 入口 2 / 出口 3。
- 断言共 63 条，全部通过：
  - 节点数与矩阵一致（v2ray 9 链、Surge 7、Loon 11、QuanX 8；
    链式 Surge 2+2、Loon 2+3、QuanX 2+3、v2ray 退化为 3 条出口链接）；
  - 三种 INI 格式的组引用全闭合（成员必为已定义节点/组/内建）；
  - 关键行格式正则通过；v2ray 输出可 base64 解码、每行均为合法
    协议链接、vmess JSON 可回读校验 ws/SNI/UUID；
  - 链式标记断言：Surge `underlying-proxy=`、Loon `[Proxy Chain]`
    跳序、QuanX `via-server=`、入口行不带链式参数；
  - 错误路径：仅 vless 转 Surge → 502 说明；未知 target → 400/501；
  - 短链：surge 普通记录与 loon 链式记录可经 `/shorten` + `/c/<code>`
    原生出件，同一链式码经 `/m/` 仍出 clash 链式配置。
- 既有回归：`node test/smoke.mjs` 全部通过（clash/sing-box、
  短链、规则镜像、D1/R2 路径无回归）。

语法/格式依据（2026-11-01 核查）：subconverter master 的
`subexport.cpp`、Surge 官方手册、Quantumult X 官方 sample.conf、
Loon 公开示例配置。与 subconverter 的有意差异：Surge 的
hysteria2 类型关键字用手册的 `hysteria2`（subconverter 的
`hysteria` 已过时）；Surge trojan 补 ws 参数（subconverter 未输出）。

## 已知缺口

1. **vmess/vless 的 grpc 传输**：Surge、Loon、QuanX 三家均跳过
   （subconverter 对 Loon/QuanX 输出 grpc 参数、Surge 跳过；
   本实现为求稳妥三家统一跳过，分享链接 v2ray 保留 grpc）。
   如需补齐，QuanX 为 `obfs=grpc` 一类参数、Loon 为
   `transport=grpc,service-name=`，可按客户端实测后再加。
2. **ss 的 v2ray-plugin**：Surge、Loon 跳过该节点（QuanX 映射为
   obfs=ws/wss，v2ray 链接输出 SIP002 `plugin=`）。obfs-plugin
   三家均支持。
3. **QuanX via-server 未获官方文档证实**（见上），需真机验证。
4. **Loon 的 tuic / snell 参数式**为尽力而为（公开配置较少），
   建议真机抽验；vmess alterId>0（非 AEAD）在 Loon 无参数位，
   按 AEAD 输出。
5. **ECH 相关选项**（ech-opts）在四种文本格式中均忽略
   （clash/sing-box 的 ECH 路由逻辑不适用于这些客户端）。
6. 文本格式的规则段只有基础意图版（私有直连 + GEOIP CN + FINAL），
   不含 clash 骨架的完整规则集与规则集订阅——按任务书范围执行。

## 交付物

- `src/worker.js`：四个渲染器 + 分发接线（副本内）。
- `test/native-formats.mjs`：结构化自检（63 条断言）。
- 本报告。其余目录未动，未推送、未部署——整合进 edgetunnel-ipfilter
  2.0 时需在 merge 构建中以本副本的渲染器替换透传逻辑，并删除生产
  环境的 `EXTERNAL_SUBCONVERTER_URL` 依赖（整合动作不在本任务范围）。

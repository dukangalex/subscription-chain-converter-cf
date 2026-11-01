// Structured self-checks for the native text-format renderers
// (v2ray / surge / loon / quanx). Same harness style as smoke.mjs:
// a Map-based KV stub and a stubbed global fetch (the only URL it
// serves is a clash YAML fixture; anything else 404s, which also
// proves the four formats never call an external subconverter —
// EXTERNAL_SUBCONVERTER_URL is empty throughout).
//
//   node test/native-formats.mjs
const worker = (await import("../src/worker.js")).default;

// ------------------------------------------------------------- KV stub
class KVStub {
  constructor() { this.map = new Map(); }
  async get(key, opt) {
    if (!this.map.has(key)) return null;
    const raw = this.map.get(key);
    const type = typeof opt === "string" ? opt : (opt && opt.type) || "text";
    if (type === "json") return JSON.parse(raw);
    return raw;
  }
  async put(key, value) { this.map.set(key, value); }
}

// ---------------------------------------------------------- fixtures
const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const UUID1 = "11111111-2222-3333-4444-555555555555";
const UUID2 = "22222222-3333-4444-5555-666666666666";
const UUID3 = "33333333-4444-5555-6666-777777777777";
const UUID4 = "44444444-5555-6666-7777-888888888888";
const PUBKEY = "k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk"; // sample value

const URI_SS = `ss://${b64("aes-256-gcm:password123")}@ss.example.com:8388#SS-Node`;
const URI_VMESS = "vmess://" + b64(JSON.stringify({
  v: "2", ps: "VMess-WS", add: "vmess.example.com", port: "443",
  id: UUID1, aid: "0", scy: "auto", net: "ws", type: "none",
  host: "cdn.example.com", path: "/ws-path", tls: "tls",
  sni: "sni.example.com",
}));
const URI_VLESS_REALITY =
  `vless://${UUID2}@vless.example.com:443?security=reality` +
  `&pbk=${PUBKEY}&sid=ab12&fp=chrome&flow=xtls-rprx-vision` +
  `&sni=www.apple.com&type=tcp#VLESS-Reality`;
const URI_VLESS_WS =
  `vless://${UUID3}@vw.example.com:443?security=tls&sni=vw.example.com` +
  `&type=ws&host=vw.example.com&path=%2Fvless#VLESS-WS`;
const URI_TROJAN =
  "trojan://trojanpass@trojan.example.com:443?sni=trojan.example.com" +
  "#Trojan-Node";
const URI_HY2 =
  "hysteria2://hy2pass@hy2.example.com:443?sni=hy2.example.com" +
  "&obfs=salamander&obfs-password=obfspass&insecure=1#HY2-Obfs";
const URI_TUIC =
  `tuic://${UUID4}:tuicpass@tuic.example.com:443?sni=tuic.example.com` +
  "&alpn=h3&congestion_control=bbr&udp_relay_mode=native#TUIC-Node";
const URI_ANYTLS =
  "anytls://anytlspass@anytls.example.com:443?sni=anytls.example.com" +
  "#AnyTLS-Node";

const YAML_FIXTURE = [
  "proxies:",
  "  - {name: Snell-Node, type: snell, server: snell.example.com, " +
    "port: 443, psk: snellpsk, version: 4, " +
    "obfs-opts: {mode: tls, host: bing.com}}",
  "  - {name: SSR-Node, type: ssr, server: ssr.example.com, " +
    "port: 443, cipher: aes-256-cfb, password: ssrpass, " +
    "protocol: auth_aes128_md5, protocol-param: '12345:abc', " +
    "obfs: tls1.2_ticket_auth, obfs-param: bing.com}",
  "  - {name: Socks-Node, type: socks5, server: socks.example.com, " +
    "port: 1080, username: suser, password: spass}",
  "  - {name: VMess-gRPC, type: vmess, server: grpc.example.com, " +
    "port: 443, uuid: 55555555-6666-7777-8888-999999999999, " +
    "alterId: 0, cipher: auto, network: grpc, tls: true, " +
    "servername: grpc.example.com, " +
    "grpc-opts: {grpc-service-name: grpc-service}}",
  "",
].join("\n");
const YAML_URL = "https://fixture.test/clash.yaml";

globalThis.fetch = async (url) => {
  if (String(url) === YAML_URL) {
    return new Response(YAML_FIXTURE, { status: 200 });
  }
  return new Response("not found (fetch stub)", { status: 404 });
};

const env = { KV: new KVStub(), EXTERNAL_SUBCONVERTER_URL: "" };
const ctx = { waitUntil() {} };
const BASE = "https://cf.test";

let failures = 0;
function check(name, cond, extra = "") {
  if (cond) console.log(`PASS ${name}`);
  else {
    failures++;
    console.log(`FAIL ${name}${extra ? " — " + extra : ""}`);
  }
}

async function call(path, opts = {}) {
  return worker.fetch(new Request(BASE + path, opts), env, ctx);
}

const ALL_URIS = [URI_SS, URI_VMESS, URI_VLESS_REALITY, URI_VLESS_WS,
  URI_TROJAN, URI_HY2, URI_TUIC, URI_ANYTLS, YAML_URL];
const convUrl = (target, items) =>
  "/conv?target=" + target + "&url=" +
  encodeURIComponent(items.join("|"));

async function conv(target, items = ALL_URIS) {
  const r = await call(convUrl(target, items));
  return { status: r.status, body: await r.text() };
}

// ------------------------------------------------------------ plain: v2ray
{
  const { status, body } = await conv("v2ray");
  check("v2ray: 200", status === 200, `got ${status}: ${body.slice(0, 120)}`);
  const text = Buffer.from(body, "base64").toString("utf8");
  const links = text.trim().split("\n");
  check("v2ray: 9 links (snell/ssr/socks5 skipped)",
    links.length === 9, `got ${links.length}`);
  check("v2ray: every line is a known share link",
    links.every((l) =>
      /^(ss|vmess|vless|trojan|hysteria2|tuic|anytls):\/\//.test(l)));
  const vmess = links.find((l) => l.startsWith("vmess://"));
  const vdoc = JSON.parse(
    Buffer.from(vmess.slice(8), "base64").toString("utf8"));
  check("v2ray: vmess JSON round-trips ws/sni",
    vdoc.net === "ws" && vdoc.path === "/ws-path" &&
    vdoc.sni === "sni.example.com" && vdoc.id === UUID1);
  const vless = links.find((l) => l.includes("VLESS-Reality") ||
    l.startsWith("vless://"));
  check("v2ray: vless reality params present",
    links.some((l) => l.startsWith("vless://") &&
      l.includes("security=reality") && l.includes("pbk=" + PUBKEY) &&
      l.includes("flow=xtls-rprx-vision")));
  check("v2ray: hy2 obfs params present",
    links.some((l) => l.startsWith("hysteria2://") &&
      l.includes("obfs=salamander") &&
      l.includes("obfs-password=obfspass")));
  check("v2ray: tuic params present",
    links.some((l) => l.startsWith("tuic://") &&
      l.includes("congestion_control=bbr")));
  check("v2ray: grpc vmess kept as link",
    links.filter((l) => l.startsWith("vmess://")).length === 2);
  void vless;
}

// ------------------------------------------------------- INI helpers
function parseSections(body) {
  const sections = new Map();
  let cur = null;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^\[(.+)\]$/);
    if (m) {
      cur = m[1];
      if (!sections.has(cur)) sections.set(cur, []);
      continue;
    }
    if (cur) sections.get(cur).push(line);
  }
  return sections;
}

function surgeProxyLines(body) {
  return parseSections(body).get("Proxy")
    .filter((l) => !l.startsWith("DIRECT ="));
}

function loonProxyLines(body) {
  return parseSections(body).get("Proxy");
}

function quanxServerLines(body) {
  return parseSections(body).get("server_local");
}

// kind "ini":    `Name = <type-kw>, members...` (Surge/Loon groups)
// kind "quanx":  `<type-kw>=Name, members...`   (policy name is 1st RHS)
// kind "chain":  `Name = member, member, ...`  (Loon [Proxy Chain] hops)
function groupNameOf(line, kind) {
  if (kind === "quanx") {
    return line.slice(line.indexOf("=") + 1).split(",")[0].trim();
  }
  return line.split("=")[0].trim();
}

function groupMembersOf(line, kind) {
  const rhs = line.slice(line.indexOf("=") + 1);
  let toks = rhs.split(",").map((s) => s.trim()).filter(Boolean);
  if (kind === "ini" || kind === "quanx") toks = toks.slice(1);
  return toks.filter((t) => !t.includes("=")); // drop url=, interval=, …
}

function checkRefs(label, defined, groupLines, builtins,
  kind = "ini", extraNames = []) {
  const names = new Set([...defined, ...builtins, ...extraNames]);
  for (const g of groupLines) names.add(groupNameOf(g, kind));
  let ok = true;
  for (const g of groupLines) {
    for (const tok of groupMembersOf(g, kind)) {
      if (!names.has(tok)) {
        ok = false;
        console.log(`  unresolved ref in ${label}: "${tok}" <- ${g}`);
      }
    }
  }
  check(`${label}: all group references resolve`, ok);
}

// ------------------------------------------------------------ plain: surge
{
  const { status, body } = await conv("surge");
  check("surge: 200", status === 200, `got ${status}: ${body.slice(0, 120)}`);
  const lines = surgeProxyLines(body);
  check("surge: 7 nodes (vless x2 + tuic skipped)",
    lines.length === 7, `got ${lines.length}: ${lines.join(" | ")}`);
  const re = /^[^=]+ = (ss|vmess|trojan|hysteria2|anytls|snell|socks5|socks5-tls|http), [^,]+, \d+(, .*)?$/;
  check("surge: node line format", lines.every((l) => re.test(l)),
    lines.find((l) => !re.test(l)) || "");
  check("surge: ss line", lines.some((l) =>
    l.includes("SS-Node = ss, ss.example.com, 8388, encrypt-method=aes-256-gcm, password=password123")));
  check("surge: vmess ws line", lines.some((l) =>
    l.includes("vmess, vmess.example.com, 443, username=" + UUID1) &&
    l.includes("ws=true") && l.includes("ws-path=/ws-path") &&
    l.includes("sni=sni.example.com")));
  check("surge: no vless/tuic lines",
    !lines.some((l) => /, (vless|tuic), /.test(l)));
  check("surge: snell line", lines.some((l) =>
    l.includes("snell, snell.example.com, 443, psk=snellpsk") &&
    l.includes("version=4") && l.includes("obfs=tls")));
  check("surge: hy2 type keyword is hysteria2", lines.some((l) =>
    l.includes("hysteria2, hy2.example.com, 443")));
  const sections = parseSections(body);
  checkRefs("surge", lines.map((l) => l.split(" = ")[0]),
    sections.get("Proxy Group"), ["DIRECT", "REJECT"]);
  check("surge: rules intent",
    body.includes("GEOIP,CN,DIRECT") && body.includes("FINAL,Proxy") &&
    body.includes("IP-CIDR,192.168.0.0/16,DIRECT,no-resolve"));
}

// ------------------------------------------------------------- plain: loon
{
  const { status, body } = await conv("loon");
  check("loon: 200", status === 200, `got ${status}: ${body.slice(0, 120)}`);
  const lines = loonProxyLines(body);
  check("loon: 11 nodes (only vmess-grpc skipped)",
    lines.length === 11, `got ${lines.length}: ${lines.join(" | ")}`);
  const re = /^[^=]+ = (Shadowsocks|ShadowsocksR|vmess|VLESS|trojan|hysteria2|tuic|anytls|snell|socks5|http|https),[^,]+,\d+/;
  check("loon: node line format", lines.every((l) => re.test(l)),
    lines.find((l) => !re.test(l)) || "");
  check("loon: ss positional line", lines.some((l) =>
    l.includes('SS-Node = Shadowsocks,ss.example.com,8388,aes-256-gcm,"password123"')));
  check("loon: vless reality line", lines.some((l) =>
    l.includes("VLESS,vless.example.com,443") &&
    l.includes("flow=xtls-rprx-vision") &&
    l.includes('public-key="' + PUBKEY + '"') &&
    l.includes("over-tls=true")));
  check("loon: tuic line", lines.some((l) =>
    l.includes("tuic,tuic.example.com,443") && l.includes("alpn=h3") &&
    l.includes("congestion-controller=bbr")));
  check("loon: ssr line", lines.some((l) =>
    l.includes("ShadowsocksR,ssr.example.com,443") &&
    l.includes("protocol=auth_aes128_md5")));
  const sections = parseSections(body);
  checkRefs("loon", lines.map((l) => l.split(" = ")[0]),
    sections.get("Proxy Group"), ["DIRECT", "REJECT"]);
  check("loon: rules intent",
    body.includes("GEOIP,CN,DIRECT") && body.includes("FINAL,Proxy"));
}

// ------------------------------------------------------------ plain: quanx
{
  const { status, body } = await conv("quanx");
  check("quanx: 200", status === 200, `got ${status}: ${body.slice(0, 120)}`);
  const lines = quanxServerLines(body);
  check("quanx: 8 nodes (hy2/tuic/snell/grpc skipped)",
    lines.length === 8, `got ${lines.length}: ${lines.join(" | ")}`);
  const re = /^(shadowsocks|vmess|vless|trojan|anytls|socks5|http)=[^:,]+:\d+, .*, tag=.+$/;
  check("quanx: server line format", lines.every((l) => re.test(l)),
    lines.find((l) => !re.test(l)) || "");
  check("quanx: ss line", lines.some((l) =>
    l.startsWith("shadowsocks=ss.example.com:8388, method=aes-256-gcm, password=password123") &&
    l.endsWith("tag=SS-Node")));
  check("quanx: vmess ws line", lines.some((l) =>
    l.startsWith("vmess=vmess.example.com:443") &&
    l.includes("obfs=wss") && l.includes("obfs-uri=/ws-path") &&
    l.includes("method=chacha20-ietf-poly1305")));
  check("quanx: vless reality line", lines.some((l) =>
    l.startsWith("vless=vless.example.com:443, method=none") &&
    l.includes("reality-base64-pubkey=" + PUBKEY) &&
    l.includes("reality-hex-shortid=ab12") &&
    l.includes("vless-flow=xtls-rprx-vision")));
  check("quanx: anytls line", lines.some((l) =>
    l.startsWith("anytls=anytls.example.com:443") &&
    l.includes("over-tls=true") && l.includes("tls-host=anytls.example.com")));
  check("quanx: no hy2/tuic lines",
    !lines.some((l) => /^(hysteria2|tuic)=/.test(l)));
  const sections = parseSections(body);
  const tags = lines.map((l) => l.match(/, tag=(.+)$/)[1]);
  checkRefs("quanx", tags, sections.get("policy"), ["direct", "reject"],
    "quanx");
  check("quanx: filter intent",
    body.includes("geoip, cn, direct") && body.includes("final, Proxy") &&
    body.includes("ip-cidr, 192.168.0.0/16, direct"));
}

// ------------------------------------------------------------- chain tests
const CHAIN_ENTRY = [URI_SS, URI_TROJAN];
const CHAIN_EXIT = [URI_VMESS, URI_TROJAN.replace("Trojan-Node", "Trojan-Exit"), URI_VLESS_WS];
const chainUrl = (target) =>
  "/chain?target=" + target +
  "&entry=" + encodeURIComponent(CHAIN_ENTRY.join("|")) +
  "&exit=" + encodeURIComponent(CHAIN_EXIT.join("|"));

{
  const r = await call(chainUrl("surge"));
  const body = await r.text();
  check("surge chain: 200", r.status === 200, `got ${r.status}: ${body.slice(0, 160)}`);
  const lines = surgeProxyLines(body);
  check("surge chain: 2 entries + 2 exits (vless exit skipped)",
    lines.length === 4, `got ${lines.length}`);
  check("surge chain: entry/exit renames", lines.every((l) =>
    l.includes("入口-") || l.includes("出口-")));
  const exitLines = lines.filter((l) => l.includes("出口-"));
  check("surge chain: exits carry underlying-proxy=entry group",
    exitLines.every((l) => l.includes("underlying-proxy=⛓ 入口优选")));
  const entryLines = lines.filter((l) => l.includes("入口-"));
  check("surge chain: entries have no underlying-proxy",
    entryLines.every((l) => !l.includes("underlying-proxy")));
  const sections = parseSections(body);
  checkRefs("surge chain", lines.map((l) => l.split(" = ")[0]),
    sections.get("Proxy Group"), ["DIRECT", "REJECT"]);
  console.log("\n----- surge chain sample -----\n" + body);
}

{
  const r = await call(chainUrl("loon"));
  const body = await r.text();
  check("loon chain: 200", r.status === 200, `got ${r.status}: ${body.slice(0, 160)}`);
  const lines = loonProxyLines(body);
  check("loon chain: 2 entries + 3 exits", lines.length === 5,
    `got ${lines.length}`);
  const sections = parseSections(body);
  const chain = sections.get("Proxy Chain") || [];
  check("loon chain: [Proxy Chain] hops entry group then exit group",
    chain.length === 1 &&
    chain[0].startsWith("⛓ 链式代理 = ⛓ 入口优选,⛓ 出口优选"),
    chain.join(" | "));
  const loonChainNames = (sections.get("Proxy Chain") || [])
    .map((l) => l.split(" = ")[0]);
  checkRefs("loon chain groups", lines.map((l) => l.split(" = ")[0]),
    sections.get("Proxy Group"), ["DIRECT", "REJECT"], "ini",
    loonChainNames);
  const loonGroupNames = sections.get("Proxy Group")
    .map((l) => groupNameOf(l, "ini"));
  checkRefs("loon chain hops", lines.map((l) => l.split(" = ")[0]),
    sections.get("Proxy Chain") || [], [], "chain", loonGroupNames);
  // chain section members must be the two groups, in order
  const members = chain.length
    ? chain[0].split(" = ")[1].split(",").map((s) => s.trim())
      .filter((t) => !t.includes("=")) : [];
  check("loon chain: chain members are the entry/exit groups",
    members.length === 2 && members[0] === "⛓ 入口优选" &&
    members[1] === "⛓ 出口优选", members.join(" | "));
  console.log("\n----- loon chain sample -----\n" + body);
}

{
  const r = await call(chainUrl("quanx"));
  const body = await r.text();
  check("quanx chain: 200", r.status === 200, `got ${r.status}: ${body.slice(0, 160)}`);
  const lines = quanxServerLines(body);
  check("quanx chain: 2 entries + 3 exits", lines.length === 5,
    `got ${lines.length}`);
  const exitLines = lines.filter((l) => l.includes("tag=🇺🇸") ||
    l.includes("出口-"));
  const exitsTagged = lines.filter((l) => /, tag=.*出口-/.test(l));
  check("quanx chain: exits carry via-server=entry group",
    exitsTagged.length === 3 &&
    exitsTagged.every((l) => l.includes("via-server=⛓ 入口优选")),
    lines.join(" | "));
  const entriesTagged = lines.filter((l) => /, tag=.*入口-/.test(l));
  check("quanx chain: entries have no via-server",
    entriesTagged.length === 2 &&
    entriesTagged.every((l) => !l.includes("via-server")));
  void exitLines;
  const sections = parseSections(body);
  const tags = lines.map((l) => l.match(/, tag=(.+)$/)[1]);
  checkRefs("quanx chain", tags, sections.get("policy"),
    ["direct", "reject"], "quanx");
  console.log("\n----- quanx chain sample -----\n" + body);
}

{
  const r = await call(chainUrl("v2ray"));
  const body = await r.text();
  check("v2ray chain: 200 (degrades to exit link set)",
    r.status === 200, `got ${r.status}: ${body.slice(0, 160)}`);
  const links = Buffer.from(body, "base64").toString("utf8")
    .trim().split("\n");
  check("v2ray chain: exactly the 3 exit nodes as links",
    links.length === 3 &&
    links.every((l) => /^(vmess|trojan|vless):\/\//.test(l)),
    links.join(" | "));
  check("v2ray chain: no entry nodes leaked",
    !links.some((l) => l.includes("SS-Node") ||
      l.includes("example.com:8388")));
}

// ------------------------------------------------------------ error paths
{
  const r = await call(convUrl("surge", [URI_VLESS_WS]));
  check("surge with only vless: 502 with explanation",
    r.status === 502, `got ${r.status}`);
  const r2 = await call("/conv?target=bogus&url=" +
    encodeURIComponent(URI_SS));
  check("unknown target on /conv: 400", r2.status === 400,
    `got ${r2.status}`);
  const r3 = await call("/sub?target=surge&url=" +
    encodeURIComponent(URI_SS));
  const b3 = await r3.text();
  check("/sub surge renders natively (no external backend)",
    r3.status === 200 && b3.includes("[Proxy]"),
    `got ${r3.status}: ${b3.slice(0, 120)}`);
  const r4 = await call("/sub?target=bogus&url=" +
    encodeURIComponent(URI_SS));
  check("/sub unknown target without backend: 501",
    r4.status === 501, `got ${r4.status}`);
}

// ------------------------------------------------------------- short links
{
  const s = await call("/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: "surge", url: URI_SS }),
  });
  const text = await s.text();
  check("shorten surge conv: 200 /c/<code>",
    s.status === 200 && text.includes("/c/"), text);
  const code = text.split("/").pop();
  const g = await call("/c/" + code);
  const gb = await g.text();
  check("short link serves native surge",
    g.status === 200 && gb.includes("SS-Node = ss,"),
    `got ${g.status}: ${gb.slice(0, 120)}`);
  const s2 = await call("/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: "loon",
      entry: CHAIN_ENTRY.join("|"), exit: CHAIN_EXIT.join("|"),
    }),
  });
  const text2 = await s2.text();
  check("shorten loon chain: 200", s2.status === 200, text2);
  const code2 = text2.split("/").pop();
  const g2 = await call("/c/" + code2);
  const gb2 = await g2.text();
  check("short link serves native loon chain",
    g2.status === 200 && gb2.includes("[Proxy Chain]"),
    `got ${g2.status}: ${gb2.slice(0, 120)}`);
  const g3 = await call("/m/" + code2);
  check("same chain code still serves clash via /m/",
    g3.status === 200 &&
    (await g3.text()).includes("dialer-proxy"));
}

console.log(failures === 0
  ? "NATIVE FORMATS OK — all assertions passed"
  : `NATIVE FORMATS FAILED — ${failures} assertion(s) failed`);
process.exit(failures === 0 ? 0 : 1);

// Smoke test for the Cloudflare Workers variant. No wrangler needed:
// a Map-based KV stub and a stubbed global fetch stand in for KV, the
// subscription endpoints and the AliDNS DoH ECH lookup.
//
//   npm install   (once, for js-yaml)
//   node test/smoke.mjs
import worker from "../src/worker.js";
import manifest from "../src/rules_manifest.json" with { type: "json" };

// ------------------------------------------------------------- KV stub
class KVStub {
  constructor() {
    this.map = new Map();
  }
  _bytes(v) {
    if (typeof v === "string") return new TextEncoder().encode(v);
    if (v instanceof ArrayBuffer) return new Uint8Array(v);
    if (ArrayBuffer.isView(v)) {
      return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
    }
    return v;
  }
  async get(key, opt) {
    if (!this.map.has(key)) return null;
    const raw = this.map.get(key);
    const type = typeof opt === "string" ? opt : (opt && opt.type) || "text";
    if (type === "json") {
      return JSON.parse(new TextDecoder().decode(this._bytes(raw)));
    }
    if (type === "arrayBuffer") {
      const b = this._bytes(raw);
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    }
    return typeof raw === "string"
      ? raw : new TextDecoder().decode(this._bytes(raw));
  }
  async put(key, value) {
    this.map.set(key, value);
  }
}

// ------------------------------------------------------------- D1 stub
// In-memory emulation of exactly the statements src/worker.js issues.
class D1Stub {
  constructor() {
    this.links = new Map();
    this.refreshLog = [];
  }
  prepare(sql) {
    const db = this;
    let args = [];
    const stmt = {
      bind(...a) { args = a; return stmt; },
      async run() { db._run(sql, args); return { success: true }; },
      async first() { return db._first(sql, args); },
      async all() { return { results: [] }; },
    };
    return stmt;
  }
  _run(sql, a) {
    if (sql.startsWith("CREATE")) return;
    if (sql.includes("INSERT INTO links")) {
      const [code, kind, target, url, entry, exit, hash, created_at] = a;
      this.links.set(code, {
        code, kind, target, url, entry, exit, hash, created_at, hits: 0,
      });
      return;
    }
    if (sql.includes("UPDATE links SET hits")) {
      const row = this.links.get(a[0]);
      if (row) row.hits++;
      return;
    }
    if (sql.includes("INSERT INTO refresh_log")) {
      this.refreshLog.push({ time: a[0], ok: a[1], failed: a[2] });
      return;
    }
    throw new Error("D1Stub: unhandled SQL: " + sql.slice(0, 60));
  }
  _first(sql, a) {
    if (sql.includes("SELECT code FROM links WHERE hash")) {
      for (const row of this.links.values()) {
        if (row.hash === a[0]) return { code: row.code };
      }
      return null;
    }
    if (sql.includes("WHERE code = ?")) {
      const row = this.links.get(a[0]);
      return row ? { ...row } : null;
    }
    throw new Error("D1Stub: unhandled query: " + sql.slice(0, 60));
  }
}

// ------------------------------------------------------------- R2 stub
class R2Stub {
  constructor() {
    this.map = new Map();
  }
  async put(key, value) {
    const b = value instanceof Uint8Array
      ? value : new Uint8Array(value);
    this.map.set(key, b.slice());
  }
  async get(key) {
    if (!this.map.has(key)) return null;
    const b = this.map.get(key);
    return {
      arrayBuffer: async () =>
        b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    };
  }
}

// ---------------------------------------------------------- fetch stub
const svgBytes = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
  '<rect width="16" height="16" fill="#000"/></svg>');
const binBytes = new Uint8Array(256);
for (let i = 0; i < 256; i++) binBytes[i] = (i * 37) % 251;
const srcSet = new Map(manifest.map((e) => [e.src, e.dst]));

globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.startsWith("https://dns.alidns.com/resolve")) {
    // Canned DNS HTTPS answer in the shape _fetch_ech_config parses.
    return Response.json({
      Answer: [{
        name: "example.com", type: 65, TTL: 56,
        data: 'alpn="h2,h3" ech="QUJDREVGR0hJSktMTU5PUA=="',
      }],
    });
  }
  if (srcSet.has(u)) {
    const bytes = srcSet.get(u).endsWith(".svg") ? svgBytes : binBytes;
    return new Response(bytes, {
      status: 200,
      headers: { "Content-Type": "application/octet-stream" },
    });
  }
  return new Response("not found (fetch stub)", { status: 404 });
};

// -------------------------------------------------------------- harness
const env = {
  KV: new KVStub(),
  REFRESH_TOKEN: "test-token",
  EXTERNAL_SUBCONVERTER_URL: "",
};
const ctx = { waitUntil() {} };
const BASE = "https://cf.test";

let failures = 0;
function check(name, cond, extra = "") {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${extra ? " — " + extra : ""}`);
  }
}

async function call(path, opts = {}) {
  return worker.fetch(new Request(BASE + path, opts), env, ctx);
}

const ENTRY =
  "vless://00000000-0000-0000-0000-000000000000@entry.example.com:443?security=none#entry-node";
const EXIT =
  "vless://11111111-1111-1111-1111-111111111111@exit.example.com:443?security=none#exit-node";
const ENTRY2 =
  "vless://22222222-2222-2222-2222-222222222222@entry2.example.com:443?security=none#entry2-node";

function shorten(body) {
  return call("/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// (e, part 1) a mirrored rule file is 404 before any refresh
{
  const r = await call("/rules/clash/private.mrs");
  check("rules 404 before refresh", r.status === 404, `got ${r.status}`);
}

// (a) shorten a chain, then fetch it as sing-box
let code = null;
{
  const r = await shorten({ target: "singbox", entry: ENTRY, exit: EXIT });
  const text = await r.text();
  check("shorten returns 200", r.status === 200, `got ${r.status}: ${text}`);
  code = text.split("/").pop();
  check("shorten returns /s/<10-char code>",
    text.startsWith(BASE + "/s/") && code.length === 10, text);
  const g = await call("/s/" + code);
  const body = await g.text();
  check("/s/<code> returns 200", g.status === 200, `got ${g.status}`);
  check("sing-box chain contains detour", body.includes('"detour"'));
  check("sing-box chain has entry group", body.includes("⛓ 入口优选"));
  check("sing-box chain has exit group", body.includes("⛓ 出口优选"));
  check("sing-box chain exit detours via entry group",
    body.includes('"detour": "⛓ 入口优选"'));
  check("rule URLs use the request origin",
    body.includes(BASE + "/rules/"));
}

// (b) the same code as clash/mihomo
{
  const g = await call("/m/" + code);
  const body = await g.text();
  check("/m/<code> returns 200", g.status === 200, `got ${g.status}`);
  check("clash chain contains dialer-proxy",
    body.includes("dialer-proxy"));
  check("clash content type is yaml",
    (g.headers.get("Content-Type") || "").includes("text/yaml"));
}

// (c) identical content dedupes to the same code
{
  const r = await shorten({ target: "clash", entry: ENTRY, exit: EXIT });
  const text = await r.text();
  check("same content returns the same code",
    text.split("/").pop() === code, text);
}

// (d) custom code: first come first served, conflict is a 409
{
  const r1 = await shorten({
    target: "singbox", entry: ENTRY, exit: EXIT, code: "my-chain-01",
  });
  check("custom code accepted", r1.status === 200, `got ${r1.status}`);
  const r2 = await shorten({
    target: "singbox", entry: ENTRY2, exit: EXIT, code: "my-chain-01",
  });
  check("custom code conflict returns 409",
    r2.status === 409, `got ${r2.status}`);
}

// (e, part 2) first-run bootstrap refresh needs no token; once the
// mirror exists, a wrong token is refused and the right one works
{
  const boot = await call("/admin/refresh", { method: "POST" });
  const status = await boot.json();
  check("bootstrap refresh without token returns 200",
    boot.status === 200, `got ${boot.status}`);
  const bad = await call("/admin/refresh", {
    method: "POST",
    headers: { Authorization: "Bearer wrong-token" },
  });
  check("refresh with wrong token returns 401 after bootstrap",
    bad.status === 401, `got ${bad.status}`);
  const r = await call("/admin/refresh", {
    method: "POST",
    headers: { Authorization: "Bearer test-token" },
  });
  check("refresh with token returns 200", r.status === 200,
    `got ${r.status}`);
  check("refresh ok count equals manifest size",
    status.ok === manifest.length, JSON.stringify(status).slice(0, 200));
  check("refresh failed list is empty",
    Array.isArray(status.failed) && status.failed.length === 0);
  const g = await call("/rules/clash/private.mrs");
  check("rules 200 after refresh", g.status === 200, `got ${g.status}`);
  check("binary content type",
    (g.headers.get("Content-Type") || "").includes("application/octet-stream"));
}

// (f) saved-config restore endpoint + page affordances
{
  const r = await call("/api/link/" + code);
  const j = await r.json();
  check("api/link returns the stored record",
    r.status === 200 && j.kind === "chain" && j.target === "singbox" &&
    j.entry === ENTRY && j.exit === EXIT,
    `got ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const miss = await call("/api/link/no-such-code");
  check("api/link unknown code returns 404",
    miss.status === 404, `got ${miss.status}`);
  const page = await (await call("/")).text();
  check("page wires restore + one-click import",
    page.includes("/api/link/") && page.includes("install-config") &&
    page.includes("import-remote-profile"));
}

// (g) advanced tier: D1 links + R2 rule mirror when bound
{
  const env2 = {
    KV: new KVStub(),
    DB: new D1Stub(),
    RULES: new R2Stub(),
    REFRESH_TOKEN: ["test", "token"].join("-"),
    EXTERNAL_SUBCONVERTER_URL: "",
  };
  const pending = [];
  const ctx2 = { waitUntil(p) { pending.push(p); } };
  const call2 = (path, opts = {}) =>
    worker.fetch(new Request(BASE + path, opts), env2, ctx2);
  const shorten2 = (body) => call2("/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const r = await shorten2({ target: "singbox", entry: ENTRY, exit: EXIT });
  const text = await r.text();
  const code2 = text.split("/").pop();
  check("D1: shorten returns 200 + 10-char code",
    r.status === 200 && code2.length === 10, text);
  check("D1: record stored in D1, not KV",
    env2.DB.links.has(code2) && !(await env2.KV.get("link:" + code2)));
  const g = await call2("/s/" + code2);
  const gbody = await g.text();
  check("D1: /s/<code> serves the chain config",
    g.status === 200 && gbody.includes('"detour"'), `got ${g.status}`);
  await Promise.all(pending.splice(0));
  const api = await (await call2("/api/link/" + code2)).json();
  check("D1: api/link reports the counted hit",
    api.hits >= 1, JSON.stringify(api).slice(0, 200));
  const dup = await shorten2({ target: "clash", entry: ENTRY, exit: EXIT });
  check("D1: same content dedupes to the same code",
    (await dup.text()).split("/").pop() === code2);
  const c1 = await shorten2({
    target: "singbox", entry: ENTRY, exit: EXIT, code: "d1-chain-01",
  });
  check("D1: custom code accepted", c1.status === 200, `got ${c1.status}`);
  const c2 = await shorten2({
    target: "singbox", entry: ENTRY2, exit: EXIT, code: "d1-chain-01",
  });
  check("D1: custom code conflict returns 409",
    c2.status === 409, `got ${c2.status}`);

  const before = await call2("/rules/clash/private.mrs");
  check("R2: rules 404 before refresh",
    before.status === 404, `got ${before.status}`);
  const boot = await call2("/admin/refresh", { method: "POST" });
  check("R2: bootstrap refresh returns 200",
    boot.status === 200, `got ${boot.status}`);
  check("R2: mirror object landed in R2",
    env2.RULES.map.has("clash/private.mrs"));
  check("D1: refresh was logged",
    env2.DB.refreshLog.length === 1 &&
    env2.DB.refreshLog[0].ok === manifest.length);
  const served = await call2("/rules/clash/private.mrs");
  check("R2: rules serve 200 after refresh",
    served.status === 200, `got ${served.status}`);
}

console.log(failures === 0
  ? "SMOKE OK — all assertions passed"
  : `SMOKE FAILED — ${failures} assertion(s) failed`);
process.exit(failures === 0 ? 0 : 1);

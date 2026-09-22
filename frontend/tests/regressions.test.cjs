const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(result.outputText, filename);
};
const { serializeJsonLd } = require("../lib/json-ld.ts");
const { getPublicPage } = require("../lib/api.ts");

test("CMS content cannot terminate a JSON-LD script", () => {
  const value = { headline: '</script><script>alert("x")</script>', description: "বাংলা" };
  const encoded = serializeJsonLd(value);
  assert.equal(encoded.includes("<"), false);
  assert.deepEqual(JSON.parse(encoded), value);
});

test("malformed legacy arrays preserve real API records and bounded requests", async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (url) => {
    requests.push(new URL(url));
    return Response.json({ data: [
      { id: 123, title: "Real project", gallery: "invalid JSON", tags: "{}" },
      { id: 124, title: "Second project", gallery: '["photo.jpg",null,3]', tags: '["design",null]' },
    ], pagination: { hasMore: true } });
  };
  try {
    const projects = await getPublicPage("projects", { limit: 4 });
    const posts = await getPublicPage("blog", { limit: 4 });
    assert.equal(projects.data[0].id, 123);
    assert.deepEqual(projects.data[0].gallery, []);
    assert.deepEqual(projects.data[1].gallery, ["photo.jpg"]);
    assert.deepEqual(posts.data[0].tags, []);
    assert.deepEqual(posts.data[1].tags, ["design"]);
    assert.equal(requests.length, 2);
    assert.ok(requests.every(url => url.searchParams.get("limit") === "4"));
  } finally { global.fetch = originalFetch; }
});

test("chat widget guards unsafe links and preserves user bubble contrast", () => {
  const source = fs.readFileSync(require.resolve("../components/ChatWidget.tsx"), "utf8");
  assert.match(source, /function isSafeChatHref/);
  assert.match(source, /\^https\?:\\\/\\\//);
  assert.match(source, /tone === "user" \? "text-white"/);
  assert.match(source, /RichMessageContent content=\{m\.content\} tone=\{isUser \? "user" : "assistant"\}/);
});

test("mobile logo has bounded header width", () => {
  const css = fs.readFileSync(require.resolve("../styles/globals.css"), "utf8");
  assert.match(css, /\.brand-logo-copy\s*{\s*overflow: hidden;/);
  assert.match(css, /\.site-header \.brand-logo\s*{\s*max-width: calc\(100vw - 9\.75rem\);/);
});

test("quick project enquiries require email and do not fake success", () => {
  const source = fs.readFileSync(require.resolve("../components/ProjectCard.tsx"), "utf8");
  assert.match(source, /email: clientEmail\.trim\(\)/);
  assert.match(source, /if \(!response\.ok \|\| !data\.success\)/);
  assert.doesNotMatch(source, /catch \{\s*setSubmitted\(true\)/);
});

test("content markdown rejects unsafe URLs", () => {
  const source = fs.readFileSync(require.resolve("../components/MarkdownContent.tsx"), "utf8");
  assert.match(source, /function isSafeContentUrl/);
  assert.match(source, /if \(!isSafeContentUrl\(link\[2\]\)\) return link\[1\]/);
  assert.match(source, /referrerPolicy="no-referrer"/);
});

test("browser voices and overlay body styles are restored safely", () => {
  const chat = fs.readFileSync(require.resolve("../components/ChatWidget.tsx"), "utf8");
  const lightbox = fs.readFileSync(require.resolve("../components/ImageLightbox.tsx"), "utf8");
  assert.match(chat, /addEventListener\("voiceschanged", loadVoices\)/);
  assert.match(lightbox, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(lightbox, /document\.body\.style\.touchAction = previousTouchAction/);
});

const { invoiceTotals } = require("../app/admin/invoices/calculations.ts");
test("invoice discounts apply before tax and deposits reduce the balance", () => {
  const totals = invoiceTotals([{ quantity: 2, rate: 1250, description: "Design" }, { quantity: 1.5, rate: 100, description: "Visit" }], 10, 15, 1000);
  assert.deepEqual(totals, { lines: [2500, 150], subtotal: 2650, discount: 265, tax: 357.75, total: 2742.75, due: 1742.75, credit: 0 });
});
test("invoice rounds line prices and shows overpayments as credit", () => {
  const totals = invoiceTotals([{ quantity: 3, rate: 0.1, description: "Item" }], 0, 0, 1);
  assert.equal(totals.total, 0.3);
  assert.equal(totals.due, 0);
  assert.equal(totals.credit, 0.7);
  assert.equal(invoiceTotals([{ quantity: 1, rate: 100, description: "Item" }], 100, 15, 0).total, 0);
});

test("invoice half-cent products match backend decimal ROUND_HALF_UP", () => {
  assert.equal(invoiceTotals([{ quantity: 0.03, rate: 72.50, description: "Fraction" }], 0, 0, 0).total, 2.18);
  // Exhaustively cover two-decimal quantities/rates around half-cent boundaries.
  for (let q = 1; q <= 100; q++) for (let r = 1; r <= 1000; r++) {
    const expected = Math.floor((q * r + 50) / 100) / 100;
    assert.equal(invoiceTotals([{ quantity: q / 100, rate: r / 100, description: "Item" }], 0, 0, 0).total, expected);
  }
});

const { adminReturnPath } = require("../lib/admin-return-path.ts");
test("login only redirects to local admin pages", () => {
  assert.equal(adminReturnPath("/admin/invoices?view=recent"), "/admin/invoices?view=recent");
  for (const path of [null, "javascript:alert(1)", "https://evil.example", "//evil.example", "/\\evil.example", "/admin/../../contact", "/admin/login", "/administer", " /admin"]) {
    assert.equal(adminReturnPath(path), "/admin");
  }
});

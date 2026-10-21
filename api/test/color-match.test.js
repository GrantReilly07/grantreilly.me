const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../color-match");
const match = { objectID: 437376, red: 17, green: 13, blue: 7, distanceSquared: 507 };
const validQuery = { red: "0", green: "0", blue: "0" };

async function invoke(query, fetchImpl) {
  const originalFetch = global.fetch;
  global.fetch = fetchImpl;
  const context = { log: { error() {} } };
  try { await handler(context, { query }); return context.res; }
  finally { global.fetch = originalFetch; }
}

test("forwards valid RGB values to the fixed Java endpoint and returns a usable match", async () => {
  const response = await invoke({ red: " 017 ", green: "255", blue: "0", url: "https://example.com" }, async (url, options) => {
    assert.equal(url, "https://met-color-api-cxehftbtf8dbg4gx.westus3-01.azurewebsites.net/api/closest-color?red=17&green=255&blue=0");
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => ({ ...match, objectURL: "javascript:alert(1)" }) };
  });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { ...match, objectURL: "https://www.metmuseum.org/art/collection/search/437376" });
});

test("rejects missing, fractional, out of range, and injected inputs before making any request", async () => {
  for (const value of [undefined, "", "256", "-1", "1.5", "1e2", "12&blue=3", ["1", "2"]]) {
    const response = await invoke({ ...validQuery, green: value }, () => { throw new Error("Must not fetch"); });
    assert.equal(response.status, 400);
  }
});

test("maps upstream errors and timeouts without exposing upstream response text", async () => {
  for (const [status, expected] of [[403, 502], [429, 503], [500, 502], [503, 503]]) {
    const response = await invoke(validQuery, async () => ({ ok: false, status }));
    assert.equal(response.status, expected);
    assert.match(response.body.error, /temporarily unavailable/);
  }
  const timeout = await invoke(validQuery, async () => { throw new DOMException("timeout", "TimeoutError"); });
  assert.equal(timeout.status, 504);
  const network = await invoke(validQuery, async () => { throw new Error("network"); });
  assert.equal(network.status, 502);
});

test("rejects malformed upstream JSON and incomplete match data", async () => {
  for (const data of [null, {}, { ...match, objectID: -1 }, { ...match, red: 256 }, { ...match, distanceSquared: -1 }]) {
    const response = await invoke(validQuery, async () => ({ ok: true, json: async () => data }));
    assert.equal(response.status, 502);
  }
  const response = await invoke(validQuery, async () => ({ ok: true, json: async () => { throw new SyntaxError("not JSON"); } }));
  assert.equal(response.status, 502);
});

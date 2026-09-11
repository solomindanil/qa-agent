import assert from "node:assert/strict";
import test from "node:test";

import { runOnyxPublicUiProbe } from "../../scripts/qah/onyx-browser-probe.mjs";

function browserFixture({ badResponse = null, failedMedia = false, overflow = false } = {}) {
  const events = new Map();
  const page = {
    on(name, handler) { events.set(name, handler); },
    async setViewportSize(viewport) { this.viewport = viewport; },
    async goto() {
      if (badResponse) events.get("response")?.({ status: () => badResponse, url: () => "https://onyxcampus.com/app.js", request: () => ({ resourceType: () => "script" }) });
      if (failedMedia) events.get("requestfailed")?.({ url: () => "https://onyxcampus.com/hero.mp4", failure: () => ({ errorText: "net::ERR_ABORTED" }), resourceType: () => "media" });
      return { status: () => 200 };
    },
    async title() { return "Onyx Campus — The world's first five-star AI campus"; },
    locator(selector) {
      return {
        first() { return this; },
        async innerText() { return "The world's first five-star AI campus."; },
        async count() { return selector === "form" ? 1 : 0; },
      };
    },
    getByRole(role, options) {
      return { async count() { return role === "link" && options.name.test("Apply now") ? 9 : 0; } };
    },
    async evaluate() { return { client_width: this.viewport.width, scroll_width: overflow ? this.viewport.width + 1 : this.viewport.width, lang: "en" }; },
    async close() {},
  };
  const context = { async newPage() { return page; } };
  const browser = { contexts() { return [context]; } };
  return { chromium: { async connectOverCDP() { return browser; } } };
}

test("Onyx probe verifies the public landing page in real desktop and mobile browser contexts without submitting the form", async () => {
  const result = await runOnyxPublicUiProbe({
    targetUrl: "https://onyxcampus.com/",
    cdpUrl: "http://127.0.0.1:9222",
    chromium: browserFixture({ failedMedia: true }).chromium,
    now: () => "2026-08-12T00:00:00.000Z",
  });
  assert.equal(result.status, "passed");
  assert.equal(result.target_url, "https://onyxcampus.com/");
  assert.equal(result.pages.length, 2);
  assert.equal(result.pages[1].viewport, "mobile");
  assert.equal(result.pages[1].horizontal_overflow, false);
  assert.equal(result.form_count, 1);
  assert.equal(result.apply_cta_count, 9);
  assert.equal(result.ignored_media_aborts, 2);
  assert.equal(result.product_network_requests > 0, true);
});

test("Onyx probe fails closed for an unexpected target, a bad response, or horizontal overflow", async () => {
  await assert.rejects(() => runOnyxPublicUiProbe({
    targetUrl: "https://example.com/",
    cdpUrl: "http://127.0.0.1:9222",
    chromium: browserFixture().chromium,
  }), /target/i);
  for (const fixture of [browserFixture({ badResponse: 500 }), browserFixture({ overflow: true })]) {
    const result = await runOnyxPublicUiProbe({
      targetUrl: "https://onyxcampus.com/",
      cdpUrl: "http://127.0.0.1:9222",
      chromium: fixture.chromium,
      now: () => "2026-08-12T00:00:00.000Z",
    });
    assert.equal(result.status, "failed");
  }
});

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const TARGET_URL = "https://onyxcampus.com/";
const VIEWPORTS = Object.freeze([
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
]);

function exactTarget(value) {
  if (value !== TARGET_URL) throw new Error("Onyx browser target is not in the code-owned allowlist");
  return value;
}

function exactCdp(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("browser CDP URL is invalid"); }
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.username || url.password || url.hash) {
    throw new Error("browser CDP URL must be credential-free loopback HTTP");
  }
  return url.toString().replace(/\/$/u, "");
}

function loadChromium(modulePath) {
  if (typeof modulePath !== "string" || modulePath.length === 0) throw new Error("worker Playwright module is required");
  const loaded = require(modulePath);
  if (!loaded?.chromium?.connectOverCDP) throw new Error("worker Playwright module lacks Chromium CDP support");
  return loaded.chromium;
}

export async function runOnyxPublicUiProbe({
  targetUrl,
  cdpUrl = process.env.NUANU_QA_BROWSER_CDP_URL,
  playwrightModule = process.env.NUANU_QA_PLAYWRIGHT_MODULE,
  chromium = null,
  now = () => new Date().toISOString(),
} = {}) {
  const target = exactTarget(targetUrl);
  const browser = await (chromium ?? loadChromium(playwrightModule)).connectOverCDP(exactCdp(cdpUrl));
  const context = browser.contexts()[0];
  if (!context) throw new Error("worker browser has no persistent context");

  const pages = [];
  const failureCodes = new Set();
  let ignoredMediaAborts = 0;
  let productNetworkRequests = 0;
  let formCount = null;
  let applyCtaCount = null;

  for (const viewport of VIEWPORTS) {
    const page = await context.newPage();
    const badResponses = [];
    const failedRequests = [];
    const consoleErrors = [];
    page.on("request", () => { productNetworkRequests += 1; });
    page.on("response", (response) => {
      if (response.status() >= 400) badResponses.push({ status: response.status(), url: response.url(), type: response.request().resourceType() });
    });
    page.on("requestfailed", (request) => {
      const failure = { url: request.url(), reason: request.failure()?.errorText ?? "unknown", type: request.resourceType() };
      if (failure.type === "media" && failure.reason === "net::ERR_ABORTED") ignoredMediaAborts += 1;
      else failedRequests.push(failure);
    });
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
      productNetworkRequests = Math.max(productNetworkRequests, pages.length + 1);
      const title = await page.title();
      const h1 = await page.locator("h1").first().innerText();
      const currentApplyCount = await page.getByRole("link", { name: /Apply now/i }).count();
      const currentFormCount = await page.locator("form").count();
      const dimensions = await page.evaluate(() => ({
        client_width: document.documentElement.clientWidth,
        scroll_width: document.documentElement.scrollWidth,
        lang: document.documentElement.lang,
      }));
      if (formCount === null) formCount = currentFormCount;
      if (applyCtaCount === null) applyCtaCount = currentApplyCount;
      if (response?.status() !== 200) failureCodes.add(`HTTP_${response?.status() ?? "NO_RESPONSE"}`);
      if (!title.includes("Onyx Campus")) failureCodes.add("TITLE_MISMATCH");
      if (h1.trim() !== "The world's first five-star AI campus.") failureCodes.add("H1_MISMATCH");
      if (currentApplyCount < 1) failureCodes.add("APPLY_CTA_MISSING");
      if (currentFormCount !== 1) failureCodes.add("APPLICATION_FORM_MISMATCH");
      if (dimensions.lang !== "en") failureCodes.add("LANG_MISMATCH");
      if (dimensions.scroll_width > dimensions.client_width) failureCodes.add(`HORIZONTAL_OVERFLOW_${viewport.name.toUpperCase()}`);
      if (badResponses.length > 0) failureCodes.add("FAILED_HTTP_RESOURCE");
      if (failedRequests.length > 0) failureCodes.add("FAILED_NETWORK_RESOURCE");
      if (consoleErrors.length > 0) failureCodes.add("CONSOLE_ERROR");
      pages.push({
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        status: response?.status() ?? null,
        title,
        h1: h1.trim(),
        horizontal_overflow: dimensions.scroll_width > dimensions.client_width,
        failed_http_resources: badResponses.length,
        failed_network_resources: failedRequests.length,
        console_errors: consoleErrors.length,
      });
    } finally {
      await page.close();
    }
  }

  return {
    schema_version: "nuanu.qah-onyx-browser-probe.v1",
    status: failureCodes.size === 0 ? "passed" : "failed",
    target_url: target,
    checked_at: now(),
    pages,
    form_count: formCount,
    apply_cta_count: applyCtaCount,
    ignored_media_aborts: ignoredMediaAborts,
    product_network_requests: productNetworkRequests,
    failure_codes: [...failureCodes].sort(),
  };
}

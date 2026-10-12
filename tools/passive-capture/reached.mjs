// Reached-route ledger: records which routes the agent's own Playwright page reached, so detect.mjs can list the ones that
// were never captured as an unassessed remainder. It only listens; it never clicks, types or navigates.
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const LEDGER = 'reached.jsonl';
const ROUTE_SCHEMES = new Set(['http:', 'https:', 'file:']);

// A route is the scheme, host, path and fragment route. Query values, credentials and fragment parameters (from the first
// ?, & or = in the fragment on) are never kept. Other schemes (about:, data:, blob:, browser error pages) are not routes.
export function routeOf(raw) {
  if (typeof raw !== 'string') return null;
  let url; try { url = new URL(raw); } catch { return null; }
  return ROUTE_SCHEMES.has(url.protocol) ? `${url.protocol}//${url.host}${url.pathname}${url.hash.split(/[?&=]/)[0]}` : null;
}

// Appends {url, at} to passive/reached.jsonl for the route shown now and for every later main-frame navigation. Playwright reports
// full loads, history.pushState and fragment changes as framenavigated (checked in Chromium by browser-control.mjs). Await stop()
// before running detect: it flushes the ledger and rethrows the first failed write.
export async function trackReached(page, { dir } = {}) {
  if (!page || typeof page.on !== 'function' || typeof page.mainFrame !== 'function') throw new TypeError('trackReached needs a Playwright page');
  if (typeof dir !== 'string' || !dir) throw new TypeError('trackReached needs an output dir');
  const out = join(dir, 'passive'); await mkdir(out, { recursive: true });
  let writes = Promise.resolve(); let failure = null;
  const record = (raw) => {
    const url = routeOf(raw); if (!url) return;
    const line = `${JSON.stringify({ url, at: new Date().toISOString() })}\n`;
    writes = writes.then(() => appendFile(join(out, LEDGER), line)).catch((error) => { failure ??= error; });
  };
  const onNavigated = (frame) => { if (frame === page.mainFrame()) record(frame.url()); };
  page.on('framenavigated', onNavigated);
  record(page.url());
  return { stop: async () => { page.off('framenavigated', onNavigated); await writes; if (failure) throw failure; } };
}

// The ledger entries, or null when no ledger was recorded (unknown, which is not the same as nothing reached).
export async function loadReached(dir) {
  const text = await readFile(join(dir, 'passive', LEDGER), 'utf8').catch((error) => (error.code === 'ENOENT' ? null : Promise.reject(error)));
  return text === null ? null : text.split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

// Reached routes without a captured state: remainder, not a defect. Captured state URLs are compared as routes too.
export function reachedRemainder(ledger, states) {
  if (!ledger) return { ledger: 'absent' };
  const routes = [...new Set(ledger.map((e) => routeOf(e?.url)).filter(Boolean))].sort();
  const captured = new Set(states.map((s) => routeOf(s.url)));
  const uncaptured = routes.filter((r) => !captured.has(r));
  return { ledger: 'recorded', routes: routes.length, captured: routes.length - uncaptured.length, uncaptured };
}

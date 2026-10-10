#!/usr/bin/env node
// Local browser control: capture the static fixtures with a real Playwright page and check that in-page facts and the
// offline detectors produce exactly the expected candidates. Not a product check; it never leaves file:// URLs.
//   node tools/passive-capture/browser-control.mjs --playwright-from <dir with node_modules/playwright> --out <dir> [--axe <axe.min.js>]
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { captureState } from './capture.mjs';
import { loadStates, runDetectors } from './detect.mjs';

const EXPECTED = ['a11y-name@cards', 'contrast@cards', 'style@cards', 'a11y-name@form4', 'geometry@form4', 'padding@form4'].sort();
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => (i % 2 ? acc : [...acc, [v.replace(/^--/, ''), all[i + 1]]]), []));
if (!args['playwright-from'] || !args.out) { console.error('usage: browser-control.mjs --playwright-from DIR --out DIR [--axe FILE]'); process.exit(2); }
const { chromium } = createRequire(join(args['playwright-from'], 'package.json'))('playwright');
await mkdir(args.out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/*', (route) => (route.request().url().startsWith('file:') ? route.continue() : route.abort()));
  const timings = [];
  for (const label of ['cards', 'modal', 'form1', 'form2', 'form3', 'form4']) {
    await page.goto(pathToFileURL(join(import.meta.dirname, 'fixtures', `${label}.html`)).href);
    timings.push(await captureState(page, { dir: args.out, label, axeSource: args.axe ?? null }));
  }
  const list = runDetectors(await loadStates(args.out));
  const got = list.flatMap((c) => c.states.map((s) => `${c.detector}@${s}`)).sort();
  console.log(JSON.stringify({ axe: args.axe ? 'requested' : 'not requested', captures: timings.map((t) => ({ label: t.label, ms: t.ms, axe: t.axe })), candidates: list.map((c) => `${c.id} ${c.detector} ${c.states.join(',')}: ${c.what}`) }, null, 1));
  assert.deepEqual(got, EXPECTED);
  console.log('BROWSER CONTROL PASS');
} finally { await browser.close(); }

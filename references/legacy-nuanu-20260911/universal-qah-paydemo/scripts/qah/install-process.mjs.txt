#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { canonicalJson } from "./canonical.mjs";
import { runDirectInstallPreflight } from "./install-preflight.mjs";
import { renderProcessForInstall } from "./render-process.mjs";

function argumentsMap(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!["--request", "--blueprint"].includes(argv[index]) || !argv[index + 1] || !isAbsolute(argv[index + 1])) throw new Error("usage: install-process.mjs --request /abs/request.json --blueprint /abs/blueprint.json");
    result[argv[index].slice(2)] = argv[index + 1];
  }
  if (Object.keys(result).length !== 2) throw new Error("request and blueprint are required");
  return result;
}

async function boundedJson(path, label) {
  const bytes = await readFile(path);
  if (bytes.byteLength < 2 || bytes.byteLength > 262144) throw new Error(`${label} is outside byte bounds`);
  return JSON.parse(bytes.toString("utf8"));
}

export async function main(argv = process.argv.slice(2)) {
  const paths = argumentsMap(argv);
  const [request, blueprint] = await Promise.all([boundedJson(paths.request, "request"), boundedJson(paths.blueprint, "blueprint")]);
  const attestation = await runDirectInstallPreflight(request);
  process.stdout.write(canonicalJson(renderProcessForInstall(blueprint, attestation)));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });

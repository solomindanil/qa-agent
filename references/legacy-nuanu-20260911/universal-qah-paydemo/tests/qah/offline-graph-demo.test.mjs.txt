import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";

import { canonicalJson } from "../../scripts/qah/canonical.mjs";
import { runOfflineGraphDemo } from "../../scripts/qah/offline-graph-demo.mjs";

const execFile = promisify(execFileCallback);

function assertReport(report) {
  assert.deepEqual(report.scenarios.map(({ route }) => route), [
    "READY_FOR_PRODUCTION",
    "HUMAN_REVIEW",
    "RETURN_TO_WORK",
  ]);
  assert.deepEqual(report.summary, {
    scenarios: 3,
    product_repository_reads: 0,
    git_commands: 0,
    product_network_requests: 0,
    credential_reads: 0,
  });
  assert.doesNotMatch(canonicalJson(report), /token|password|Authorization:|github\.com\/.*Freeland/i);
  for (const scenario of report.scenarios) {
    assert.equal(scenario.trigger, "column:ready_for_qa");
    assert.equal(scenario.execution_attempts, 1);
    assert.match(scenario.graph_plan_digest, /^sha256:[a-f0-9]{64}$/);
    assert.match(scenario.receipt_digest, /^sha256:[a-f0-9]{64}$/);
  }
}

test("offline demo emits canonical sanitized routes", async () => {
  const report = await runOfflineGraphDemo();
  assertReport(report);
});

test("offline demo CLI writes exactly one canonical JSON document", async () => {
  const { stdout, stderr } = await execFile(process.execPath, ["scripts/qah/offline-graph-demo.mjs"], {
    cwd: new URL("../..", import.meta.url),
    encoding: "utf8",
    env: { PATH: process.env.PATH, HOME: process.env.HOME, NUANU_FLOW_WORKER_ROOT: process.env.NUANU_FLOW_WORKER_ROOT },
    maxBuffer: 1024 * 1024,
  });
  assert.equal(stderr, "");
  assert.equal(stdout.endsWith("\n"), false);
  const report = JSON.parse(stdout);
  assert.equal(stdout, canonicalJson(report));
  assertReport(report);
});

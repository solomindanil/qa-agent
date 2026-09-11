import { execFile as execFileCallback } from "node:child_process";
import { realpath } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import YAML, { isAlias, isMap, isSeq } from "yaml";
import { validateProfile } from "./contracts.mjs";

const execFile = promisify(execFileCallback);

function assertSafeYaml(node) {
  if (!node) return;
  if (isAlias(node) || node.anchor) throw new Error("YAML aliases and anchors are not allowed");
  if (node.tag && !node.tag.startsWith("tag:yaml.org,2002:")) throw new Error("YAML custom tags are not allowed");
  if (isMap(node)) for (const pair of node.items) {
    assertSafeYaml(pair.key);
    assertSafeYaml(pair.value);
  } else if (isSeq(node)) for (const item of node.items) assertSafeYaml(item);
}

export function parseProfileBytes(source) {
  const text = Buffer.isBuffer(source) || source instanceof Uint8Array
    ? new TextDecoder("utf-8", { fatal: true }).decode(source)
    : source;
  if (typeof text !== "string") throw new Error("profile source must be UTF-8 bytes or text");
  const documents = YAML.parseAllDocuments(text, { schema: "core", uniqueKeys: true, prettyErrors: false, merge: false });
  if (documents.length !== 1) throw new Error("YAML profile must contain exactly one document");
  const [document] = documents;
  if (document.errors.length > 0 || document.warnings.length > 0) throw new Error(`YAML profile is invalid: ${(document.errors[0] ?? document.warnings[0]).message}`);
  assertSafeYaml(document.contents);
  return validateProfile(document.toJS({ maxAliasCount: 0 }));
}

export async function loadProfile(path, expectedCommit) {
  if (typeof expectedCommit !== "string" || !/^[a-f0-9]{40}$/.test(expectedCommit)) throw new Error("expectedCommit must be a lowercase 40-character Git SHA");
  const requestedPath = await realpath(resolve(path));
  let repositoryRoot;
  try {
    ({ stdout: repositoryRoot } = await execFile("git", ["-C", dirname(requestedPath), "rev-parse", "--show-toplevel"]));
  } catch {
    throw new Error("profile path must belong to a Git repository");
  }
  repositoryRoot = await realpath(resolve(repositoryRoot.trim()));
  const profilePath = relative(repositoryRoot, requestedPath);
  if (!profilePath || profilePath === ".." || profilePath.startsWith(`..${sep}`)) throw new Error("profile path must be contained by its Git repository");
  const objectName = `${expectedCommit}:${profilePath.split(sep).join("/")}`;
  let source;
  try {
    await execFile("git", ["-C", repositoryRoot, "rev-parse", "--verify", "--quiet", `${expectedCommit}^{commit}`]);
    ({ stdout: source } = await execFile("git", ["-C", repositoryRoot, "show", "--no-ext-diff", "--format=", objectName], { maxBuffer: 1048576 }));
  } catch {
    throw new Error("profile must exist in the requested Git commit");
  }
  return parseProfileBytes(source);
}

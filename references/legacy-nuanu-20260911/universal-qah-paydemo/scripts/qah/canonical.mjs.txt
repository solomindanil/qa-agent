import { createHash } from "node:crypto";

function canonicalize(value, stack = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON only supports finite numbers");
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => canonicalize(item, stack));
  if (typeof value !== "object") throw new TypeError("canonical JSON only supports JSON values");
  if (stack.has(value)) throw new TypeError("canonical JSON does not support circular values");
  stack.add(value);
  const result = Object.create(null);
  for (const key of Object.keys(value).sort()) result[key] = canonicalize(value[key], stack);
  stack.delete(value);
  return result;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  const content = typeof value === "string" ? value : canonicalJson(value);
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

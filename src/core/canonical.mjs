import crypto from "node:crypto";

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, normalize(value[key])]),
  );
}

export function canonicalStringify(value) {
  return JSON.stringify(normalize(value));
}

export function sha256Hex(value) {
  const input = Buffer.isBuffer(value) || value instanceof Uint8Array
    ? value
    : Buffer.from(typeof value === "string" ? value : canonicalStringify(value), "utf8");
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function stableId(prefix, domain, parts) {
  return `${prefix}_${sha256Hex([domain, ...parts])}`;
}

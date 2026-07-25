export const RECEIPT_TYPE_VALUES = Object.freeze(["work", "emotion", "both"]);
export const DEFAULT_RECEIPT_TYPE = "both";

const VALID_RECEIPT_TYPES = new Set(RECEIPT_TYPE_VALUES);

export function normalizeReceiptType(value, fallback = DEFAULT_RECEIPT_TYPE) {
  if (Array.isArray(value)) {
    const selected = new Set(value.filter((item) => item === "work" || item === "emotion"));
    if (selected.has("work") && selected.has("emotion")) return "both";
    if (selected.has("emotion")) return "emotion";
    if (selected.has("work")) return "work";
    return fallback;
  }
  return VALID_RECEIPT_TYPES.has(value) ? value : fallback;
}

export function receiptTypesFor(value) {
  const type = normalizeReceiptType(value);
  if (type === "work") return ["work"];
  if (type === "emotion") return ["emotion"];
  return ["work", "emotion"];
}

export function receiptTypeFromPreferences(preferences, fallback = DEFAULT_RECEIPT_TYPE) {
  if (!preferences || typeof preferences !== "object") return fallback;
  if (Array.isArray(preferences.receipt_types)) {
    return normalizeReceiptType(preferences.receipt_types, fallback);
  }
  return normalizeReceiptType(preferences.receipt_type, fallback);
}

export function receiptTypeLabel(value, locale = "zh-CN") {
  const type = normalizeReceiptType(value);
  if (locale === "en") {
    return type === "work" ? "Work receipt only" : type === "emotion" ? "Mood receipt only" : "Both receipts";
  }
  return type === "work" ? "只输出打工小票" : type === "emotion" ? "只输出情绪小票" : "两种都输出";
}

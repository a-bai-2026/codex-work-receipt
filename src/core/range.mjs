import { dateKey } from "../lib/time.mjs";

export const RECEIPT_SCOPES = new Set([
  "latest",
  "session",
  "today",
  "last-7-days",
  "this-week",
]);

const SCOPE_ALIASES = new Map([
  ["latest", "latest"],
  ["session", "session"],
  ["today", "today"],
  ["7d", "last-7-days"],
  ["last-7-days", "last-7-days"],
  ["last7days", "last-7-days"],
  ["week", "this-week"],
  ["this-week", "this-week"],
]);

export function normalizeScope(value) {
  return SCOPE_ALIASES.get(String(value || "").trim().toLowerCase()) || null;
}

export function shiftDateKey(value, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) throw new Error(`无效日期：${value}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function mondayDateKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  return shiftDateKey(value, -daysSinceMonday);
}

export function resolveRange(scope, timezone, now = new Date(), sessionId = null) {
  const normalizedScope = normalizeScope(scope);
  if (!normalizedScope || !RECEIPT_SCOPES.has(normalizedScope)) {
    throw new Error(`不支持的统计范围：${scope}`);
  }

  const targetDate = dateKey(now, timezone);
  let startDate = null;
  let endDate = null;

  if (normalizedScope === "today") {
    startDate = targetDate;
    endDate = targetDate;
  } else if (normalizedScope === "last-7-days") {
    startDate = shiftDateKey(targetDate, -6);
    endDate = targetDate;
  } else if (normalizedScope === "this-week") {
    startDate = mondayDateKey(targetDate);
    endDate = targetDate;
  }

  return {
    scope: normalizedScope,
    timezone,
    targetDate,
    startDate,
    endDate,
    sessionId: sessionId || null,
  };
}

export function isCalendarScope(scope) {
  return scope === "today" || scope === "last-7-days" || scope === "this-week";
}

export function isDateInRange(date, range) {
  if (!date) return false;
  if (!isCalendarScope(range.scope)) return true;
  const key = dateKey(date, range.timezone);
  return key >= range.startDate && key <= range.endDate;
}

export function calendarDayCount(range) {
  if (!range.startDate || !range.endDate) return 1;
  let count = 1;
  let current = range.startDate;
  while (current < range.endDate) {
    current = shiftDateKey(current, 1);
    count += 1;
  }
  return count;
}

function safeSlugSegment(value, fallback = "receipt") {
  const normalized = String(value || "")
    .trim()
    .replace(/^cwr_/, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return normalized || fallback;
}

export function outputSlugForRange(range, receiptId = "") {
  const scope = normalizeScope(range?.scope) || "latest";
  const startDate = range?.startDate || range?.targetDate || "";
  const endDate = range?.endDate || range?.targetDate || startDate;

  if (scope === "today") return `today-${safeSlugSegment(endDate, "today")}`;
  if (scope === "last-7-days" || scope === "this-week") {
    const dateSpan = startDate === endDate ? endDate : `${startDate}-to-${endDate}`;
    return `${scope}-${safeSlugSegment(dateSpan, scope)}`;
  }
  if (scope === "session") {
    return `session-${safeSlugSegment(range?.sessionId || receiptId, "selected")}`;
  }
  return `latest-${safeSlugSegment(receiptId || endDate, "receipt")}`;
}

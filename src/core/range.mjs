import { dateKey } from "../lib/time.mjs";

export const RECEIPT_SCOPES = new Set([
  "latest",
  "session",
  "last-hours",
  "custom-range",
  "today",
  "last-7-days",
  "this-week",
]);

const SCOPE_ALIASES = new Map([
  ["latest", "latest"],
  ["session", "session"],
  ["hours", "last-hours"],
  ["last-hours", "last-hours"],
  ["custom", "custom-range"],
  ["custom-range", "custom-range"],
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

function floorToMinute(value) {
  const date = new Date(value);
  date.setUTCSeconds(0, 0);
  return date;
}

function parseDateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function parseDateTimeParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function validCalendarParts(parts, includeTime = false) {
  if (!parts) return false;
  const probe = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    probe.getUTCFullYear() !== parts.year ||
    probe.getUTCMonth() + 1 !== parts.month ||
    probe.getUTCDate() !== parts.day
  ) return false;
  if (!includeTime) return true;
  return parts.hour >= 0 && parts.hour <= 23 && parts.minute >= 0 && parts.minute <= 59;
}

function zonedParts(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
}

function zonedDateTime(parts, timezone) {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour || 0, parts.minute || 0, 0, 0);
  let result = new Date(target);
  for (let index = 0; index < 3; index += 1) {
    const displayed = zonedParts(result, timezone);
    const displayedUtc = Date.UTC(
      displayed.year,
      displayed.month - 1,
      displayed.day,
      displayed.hour,
      displayed.minute,
      displayed.second,
    );
    result = new Date(result.getTime() + target - displayedUtc);
  }
  const displayed = zonedParts(result, timezone);
  if (
    displayed.year !== parts.year ||
    displayed.month !== parts.month ||
    displayed.day !== parts.day ||
    displayed.hour !== (parts.hour || 0) ||
    displayed.minute !== (parts.minute || 0)
  ) throw new Error("自定义时间在所选时区中不存在，请检查夏令时切换或输入格式");
  return result;
}

export function parseCustomRange(from, to, timezone) {
  const fromDate = parseDateParts(from);
  const toDate = parseDateParts(to);
  const fromDateTime = parseDateTimeParts(from);
  const toDateTime = parseDateTimeParts(to);

  if (fromDate && toDate) {
    if (!validCalendarParts(fromDate) || !validCalendarParts(toDate)) throw new Error("自定义日期无效");
    const startDate = String(from).trim();
    const endDate = String(to).trim();
    if (startDate > endDate) throw new Error("自定义区间的开始日期不能晚于结束日期");
    const nextDate = shiftDateKey(endDate, 1);
    return {
      boundaryKind: "calendar-days",
      startDate,
      endDate,
      startAt: zonedDateTime({ ...fromDate, hour: 0, minute: 0 }, timezone),
      endAt: zonedDateTime({ ...parseDateParts(nextDate), hour: 0, minute: 0 }, timezone),
    };
  }

  if (fromDateTime && toDateTime) {
    if (!validCalendarParts(fromDateTime, true) || !validCalendarParts(toDateTime, true)) {
      throw new Error("自定义时间无效");
    }
    const startAt = zonedDateTime(fromDateTime, timezone);
    const endAt = zonedDateTime(toDateTime, timezone);
    if (startAt >= endAt) throw new Error("自定义区间的开始时间必须早于结束时间");
    return {
      boundaryKind: "exact-time",
      startDate: dateKey(startAt, timezone),
      endDate: dateKey(endAt, timezone),
      startAt,
      endAt,
    };
  }

  throw new Error("自定义区间请统一使用 YYYY-MM-DD，或 YYYY-MM-DDTHH:mm 格式");
}

export function resolveRange(
  scope,
  timezone,
  now = new Date(),
  sessionId = null,
  hours = null,
  customRange = null,
  projectId = null,
) {
  const normalizedScope = normalizeScope(scope);
  if (!normalizedScope || !RECEIPT_SCOPES.has(normalizedScope)) {
    throw new Error(`不支持的统计范围：${scope}`);
  }

  const targetDate = dateKey(now, timezone);
  let startDate = null;
  let endDate = null;
  let startAt = null;
  let endAt = null;
  let windowHours = null;
  let boundaryKind = null;

  if (normalizedScope === "last-hours") {
    windowHours = Number(hours ?? 3);
    if (!Number.isInteger(windowHours) || windowHours < 1 || windowHours > 168) {
      throw new Error("最近小时数必须是 1 至 168 之间的整数");
    }
    endAt = floorToMinute(now);
    startAt = new Date(endAt.getTime() - windowHours * 60 * 60 * 1000);
    startDate = dateKey(startAt, timezone);
    endDate = dateKey(endAt, timezone);
    boundaryKind = "exact-time";
  } else if (normalizedScope === "custom-range") {
    if (!customRange?.from || !customRange?.to) throw new Error("自定义区间需要开始和结束时间");
    const parsed = parseCustomRange(customRange.from, customRange.to, timezone);
    startDate = parsed.startDate;
    endDate = parsed.endDate;
    startAt = parsed.startAt;
    endAt = parsed.endAt;
    boundaryKind = parsed.boundaryKind;
  } else if (normalizedScope === "today") {
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
    startAt,
    endAt,
    hours: windowHours,
    sessionId: sessionId || null,
    boundaryKind,
    projectId: projectId || null,
  };
}

export function isCalendarRange(range) {
  return range?.scope === "today" || range?.scope === "last-7-days" || range?.scope === "this-week"
    || (range?.scope === "custom-range" && range?.boundaryKind === "calendar-days");
}

export function isTimeWindowRange(range) {
  return range?.scope === "last-hours"
    || (range?.scope === "custom-range" && range?.boundaryKind === "exact-time");
}

export function isDateInRange(date, range) {
  if (!date) return false;
  if (isTimeWindowRange(range)) {
    return date >= range.startAt && (range.scope === "custom-range" ? date < range.endAt : date <= range.endAt);
  }
  if (!isCalendarRange(range)) return true;
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
  if (scope === "last-hours") {
    const endAt = range?.endAt instanceof Date ? range.endAt : new Date(range?.endAt || 0);
    const endStamp = Number.isNaN(endAt.getTime())
      ? safeSlugSegment(endDate, "window")
      : endAt.toISOString().replace(/[-:]/g, "").slice(0, 13);
    return `last-${Number(range?.hours || 3)}-hours-${safeSlugSegment(endStamp, "window")}`;
  }
  if (scope === "custom-range") {
    if (range?.boundaryKind === "calendar-days") {
      const dateSpan = startDate === endDate ? endDate : `${startDate}-to-${endDate}`;
      return `custom-${safeSlugSegment(dateSpan, "range")}`;
    }
    const startAt = range?.startAt instanceof Date ? range.startAt : new Date(range?.startAt || 0);
    const endAt = range?.endAt instanceof Date ? range.endAt : new Date(range?.endAt || 0);
    const stamp = (value) => Number.isNaN(value.getTime())
      ? "time"
      : value.toISOString().replace(/[-:]/g, "").slice(0, 13);
    return `custom-${safeSlugSegment(`${stamp(startAt)}-to-${stamp(endAt)}`, "range")}`;
  }
  if (scope === "last-7-days" || scope === "this-week") {
    const dateSpan = startDate === endDate ? endDate : `${startDate}-to-${endDate}`;
    return `${scope}-${safeSlugSegment(dateSpan, scope)}`;
  }
  if (scope === "session") {
    return `session-${safeSlugSegment(range?.sessionId || receiptId, "selected")}`;
  }
  return `latest-${safeSlugSegment(receiptId || endDate, "receipt")}`;
}

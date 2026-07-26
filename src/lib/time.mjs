export function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function rowDate(row) {
  return toDate(
    row.timestamp ||
      row.payload?.completed_at ||
      row.payload?.started_at ||
      row.payload?.timestamp,
  );
}

export function dateKey(date, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDate(date, timezone, locale = "zh-CN") {
  const selectedLocale = normalizeLocale(locale);
  const dateLocale = selectedLocale === "en" ? "en-CA" : intlLocale(selectedLocale);
  const formatted = new Intl.DateTimeFormat(dateLocale, {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return selectedLocale === "zh-CN" ? formatted.replaceAll("/", ".") : formatted;
}

export function formatTime(date, timezone, locale = "zh-CN") {
  const selectedLocale = normalizeLocale(locale);
  return new Intl.DateTimeFormat(selectedLocale === "en" ? "en-GB" : intlLocale(selectedLocale), {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function formatNumber(value, locale = "zh-CN") {
  return new Intl.NumberFormat(intlLocale(locale)).format(Math.max(0, Math.round(value || 0)));
}
import { intlLocale, normalizeLocale } from "./locale.mjs";

import fs from "node:fs";
import { createRequire } from "node:module";

import { formatDate, formatDuration, formatNumber, formatTime } from "../lib/time.mjs";
import { buildCompensation, DEFAULT_LOCALE, getReceiptCopy } from "../core/presentation.mjs";

const require = createRequire(import.meta.url);
const DOM_TO_IMAGE_SOURCE = fs.readFileSync(require.resolve("dom-to-image-more"), "utf8");

function inlineScript(value) {
  return String(value).replaceAll("</script", "<\\/script");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function receiptRow(label, value, emphasize = false) {
  return `<div class="receipt-row${emphasize ? " receipt-row--emphasize" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function formatCount(value, units, locale) {
  const amount = Math.max(0, Math.round(value || 0));
  const unit = units[amount === 1 ? 0 : 1];
  return `${formatNumber(amount, locale)} ${unit}`;
}

function formatDateKey(value, locale) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return String(value || "");
  return locale === "en" ? `${match[2]}/${match[3]}/${match[1]}` : `${match[1]}/${match[2]}/${match[3]}`;
}

export function renderHtml({ record, dataQrDataUrl = null, dataQrDataUrls = null, miniProgramCodeDataUrl = null }) {
  const locale = record.locale || DEFAULT_LOCALE;
  const copy = getReceiptCopy(locale);
  const startAt = new Date(record.period.start_at);
  const endAt = new Date(record.period.end_at);
  const timezone = record.period.timezone;
  const displayDate = formatDate(endAt, timezone, locale);
  const rangeStartDate = record.period.range_start_date || formatDateKey(record.period.start_at.slice(0, 10), "zh-CN").replaceAll("/", "-");
  const rangeEndDate = record.period.range_end_date || formatDateKey(record.period.end_at.slice(0, 10), "zh-CN").replaceAll("/", "-");
  const isCalendarScope = new Set(["today", "last-7-days", "this-week"]).has(record.source.scope);
  const spansMultipleDates = rangeStartDate !== rangeEndDate;
  const scopeLabel = copy.scope[record.source.scope] || copy.scope.latest;
  const dateRange = spansMultipleDates
    ? `${formatDateKey(rangeStartDate, locale)}—${formatDateKey(rangeEndDate, locale)}`
    : formatDateKey(rangeEndDate, locale);
  const businessPeriod = isCalendarScope
    ? `${dateRange} · ${scopeLabel}`
    : `${formatTime(startAt, timezone, locale)}—${formatTime(endAt, timezone, locale)}`;
  const businessPeriodLabel = isCalendarScope ? copy.meta.period : copy.meta.hours;
  const modelLabel = record.stats.models.length ? record.stats.models.join(" / ") : copy.modelMissing;
  const receiptNumber = `${record.id.slice(4, 12).toUpperCase()}-${String(record.stats.completed_turns).padStart(3, "0")}`;
  const compensation = record.presentation.compensation || buildCompensation(record.source.scope, 0, locale);
  const responseSeconds = new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(record.stats.average_first_token_ms / 1000);
  const exportConfig = JSON.stringify({
    idleLabel: copy.exportImage,
    busyLabel: copy.exportingImage,
    successLabel: copy.exportSuccess,
    errorLabel: copy.exportError,
    fileBase: `codex-work-receipt-${record.source.scope}-${spansMultipleDates ? `${rangeStartDate}-to-${rangeEndDate}` : `${rangeEndDate}-${record.id.slice(4, 12)}`}`,
  }).replaceAll("<", "\\u003c");
  const rows = [
    receiptRow(copy.rows.scope, scopeLabel),
    receiptRow(copy.rows.sessions, formatCount(record.stats.session_count, copy.units.sessions, locale)),
    receiptRow(copy.rows.turns, formatCount(record.stats.completed_turns, copy.units.turns, locale)),
    receiptRow(copy.rows.messages, formatCount(record.stats.user_messages, copy.units.messages, locale)),
    receiptRow(copy.rows.tools, formatCount(record.stats.tool_calls, copy.units.tools, locale)),
    receiptRow(copy.rows.tokens, formatNumber(record.stats.tokens.total_tokens, locale), true),
    receiptRow(copy.rows.cachedTokens, formatNumber(record.stats.tokens.cached_input_tokens, locale)),
    receiptRow(copy.rows.interruptions, formatCount(record.stats.interruptions, copy.units.interruptions, locale)),
    receiptRow(copy.rows.firstResponse, `${responseSeconds} ${copy.units.seconds[1]}`),
    receiptRow(copy.rows.duration, formatDuration(record.stats.work_duration_ms), true),
  ].join("");

  const miniProgramVisual = miniProgramCodeDataUrl
    ? `<img src="${miniProgramCodeDataUrl}" alt="${escapeHtml(copy.miniProgramAlt)}">`
    : `<div class="mini-placeholder" role="img" aria-label="${escapeHtml(copy.placeholderAria)}"><span>${escapeHtml(copy.placeholderLabel)}</span><strong>${escapeHtml(copy.placeholderValue)}</strong></div>`;
  const qrUrls = Array.isArray(dataQrDataUrls) && dataQrDataUrls.length
    ? dataQrDataUrls
    : dataQrDataUrl
      ? [dataQrDataUrl]
      : [];
  const dataQrItems = qrUrls.map((url, index) => `
        <div class="qr-item">
          <div class="qr-frame"><img src="${url}" alt="${escapeHtml(copy.dataQrAlt)} ${index + 1}/${qrUrls.length}"></div>
          <strong>${escapeHtml(copy.importData)}${qrUrls.length > 1 ? ` ${index + 1}/${qrUrls.length}` : ""}</strong>
          <span>${escapeHtml(copy.importDataHint)}</span>
        </div>`).join("");

  return `<!doctype html>
<html lang="${escapeHtml(copy.htmlLang)}" data-theme="${escapeHtml(record.presentation.default_theme)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(copy.pageTitle)} · ${escapeHtml(displayDate)}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #171713;
      --paper: #ffffff;
      --desk: #eeeae3;
      --desk-soft: #f6f3ee;
      --muted: #6d6c65;
      --line: #aaa8a0;
      --accent: #f3f2ed;
      --shadow: rgba(31, 30, 24, .18);
      --mark-bg: #ffffff;
      --mark-fg: #171713;
    }
    html[data-theme="diner"] {
      --ink: #a7475d;
      --paper: #f7dde3;
      --desk: #f2ece8;
      --desk-soft: #faf6f3;
      --muted: #b46b7b;
      --line: #d29aa7;
      --accent: #f0cdd6;
      --shadow: rgba(116, 58, 72, .18);
      --mark-bg: #f7dde3;
      --mark-fg: #a7475d;
    }
    html[data-theme="payroll"] {
      --ink: #ffe077;
      --paper: #66742f;
      --desk: #edebe3;
      --desk-soft: #f7f5ef;
      --muted: #e8cf74;
      --line: #9aa35d;
      --accent: #5c682b;
      --shadow: rgba(48, 57, 19, .24);
      --mark-bg: #66742f;
      --mark-fg: #ffe077;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 20% 10%, rgba(255,255,255,.7), transparent 30%),
        linear-gradient(135deg, var(--desk-soft), var(--desk));
      color: var(--ink);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      transition: background .2s ease, color .2s ease;
    }
    .page {
      width: min(100%, 540px);
      margin: 0 auto;
      padding: 30px 18px 54px;
    }
    .toolbar {
      display: grid;
      justify-items: center;
      gap: 12px;
      margin-bottom: 22px;
    }
    .theme-switcher {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    .theme-button {
      appearance: none;
      border: 1px solid color-mix(in srgb, var(--ink) 28%, transparent);
      border-radius: 999px;
      background: color-mix(in srgb, var(--paper) 74%, transparent);
      color: var(--ink);
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      padding: 8px 12px;
    }
    .theme-button[aria-pressed="true"] {
      background: var(--ink);
      color: var(--paper);
    }
    .export-actions {
      display: grid;
      justify-items: center;
      gap: 6px;
    }
    .export-button {
      appearance: none;
      min-width: 168px;
      border: 1px solid var(--ink);
      border-radius: 999px;
      background: var(--ink);
      color: var(--paper);
      cursor: pointer;
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      padding: 10px 18px;
      transition: opacity .15s ease, transform .15s ease;
    }
    .export-button:hover { transform: translateY(-1px); }
    .export-button:disabled { cursor: wait; opacity: .62; transform: none; }
    .export-status {
      min-height: 16px;
      color: var(--muted);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
      font-size: 11px;
    }
    .export-status[data-state="error"] { color: #b33a2e; }
    .export-sheet { padding: 10px 0; }
    .paper {
      position: relative;
      background:
        repeating-linear-gradient(0deg, color-mix(in srgb, var(--ink) 2%, transparent) 0, color-mix(in srgb, var(--ink) 2%, transparent) 1px, transparent 1px, transparent 4px),
        var(--paper);
      box-shadow: 0 22px 60px var(--shadow);
      filter: contrast(.985);
    }
    .paper::before,
    .paper::after {
      content: "";
      position: absolute;
      left: 0;
      width: 100%;
      height: 10px;
      background: linear-gradient(135deg, transparent 7px, var(--paper) 0) 0 0 / 14px 14px repeat-x;
    }
    .paper::before { top: -9px; transform: rotate(180deg); }
    .paper::after { bottom: -9px; }
    .receipt { padding: 34px 28px 32px; }
    .brand { text-align: center; }
    .brand-mark {
      display: inline-grid;
      place-items: center;
      width: 46px;
      height: 46px;
      margin-bottom: 12px;
      border: 2px solid var(--ink);
      border-radius: 50%;
      background: var(--mark-bg);
      color: var(--mark-fg);
      font-size: 22px;
      font-weight: 800;
    }
    h1 {
      margin: 0;
      font-size: clamp(22px, 7vw, 30px);
      letter-spacing: .08em;
    }
    .subtitle {
      margin: 9px 0 0;
      color: var(--muted);
      font-size: 12px;
      letter-spacing: .12em;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 18px;
      margin: 26px 0 16px;
      font-size: 12px;
    }
    .meta div:nth-child(even) { text-align: right; }
    .divider {
      height: 1px;
      margin: 18px 0;
      border-top: 1px dashed var(--line);
    }
    .receipt-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 24px;
      padding: 6px 0;
      font-size: 14px;
    }
    .receipt-row span { color: var(--muted); }
    .receipt-row strong { text-align: right; font-weight: 700; }
    .receipt-row--emphasize {
      margin: 3px -6px;
      padding: 8px 6px;
      background: var(--accent);
    }
    .verdict { text-align: center; }
    .verdict h2 { margin: 0; font-size: 22px; letter-spacing: .04em; }
    .review {
      margin: 12px auto 0;
      max-width: 30em;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
      font-size: 14px;
      line-height: 1.7;
    }
    .salary {
      padding: 10px 0 2px;
      font-size: 14px;
    }
    .salary-line {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 18px;
    }
    .salary-line span { color: var(--muted); }
    .salary strong { font-size: 28px; }
    .salary strong small {
      margin-left: 6px;
      font-size: 12px;
      color: var(--muted);
    }
    .barcode {
      height: 48px;
      margin: 18px auto 8px;
      max-width: 280px;
      background: repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 4px, var(--ink) 4px 5px, transparent 5px 8px);
      opacity: .84;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      line-height: 1.65;
      color: var(--muted);
    }
    .transfer-stub {
      margin-top: 32px;
      padding: 26px 24px 24px;
    }
    .transfer-heading { text-align: center; }
    .transfer-heading h2 { margin: 0; font-size: 18px; letter-spacing: .08em; }
    .transfer-heading p { margin: 7px 0 0; color: var(--muted); font-size: 11px; }
    .qr-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-top: 20px;
    }
    .qr-item { text-align: center; }
    .qr-frame {
      display: grid;
      place-items: center;
      width: min(100%, 176px);
      aspect-ratio: 1;
      margin: 0 auto 10px;
      padding: 10px;
      border: 1px solid var(--line);
      background: #fff;
    }
    .qr-frame img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .qr-item strong { display: block; font-size: 12px; }
    .qr-item span { display: block; margin-top: 4px; color: var(--muted); font-size: 10px; line-height: 1.45; }
    .mini-placeholder {
      display: grid;
      place-content: center;
      width: 100%;
      height: 100%;
      border: 2px dashed #9a9a92;
      color: #5f5f59;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
    }
    .mini-placeholder span { font-size: 13px; }
    .mini-placeholder strong { margin-top: 4px; font-size: 18px; }
    .transfer-note {
      margin: 18px 0 0;
      padding-top: 14px;
      border-top: 1px dashed var(--line);
      color: var(--muted);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
      font-size: 11px;
      line-height: 1.65;
      text-align: center;
    }
    .privacy {
      margin: 24px auto 0;
      max-width: 440px;
      color: color-mix(in srgb, var(--ink) 64%, transparent);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
      font-size: 12px;
      line-height: 1.6;
      text-align: center;
    }
    @media (max-width: 420px) {
      .page { padding-inline: 10px; }
      .receipt { padding-inline: 20px; }
      .meta { grid-template-columns: 1fr; }
      .meta div:nth-child(even) { text-align: left; }
      .qr-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="toolbar">
      <nav class="theme-switcher" aria-label="${escapeHtml(copy.themeAria)}">
        <button class="theme-button" type="button" data-theme-value="classic">${escapeHtml(copy.themes.classic)}</button>
        <button class="theme-button" type="button" data-theme-value="diner">${escapeHtml(copy.themes.diner)}</button>
        <button class="theme-button" type="button" data-theme-value="payroll">${escapeHtml(copy.themes.payroll)}</button>
      </nav>
      <div class="export-actions">
        <button class="export-button" id="save-receipt-image" type="button">${escapeHtml(copy.exportImage)}</button>
        <span class="export-status" id="export-status" role="status" aria-live="polite"></span>
      </div>
    </div>

    <div class="export-sheet" id="receipt-export">
      <article class="paper receipt" aria-label="${escapeHtml(copy.receiptAria)}">
      <header class="brand">
        <div class="brand-mark">C</div>
        <h1>${escapeHtml(copy.receiptTitle)}</h1>
        <p class="subtitle">CODEX WORK RECEIPT</p>
      </header>

      <section class="meta">
        <div>${escapeHtml(copy.meta.date)}: ${escapeHtml(displayDate)}</div>
        <div>${escapeHtml(businessPeriodLabel)}: ${escapeHtml(businessPeriod)}</div>
        <div>${escapeHtml(copy.meta.number)}: ${escapeHtml(receiptNumber)}</div>
        <div>${escapeHtml(copy.meta.timezone)}: ${escapeHtml(timezone)}</div>
      </section>

      <div class="divider"></div>
      <section>${rows}</section>
      <div class="divider"></div>

      <section class="verdict">
        <h2>${escapeHtml(record.presentation.work_title)}</h2>
        <p class="review">${escapeHtml(record.presentation.review)}</p>
      </section>

      <div class="divider"></div>
      <section class="salary">
        <div class="salary-line">
          <span>${escapeHtml(compensation.label)}</span>
          <strong>${escapeHtml(formatNumber(compensation.amount, locale))}<small>${escapeHtml(compensation.unit)}</small></strong>
        </div>
      </section>
      <div class="barcode" aria-hidden="true"></div>
      <footer class="footer">
        <div>MODEL · ${escapeHtml(modelLabel)}</div>
        <div>${escapeHtml(copy.footerThanks)}</div>
      </footer>
      </article>

      <section class="paper transfer-stub" aria-label="${escapeHtml(copy.transferAria)}">
      <header class="transfer-heading">
        <h2>${escapeHtml(copy.transferTitle)}</h2>
        <p>${escapeHtml(copy.transferDescription)}</p>
      </header>
      <div class="qr-grid">
        <div class="qr-item">
          <div class="qr-frame">${miniProgramVisual}</div>
          <strong>${escapeHtml(copy.openMiniProgram)}</strong>
          <span>${escapeHtml(copy.openMiniProgramHint)}</span>
        </div>
        ${dataQrItems}
      </div>
      <p class="transfer-note">${escapeHtml(copy.transferNote)}</p>
      </section>
    </div>

    <p class="privacy">${escapeHtml(copy.privacy)}</p>
  </main>
  <script>${inlineScript(DOM_TO_IMAGE_SOURCE)}</script>
  <script>
    const exportConfig = ${exportConfig};
    const themes = new Set(["classic", "diner", "payroll"]);
    const buttons = [...document.querySelectorAll("[data-theme-value]")];
    function applyTheme(theme) {
      const selected = themes.has(theme) ? theme : "classic";
      document.documentElement.dataset.theme = selected;
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.themeValue === selected)));
      try { localStorage.setItem("codex-work-receipt-theme", selected); } catch {}
    }
    buttons.forEach((button) => button.addEventListener("click", () => applyTheme(button.dataset.themeValue)));
    let savedTheme = null;
    try { savedTheme = localStorage.getItem("codex-work-receipt-theme"); } catch {}
    applyTheme(savedTheme || document.documentElement.dataset.theme);

    const exportButton = document.getElementById("save-receipt-image");
    const exportStatus = document.getElementById("export-status");
    const exportNode = document.getElementById("receipt-export");

    function setExportStatus(message, state = "") {
      exportStatus.textContent = message;
      exportStatus.dataset.state = state;
    }

    function waitForImages(node) {
      return Promise.all([...node.querySelectorAll("img")].map((image) => {
        if (image.complete && image.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve, reject) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", reject, { once: true });
        });
      }));
    }

    function downloadImage(dataUrl, filename) {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      if (typeof link.download === "string") link.click();
      else window.open(dataUrl, "_blank", "noopener");
      link.remove();
    }

    exportButton.addEventListener("click", async () => {
      if (exportButton.disabled) return;
      exportButton.disabled = true;
      exportButton.textContent = exportConfig.busyLabel;
      setExportStatus("");

      try {
        if (document.fonts?.ready) await document.fonts.ready;
        await waitForImages(exportNode);
        const width = Math.ceil(exportNode.scrollWidth);
        const height = Math.ceil(exportNode.scrollHeight);
        const scale = Math.max(2, Math.min(3, 1500 / Math.max(1, width)));
        const paperColor = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#ffffff";
        const dataUrl = await domtoimage.toPng(exportNode, {
          width,
          height,
          scale,
          pixelRatio: 1,
          bgcolor: paperColor,
          cacheBust: false,
          style: { background: paperColor },
          onclone(clone) {
            clone.style.background = paperColor;
            clone.querySelectorAll(".paper").forEach((paper) => {
              paper.style.boxShadow = "none";
            });
          },
          logger: {},
        });
        const theme = themes.has(document.documentElement.dataset.theme)
          ? document.documentElement.dataset.theme
          : "classic";
        downloadImage(dataUrl, exportConfig.fileBase + "-" + theme + ".png");
        setExportStatus(exportConfig.successLabel, "success");
      } catch (error) {
        console.error(error);
        setExportStatus(exportConfig.errorLabel, "error");
      } finally {
        exportButton.disabled = false;
        exportButton.textContent = exportConfig.idleLabel;
      }
    });
  </script>
</body>
</html>`;
}

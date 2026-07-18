import { formatDate, formatDuration, formatNumber, formatTime } from "../lib/time.mjs";
import { buildCompensation, DEFAULT_LOCALE, getReceiptCopy } from "../core/presentation.mjs";

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

export function renderHtml({ record, dataQrDataUrl, miniProgramCodeDataUrl = null }) {
  const locale = record.locale || DEFAULT_LOCALE;
  const copy = getReceiptCopy(locale);
  const startAt = new Date(record.period.start_at);
  const endAt = new Date(record.period.end_at);
  const timezone = record.period.timezone;
  const displayDate = formatDate(endAt, timezone, locale);
  const businessHours = `${formatTime(startAt, timezone, locale)}—${formatTime(endAt, timezone, locale)}`;
  const scopeLabel = copy.scope[record.source.scope] || copy.scope.latest;
  const modelLabel = record.stats.models.length ? record.stats.models.join(" / ") : copy.modelMissing;
  const receiptNumber = `${record.id.slice(4, 12).toUpperCase()}-${String(record.stats.completed_turns).padStart(3, "0")}`;
  const compensation = record.presentation.compensation || buildCompensation(record.source.scope, 0, locale);
  const responseSeconds = new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(record.stats.average_first_token_ms / 1000);
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
      --paper: #fffef4;
      --desk: #d9d7cb;
      --desk-soft: #cfcdc1;
      --muted: #68675f;
      --line: rgba(23, 23, 19, .42);
      --accent: rgba(23, 23, 19, .055);
      --shadow: rgba(31, 30, 24, .18);
      --mark-bg: transparent;
      --mark-fg: var(--ink);
    }
    html[data-theme="diner"] {
      --ink: #7f1e18;
      --paper: #fff8e8;
      --desk: #d8a58e;
      --desk-soft: #f0d4bd;
      --muted: #9a4b3e;
      --line: rgba(127, 30, 24, .42);
      --accent: rgba(198, 54, 38, .08);
      --shadow: rgba(89, 34, 24, .2);
      --mark-bg: #bd2f23;
      --mark-fg: #fff8e8;
    }
    html[data-theme="payroll"] {
      --ink: #183d67;
      --paper: #f4f9ff;
      --desk: #aebdcb;
      --desk-soft: #dbe5ee;
      --muted: #53718f;
      --line: rgba(24, 61, 103, .38);
      --accent: rgba(40, 104, 166, .075);
      --shadow: rgba(28, 52, 79, .18);
      --mark-bg: #183d67;
      --mark-fg: #f4f9ff;
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
    .theme-switcher {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 22px;
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
    <nav class="theme-switcher" aria-label="${escapeHtml(copy.themeAria)}">
      <button class="theme-button" type="button" data-theme-value="classic">${escapeHtml(copy.themes.classic)}</button>
      <button class="theme-button" type="button" data-theme-value="diner">${escapeHtml(copy.themes.diner)}</button>
      <button class="theme-button" type="button" data-theme-value="payroll">${escapeHtml(copy.themes.payroll)}</button>
    </nav>

    <article class="paper receipt" aria-label="${escapeHtml(copy.receiptAria)}">
      <header class="brand">
        <div class="brand-mark">C</div>
        <h1>${escapeHtml(copy.receiptTitle)}</h1>
        <p class="subtitle">CODEX WORK RECEIPT</p>
      </header>

      <section class="meta">
        <div>${escapeHtml(copy.meta.date)}: ${escapeHtml(displayDate)}</div>
        <div>${escapeHtml(copy.meta.hours)}: ${escapeHtml(businessHours)}</div>
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
        <div class="qr-item">
          <div class="qr-frame"><img src="${dataQrDataUrl}" alt="${escapeHtml(copy.dataQrAlt)}"></div>
          <strong>${escapeHtml(copy.importData)}</strong>
          <span>${escapeHtml(copy.importDataHint)}</span>
        </div>
      </div>
      <p class="transfer-note">${escapeHtml(copy.transferNote)}</p>
    </section>

    <p class="privacy">${escapeHtml(copy.privacy)}</p>
  </main>
  <script>
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
  </script>
</body>
</html>`;
}

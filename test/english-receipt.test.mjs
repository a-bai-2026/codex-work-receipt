import assert from "node:assert/strict";
import test from "node:test";
import { Script } from "node:vm";

import { OPEN_SOURCE_REPOSITORY_URL } from "../src/core/open-source.mjs";
import { getWorkProfileCopy, selectWorkProfileId } from "../src/core/presentation.mjs";
import { buildReceiptRecord } from "../src/core/receipt-record.mjs";
import { compactReceipt } from "../src/core/transfer-record.mjs";
import { renderHtml } from "../src/renderers/html.mjs";

const metrics = {
  mode: "latest",
  timezone: "Asia/Shanghai",
  targetDate: "2026-07-18",
  rangeStartDate: "2026-07-18",
  rangeEndDate: "2026-07-18",
  activeDayCount: 1,
  sessionIds: ["english-session"],
  sessionCount: 1,
  startAt: new Date("2026-07-18T10:00:00.000Z"),
  endAt: new Date("2026-07-18T11:00:00.000Z"),
  completedTurns: 8,
  userMessages: 9,
  toolCalls: 42,
  interruptions: 0,
  workDurationMs: 3_600_000,
  averageFirstTokenMs: 1250,
  tokens: {
    input_tokens: 12_000,
    cached_input_tokens: 10_000,
    output_tokens: 2_000,
    reasoning_output_tokens: 500,
    total_tokens: 14_000,
  },
  models: ["test-model"],
  insights: {
    cache_hit_rate: 0.8333,
    per_turn: {
      total_tokens: 1_750,
      output_tokens: 250,
      tool_calls: 5.25,
      work_duration_ms: 450_000,
    },
    latency_ms: {
      first_token: { sample_count: 8, p50: 1_000, p90: 1_800 },
      turn: { sample_count: 8, p50: 300_000, p90: 600_000 },
    },
    activity_by_hour: Array.from({ length: 24 }, (_, hour) => hour === 10 ? 5 : 0),
    model_usage: [{ model: "test-model", count: 8 }],
    tool_usage: [
      { category: "terminal", count: 30 },
      { category: "file-edit", count: 12 },
    ],
  },
  workProfileId: "toolchain-commander",
  workPoints: 520,
};

test("工种规则先生成语义 ID，再分别映射中英文文案", () => {
  const profileId = selectWorkProfileId(metrics);

  assert.equal(profileId, "toolchain-commander");
  assert.equal(getWorkProfileCopy(profileId, "zh-CN").title, "工具链指挥官");
  assert.equal(getWorkProfileCopy(profileId, "en").title, "Toolchain Commander");
});

test("英文 HTML 会完整本地化 V6 回执所与原版小票内容", () => {
  const record = buildReceiptRecord(metrics, "payroll", "en");
  record.generated_at = "2026-07-18T01:30:00.000Z";
  const html = renderHtml({
    record,
    dataQrDataUrl: "data:image/png;base64,DATA",
    miniProgramCodeDataUrl: "data:image/png;base64,MINI",
  });

  assert.match(html, /<html lang="en" data-theme="payroll" data-scene="day" data-receipt-type="both">/);
  assert.match(html, /AI Work Receipt/);
  assert.match(html, /Latest session/);
  assert.match(html, /Toolchain Commander/);
  assert.match(html, /SHIFT PAY/);
  assert.match(html, /Efficiency &amp; work structure/);
  assert.match(html, /Cache hit rate/);
  assert.match(html, /83\.3%/);
  assert.match(html, /Per-turn efficiency/);
  assert.match(html, /P50 1s/);
  assert.match(html, /P90 1\.8s/);
  assert.match(html, /Work-time heatmap/);
  assert.equal((html.match(/class="heatmap-cell"/g) || []).length, 24);
  assert.match(html, /Model structure/);
  assert.match(html, /Tool structure/);
  assert.match(html, /File editing/);
  assert.match(html, /Classic White/);
  assert.match(html, /Vintage Pink/);
  assert.match(html, /Night Shift Green/);
  assert.match(html, /--paper: #ffffff/);
  assert.match(html, /--paper: #f7dde3/);
  assert.match(html, /--paper: #66742f/);
  assert.match(html, /--ink: #ffe077/);
  assert.match(html, /Open mini program/);
  assert.match(html, /Download WeChat import file/);
  assert.match(html, /Import from a chat file/);
  assert.match(html, /Or import by scanning/);
  assert.equal((html.match(/data-data-qr-panel hidden/g) || []).length, 1);
  assert.doesNotMatch(html, /multipart|Data part|rotate automatically/i);
  assert.match(html, /Structured data and the WeChat import file stay on this computer/);
  assert.match(html, /Save full PNG/);

  assert.match(html, /WORLD&#039;S EDGE · AI RECEIPT OFFICE · Day Shift/);
  assert.match(html, /AI RECEIPT OFFICE · Day Shift ON DUTY/);
  assert.match(html, /2026-07-18 · 09:30 · Received by Ticket Buddy/);
  assert.match(html, /Today&#039;s receipt/);
  assert.match(html, /has arrived/);
  assert.match(html, /Today&#039;s Mood/);
  assert.match(html, /Ticket House/);
  assert.match(html, /Badge Wall/);
  assert.match(html, /Planned/);
  assert.equal((html.match(/data-scene-mode=/g) || []).length, 3);
  assert.match(html, /data-scene-mode="auto" aria-pressed="true"/);
  assert.match(html, /id="commandDrawerToggle"/);
  assert.doesNotMatch(html, /printerCommandToggle/);
  assert.match(html, /id="feedbackToggle"/);
  assert.doesNotMatch(html, /id="windToggle"|wind-paused|Pause wind|Resume wind/);
  assert.match(html, /data:image\/gif;base64,[A-Za-z0-9+/=]+" alt="Ticket Buddy on duty/);

  assert.match(html, /<dialog class="feedback-dialog" id="feedbackDialog" aria-labelledby="feedbackDialogTitle">/);
  assert.match(html, /Scan to join the Xiaohongshu beta group/);
  assert.match(html, /Send me problems, screenshots, or ideas directly\./);
  assert.match(html, /Or open a GitHub Issue/);
  assert.match(html, /Give feedback on GitHub/);
  assert.match(html, /To protect your privacy, do not submit prompts, code, secrets, or local file paths\./);
  assert.match(html, /data:image\/png;base64,[A-Za-z0-9+/=]+" alt="Xiaohongshu beta group QR code, valid until August 22, 2026"/);
  assert.match(html, new RegExp(`href="${OPEN_SOURCE_REPOSITORY_URL}/issues"`));
  assert.match(html, /feedbackDialog\.showModal\(\)/);
  assert.match(html, /feedbackDialog\?\.addEventListener\("close"/);

  assert.match(html, /class="office-info-cluster"/);
  assert.match(html, /Like this tool\? Give it a star on GitHub\./);
  assert.doesNotMatch(html, /See what changed at the Receipt Office|CHANGELOG\.md|class="log-board"/);
  assert.equal(html.split(OPEN_SOURCE_REPOSITORY_URL).length - 1, 2);
  assert.match(html, /class="github-board github-star-link"[^>]+target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="https:\/\/modelflare\.dev\/sign-up\?partner=OB9YXNSEEGOL&amp;utm_source=codex_work_receipt&amp;utm_content=banner_en_v1"/);
  assert.match(html, /class="sponsor-logo" src="data:image\/png;base64,[A-Za-z0-9+/=]+" alt="ModelFlare logo"/);
  assert.match(html, /class="sponsor-banner" src="data:image\/png;base64,[A-Za-z0-9+/=]+" alt="ModelFlare: stable full-capacity models/);
  assert.match(html, /TOKEN SPONSOR/);
  assert.match(html, /class="mobile-sponsor-crate sponsor-crate--banner" href="https:\/\/modelflare\.dev\/sign-up\?partner=OB9YXNSEEGOL&amp;utm_source=codex_work_receipt&amp;utm_content=banner_en_v1"/);
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) || []).length, 4);

  assert.match(html, /<details class="feature-dock" id="commandDrawer" data-feature-details>/);
  assert.match(html, /More CLI features/);
  assert.match(html, /22 commands/);
  assert.match(html, /role="tablist" aria-label="Receipt feature categories"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 6);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 6);
  assert.match(html, /Receipt types/);
  assert.match(html, /Help and settings/);
  assert.match(html, /Time ranges/);
  assert.match(html, /Sessions and projects/);
  assert.match(html, /Choose a custom range/);
  assert.match(html, /--select-session --lang en/);
  assert.match(html, /--select-project --lang en/);
  assert.match(html, /npx codex-work-receipt@latest --hours 3 --lang en/);
  assert.match(html, /npx codex-work-receipt@latest --install-companion --lang en/);
  assert.equal((html.match(/data-copy-command=/g) || []).length, 22);
  assert.match(html, /codex-work-receipt-feature-tab/);
  assert.match(html, /ArrowRight/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /document\.execCommand\("copy"\)/);
  assert.doesNotMatch(html, /raw\.githubusercontent\.com/);

  assert.match(html, /class="ticket-rail"/);
  assert.match(html, /data-report-view="work"/);
  assert.match(html, /data-report-view="emotion"/);
  assert.match(html, /id="report-panel-work"/);
  assert.match(html, /id="report-panel-emotion"/);
  assert.match(html, /Today&#039;s mood card/);
  assert.match(html, /data-emotion-state="smooth"/);
  assert.match(html, /TICKET BUDDY · IN SYNC/);
  assert.match(html, /id="save-emotion-image"/);
  assert.match(html, /new URLSearchParams\(window\.location\.search\)\.get\("emotion"\)/);
  assert.match(html, /emotionConfig\.fileBase \+ "-" \+ currentEmotionState/);
  assert.match(html, /class="receipt-toolbar toolbar"/);
  assert.match(html, /\.ticket-rail \{[\s\S]*?position: fixed;[\s\S]*?overflow-y: auto;/);
  assert.match(html, /\.receipt-toolbar \{[\s\S]*?position: sticky;[\s\S]*?top: 0;/);
  assert.match(html, /body \{[\s\S]*?height: 100dvh;[\s\S]*?overscroll-behavior: none;/);
  assert.match(html, /html\[data-scene="day"\] body/);
  assert.match(html, /html\[data-scene="night"\] \.moon[\s\S]*?mask-image: radial-gradient/);
  assert.match(html, /aspect-ratio: 1843 \/ 576/);
  assert.doesNotMatch(html, /class="door"|class="printer"|sponsor-offer/);
  assert.doesNotMatch(html, /today-package|workReceiptShortcut/);
  assert.match(html, /\.feature-dock:not\(\[open\]\)[\s\S]*?visibility: hidden/);
  assert.match(html, /document\.addEventListener\("wheel"[\s\S]*?ticketRail\.scrollBy/);
  assert.match(html, /applySceneMode\("auto"\)/);
  assert.match(html, /officeConfig\.generatedScene/);

  assert.match(html, /id="save-receipt-image"/);
  assert.match(html, /domtoimage\.toPng/);
  assert.match(html, /data-barcode-value="[A-Z0-9]+-008"/);
  assert.match(html, /barcode-segment--bar/);
  assert.match(html, /barcode-segment--space/);
  assert.match(html, /style="flex-grow:[1-4]"/);
  const exportStart = html.indexOf('<div class="export-sheet" id="receipt-export">');
  const exportEnd = html.indexOf('<p class="privacy">', exportStart);
  const exportMarkup = html.slice(exportStart, exportEnd);
  assert.match(exportMarkup, /paper receipt/);
  assert.match(exportMarkup, /paper transfer-stub/);
  assert.doesNotMatch(exportMarkup, /theme-switcher|save-receipt-image|class="privacy"/);
  assert.doesNotMatch(exportMarkup, /github-star-link|GitHub|Changelog|ModelFlare/);
  assert.doesNotMatch(exportMarkup, /More CLI features|data-copy-command|today-package|data-planned-message/);
  assert.doesNotMatch(exportMarkup, /feedback-dialog|Xiaohongshu beta group|GitHub Issue/);
  assert.match(html, /function sanitizeExportNode/);
  assert.match(html, /function normalizeExportTextLayout/);
  assert.match(html, /\.meta > div, \.receipt-row > span, \.receipt-row > strong, \.salary-line > span, \.salary-line > strong/);
  assert.match(html, /\["width", "height", "inline-size", "block-size"\]\.forEach/);
  assert.match(html, /value\.style\.setProperty\("white-space", "nowrap"\)/);
  assert.match(html, /value\.style\.setProperty\("flex-shrink", "0"\)/);
  assert.match(html, /onclone\(clone\) \{[\s\S]*?sanitizeExportNode\(clone\);[\s\S]*?normalizeExportTextLayout\(clone\);/);
  assert.match(html, /node\.querySelector\("\[data-file-import-controls\]"\)/);
  assert.match(html, /node\.querySelector\("\[data-data-qr-panel\]"\)/);
  assert.match(html, /transferLayout\.style\.gridTemplateColumns = "minmax\(0, 1fr\)"/);
  assert.match(html, /domtoimage\.toPng\(renderNode/);
  assert.match(html, /data-export-mini-label/);
  assert.match(html, /new Blob\(\[transferConfig\.content\]/);
});

test("中文 HTML 使用夜班回执所并保留完整功能入口", () => {
  const record = buildReceiptRecord(metrics, "classic", "zh-CN");
  record.generated_at = "2026-07-18T13:30:00.000Z";
  const html = renderHtml({ record, dataQrDataUrl: "data:image/png;base64,DATA" });

  assert.match(html, /<html lang="zh-CN" data-theme="classic" data-scene="night" data-receipt-type="both">/);
  assert.match(html, /世界边缘 · AI 回执所 · 夜班/);
  assert.match(html, /AI 回执所 · 夜班值守中/);
  assert.match(html, /2026\.07\.18 · 21:30 · 票仔签收/);
  assert.match(html, /今日回执/);
  assert.match(html, /今日情绪/);
  assert.match(html, /已送达/);
  assert.match(html, /喜欢这个工具？去 GitHub 点个 ⭐️/);
  assert.doesNotMatch(html, /查看回执所最近发生了什么|本所物资补给|sponsor-offer/);
  assert.match(html, /Token 赞助商/);
  assert.match(html, /href="https:\/\/modelflare\.dev\/sign-up\?partner=OB9YXNSEEGOL&amp;utm_source=codex_work_receipt&amp;utm_content=banner_zh_v1"/);
  assert.match(html, /class="sponsor-banner" src="data:image\/png;base64,[A-Za-z0-9+/=]+" alt="ModelFlare：稳定满血大模型/);
  assert.match(html, /data:image\/gif;base64,[A-Za-z0-9+/=]+" alt="票仔在回执所窗口值守/);
  assert.match(html, /小票屋/);
  assert.match(html, /勋章墙/);
  assert.match(html, /规划中/);
  assert.match(html, /id="feedbackToggle"/);
  assert.match(html, /意见反馈/);
  assert.match(html, /扫码加入小红书内测群/);
  assert.match(html, /直接把问题、截图或者想法丢给我/);
  assert.match(html, /也可以直接给我提 Issue/);
  assert.match(html, /去 GitHub 反馈/);
  assert.match(html, /为了保护隐私，请不要提交 Prompt、代码、密钥或本地文件路径。/);
  assert.doesNotMatch(html, /id="windToggle"|wind-paused|暂停风|让风继续/);
  assert.match(html, /更多命令行功能/);
  assert.match(html, /22 项/);
  assert.match(html, /小票类型/);
  assert.match(html, /帮助与设置/);
  assert.match(html, /时间范围/);
  assert.match(html, /会话与项目/);
  assert.match(html, /自定义时间区间/);
  assert.match(html, /生成最近 3 小时小票/);
  assert.match(html, /npx codex-work-receipt@latest --hours 3/);
  assert.doesNotMatch(html, /--hours 3 --lang en/);
  assert.equal((html.match(/data-copy-command=/g) || []).length, 22);
  assert.equal((html.match(/data-scene-mode=/g) || []).length, 3);
  assert.equal(html.split(OPEN_SOURCE_REPOSITORY_URL).length - 1, 2);
});

test("没有单码数据时只保留聊天文件导入，不渲染扫码备选", () => {
  const record = buildReceiptRecord(metrics, "classic", "zh-CN");
  const html = renderHtml({
    record,
    miniProgramCodeDataUrl: "data:image/png;base64,MINI",
  });

  assert.match(html, /下载微信导入文件/);
  assert.match(html, /文件传输助手/);
  assert.doesNotMatch(html, /data-data-qr-panel hidden/);
  assert.doesNotMatch(html, /data-show-data-qr type=/);
  assert.doesNotMatch(html, /也可以扫码导入/);
  assert.doesNotMatch(html, /multipart|分片二维码|自动轮播/i);
  assert.match(html, /sanitizeExportNode\(clone\)/);
  assert.match(html, /miniProgramLabel\.textContent = exportConfig\.miniProgramLabel/);

  const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(inlineScripts.length > 0);
  assert.doesNotThrow(() => new Script(inlineScripts.at(-1)[1]));
});

test("英文网页的数据二维码继续兼容当前中文小程序", () => {
  const record = buildReceiptRecord(metrics, "diner", "en");
  const compact = compactReceipt(record);

  assert.equal(compact.l, "en");
  assert.equal(compact.r, "toolchain-commander");
  assert.equal(compact.p[1], "工具链指挥官");
  assert.equal(compact.p[3][0], "本单工资");
  assert.equal(compact.p[3][2], "AI 工分");
});

test("自然日范围会在小票顶部展示完整统计周期", () => {
  const record = buildReceiptRecord({
    ...metrics,
    mode: "last-7-days",
    rangeStartDate: "2026-07-12",
    rangeEndDate: "2026-07-18",
    startAt: new Date("2026-07-12T02:00:00.000Z"),
    endAt: new Date("2026-07-18T11:00:00.000Z"),
  }, "classic", "zh-CN");
  const html = renderHtml({
    record,
    dataQrDataUrl: "data:image/png;base64,DATA",
    miniProgramCodeDataUrl: "data:image/png;base64,MINI",
  });

  assert.match(html, /统计周期: 2026\/07\/12—2026\/07\/18 · 最近 7 个自然日/);
  assert.match(html, /codex-work-receipt-last-7-days-2026-07-12-to-2026-07-18/);
});

test("滚动小时范围展示请求窗口和动态小时文案", () => {
  const record = buildReceiptRecord({
    ...metrics,
    mode: "last-hours",
    windowStartAt: new Date("2026-07-18T08:00:00.000Z"),
    windowEndAt: new Date("2026-07-18T11:00:00.000Z"),
    windowHours: 3,
  }, "payroll", "en");
  const html = renderHtml({ record, dataQrDataUrl: "data:image/png;base64,DATA" });

  assert.match(html, /Last 3 hours/);
  assert.match(html, /Work hours: 16:00—19:00/);
  assert.match(html, /WINDOW PAY/);
  assert.match(html, /rolling summary for private history only/);
  assert.match(html, /does not participate in AI Work Cooperative accounting/);
});

test("自定义时间和项目筛选在 HTML 中使用隐私安全标签", () => {
  const record = buildReceiptRecord({
    ...metrics,
    mode: "custom-range",
    boundaryKind: "exact-time",
    projectId: "cwp_private",
    windowStartAt: new Date("2026-07-18T01:00:00.000Z"),
    windowEndAt: new Date("2026-07-18T09:30:00.000Z"),
  }, "classic", "zh-CN");
  const html = renderHtml({ record });

  assert.match(html, /指定项目 · 自定义时间/);
  assert.match(html, /营业时段: 09:00—17:30/);
  assert.match(html, /区间工资/);
  assert.match(html, /精确时间区间属于私人摘要/);
  assert.doesNotMatch(html, /project_path|repository_url|"cwd"/);
});

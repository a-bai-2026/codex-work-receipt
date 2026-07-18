import assert from "node:assert/strict";
import test from "node:test";

import { compactReceipt } from "../src/core/qr-payload.mjs";
import { getWorkProfileCopy, selectWorkProfileId } from "../src/core/presentation.mjs";
import { buildReceiptRecord } from "../src/core/receipt-record.mjs";
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
  workProfileId: "toolchain-commander",
  workPoints: 520,
};

test("工种规则先生成语义 ID，再分别映射中英文文案", () => {
  const profileId = selectWorkProfileId(metrics);

  assert.equal(profileId, "toolchain-commander");
  assert.equal(getWorkProfileCopy(profileId, "zh-CN").title, "工具链指挥官");
  assert.equal(getWorkProfileCopy(profileId, "en").title, "Toolchain Commander");
});

test("英文 HTML 会完整本地化主要小票内容", () => {
  const record = buildReceiptRecord(metrics, "payroll", "en");
  const html = renderHtml({
    record,
    dataQrDataUrl: "data:image/png;base64,DATA",
    miniProgramCodeDataUrl: "data:image/png;base64,MINI",
  });

  assert.match(html, /<html lang="en"/);
  assert.match(html, /AI Work Receipt/);
  assert.match(html, /Latest session/);
  assert.match(html, /Toolchain Commander/);
  assert.match(html, /SHIFT PAY/);
  assert.match(html, /Classic Thermal/);
  assert.match(html, /Open mini program/);
  assert.match(html, /Structured data is also stored locally/);
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

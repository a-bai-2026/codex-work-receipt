import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseArgs } from "../src/core/args.mjs";
import {
  normalizeReceiptType,
  receiptTypeFromPreferences,
  receiptTypesFor,
} from "../src/core/receipt-types.mjs";
import { buildReceiptRecord } from "../src/core/receipt-record.mjs";
import { renderHtml } from "../src/renderers/html.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(path.dirname(TEST_DIR), "src", "cli.mjs");

const metrics = {
  mode: "today",
  timezone: "Asia/Shanghai",
  targetDate: "2026-07-26",
  rangeStartDate: "2026-07-26",
  rangeEndDate: "2026-07-26",
  activeDayCount: 1,
  sessionIds: ["receipt-type-session"],
  sessionCount: 1,
  startAt: new Date("2026-07-26T01:00:00.000Z"),
  endAt: new Date("2026-07-26T03:17:00.000Z"),
  completedTurns: 31,
  userMessages: 32,
  toolCalls: 18,
  interruptions: 4,
  workDurationMs: 137 * 60_000,
  averageFirstTokenMs: 2_000,
  tokens: {
    input_tokens: 12_000,
    cached_input_tokens: 8_000,
    output_tokens: 3_000,
    reasoning_output_tokens: 1_000,
    total_tokens: 15_000,
  },
  models: ["test-model"],
  insights: {
    cache_hit_rate: 0.6667,
    per_turn: { total_tokens: 484, output_tokens: 97, tool_calls: 0.58, work_duration_ms: 265_161 },
    latency_ms: {
      first_token: { sample_count: 31, p50: 2_000, p90: 4_000 },
      turn: { sample_count: 31, p50: 120_000, p90: 360_000 },
    },
    activity_by_hour: Array.from({ length: 24 }, (_, hour) => hour === 10 ? 31 : 0),
    model_usage: [{ model: "test-model", count: 31 }],
    tool_usage: [{ category: "terminal", count: 18 }],
  },
  workProfileId: "toolchain-commander",
  workPoints: 520,
};

test("小票类型参数默认 both，并校验三个公开值", () => {
  assert.equal(parseArgs([]).receiptType, "both");
  assert.equal(parseArgs(["--receipt-type", "work"]).receiptType, "work");
  assert.equal(parseArgs(["--receipt-type", "emotion"]).receiptType, "emotion");
  assert.equal(parseArgs(["--receipt-type", "both"]).receiptTypeExplicit, true);
  assert.throws(() => parseArgs(["--receipt-type", "unknown"]), /不支持的小票类型/);
});

test("Help 支持分类主题并拒绝未知主题", () => {
  assert.equal(parseArgs(["--help"]).help, true);
  assert.equal(parseArgs(["--help", "receipt"]).helpTopic, "receipt");
  assert.equal(parseArgs(["-h", "auto", "--lang", "en"]).helpTopic, "auto");
  assert.throws(() => parseArgs(["--help", "unknown"]), /不支持的帮助分类/);
});

test("分组 Help 输出对应主题并且不会生成报告", () => {
  const receiptHelp = execFileSync(process.execPath, [CLI_PATH, "--help", "receipt"], { encoding: "utf8" });
  const autoHelp = execFileSync(process.execPath, [CLI_PATH, "--help", "auto", "--lang", "en"], { encoding: "utf8" });

  assert.match(receiptHelp, /小票类型/);
  assert.match(receiptHelp, /--receipt-type both/);
  assert.doesNotMatch(receiptHelp, /已生成网页/);
  assert.match(autoHelp, /Automatic and manual saving/);
  assert.match(autoHelp, /--enable-auto --receipt-type both/);
});

test("配置中的 receipt_types 会归一化并兼容缺失字段", () => {
  assert.equal(receiptTypeFromPreferences(null), "both");
  assert.equal(receiptTypeFromPreferences({}), "both");
  assert.equal(receiptTypeFromPreferences({ receipt_types: ["work"] }), "work");
  assert.equal(receiptTypeFromPreferences({ receipt_types: ["emotion"] }), "emotion");
  assert.equal(receiptTypeFromPreferences({ receipt_types: ["emotion", "work"] }), "both");
  assert.deepEqual(receiptTypesFor(normalizeReceiptType("both")), ["work", "emotion"]);
});

test("只输出打工小票时情绪 Tab 展示范围感知的命令空态", () => {
  const record = buildReceiptRecord(metrics, "classic", "zh-CN");
  const html = renderHtml({ record, receiptType: "work" });

  assert.match(html, /data-receipt-type="work"/);
  assert.match(html, /id="report-panel-work" data-report-panel="work" data-report-available="true"/);
  assert.match(html, /id="report-panel-emotion" data-report-panel="emotion" data-report-available="false"/);
  assert.match(html, /今天还没有生成情绪小票/);
  assert.match(html, /--today --receipt-type both/);
  assert.match(html, /--today --receipt-type emotion/);
  assert.doesNotMatch(html, /<article class="emotion-ticket"/);
  assert.match(html, /"initialView":"work"/);
});

test("只输出情绪小票时默认打开情绪 Tab，打工 Tab 展示空态", () => {
  const record = buildReceiptRecord(metrics, "classic", "zh-CN");
  const html = renderHtml({ record, receiptType: "emotion" });

  assert.match(html, /data-receipt-type="emotion"/);
  assert.match(html, /id="report-panel-work" data-report-panel="work" data-report-available="false"/);
  assert.match(html, /id="report-panel-emotion" data-report-panel="emotion" data-report-available="true"/);
  assert.match(html, /今天还没有生成打工小票/);
  assert.match(html, /data-emotion-ticket/);
  assert.doesNotMatch(html, /id="receipt-export"/);
  assert.match(html, /"initialView":"emotion"/);
  assert.match(html, /activateReportView\(reportConfig\.initialView\)/);
});

test("两种小票都输出时两个面板完整存在并默认打开今日回执", () => {
  const record = buildReceiptRecord(metrics, "classic", "zh-CN");
  const html = renderHtml({ record, receiptType: "both" });

  assert.match(html, /data-receipt-type="both"/);
  assert.equal((html.match(/data-report-available="true"/g) || []).length, 2);
  assert.doesNotMatch(html, /data-report-available="false"/);
  assert.match(html, /id="receipt-export"/);
  assert.match(html, /data-emotion-ticket/);
  assert.match(html, /"initialView":"work"/);
  assert.match(html, /22 项/);
  assert.match(html, /--help receipt/);
});

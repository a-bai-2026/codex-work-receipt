import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseArgs } from "../src/core/args.mjs";
import { buildEmotionReceiptConfig } from "../src/core/emotion-receipt.mjs";
import { getWorkProfileCopy } from "../src/core/presentation.mjs";
import { buildReceiptRecord } from "../src/core/receipt-record.mjs";
import { renderHtml } from "../src/renderers/html.mjs";
import { formatDate, formatNumber } from "../src/lib/time.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(path.dirname(TEST_DIR), "src", "cli.mjs");

const metrics = {
  mode: "latest",
  timezone: "Asia/Shanghai",
  targetDate: "2026-07-18",
  rangeStartDate: "2026-07-18",
  rangeEndDate: "2026-07-18",
  activeDayCount: 1,
  sessionIds: ["japanese-session"],
  sessionCount: 1,
  startAt: new Date("2026-07-18T10:00:00.000Z"),
  endAt: new Date("2026-07-18T11:00:00.000Z"),
  completedTurns: 8,
  userMessages: 9,
  toolCalls: 42,
  interruptions: 0,
  workDurationMs: 3_600_000,
  averageFirstTokenMs: 1_250,
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

test("日文 locale は公開引数、ヘルプ、Intl 表記として利用できる", () => {
  assert.equal(parseArgs(["--lang", "ja"]).locale, "ja");
  assert.throws(() => parseArgs(["--lang", "fr"]), /不支持的语言/);

  const help = execFileSync(process.execPath, [CLI_PATH, "--help", "receipt", "--lang", "ja"], { encoding: "utf8" });
  const optionsHelp = execFileSync(process.execPath, [CLI_PATH, "--help", "options", "--lang", "ja"], { encoding: "utf8" });
  assert.match(help, /レシートの種類/);
  assert.match(help, /気分レシートのみを出力/);
  assert.match(optionsHelp, /--lang <zh-CN\|en\|ja>/);
  assert.match(formatDate(new Date("2026-07-18T01:30:00.000Z"), "Asia/Shanghai", "ja"), /2026\/07\/18/);
  assert.equal(formatNumber(12_000, "ja"), "12,000");
});

test("日文 HTML は作業票、気分票、再生成コマンドを日本語化する", () => {
  const record = buildReceiptRecord(metrics, "payroll", "ja");
  record.generated_at = "2026-07-18T01:30:00.000Z";
  const html = renderHtml({
    record,
    dataQrDataUrl: "data:image/png;base64,DATA",
    miniProgramCodeDataUrl: "data:image/png;base64,MINI",
  });

  assert.equal(getWorkProfileCopy("toolchain-commander", "ja").title, "ツールチェーン司令塔");
  assert.match(html, /<html lang="ja" data-theme="payroll" data-scene="day" data-receipt-type="both">/);
  assert.match(html, /Codex AI 作業レシート/);
  assert.match(html, /直近のセッション/);
  assert.match(html, /ツールチェーン司令塔/);
  assert.match(html, /今回の作業ポイント/);
  assert.match(html, /効率と作業の構成/);
  assert.match(html, /キャッシュヒット率/);
  assert.match(html, /作業時間ヒートマップ/);
  assert.match(html, /今日の気分/);
  assert.match(html, /レシート保管庫/);
  assert.match(html, /フィードバック/);
  assert.match(html, /プライバシー保護のため、プロンプト、コード、秘密情報、ローカルパスは送信しないでください。/);
  assert.match(html, /CLI のその他の機能/);
  assert.match(html, /25 個のコマンド/);
  assert.match(html, /--select-session --lang ja/);
  assert.match(html, /npx codex-work-receipt@latest --hours 3 --lang ja/);
  assert.equal((html.match(/data-copy-command=/g) || []).length, 25);
  assert.equal((html.match(/class="heatmap-cell"/g) || []).length, 24);
  assert.match(html, /気分カード/);
  assert.match(html, /票仔の心の声/);
  assert.match(html, /1秒/);
});

test("日文の気分票は日本語の状態と数値単位を使う", () => {
  const record = buildReceiptRecord({
    ...metrics,
    completedTurns: 6,
    workDurationMs: 2_520_000,
    averageFirstTokenMs: 1_000,
  }, "classic", "ja");
  const config = buildEmotionReceiptConfig(record, "ja");

  assert.equal(config.shared.navLabel, "今日の気分");
  assert.equal(config.states.smooth.name, "息の合う流れ");
  assert.equal(config.states.stable.metrics[0].value, "42分");
  assert.equal(config.states.stable.metrics[1].value, "6 ターン");
  assert.match(config.states.stable.receiptNumber, /^PIAOZAI · 気分 No\./);
});

import assert from "node:assert/strict";
import test from "node:test";

import { parseArgs } from "../src/core/args.mjs";
import { collectMetrics } from "../src/core/metrics.mjs";
import { resolveRange } from "../src/core/range.mjs";

function tokenRow(timestamp, totalTokens) {
  return {
    timestamp,
    type: "event_msg",
    payload: {
      type: "token_count",
      info: {
        total_token_usage: {
          input_tokens: totalTokens,
          cached_input_tokens: 0,
          output_tokens: 0,
          reasoning_output_tokens: 0,
          total_tokens: totalTokens,
        },
      },
    },
  };
}

function taskRow(timestamp, durationMs = 1_000) {
  return {
    timestamp,
    type: "event_msg",
    payload: { type: "task_complete", duration_ms: durationMs, time_to_first_token_ms: 500 },
  };
}

function toolRow(timestamp) {
  return { timestamp, type: "response_item", payload: { type: "function_call" } };
}

const sessions = [
  {
    sessionId: "parallel-a",
    rows: [
      tokenRow("2026-07-11T23:00:00.000Z", 100),
      { timestamp: "2026-07-12T09:00:00.000Z", type: "turn_context", payload: { model: "gpt-test" } },
      taskRow("2026-07-12T09:10:00.000Z"),
      toolRow("2026-07-12T09:11:00.000Z"),
      tokenRow("2026-07-12T09:12:00.000Z", 200),
      taskRow("2026-07-18T08:00:00.000Z"),
      toolRow("2026-07-18T08:01:00.000Z"),
      tokenRow("2026-07-18T08:02:00.000Z", 400),
      tokenRow("2026-07-19T08:02:00.000Z", 500),
    ],
  },
  {
    sessionId: "parallel-b",
    rows: [
      { timestamp: "2026-07-18T10:00:00.000Z", type: "turn_context", payload: { model: "gpt-test" } },
      taskRow("2026-07-18T10:05:00.000Z"),
      toolRow("2026-07-18T10:06:00.000Z"),
      tokenRow("2026-07-18T10:07:00.000Z", 50),
    ],
  },
];

test("命令行范围参数支持近七日、本周和指定会话", () => {
  assert.equal(parseArgs(["--range", "7d"]).mode, "last-7-days");
  assert.equal(parseArgs(["--range", "week"]).mode, "this-week");
  assert.deepEqual(
    { mode: parseArgs(["--session", "abc"]).mode, sessionId: parseArgs(["--session", "abc"]).sessionId },
    { mode: "session", sessionId: "abc" },
  );
});

test("今日范围会汇总并行会话，不混入其他日期", () => {
  const range = resolveRange("today", "UTC", new Date("2026-07-18T12:00:00.000Z"));
  const metrics = collectMetrics(sessions, range);

  assert.equal(metrics.sessionCount, 2);
  assert.equal(metrics.completedTurns, 2);
  assert.equal(metrics.toolCalls, 2);
  assert.equal(metrics.tokens.total_tokens, 250);
  assert.equal(metrics.rangeStartDate, "2026-07-18");
  assert.equal(metrics.rangeEndDate, "2026-07-18");
});

test("近七个自然日按每个会话的区间基线计算 Token 增量", () => {
  const range = resolveRange("last-7-days", "UTC", new Date("2026-07-18T12:00:00.000Z"));
  const metrics = collectMetrics(sessions, range);

  assert.equal(range.startDate, "2026-07-12");
  assert.equal(metrics.sessionCount, 2);
  assert.equal(metrics.completedTurns, 3);
  assert.equal(metrics.tokens.total_tokens, 350);
  assert.equal(metrics.calendarDayCount, 7);
  assert.equal(metrics.activeDayCount, 2);
});

test("本周范围从周一开始，不等同于最近七天", () => {
  const range = resolveRange("this-week", "UTC", new Date("2026-07-18T12:00:00.000Z"));
  const metrics = collectMetrics(sessions, range);

  assert.equal(range.startDate, "2026-07-13");
  assert.equal(metrics.completedTurns, 2);
  assert.equal(metrics.tokens.total_tokens, 250);
});

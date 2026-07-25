import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEmotionReceiptConfig,
  EMOTION_RECEIPT_STATE_IDS,
  selectEmotionReceiptState,
} from "../src/core/emotion-receipt.mjs";

function recordWith(overrides = {}) {
  const stats = {
    session_count: 1,
    completed_turns: 4,
    user_messages: 5,
    tool_calls: 8,
    interruptions: 0,
    work_duration_ms: 42 * 60_000,
    average_first_token_ms: 22_000,
    insights: { activity_by_hour: Array(24).fill(0) },
    ...overrides,
  };
  return {
    locale: "zh-CN",
    id: "cwr2_emotion-test",
    generated_at: "2026-07-26T02:00:00.000Z",
    period: { timezone: "Asia/Shanghai" },
    stats,
  };
}

test("情绪选择只使用当前记录中有证据的协作指标", () => {
  assert.equal(selectEmotionReceiptState(recordWith()), "stable");
  assert.equal(selectEmotionReceiptState(recordWith({ completed_turns: 8, interruptions: 2 })), "resilient");

  const nightActivity = Array(24).fill(0);
  nightActivity[23] = 3;
  assert.equal(selectEmotionReceiptState(recordWith({
    completed_turns: 6,
    insights: { activity_by_hour: nightActivity },
  })), "night");

  assert.equal(selectEmotionReceiptState(recordWith({ completed_turns: 2 })), "quiet");
  assert.equal(selectEmotionReceiptState(recordWith({ completed_turns: 12, user_messages: 13 })), "collaborative");
  assert.equal(selectEmotionReceiptState(recordWith({
    completed_turns: 6,
    average_first_token_ms: 2_000,
  })), "smooth");
});

test("七种情绪都进入同一份独立情绪小票配置", () => {
  const config = buildEmotionReceiptConfig(recordWith({
    completed_turns: 8,
    user_messages: 9,
    tool_calls: 42,
    work_duration_ms: 3_600_000,
  }));

  assert.deepEqual(Object.keys(config.states), EMOTION_RECEIPT_STATE_IDS);
  assert.equal(config.states.stable.state, "不用赶，也没有掉线");
  assert.equal(config.states.resilient.innerOs.length, 3);
  assert.equal(config.states.night.metrics[1].label, "深夜协作");
  assert.equal(config.states["self-rescue"].metrics[0].label, "尝试路径");
  assert.equal(config.states.collaborative.footerSignature, "TOGETHER, CLOSER");
  assert.equal(config.states.quiet.name, "安静守候");
  assert.equal(config.states.stable.metrics[0].value, "1 小时");
  assert.equal(config.states.stable.metrics[1].value, "8 轮");
  assert.match(config.fileBase, /^codex-emotion-receipt-2026-07-26$/);
});

test("英文情绪小票保持完整本地化", () => {
  const record = { ...recordWith({ completed_turns: 6, average_first_token_ms: 1_000 }), locale: "en" };
  const config = buildEmotionReceiptConfig(record, "en");

  assert.equal(config.shared.navLabel, "Today's mood");
  assert.equal(config.states.smooth.name, "In sync");
  assert.equal(config.states.stable.metrics[0].value, "42m");
  assert.equal(config.states.stable.metrics[1].value, "6 turns");
});

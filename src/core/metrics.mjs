import { dateKey, rowDate } from "../lib/time.mjs";
import { selectWorkProfileId } from "./presentation.mjs";

function zeroUsage() {
  return {
    input_tokens: 0,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 0,
  };
}

function subtractUsage(after = {}, before = {}) {
  const result = zeroUsage();
  for (const key of Object.keys(result)) {
    result[key] = Math.max(0, Number(after[key] || 0) - Number(before[key] || 0));
  }
  return result;
}

function addUsage(target, source) {
  for (const key of Object.keys(target)) target[key] += Number(source[key] || 0);
}

function sessionTokenUsage(rows, mode, targetDate, timezone) {
  const events = rows
    .filter((row) => row.type === "event_msg" && row.payload?.type === "token_count")
    .filter((row) => row.payload?.info?.total_token_usage)
    .sort((left, right) => (rowDate(left)?.getTime() || 0) - (rowDate(right)?.getTime() || 0));

  if (!events.length) return zeroUsage();
  if (mode === "latest") return { ...zeroUsage(), ...events.at(-1).payload.info.total_token_usage };

  const lastToday = events.filter((row) => {
    const date = rowDate(row);
    return date && dateKey(date, timezone) === targetDate;
  }).at(-1);
  if (!lastToday) return zeroUsage();

  const baseline = events.filter((row) => {
    const date = rowDate(row);
    return date && dateKey(date, timezone) < targetDate;
  }).at(-1)?.payload.info.total_token_usage || zeroUsage();
  return subtractUsage(lastToday.payload.info.total_token_usage, baseline);
}

function calculateWorkPoints(metrics) {
  const workMinutes = Math.ceil(metrics.workDurationMs / 60_000);
  const outputTokenK = Number(metrics.tokens.output_tokens || 0) / 1000;
  const reasoningTokenK = Number(metrics.tokens.reasoning_output_tokens || 0) / 1000;
  const points =
    60 +
    metrics.completedTurns * 8 +
    metrics.toolCalls * 3 +
    outputTokenK * 1.2 +
    reasoningTokenK * 1.8 +
    workMinutes * 2 +
    metrics.interruptions * 12;
  return Math.max(0, Math.round(points));
}

export function collectMetrics(sessions, mode, timezone) {
  const targetDate = dateKey(new Date(), timezone);
  const scopedSessions = [];
  const sessionIds = [];
  const tokens = zeroUsage();
  let completedTurns = 0;
  let userMessages = 0;
  let toolCalls = 0;
  let interruptions = 0;
  let workDurationMs = 0;
  let totalFirstTokenMs = 0;
  let firstTokenSamples = 0;
  const timestamps = [];
  const models = new Set();

  for (const session of sessions) {
    const scopedRows = mode === "latest"
      ? session.rows
      : session.rows.filter((row) => {
          const date = rowDate(row);
          return date && dateKey(date, timezone) === targetDate;
        });

    if (!scopedRows.length) continue;
    scopedSessions.push(session);
    sessionIds.push(session.sessionId);
    addUsage(tokens, sessionTokenUsage(session.rows, mode, targetDate, timezone));

    for (const row of scopedRows) {
      const date = rowDate(row);
      if (date) timestamps.push(date);

      if (row.type === "turn_context" && row.payload?.model) models.add(row.payload.model);
      if (row.type === "event_msg") {
        const eventType = row.payload?.type;
        if (eventType === "task_complete") {
          completedTurns += 1;
          workDurationMs += Number(row.payload.duration_ms || 0);
          if (Number.isFinite(row.payload.time_to_first_token_ms)) {
            totalFirstTokenMs += row.payload.time_to_first_token_ms;
            firstTokenSamples += 1;
          }
        } else if (eventType === "user_message") userMessages += 1;
        else if (eventType === "turn_aborted") {
          interruptions += 1;
          workDurationMs += Number(row.payload.duration_ms || 0);
        }
      }

      if (
        row.type === "response_item" &&
        (row.payload?.type === "custom_tool_call" || row.payload?.type === "function_call")
      ) toolCalls += 1;
    }

    const fallbackModel = [...session.rows]
      .reverse()
      .find((row) => row.type === "turn_context" && row.payload?.model)?.payload?.model;
    if (fallbackModel) models.add(fallbackModel);
  }

  if (!scopedSessions.length) {
    throw new Error(mode === "today" ? `没有找到 ${targetDate} 的 Codex 活动` : "没有找到可统计的 Codex 会话");
  }

  timestamps.sort((left, right) => left - right);
  const metrics = {
    mode,
    timezone,
    targetDate,
    sessionIds,
    sessionCount: scopedSessions.length,
    startAt: timestamps[0],
    endAt: timestamps.at(-1),
    completedTurns,
    userMessages,
    toolCalls,
    interruptions,
    workDurationMs,
    averageFirstTokenMs: firstTokenSamples ? totalFirstTokenMs / firstTokenSamples : 0,
    tokens,
    models: [...models],
  };
  metrics.workProfileId = selectWorkProfileId(metrics);
  metrics.workPoints = calculateWorkPoints(metrics);
  return metrics;
}

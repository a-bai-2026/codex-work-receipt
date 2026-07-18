import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { rowDate } from "../lib/time.mjs";

function walkJsonlFiles(directory, accumulator = []) {
  if (!fs.existsSync(directory)) return accumulator;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walkJsonlFiles(entryPath, accumulator);
    else if (entry.isFile() && entry.name.endsWith(".jsonl")) accumulator.push(entryPath);
  }
  return accumulator;
}

function readJsonl(filePath) {
  const rows = [];
  const source = fs.readFileSync(filePath, "utf8");
  for (const [lineIndex, line] of source.split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      console.warn(`跳过无法解析的记录：${path.basename(filePath)}:${lineIndex + 1}`);
    }
  }
  return rows;
}

function sessionFromFile(file) {
  const rows = readJsonl(file.filePath);
  const meta = rows.find((row) => row.type === "session_meta")?.payload || {};
  const timestamps = rows.map(rowDate).filter(Boolean).sort((left, right) => left - right);
  const fallbackDate = new Date(file.modifiedAt);
  return {
    rows,
    filePath: file.filePath,
    modifiedAt: file.modifiedAt,
    sessionId: meta.session_id || meta.id || path.basename(file.filePath, ".jsonl"),
    startAt: timestamps[0] || fallbackDate,
    endAt: timestamps.at(-1) || fallbackDate,
  };
}

function codexSessionFiles() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  const sessionsDirectory = path.join(codexHome, "sessions");
  const files = walkJsonlFiles(sessionsDirectory)
    .map((filePath) => ({ filePath, modifiedAt: fs.statSync(filePath).mtimeMs }))
    .sort((left, right) => right.modifiedAt - left.modifiedAt);
  if (!files.length) throw new Error(`没有在 ${sessionsDirectory} 找到 Codex 会话记录`);
  return files;
}

function calendarCandidates(files, startDate) {
  if (!startDate) return files;
  const approximateStart = Date.parse(`${startDate}T00:00:00.000Z`) - 48 * 60 * 60 * 1000;
  return files.filter((file) => file.modifiedAt >= approximateStart);
}

export function loadCodexSessions(range) {
  const files = codexSessionFiles();
  let candidates = files;

  if (range.scope === "latest") {
    candidates = files.slice(0, 40);
  } else if (range.scope === "session" && range.sessionId) {
    const filenameMatches = files.filter((file) => path.basename(file.filePath).includes(range.sessionId));
    candidates = filenameMatches.length ? filenameMatches : files;
  } else {
    candidates = calendarCandidates(files, range.startDate);
  }

  const sessions = candidates
    .map(sessionFromFile)
    .sort((left, right) => right.endAt - left.endAt);

  if (range.scope === "latest") return sessions.slice(0, 1);
  if (range.scope === "session") {
    const selected = sessions.find((session) => session.sessionId === range.sessionId);
    if (!selected) throw new Error(`没有找到指定的 Codex 会话：${range.sessionId}`);
    return [selected];
  }
  return sessions;
}

export function listRecentCodexSessions(limit = 10) {
  const sessions = codexSessionFiles()
    .slice(0, Math.max(40, limit * 3))
    .map(sessionFromFile)
    .filter((session) => session.rows.length)
    .sort((left, right) => right.endAt - left.endAt)
    .slice(0, limit);

  return sessions.map((session) => {
    let completedTurns = 0;
    let toolCalls = 0;
    let model = null;
    for (const row of session.rows) {
      if (row.type === "turn_context" && row.payload?.model) model = row.payload.model;
      if (row.type === "event_msg" && row.payload?.type === "task_complete") completedTurns += 1;
      if (
        row.type === "response_item" &&
        (row.payload?.type === "custom_tool_call" || row.payload?.type === "function_call")
      ) toolCalls += 1;
    }
    return {
      sessionId: session.sessionId,
      startAt: session.startAt,
      endAt: session.endAt,
      completedTurns,
      toolCalls,
      model,
    };
  });
}

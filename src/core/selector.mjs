import { createInterface } from "node:readline/promises";

import { parseCustomRange } from "./range.mjs";

function formatSessionDate(value, timezone, locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    timeZone: timezone,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function sessionLine(session, index, timezone, locale) {
  const start = formatSessionDate(session.startAt, timezone, locale);
  const end = formatSessionDate(session.endAt, timezone, locale);
  const model = session.model || (locale === "en" ? "model unknown" : "模型未记录");
  if (locale === "en") {
    return `${index + 1}. ${start}–${end} · ${session.completedTurns} turns · ${session.toolCalls} tool calls · ${model}`;
  }
  return `${index + 1}. ${start}–${end} · ${session.completedTurns} 轮 · ${session.toolCalls} 次工具调用 · ${model}`;
}

function projectLine(project, index, timezone, locale) {
  const latest = formatSessionDate(project.endAt, timezone, locale);
  const suffix = project.projectId.slice(-6).toUpperCase();
  if (locale === "en") {
    return `${index + 1}. ${project.projectLabel} · ${project.sessionCount} sessions · latest ${latest} · ${suffix}`;
  }
  return `${index + 1}. ${project.projectLabel} · ${project.sessionCount} 个会话 · 最近 ${latest} · ${suffix}`;
}

async function askForNumber(readline, prompt, minimum, maximum, fallback = null) {
  while (true) {
    const answer = (await readline.question(prompt)).trim();
    if (!answer && fallback !== null) return fallback;
    const value = Number(answer);
    if (Number.isInteger(value) && value >= minimum && value <= maximum) return value;
  }
}

async function askForValue(readline, prompt) {
  while (true) {
    const answer = (await readline.question(prompt)).trim();
    if (answer) return answer;
  }
}

async function chooseSession(readline, { locale, timezone, loadRecentSessions }) {
  const isEnglish = locale === "en";
  const sessions = await loadRecentSessions();
  if (!sessions.length) throw new Error(isEnglish ? "No Codex sessions found" : "没有找到可选择的 Codex 会话");

  console.log(isEnglish ? "\nRecent sessions:\n" : "\n最近的会话：\n");
  sessions.forEach((session, index) => console.log(sessionLine(session, index, timezone, locale)));
  const choice = await askForNumber(
    readline,
    isEnglish ? `\nEnter 1–${sessions.length}: ` : `\n请输入 1–${sessions.length}：`,
    1,
    sessions.length,
  );
  return { mode: "session", sessionId: sessions[choice - 1].sessionId };
}

async function chooseCustomRange(readline, { locale, timezone }) {
  const isEnglish = locale === "en";
  console.log(isEnglish ? "\nChoose custom range precision:\n" : "\n请选择自定义区间精度：\n");
  console.log(isEnglish
    ? "1. Calendar dates (accountable cwr2 facts)"
    : "1. 按自然日（生成可计入供销社的 cwr2 事实）");
  console.log(isEnglish
    ? "2. Exact date and time (private cwr1 summary)"
    : "2. 精确到时间（生成不计入供销社的私人 cwr1 摘要）");
  const precision = await askForNumber(
    readline,
    isEnglish ? "\nEnter 1–2 (default 1): " : "\n请输入 1–2（默认 1）：",
    1,
    2,
    1,
  );
  const dateOnly = precision === 1;
  const format = dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm";
  while (true) {
    const from = await askForValue(
      readline,
      isEnglish ? `Start (${format}, ${timezone}): ` : `开始（${format}，${timezone}）：`,
    );
    const to = await askForValue(
      readline,
      isEnglish ? `End (${format}, ${timezone}): ` : `结束（${format}，${timezone}）：`,
    );
    try {
      parseCustomRange(from, to, timezone);
    } catch (error) {
      console.log(isEnglish ? `Invalid range: ${error.message}` : `区间无效：${error.message}`);
      continue;
    }
    const confirmation = (await readline.question(isEnglish
      ? `Use ${from} to ${to} in ${timezone}? [Y/n]: `
      : `确认统计 ${timezone} 的 ${from} 至 ${to}？[Y/n]：`)).trim().toLowerCase();
    if (!confirmation || confirmation === "y" || confirmation === "yes") {
      return { mode: "custom-range", sessionId: null, from, to };
    }
  }
}

async function chooseProjectRange(readline, { locale, timezone, loadRecentProjects }) {
  const isEnglish = locale === "en";
  const projects = await loadRecentProjects();
  if (!projects.length) throw new Error(isEnglish ? "No projects found in recent Codex sessions" : "最近的 Codex 会话中没有找到项目");

  console.log(isEnglish ? "\nRecent projects:\n" : "\n最近的项目：\n");
  projects.forEach((project, index) => console.log(projectLine(project, index, timezone, locale)));
  const projectChoice = await askForNumber(
    readline,
    isEnglish ? `\nEnter 1–${projects.length}: ` : `\n请输入 1–${projects.length}：`,
    1,
    projects.length,
  );

  console.log(isEnglish ? "\nChoose a range for this project:\n" : "\n请选择该项目的统计范围：\n");
  console.log(isEnglish ? "1. Today (recommended)" : "1. 今天（推荐）");
  console.log(isEnglish ? "2. Last 3 hours" : "2. 最近 3 小时");
  console.log(isEnglish ? "3. Last 7 calendar days" : "3. 最近 7 个自然日");
  console.log(isEnglish ? "4. This week" : "4. 本周");
  console.log(isEnglish ? "5. Custom range" : "5. 自定义时间区间");
  const rangeChoice = await askForNumber(
    readline,
    isEnglish ? "\nEnter 1–5 (default 1): " : "\n请输入 1–5（默认 1）：",
    1,
    5,
    1,
  );
  const projectId = projects[projectChoice - 1].projectId;
  if (rangeChoice === 1) return { mode: "today", projectId };
  if (rangeChoice === 2) return { mode: "last-hours", hours: 3, projectId };
  if (rangeChoice === 3) return { mode: "last-7-days", projectId };
  if (rangeChoice === 4) return { mode: "this-week", projectId };
  return { ...(await chooseCustomRange(readline, { locale, timezone })), projectId };
}

async function withReadline(callback) {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await callback(readline);
  } finally {
    readline.close();
  }
}

export function promptForSpecificSession(options) {
  return withReadline((readline) => chooseSession(readline, options));
}

export function promptForCustomRange(options) {
  return withReadline((readline) => chooseCustomRange(readline, options));
}

export function promptForProjectRange(options) {
  return withReadline((readline) => chooseProjectRange(readline, options));
}

export async function promptForRange({
  locale,
  timezone,
  loadRecentSessions,
  loadRecentProjects,
}) {
  const isEnglish = locale === "en";
  return withReadline(async (readline) => {
    console.log(isEnglish ? "\nChoose a receipt range:\n" : "\n请选择小票统计范围：\n");
    console.log(isEnglish ? "1. All activity today (recommended)" : "1. 今天全部活动（推荐）");
    console.log(isEnglish
      ? "2. Last 3 hours (private rolling summary; not counted by the cooperative)"
      : "2. 最近 3 小时（私人滚动摘要，不计入供销社）");
    console.log(isEnglish ? "3. Last 7 calendar days" : "3. 最近 7 个自然日");
    console.log(isEnglish ? "4. This week (Monday to now)" : "4. 本周（周一至今）");
    console.log(isEnglish ? "5. Custom date or time range" : "5. 自定义日期或时间区间");
    console.log(isEnglish ? "6. Choose a specific session" : "6. 选择一个具体会话");
    console.log(isEnglish ? "7. Choose a project" : "7. 选择一个项目");

    const choice = await askForNumber(
      readline,
      isEnglish ? "\nEnter 1–7 (default 1): " : "\n请输入 1–7（默认 1）：",
      1,
      7,
      1,
    );

    if (choice === 1) return { mode: "today", sessionId: null };
    if (choice === 2) return { mode: "last-hours", sessionId: null, hours: 3 };
    if (choice === 3) return { mode: "last-7-days", sessionId: null };
    if (choice === 4) return { mode: "this-week", sessionId: null };
    if (choice === 5) return chooseCustomRange(readline, { locale, timezone });
    if (choice === 6) return chooseSession(readline, { locale, timezone, loadRecentSessions });
    return chooseProjectRange(readline, { locale, timezone, loadRecentProjects });
  });
}

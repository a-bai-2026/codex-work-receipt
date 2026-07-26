import { normalizeScope } from "./range.mjs";
import { DEFAULT_RECEIPT_TYPE, RECEIPT_TYPE_VALUES } from "./receipt-types.mjs";
import { SUPPORTED_LOCALES } from "../lib/locale.mjs";

export const HELP_TOPICS = Object.freeze(["receipt", "range", "auto", "companion", "options", "all"]);

const HELP_SECTIONS = {
  "zh-CN": {
    heading: "Codex AI 小票",
    overview: `
用法：
  npx codex-work-receipt@latest
  npx codex-work-receipt@latest --setup
  npx codex-work-receipt@latest --today --receipt-type both

常用命令：
  --setup                     设置自动/手动模式和默认小票类型
  --receipt-type <type>       小票类型：work、emotion、both（默认 both）
  --today                     生成今天的小票
  --latest                    生成最近一次小票
  --no-open                   生成后不自动打开浏览器

分类帮助：
  --help receipt              小票类型
  --help range                时间、会话和项目范围
  --help auto                 自动保存和手动模式
  --help companion            票仔和 Codex Skill
  --help options              语言、主题和输出路径
  --help all                  完整命令参考`,
    receipt: `
小票类型：
  --receipt-type work         只输出打工小票
  --receipt-type emotion      只输出情绪小票
  --receipt-type both         两种都输出（默认，推荐）

示例：
  npx codex-work-receipt@latest --today --receipt-type work
  npx codex-work-receipt@latest --today --receipt-type emotion
  npx codex-work-receipt@latest --today --receipt-type both`,
    range: `
统计范围：
  --latest                    最近活跃的 Codex 会话（默认）
  --today                     今天的全部 Codex 活动
  --hours <1-168>             最近若干小时
  --range last-7-days         最近 7 个自然日
  --range this-week           本周
  --custom-range              交互选择自定义范围
  --from <value> --to <value> 指定日期或精确时间范围
  --session <id>              指定一个会话
  --select-session            交互选择会话
  --project <directory>       指定本地项目
  --select-project            交互选择项目和范围`,
    auto: `
自动与手动：
  --setup                     交互设置保存模式和小票类型
  --enable-auto               启用 Stop Hook 自动保存
  --disable-auto              切换为仅手动
  --auto-status               查看当前模式和小票类型

示例：
  npx codex-work-receipt@latest --enable-auto --receipt-type both
  npx codex-work-receipt@latest --disable-auto --receipt-type emotion`,
    companion: `
票仔与 Codex Skill：
  --install-companion         同时安装票仔和 Skill
  --install-pet               只安装票仔
  --uninstall-pet             卸载票仔
  --install-skill             只安装 AI 打工小票 Skill`,
    options: `
通用选项：
  --lang <zh-CN|en>           小票语言
  --timezone <IANA name>      时区，例如 Asia/Shanghai
  --theme <name>              classic、diner、payroll
  --output <file>             指定 HTML 输出路径
  --data-dir <directory>      指定本地结构数据目录
  --no-open                   生成后不打开浏览器
  --help [topic]              查看分类帮助
  -h [topic]                  --help 的短别名`,
  },
  en: {
    heading: "Codex AI Receipt",
    overview: `
Usage:
  npx codex-work-receipt@latest --lang en
  npx codex-work-receipt@latest --setup --lang en
  npx codex-work-receipt@latest --today --receipt-type both --lang en

Common commands:
  --setup                     Configure automatic/manual saving and receipt type
  --receipt-type <type>       work, emotion, or both (default: both)
  --today                     Generate today's receipt
  --latest                    Generate the latest receipt
  --no-open                   Do not open the browser

Help topics:
  --help receipt              Receipt types
  --help range                Time, session, and project ranges
  --help auto                 Automatic and manual saving
  --help companion            Ticket Buddy and Codex skills
  --help options              Language, theme, and output options
  --help all                  Complete command reference`,
    receipt: `
Receipt types:
  --receipt-type work         Work receipt only
  --receipt-type emotion      Mood receipt only
  --receipt-type both         Both receipts (default, recommended)

Examples:
  npx codex-work-receipt@latest --today --receipt-type work --lang en
  npx codex-work-receipt@latest --today --receipt-type emotion --lang en
  npx codex-work-receipt@latest --today --receipt-type both --lang en`,
    range: `
Ranges:
  --latest                    Latest active Codex session (default)
  --today                     All Codex activity today
  --hours <1-168>             Recent hours
  --range last-7-days         Last 7 calendar days
  --range this-week           This week
  --custom-range              Choose a custom range interactively
  --from <value> --to <value> Set a date or exact-time range
  --session <id>              Select one session by id
  --select-session            Choose a session interactively
  --project <directory>       Limit to a local project
  --select-project            Choose a project and range`,
    auto: `
Automatic and manual saving:
  --setup                     Configure saving mode and receipt type
  --enable-auto               Enable Stop Hook automatic saving
  --disable-auto              Switch to manual only
  --auto-status               Show the current mode and receipt type

Examples:
  npx codex-work-receipt@latest --enable-auto --receipt-type both --lang en
  npx codex-work-receipt@latest --disable-auto --receipt-type emotion --lang en`,
    companion: `
Ticket Buddy and Codex skills:
  --install-companion         Install Ticket Buddy and the receipt skill
  --install-pet               Install Ticket Buddy only
  --uninstall-pet             Remove Ticket Buddy
  --install-skill             Install the AI Work Receipt skill only`,
    options: `
General options:
  --lang <zh-CN|en>           Receipt language
  --timezone <IANA name>      Timezone, for example Asia/Shanghai
  --theme <name>              classic, diner, or payroll
  --output <file>             Set the HTML output path
  --data-dir <directory>      Set the local structured-data directory
  --no-open                   Do not open the browser
  --help [topic]              Show categorized help
  -h [topic]                  Short alias for --help`,
  },
};

export function printHelp(locale = "zh-CN", topic = null) {
  const copy = HELP_SECTIONS[locale === "en" ? "en" : "zh-CN"];
  const selected = topic || "overview";
  const sections = selected === "all"
    ? ["overview", "receipt", "range", "auto", "companion", "options"]
    : [selected];
  console.log(`\n${copy.heading}${sections.map((key) => copy[key]).join("\n")}\n`);
}

export function parseArgs(argv) {
  const result = {
    mode: "latest",
    modeExplicit: false,
    sessionId: null,
    selectSession: false,
    project: null,
    projectId: null,
    selectProject: false,
    hours: null,
    customRange: false,
    from: null,
    to: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
    locale: "zh-CN",
    theme: "classic",
    receiptType: DEFAULT_RECEIPT_TYPE,
    receiptTypeExplicit: false,
    output: null,
    dataDir: null,
    installSkill: false,
    installPet: false,
    uninstallPet: false,
    installCompanion: false,
    setup: false,
    enableAuto: false,
    disableAuto: false,
    autoStatus: false,
    open: true,
    help: false,
    helpTopic: null,
  };

  const optionsWithValues = new Map([
    ["--timezone", "timezone"],
    ["--lang", "locale"],
    ["--theme", "theme"],
    ["--receipt-type", "receiptType"],
    ["--output", "output"],
    ["--data-dir", "dataDir"],
    ["--session", "sessionId"],
    ["--project", "project"],
    ["--hours", "hours"],
    ["--from", "from"],
    ["--to", "to"],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--latest") {
      result.mode = "latest";
      result.modeExplicit = true;
    } else if (argument === "--today") {
      result.mode = "today";
      result.modeExplicit = true;
    } else if (argument === "--custom-range") {
      result.mode = "custom-range";
      result.modeExplicit = true;
      result.customRange = true;
    } else if (argument === "--select-session") result.selectSession = true;
    else if (argument === "--select-project") result.selectProject = true;
    else if (argument === "--install-pet") result.installPet = true;
    else if (argument === "--uninstall-pet") result.uninstallPet = true;
    else if (argument === "--install-companion") result.installCompanion = true;
    else if (argument === "--range") {
      const value = argv[++index];
      if (!value) throw new Error("--range 需要提供值");
      const scope = normalizeScope(value);
      if (!scope || scope === "session") throw new Error(`不支持的统计范围：${value}`);
      result.mode = scope;
      result.modeExplicit = true;
    } else if (argument === "--install-skill") result.installSkill = true;
    else if (argument === "--setup") result.setup = true;
    else if (argument === "--enable-auto") result.enableAuto = true;
    else if (argument === "--disable-auto") result.disableAuto = true;
    else if (argument === "--auto-status") result.autoStatus = true;
    else if (argument === "--no-open") result.open = false;
    else if (argument === "--help" || argument === "-h") {
      result.help = true;
      const next = argv[index + 1];
      if (next && !next.startsWith("-")) {
        result.helpTopic = next;
        index += 1;
      }
    }
    else if (optionsWithValues.has(argument)) {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} 需要提供值`);
      const key = optionsWithValues.get(argument);
      result[key] = value;
      if (key === "receiptType") {
        result.receiptTypeExplicit = true;
      } else if (key === "sessionId") {
        result.mode = "session";
        result.modeExplicit = true;
      } else if (key === "hours") {
        result.mode = "last-hours";
        result.modeExplicit = true;
      } else if (key === "from" || key === "to") {
        result.mode = "custom-range";
        result.modeExplicit = true;
        result.customRange = true;
      }
    } else throw new Error(`不认识的参数：${argument}`);
  }

  if (!new Set(["classic", "diner", "payroll"]).has(result.theme)) {
    throw new Error(`不支持的主题：${result.theme}`);
  }
  if (!SUPPORTED_LOCALES.has(result.locale)) {
    throw new Error(`不支持的语言：${result.locale}`);
  }
  if (!RECEIPT_TYPE_VALUES.includes(result.receiptType)) {
    throw new Error(`不支持的小票类型：${result.receiptType}；请使用 work、emotion 或 both`);
  }
  if (result.helpTopic && !HELP_TOPICS.includes(result.helpTopic)) {
    throw new Error(`不支持的帮助分类：${result.helpTopic}；请使用 ${HELP_TOPICS.join("、")}`);
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: result.timezone }).format(new Date());
  } catch {
    throw new Error(`不支持的时区：${result.timezone}`);
  }
  if (result.hours !== null) {
    result.hours = Number(result.hours);
    if (!Number.isInteger(result.hours) || result.hours < 1 || result.hours > 168) {
      throw new Error("--hours 需要 1 至 168 之间的整数");
    }
  }
  if (result.mode === "last-hours" && result.hours === null) result.hours = 3;
  if (result.mode === "custom-range") result.customRange = true;
  if (Boolean(result.from) !== Boolean(result.to)) throw new Error("--from 和 --to 必须同时使用");
  if (result.selectSession && result.selectProject) throw new Error("不能同时选择会话和项目");
  if ((result.selectSession || result.selectProject) && result.modeExplicit) {
    throw new Error("交互选择参数不能与统计范围参数同时使用");
  }
  if (result.selectSession && result.project) throw new Error("指定会话时不能同时指定项目");
  if (result.selectProject && result.project) throw new Error("不能同时使用 --project 和 --select-project");
  if (result.project && !result.modeExplicit) {
    result.mode = "today";
    result.modeExplicit = true;
  }
  const managementActions = [
    result.setup,
    result.enableAuto,
    result.disableAuto,
    result.autoStatus,
  ].filter(Boolean).length;
  if (managementActions > 1) throw new Error("自动保存管理参数不能同时使用");
  if (managementActions && result.modeExplicit) throw new Error("自动保存管理参数不能与统计范围参数同时使用");
  if (managementActions && (result.selectSession || result.selectProject || result.project)) {
    throw new Error("自动保存管理参数不能与会话或项目选择参数同时使用");
  }
  if (managementActions && (
    result.installSkill || result.installPet || result.uninstallPet || result.installCompanion
  )) throw new Error("自动保存管理参数不能与 Skill 或桌宠管理参数同时使用");
  if ((result.selectSession || result.selectProject || result.project) && (
    result.installSkill || result.installPet || result.uninstallPet || result.installCompanion
  )) throw new Error("会话或项目选择参数不能与 Skill 或桌宠管理参数同时使用");
  if (result.receiptTypeExplicit && (
    result.installSkill || result.installPet || result.uninstallPet || result.installCompanion
  )) throw new Error("--receipt-type 不能与 Skill 或桌宠管理参数同时使用");
  return result;
}

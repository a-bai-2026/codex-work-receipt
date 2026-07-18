export function printHelp(locale = "zh-CN") {
  console.log(locale === "en" ? `
Codex AI Work Receipt

Usage:
  npx codex-work-receipt@latest --latest --lang en
  npx codex-work-receipt@latest --today --lang en
  npx codex-work-receipt@latest --install-skill --lang en

Options:
  --latest                    Summarize the latest active Codex session (default)
  --today                     Summarize all Codex activity from today
  --timezone <name>           Use an IANA timezone, for example Asia/Shanghai
  --lang <name>               Receipt language: zh-CN, en
  --theme <name>              Default theme: classic, diner, payroll
  --output <file>             Set the generated HTML path
  --data-dir <directory>      Set the local structured-history directory
  --install-skill             Install the natural-language Codex skill
  --no-open                   Do not open the browser after generation
  --help                      Show help
` : `
Codex AI 打工小票

用法：
  npx codex-work-receipt@latest --latest
  npx codex-work-receipt@latest --today
  npx codex-work-receipt@latest --install-skill

选项：
  --latest                    统计最近活跃的 Codex 会话（默认）
  --today                     统计本地时区今天发生的全部 Codex 活动
  --timezone <name>           指定 IANA 时区，例如 Asia/Shanghai
  --lang <name>               小票语言：zh-CN、en
  --theme <name>              默认主题：classic、diner、payroll
  --output <file>             指定生成的 HTML 文件，默认写入 ./codex-work-receipt-output/
  --data-dir <directory>      指定本地结构数据目录
  --install-skill             安装可通过自然语言调用的 Codex Skill
  --no-open                   生成后不自动打开浏览器
  --help                      显示帮助
`);
}

export function parseArgs(argv) {
  const result = {
    mode: "latest",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
    locale: "zh-CN",
    theme: "classic",
    output: null,
    dataDir: null,
    installSkill: false,
    open: true,
  };

  const optionsWithValues = new Map([
    ["--timezone", "timezone"],
    ["--lang", "locale"],
    ["--theme", "theme"],
    ["--output", "output"],
    ["--data-dir", "dataDir"],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--latest") result.mode = "latest";
    else if (argument === "--today") result.mode = "today";
    else if (argument === "--install-skill") result.installSkill = true;
    else if (argument === "--no-open") result.open = false;
    else if (argument === "--help" || argument === "-h") result.help = true;
    else if (optionsWithValues.has(argument)) {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} 需要提供值`);
      result[optionsWithValues.get(argument)] = value;
    } else throw new Error(`不认识的参数：${argument}`);
  }

  if (!new Set(["classic", "diner", "payroll"]).has(result.theme)) {
    throw new Error(`不支持的主题：${result.theme}`);
  }
  if (!new Set(["zh-CN", "en"]).has(result.locale)) {
    throw new Error(`不支持的语言：${result.locale}`);
  }
  return result;
}

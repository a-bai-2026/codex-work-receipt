import { createInterface } from "node:readline/promises";

export async function promptForGenerationMode({ locale = "zh-CN" } = {}) {
  const isEnglish = locale === "en";
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(isEnglish ? "\nHow should AI Work Receipt save receipts?\n" : "\n你希望怎样保存 AI 打工小票？\n");
    console.log(isEnglish
      ? "1. Automatic saving (recommended)"
      : "1. 自动保存（推荐）");
    console.log(isEnglish
      ? "   Quietly refresh today's receipt and WeChat import file whenever a Codex turn stops."
      : "   Codex 每完成一轮工作，就静默刷新今天的小票和微信导入文件。");
    console.log(isEnglish
      ? "2. Manual only"
      : "2. 仅手动");
    console.log(isEnglish
      ? "   Generate only when you run the command or ask Ticket Buddy."
      : "   只有执行命令或告诉票仔时才生成。");

    while (true) {
      const answer = (await readline.question(
        isEnglish ? "\nEnter 1–2 (default 1): " : "\n请输入 1–2（默认 1）：",
      )).trim();
      if (!answer || answer === "1") return "automatic";
      if (answer === "2") return "manual";
    }
  } finally {
    readline.close();
  }
}

export async function promptForReceiptType({ locale = "zh-CN" } = {}) {
  const isEnglish = locale === "en";
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(isEnglish ? "\nWhich receipts should be included?\n" : "\n你希望输出哪种小票？\n");
    console.log(isEnglish
      ? "1. Both receipts (recommended)"
      : "1. 两种都输出（推荐）");
    console.log(isEnglish
      ? "   Include both the work receipt and mood receipt in one HTML report."
      : "   在同一份 HTML 报告中同时包含打工小票和情绪小票。");
    console.log(isEnglish ? "2. Work receipt only" : "2. 只输出打工小票");
    console.log(isEnglish ? "3. Mood receipt only" : "3. 只输出情绪小票");

    while (true) {
      const answer = (await readline.question(
        isEnglish ? "\nEnter 1–3 (default 1): " : "\n请输入 1–3（默认 1）：",
      )).trim();
      if (!answer || answer === "1") return "both";
      if (answer === "2") return "work";
      if (answer === "3") return "emotion";
    }
  } finally {
    readline.close();
  }
}

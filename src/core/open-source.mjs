export const OPEN_SOURCE_REPOSITORY_URL = "https://github.com/a-bai-2026/codex-work-receipt";

const PROMPTS = {
  "zh-CN": {
    receipt: {
      label: "开源项目",
      message: "如果你也喜欢这个 AI 小票工具，欢迎来 GitHub 给我点个 Star ⭐",
    },
    pet: {
      label: "票仔开源地址",
      message: "如果你也喜欢票仔，欢迎来 GitHub 给我点个 Star ⭐",
    },
  },
  en: {
    receipt: {
      label: "Open-source project",
      message: "If you enjoy AI Work Receipt, a GitHub Star would mean a lot ⭐",
    },
    pet: {
      label: "Ticket Buddy source",
      message: "If you enjoy Ticket Buddy, a GitHub Star would mean a lot ⭐",
    },
  },
  ja: {
    receipt: {
      label: "オープンソースプロジェクト",
      message: "AI 作業レシートが役に立ったら、GitHub で Star をいただけるとうれしいです ⭐",
    },
    pet: {
      label: "票仔のソース",
      message: "票仔を気に入ってくれたら、GitHub で Star をいただけるとうれしいです ⭐",
    },
  },
};

const HTML_STAR_LABELS = {
  "zh-CN": "喜欢这个工具？点个 Star ⭐",
  en: "Enjoying it? Star on GitHub ⭐",
  ja: "このツールが役に立ったら、GitHub で Star をお願いします ⭐",
};

export function getOpenSourcePrompt(kind = "receipt", locale = "zh-CN") {
  const normalizedLocale = locale === "en" || locale === "ja" ? locale : "zh-CN";
  const localized = PROMPTS[normalizedLocale];
  const copy = localized[kind] || localized.receipt;
  return {
    url: OPEN_SOURCE_REPOSITORY_URL,
    label: copy.label,
    message: copy.message,
    separator: normalizedLocale === "zh-CN" ? "：" : ": ",
  };
}

export function getHtmlStarPrompt(locale = "zh-CN") {
  const normalizedLocale = locale === "en" || locale === "ja" ? locale : "zh-CN";
  return {
    url: OPEN_SOURCE_REPOSITORY_URL,
    label: HTML_STAR_LABELS[normalizedLocale],
  };
}

export function printOpenSourcePrompt(kind, locale, writeLine = console.log) {
  const prompt = getOpenSourcePrompt(kind, locale);
  writeLine("");
  writeLine(`${prompt.label}${prompt.separator}${prompt.url}`);
  writeLine(prompt.message);
}

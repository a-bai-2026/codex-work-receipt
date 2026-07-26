export const DEFAULT_LOCALE = "zh-CN";

const LOCALE_METADATA = Object.freeze({
  "zh-CN": Object.freeze({
    intl: "zh-CN",
    languageArgument: "",
  }),
  en: Object.freeze({
    intl: "en-US",
    languageArgument: " --lang en",
  }),
  ja: Object.freeze({
    intl: "ja-JP",
    languageArgument: " --lang ja",
  }),
});

export const SUPPORTED_LOCALES = new Set(Object.keys(LOCALE_METADATA));

export function normalizeLocale(locale = DEFAULT_LOCALE) {
  return SUPPORTED_LOCALES.has(locale) ? locale : DEFAULT_LOCALE;
}

export function intlLocale(locale = DEFAULT_LOCALE) {
  return LOCALE_METADATA[normalizeLocale(locale)].intl;
}

export function languageArgument(locale = DEFAULT_LOCALE) {
  return LOCALE_METADATA[normalizeLocale(locale)].languageArgument;
}

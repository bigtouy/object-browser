import i18next, { InitOptions } from "i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

const resources = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
} as const;

export type SupportedLanguage = keyof typeof resources;

const defaultOptions: InitOptions = {
  lng: "zh",
  fallbackLng: "zh",
  debug: false,
  resources,
  defaultNS: "translation",
  keySeparator: false,
  nsSeparator: false,
  interpolation: {
    escapeValue: false,
  },
};

const initPromise = i18next.isInitialized
  ? Promise.resolve(i18next)
  : i18next.init(defaultOptions);

export const availableLanguages = Object.keys(resources) as SupportedLanguage[];

export const changeLanguage = (lng: SupportedLanguage) => i18next.changeLanguage(lng);

export default initPromise;

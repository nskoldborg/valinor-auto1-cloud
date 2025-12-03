import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import your language JSON files dynamically
import en from "./languages/en.json";

// Dynamically load all language JSONs in /src/languages
const languageModules = import.meta.glob("./languages/*.json", { eager: true });
const resources = {};

for (const [path, module] of Object.entries(languageModules)) {
  const langCode = path.split("/").pop().replace(".json", "");
  resources[langCode] = { translation: module.default };
}

// Fallback to English if missing
if (!resources.en) {
  resources.en = { translation: en };
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
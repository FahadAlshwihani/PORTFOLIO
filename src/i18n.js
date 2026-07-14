import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar.json";
import en from "./locales/en.json";

/* ============================
   Detect Initial Language
============================ */

const savedLanguage = localStorage.getItem("language");

const browserLanguage = navigator.language?.startsWith("ar")
  ? "ar"
  : navigator.language?.startsWith("en")
  ? "en"
  : null;

const initialLanguage =
  savedLanguage ||
  browserLanguage ||
  "ar";

/* ============================
   Initialize i18next
============================ */

i18n
  .use(initReactI18next)
  .init({
    lng: initialLanguage,

    fallbackLng: "ar",

    supportedLngs: ["ar", "en"],

    resources: {
      ar: {
        translation: ar,
      },

      en: {
        translation: en,
      },
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

/* ============================
   Persist Language
============================ */

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
});

export default i18n;
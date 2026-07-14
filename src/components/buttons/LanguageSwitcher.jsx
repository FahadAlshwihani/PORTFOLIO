import { useTranslation } from "react-i18next";
import "../../styles/LanguageSwitcher.css";

// A tiny terminal-style token, not a UI control — no border, no
// background, no capsule. "$LANG" reads like a shell variable name so
// it stays literal ASCII in both languages (same reasoning as Contact's
// shell commands never translating); only the "↳ EN"/"↳ AR" value below
// it shows the language the visitor can switch TO.
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? "en" : "ar");
  };

  const targetLabel = isArabic ? t("navigation.switchToEnglish") : t("navigation.switchToArabic");

  return (
    <button
      type="button"
      className="lang-switch"
      dir="ltr"
      onClick={toggleLanguage}
      aria-label={`${t("navigation.language")} — ${targetLabel}`}
    >
      <span className="lang-switch-tag">$LANG</span>
      <span className="lang-switch-value">↳ {isArabic ? "EN" : "AR"}</span>
    </button>
  );
}

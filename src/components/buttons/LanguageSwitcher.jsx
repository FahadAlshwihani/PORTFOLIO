import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {

    const { i18n } = useTranslation();

    const currentLanguage = i18n.language;

    const toggleLanguage = () => {

        const nextLanguage =
            currentLanguage === "ar"
                ? "en"
                : "ar";

        i18n.changeLanguage(nextLanguage);

    };

    return (
        <button
            onClick={toggleLanguage}
            type="button"
        >
            {currentLanguage === "ar"
                ? "English"
                : "العربية"}
        </button>
    );

}
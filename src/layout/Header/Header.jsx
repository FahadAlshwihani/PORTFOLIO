import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import StaggeredMenu from "./StaggeredMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import { useActiveSection } from "../../hooks/useActiveSection";

// Matches the section ids rendered in Homepage.jsx — stable module-level
// reference so useActiveSection's effect doesn't re-run every render.
const SECTION_IDS = ["home", "about", "experience", "projects", "skills", "contact"];
const MENU_COLORS = ["#B19EEF", "#5227FF", "#1A1528"];
const LANGUAGE_SWITCHER = <LanguageSwitcher />;

export default function Header({ isFixed }) {
  const { t, i18n } = useTranslation();
  const activeId = useActiveSection(SECTION_IDS);
  const isRtl = i18n.language === "ar";
  const lang = i18n.language;

  // These props only change with language, but Header re-renders on every
  // scroll-driven activeId change. Memoizing them keeps StaggeredMenu
  // (now React.memo) from doing prop-diff churn on the large nav panel
  // for anything other than the activeItemId it actually needs.
  const socialItems = useMemo(
    () => [
      { label: t("navigation.socials.github"), link: "https://github.com/FahadAlshwihani" },
      { label: t("navigation.socials.linkedin"), link: "https://www.linkedin.com/in/fahad-alshwihani/" },
      { label: t("navigation.socials.whatsapp"), link: "https://wa.me/966509739309" },
    ],
    [t]
  );

  const menuItems = useMemo(
    () => SECTION_IDS.map((id) => ({ id, label: t(`navigation.${id}`), link: `/#${id}` })),
    [t]
  );

  const switchLanguage = useCallback(() => {
    i18n.changeLanguage(isRtl ? "en" : "ar");
  }, [i18n, isRtl]);

  // A utility, not a navigation destination — sits opposite the social
  // links (see StaggeredMenu.jsx), never as a numbered page. "$LANG"
  // and "↳" are literal tokens, like a shell variable name, so they
  // aren't translated; only the language name is — and only that name
  // switches to Thmanyah Display when it's actually the Arabic word
  // (isTargetArabic), never when it's "English".
  const languageAction = useMemo(
    () => ({
      tag: "$LANG",
      name: isRtl ? "English" : "العربية",
      isTargetArabic: !isRtl,
      ariaLabel: `${t("navigation.language")} — ${isRtl ? t("navigation.switchToEnglish") : t("navigation.switchToArabic")}`,
      onClick: switchLanguage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, isRtl, lang, switchLanguage]
  );

  return (
    <StaggeredMenu
      position={isRtl ? "left" : "right"}
      colors={MENU_COLORS}
      accentColor="#5227FF"
      menuButtonColor="#fff"
      openMenuButtonColor="#000000ff"
      isFixed={isFixed}
      items={menuItems}
      activeItemId={activeId}
      socialItems={socialItems}
      socialsTitle={t("navigation.connect")}
      languageAction={languageAction}
      displaySocials={true}
      displayItemNumbering={true}
      menuButtonText={t("navigation.menu")}
      closeButtonText={t("navigation.close")}
      languageSwitcher={LANGUAGE_SWITCHER}
    />
  );
}

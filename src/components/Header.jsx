import React from "react";
import { useTranslation } from "react-i18next";
import StaggeredMenu from "./ui/StaggeredMenu";
import LanguageSwitcher from "./buttons/LanguageSwitcher";
import { useActiveSection } from "../hooks/useActiveSection";

// Matches the section ids rendered in Homepage.jsx — stable module-level
// reference so useActiveSection's effect doesn't re-run every render.
const SECTION_IDS = ["home", "about", "experience", "projects", "skills", "contact"];

const socialItems = [
  { label: "GitHub", link: "https://github.com/FahadAlshwihani" },
  { label: "LinkedIn", link: "https://linkedin.com/in/fahad-alshwihani" },
  { label: "WhatsApp", link: "https://wa.me/966509739309" },
];

export default function Header({ isFixed }) {
  const { t, i18n } = useTranslation();
  const activeId = useActiveSection(SECTION_IDS);
  const isRtl = i18n.language === "ar";

  const menuItems = SECTION_IDS.map((id) => ({
    id,
    label: t(`navigation.${id}`),
    link: `/#${id}`,
  }));

  // A utility, not a navigation destination — sits opposite the social
  // links (see StaggeredMenu.jsx), never as a numbered page. "$LANG"
  // and "↳" are literal tokens, like a shell variable name, so they
  // aren't translated; only the language name is — and only that name
  // switches to Thmanyah Display when it's actually the Arabic word
  // (isTargetArabic), never when it's "English".
  const languageAction = {
    tag: "$LANG",
    name: isRtl ? "English" : "العربية",
    isTargetArabic: !isRtl,
    ariaLabel: `${t("navigation.language")} — ${isRtl ? t("navigation.switchToEnglish") : t("navigation.switchToArabic")}`,
    onClick: () => i18n.changeLanguage(isRtl ? "en" : "ar"),
  };

  return (
    <StaggeredMenu
      position={isRtl ? "left" : "right"}
      colors={["#B19EEF", "#5227FF", "#1A1528"]}
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
      languageSwitcher={<LanguageSwitcher />}
    />
  );
}

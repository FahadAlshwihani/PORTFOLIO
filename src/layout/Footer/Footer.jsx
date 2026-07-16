import React from "react";
import { useTranslation } from "react-i18next";
import Reveal from "../../components/ui/Reveal/Reveal";
import "./Footer.css";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <Reveal as="div" preset="subtitle" className="footer-inner">
        <span className="footer-copyright">{t("footer.copyright", { year: new Date().getFullYear() })}</span>
        <span className="footer-signature">{t("footer.signature")}</span>
      </Reveal>
    </footer>
  );
};

export default Footer;

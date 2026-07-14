import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/global.css";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-copyright">{t("footer.copyright", { year: new Date().getFullYear() })}</span>
        <span className="footer-signature">{t("footer.signature")}</span>
      </div>
    </footer>
  );
};

export default Footer;

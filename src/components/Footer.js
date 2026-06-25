import React from "react";
import "../styles/global.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>© {new Date().getFullYear()} codeduo — Built by Fahad</div>
        <div className="footer-links">
          <a href="mailto:hello@codeduo.sa">hello@codeduo.sa</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

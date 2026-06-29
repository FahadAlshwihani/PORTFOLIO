import React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Homepage from "./pages/Homepage";

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {

    const dir =
      i18n.language === "ar"
        ? "rtl"
        : "ltr";

    document.documentElement.lang = i18n.language;
    document.documentElement.dir = dir;

    document.body.dir = dir;

    document.body.classList.remove("rtl", "ltr");
    document.body.classList.add(dir);

  }, [i18n.language]);

  return (
    <>
      <Header isFixed={true} />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="*" element={<Homepage />} />
      </Routes>
      <Footer />
    </>
  );
}

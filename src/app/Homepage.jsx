import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HeroSection from "../sections/hero/HeroSection";
import HeroSilkTransition from "../sections/hero/HeroSilkTransition";
import EndingScene from "../sections/contact/EndingScene";
import About from "../sections/about/About";
import Experience from "../sections/experience/Experience";
import Projects from "../sections/projects/Projects";
import Skills from "../sections/skills/Skills";
import Contact from "../sections/contact/Contact";
import Footer from "../layout/Footer/Footer";
const Homepage = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    // Scroll smoothly to section based on hash (e.g. #about)
    if (location.hash) {
      const section = document.querySelector(location.hash);
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: "smooth" });
        }, 60);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  return (
    <main>
      {/* The site's one semantic <h1> — the visual design has no "big page
          title" moment (Hero is a terminal animation, the name badge on
          Lanyard is a canvas texture, not real text), so there's nowhere
          to add a real H1 without altering the UI. Visually hidden, not
          removed from the accessibility tree or crawlable content —
          see .visually-hidden's own comment for why that's not the same
          as display:none. Every H2 below it (Skills, Projects, and now
          About/Experience/Contact) nests correctly underneath it. */}
      <h1 className="visually-hidden">{t("seo.h1")}</h1>

      {/* Normal-flow sibling of #home — visually taller than Hero via a
          self-cancelling negative margin (see heroSilkTransition.css),
          not position:absolute, so it needs no positioned ancestor and
          can't disturb <main>'s own layout/scroll height. */}
      <HeroSilkTransition />
      <div id="home">
        <HeroSection />
      </div>
      <section id="about">
        <About />
      </section>
      <section id="experience">
        <Experience />
      </section>
      <section id="projects">
        <Projects />
      </section>
      <EndingScene skills={<section id="skills"><Skills /></section>}>
        <section id="contact">
          <Contact />
        </section>
        <Footer />
      </EndingScene>
    </main>
  );
};

export default Homepage;

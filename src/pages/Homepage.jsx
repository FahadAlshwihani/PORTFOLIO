import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import HeroSection from "../components/herosection";
import HeroSilkTransition from "../components/HeroSilkTransition";
import EndingScene from "../components/EndingScene";
import About from "./About";
import Experience from "./Experience";
import Projects from "./Projects";
import Skills from "./Skills";
import Contact from "./Contact";
import Footer from "../components/Footer";
const Homepage = () => {
  const location = useLocation();

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

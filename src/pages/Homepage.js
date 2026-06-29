import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import HeroSection from "../components/herosection";
import About from "./About";
import Projects from "./Project";
import Skills from "./Skills";
import Blog from "./Blog";
import Contact from "./Contact";
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
      <div id="home">
        <HeroSection />
      </div>
      <section id="about">
        <About />
      </section>
      <section id="projects">
        <Projects />
      </section>
      <section id="skills">
        <Skills />
      </section>
      <section id="blog">
        <Blog />
      </section>
      <section id="contact">
        <Contact />
      </section>
    </main>
  );
};

export default Homepage;

import React, { useState, useEffect } from "react";
import { LogoLoop } from "../components/ui/LogoLoop"; // Adjust path if needed (e.g., based on your file structure)
import "../styles/skills.css"; // Import the new skills-specific CSS

const Skills = () => {
  const skills = [
    "React.js", "JavaScript (ES6+)", "HTML & CSS", "Animation (CSS/JS/WebGL)", "Performance",
    "Accessibility", "Git", "Design systems"
  ];

  // Responsive state for logoHeight and gap
  const [logoHeight, setLogoHeight] = useState(28); // Default for desktop
  const [gap, setGap] = useState(32); // Default for desktop

  useEffect(() => {
    const updateSizes = () => {
      if (window.innerWidth < 768) {
        setLogoHeight(20); // Smaller on mobile
        setGap(16); // Tighter gap on mobile
      } else {
        setLogoHeight(28); // Default on tablet/desktop
        setGap(32); // Default on tablet/desktop
      }
    };

    updateSizes(); // Initial call
    window.addEventListener("resize", updateSizes);
    return () => window.removeEventListener("resize", updateSizes);
  }, []);

  // Prepare skills as LogoLoop items (using 'node' for text-based rendering)
  const skillItems = skills.map((skill, index) => ({
    node: <span className="skill-pill">{skill}</span>,
    key: `skill-${index}`, // Unique key for React
  }));

  return (
    <section id="skills" className="page-section">
      <div className="section-inner">
        <h2 className="section-title">Skills</h2>
        <p className="section-desc">Technologies and strengths I use to ship great front-end products.</p>

        {/* Replace static list with LogoLoop for animated, looping skills */}
        <LogoLoop
          logos={skillItems} // Pass skills as items
          direction="left" // Horizontal loop
          speed={120} // Moderate speed (adjust as needed)
          logoHeight={logoHeight} // Dynamic size based on screen
          gap={gap} // Dynamic gap based on screen
          width="100%" // Full width for responsiveness
          pauseOnHover={true} // Pause on hover for better UX
          fadeOut={true} // Fade edges for a polished look
          scaleOnHover={true} // Subtle scale effect on hover
          ariaLabel="Looping list of skills" // Accessibility
          renderItem={(item) => item.node} // Custom render for text nodes
        />
      </div>
    </section>
  );
};

export default Skills;
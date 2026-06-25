import React from 'react';
import CardSwap, { Card } from '../components/ui/cardswap';
import '../styles/sections.css';

const About = () => {
  return (
    <section id="about" className="page-section">
      <div className="section-inner about-me-grid">
        <div className="about-text-content">
          <h2 className="section-title">
            About <span className="accent">Me</span>
          </h2>
          <p className="section-desc">
            I am a passionate full-stack developer with a focus on creating modern,
            responsive, and user-friendly web applications. My expertise spans across
            front-end technologies like React, and back-end systems using Node.js and
            various databases. I thrive on solving complex problems and continuously
            learning new technologies.
          </p>

          <p className="about-description">
            This section showcases my key skills and interests. Use the arrows below
            the cards to navigate through them. Each card represents a different
            facet of my professional journey and personal development.
          </p>
        </div>

        {/* Right side: CardSwap component */}
        <div className="about-card-container">
          <CardSwap
            width={400}
            height={300}
            cardDistance={20}
            verticalDistance={25}
            delay={3500}
            pauseOnHover={true}
            easing="power1"
          >
            <Card customClass="skill-card-1">
              <h3>React & Frontend</h3>
              <p>Building dynamic and high-performance user interfaces with React, Hooks, and modern state management.</p>
            </Card>
            <Card customClass="skill-card-2">
              <h3>Backend Development</h3>
              <p>Designing robust and scalable APIs using Node.js, Express, and MongoDB/PostgreSQL.</p>
            </Card>
            <Card customClass="skill-card-3">
              <h3>UI/UX Design</h3>
              <p>A strong focus on modern, clean, and intuitive user experience following best practices and design principles.</p>
            </Card>
            <Card customClass="skill-card-4">
              <h3>Problem Solving</h3>
              <p>A knack for tackling complex technical challenges and delivering elegant, efficient solutions.</p>
            </Card>
          </CardSwap>
        </div>
      </div>
    </section>
  );
};

export default About;

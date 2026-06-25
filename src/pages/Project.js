import React from "react";
import TiltedCard from "../components/ui/TiltedCard";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Placeholder images for a modern look. In a real application, these would be project screenshots.
const PLACEHOLDER_IMAGE_URLS = [
  "https://picsum.photos/seed/project1/800/600",
  "https://picsum.photos/seed/project2/800/600",
  "https://picsum.photos/seed/project3/800/600",
  "https://picsum.photos/seed/project4/800/600",
  "https://picsum.photos/seed/project5/800/600",
  "https://picsum.photos/seed/project6/800/600",
];

// Define project data as requested, including title, description, and actions
const PROJECTS = [
  {
    title: "Portfolio Website",
    description: "A modern, responsive portfolio built with React and motion libraries. Features a dark theme, subtle animations, and a focus on clean typography. The design is inspired by the Evolvion.io aesthetic for a super modern feel.",
    tags: ["React", "Motion", "SCSS"],
    liveLink: "#",
    codeLink: "#",
  },
  {
    title: "FIFA Tournament App",
    description: "A full-stack application for managing local FIFA tournaments. It features real-time knockout bracket generation, player statistics tracking, and persistent data storage using local storage.",
    tags: ["JavaScript", "Local Storage", "UI/UX"],
    liveLink: "#",
    codeLink: "#",
  },
  {
    title: "Student Result Viewer",
    description: "An internal tool to securely display student results. It integrates with Google Sheets API for data retrieval and uses a serverless function to handle authentication and data processing.",
    tags: ["Google Sheets API", "Serverless", "React"],
    liveLink: "#",
    codeLink: "#",
  },
  {
    title: "E-commerce Checkout Flow",
    description: "Optimized the checkout process for a major e-commerce platform, resulting in a 15% reduction in cart abandonment. Focused on performance, form validation, and payment gateway integration.",
    tags: ["Next.js", "Stripe", "Performance"],
    liveLink: "#",
    codeLink: "#",
  },
  {
    title: "Real-time Chat Application",
    description: "A scalable, real-time chat application built with WebSockets. Supports multiple rooms, user presence indicators, and end-to-end encryption for secure communication.",
    tags: ["WebSockets", "Node.js", "Security"],
    liveLink: "#",
    codeLink: "#",
  },
  {
    title: "Machine Learning Dashboard",
    description: "A data visualization dashboard for monitoring machine learning model performance. Features interactive charts, model drift detection, and a clean, dark-mode interface.",
    tags: ["Python", "Plotly", "Data Viz"],
    liveLink: "#",
    codeLink: "#",
  },
];

const Projects = () => {
  const swiperSettings = {
    modules: [Navigation, Pagination, A11y],
    spaceBetween: 30,
    slidesPerView: 1, // Show only one card at a time for all screens (clean carousel)
    loop: true,
    navigation: {
      nextEl: '.swiper-button-next-custom',
      prevEl: '.swiper-button-prev-custom',
    },
    pagination: { clickable: true },
    breakpoints: {
      // All breakpoints show 1 slide for consistent centering and focus
      640: {
        slidesPerView: 1,
        spaceBetween: 20, // Tighter on small screens
      },
      1024: {
        slidesPerView: 1,
        spaceBetween: 40,
      },
    },
  };

  return (
    <section id="projects" className="page-section">
      <div className="section-inner">
        <h2 className="section-title">Projects</h2>
        <p className="section-desc">Selected projects with focus on UI & performance.</p>

        <div className="swiper-container-custom">
          <Swiper {...swiperSettings}>
            {PROJECTS.map((project, i) => (
              <SwiperSlide key={i}>
                <TiltedCard
                  imageSrc={PLACEHOLDER_IMAGE_URLS[i % PLACEHOLDER_IMAGE_URLS.length]}
                  altText={project.title}
                  captionText={project.title}
                  containerHeight="400px" // Base height; overridden responsively in CSS
                  containerWidth="100%" // Full width for centering; max-width applied in CSS
                  imageHeight="400px" // Base height; overridden responsively in CSS
                  imageWidth="100%"
                  scaleOnHover={1}
                  rotateAmplitude={10}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={true}
                  overlayContent={
                    <div className="project-overlay-content">
                      <div className="project-overlay-header">
                        <span className="project-eyebrow">Featured Project</span>
                        <h3>{project.title}</h3>
                      </div>
                      <p className="project-description">{project.description}</p>
                      <div className="project-tags">
                        {project.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                      <div className="project-actions">
                        <a href={project.liveLink} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                          View Live
                        </a>
                        <a href={project.codeLink} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                          Source Code
                        </a>
                      </div>
                    </div>
                  }
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Arrows */}
          <div className="swiper-button-prev-custom">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </div>
          <div className="swiper-button-next-custom">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
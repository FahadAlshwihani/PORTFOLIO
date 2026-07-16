import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LogoLoop } from "./LogoLoop";
import TechIcon from "./TechIcon";
import Reveal from "../../components/ui/Reveal/Reveal";
import { SKILL_CATEGORIES } from "./skillsData";
import "./Skills.css";

const useResponsiveLoopSize = () => {
  const [size, setSize] = useState({ logoHeight: 22, gap: 28 });

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) {
        setSize({ logoHeight: 18, gap: 18 });
      } else if (window.innerWidth < 900) {
        setSize({ logoHeight: 20, gap: 22 });
      } else {
        setSize({ logoHeight: 22, gap: 28 });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
};

const Skills = () => {
  const { t } = useTranslation();
  const { logoHeight, gap } = useResponsiveLoopSize();

  return (
    <section className="skills-section">
      <div className="skills-header skills-container">
        <Reveal as="p" preset="subtitle" className="skills-eyebrow">{t("skills.eyebrow")}</Reveal>
        <Reveal as="h2" preset="title" className="skills-title" delay={0.08}>{t("skills.title")}</Reveal>
        <Reveal as="p" preset="paragraph" className="skills-subtitle" delay={0.16}>{t("skills.subtitle")}</Reveal>
      </div>

      <div className="skills-categories">
        {SKILL_CATEGORIES.map((category, i) => {
          const items = category.items.map((item) => ({
            key: `${category.id}-${item.icon}-${item.name}`,
            node: (
              <span className="skill-pill">
                <TechIcon icon={item.icon} />
                <span className="skill-pill-name">{item.name}</span>
              </span>
            ),
          }));

          return (
            <Reveal as="div" preset="card" className="skills-category" key={category.id} delay={i * 0.1}>
              <h3 className="skills-category-title skills-container">{t(category.titleKey)}</h3>

              {/* Full-bleed: the loop itself spans the true viewport edges,
                  independent of the section's max-width content column. */}
              <div className="skills-loop-bleed">
                <LogoLoop
                  logos={items}
                  direction={category.direction}
                  speed={category.speed}
                  logoHeight={logoHeight}
                  gap={gap}
                  width="100%"
                  pauseOnHover
                  ariaLabel={t(category.titleKey)}
                  renderItem={(item) => item.node}
                />
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};

export default Skills;

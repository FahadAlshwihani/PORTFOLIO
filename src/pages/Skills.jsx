import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LogoLoop } from "../components/ui/LogoLoop";
import TechIcon from "../components/ui/TechIcon";
import { SKILL_CATEGORIES } from "../data/skillsData";
import "../styles/skills.css";

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
        <p className="skills-eyebrow">{t("skills.eyebrow")}</p>
        <h2 className="skills-title">{t("skills.title")}</h2>
        <p className="skills-subtitle">{t("skills.subtitle")}</p>
      </div>

      <div className="skills-categories">
        {SKILL_CATEGORIES.map((category) => {
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
            <div className="skills-category" key={category.id}>
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
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Skills;

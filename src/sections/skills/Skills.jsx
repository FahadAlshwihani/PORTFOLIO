import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LogoLoop } from "./LogoLoop";
import TechIcon from "./TechIcon";
import Reveal from "../../components/ui/Reveal/Reveal";
import { SKILL_CATEGORIES } from "./skillsData";
import "./Skills.css";

const LOOP_SIZES = {
  sm: { logoHeight: 18, gap: 18 },
  md: { logoHeight: 20, gap: 22 },
  lg: { logoHeight: 22, gap: 28 },
};

const bucketFor = (w) => (w < 640 ? "sm" : w < 900 ? "md" : "lg");

const useResponsiveLoopSize = () => {
  const [bucket, setBucket] = useState(() =>
    typeof window === "undefined" ? "lg" : bucketFor(window.innerWidth)
  );

  useEffect(() => {
    let rafId = 0;
    const measure = () => {
      rafId = 0;
      const next = bucketFor(window.innerWidth);
      // Only re-render when the breakpoint bucket actually changes, not
      // on every resize event (each of which previously allocated a new
      // size object and re-rendered Skills + all six marquees).
      setBucket((prev) => (prev === next ? prev : next));
    };
    const onResize = () => {
      if (rafId === 0) rafId = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return LOOP_SIZES[bucket];
};

const Skills = () => {
  const { t } = useTranslation();
  const { logoHeight, gap } = useResponsiveLoopSize();

  // The marquee content (icon + name nodes) only depends on the skill
  // data, which is static — never on logoHeight/gap (passed to LogoLoop
  // as their own props). Rebuilding these arrays on every resize handled
  // by useResponsiveLoopSize would hand LogoLoop (memo'd) fresh `logos`
  // references and force all six to re-render their full list DOM.
  const categoryItems = useMemo(
    () =>
      SKILL_CATEGORIES.map((category) =>
        category.items.map((item) => ({
          key: `${category.id}-${item.icon}-${item.name}`,
          node: (
            <span className="skill-pill">
              <TechIcon icon={item.icon} />
              <span className="skill-pill-name">{item.name}</span>
            </span>
          ),
        }))
      ),
    []
  );

  return (
    <section className="skills-section">
      <div className="skills-header skills-container">
        <Reveal as="p" preset="subtitle" className="skills-eyebrow">{t("skills.eyebrow")}</Reveal>
        <Reveal as="h2" preset="title" className="skills-title" delay={0.08}>{t("skills.title")}</Reveal>
        <Reveal as="p" preset="paragraph" className="skills-subtitle" delay={0.16}>{t("skills.subtitle")}</Reveal>
      </div>

      <div className="skills-categories">
        {SKILL_CATEGORIES.map((category, i) => {
          const items = categoryItems[i];

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

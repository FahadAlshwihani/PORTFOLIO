import { useEffect, useState } from "react";

// Watches a thin horizontal band near the vertical center of the viewport
// (rootMargin) rather than the raw viewport edges — sections are tall, so
// naive "is it intersecting at all" observation keeps multiple sections
// simultaneously "active" for most of the scroll. Only the section
// currently crossing that center band counts.
export function useActiveSection(ids) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveId((prev) => (prev === visible[0].target.id ? prev : visible[0].target.id));
        }
      },
      // The rootMargin already narrows observation to a ~10% band at the
      // viewport's vertical centre, so a section is either crossing that
      // band or it isn't — the extra 0.25/0.5/0.75 thresholds only made
      // the callback fire (and re-filter/sort) several more times per
      // section per scroll for no change in result.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

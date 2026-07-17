import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { getProjectImageAlt } from './projectImages';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ArrowIcon = () => (
  <svg className="project-case-link-icon project-case-link-icon--arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M3 8h9M8 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg className="project-case-link-icon" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// Container-transform open/close: the panel is FLIP-animated between the
// clicked directory item's rect (origin) and its natural centered rect,
// using gsap (already a project dependency) instead of hand-rolled rAF
// double-buffering. Reduced motion skips straight to the settled state.
//
// Blocks that make up the case file's own internal reveal cascade, queried
// fresh per-open since which sections a given project actually renders is
// conditional (gallery/architecture/highlights/etc. may or may not exist).
// `.project-case-section` covers every mid-body block uniformly (Overview,
// Architecture, Highlights, Challenges, Solutions, Technologies, Gallery,
// Links) in DOM order, so the last one is always the Links/buttons section
// regardless of which optional sections a project has — which is exactly
// the "buttons always last" behavior, without hardcoding section names.
const CONTENT_SELECTOR = '.project-case-header, .project-case-info, .project-case-media, .project-case-section';

const ProjectModal = ({ project, gallery, originRect, reducedMotion, onClose, t }) => {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const closingRef = useRef(false);
  const tlRef = useRef(null);
  const buildTimelineRef = useRef(null);
  const lastRectRef = useRef(null);
  const ctxRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const gallerySignature = gallery.map((image) => `${image.filename}:${image.src}`).join('|');

  useEffect(() => {
    setActiveImageIndex(0);
  }, [project.slug, gallerySignature]);

  // Closing mirrors opening exactly because it IS the same timeline, played
  // backward — the container-transform, the content stagger, and the
  // buttons-last gap all reverse in lockstep with no separately hand-tuned
  // close animation to keep in sync.
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    if (reducedMotion || !tlRef.current) {
      onCloseRef.current();
      return;
    }

    // The panel's on-screen rect can drift from what was measured at open
    // time (window resize, orientation change — scroll lock doesn't prevent
    // either), which would otherwise make the close animation collapse
    // toward a stale origin. Re-measure and only rebuild the container-
    // transform tween (same durations/eases, fresh coordinates) when the
    // rect has actually changed, so the common case (no resize) is unaffected.
    const panel = panelRef.current;
    if (panel && buildTimelineRef.current && ctxRef.current) {
      const fresh = panel.getBoundingClientRect();
      const last = lastRectRef.current;
      const stale =
        !last ||
        Math.abs(fresh.left - last.left) > 0.5 ||
        Math.abs(fresh.top - last.top) > 0.5 ||
        Math.abs(fresh.width - last.width) > 0.5 ||
        Math.abs(fresh.height - last.height) > 0.5;

      if (stale) {
        const wasProgress = tlRef.current.progress();
        tlRef.current.kill();
        let rebuilt = null;
        ctxRef.current.add(() => {
          rebuilt = buildTimelineRef.current(fresh);
        });
        rebuilt.progress(wasProgress);
        tlRef.current = rebuilt;
        lastRectRef.current = fresh;
      }
    }

    tlRef.current.reverse();
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return undefined;

    if (reducedMotion || !originRect) {
      gsap.set(panel, { x: 0, y: 0, scale: 1, opacity: 1 });
      gsap.set(backdrop, { opacity: 1 });
      closeBtnRef.current?.focus();
      return undefined;
    }

    const contentBlocks = Array.from(panel.querySelectorAll(CONTENT_SELECTOR));
    const buttonsBlock = contentBlocks.length ? contentBlocks[contentBlocks.length - 1] : null;
    const bodyBlocks = buttonsBlock ? contentBlocks.slice(0, -1) : contentBlocks;

    // Builds the container-transform + content-cascade timeline from a given
    // final rect. Extracted so requestClose can rebuild it with a freshly
    // measured rect if the panel's position/size drifted since open (see
    // the staleness check there) — same durations/eases every time, only
    // the FLIP coordinates differ.
    const buildTimeline = (finalRect) => {
      const dx = (originRect.left + originRect.width / 2) - (finalRect.left + finalRect.width / 2);
      const dy = (originRect.top + originRect.height / 2) - (finalRect.top + finalRect.height / 2);
      const sx = Math.max(originRect.width / finalRect.width, 0.05);
      const sy = Math.max(originRect.height / finalRect.height, 0.05);

      gsap.set(backdrop, { opacity: 0 });
      gsap.set(panel, { x: dx, y: dy, scaleX: sx, scaleY: sy, opacity: 0 });
      if (bodyBlocks.length) gsap.set(bodyBlocks, { opacity: 0, y: 16 });
      if (buttonsBlock) gsap.set(buttonsBlock, { opacity: 0, y: 12 });

      const tl = gsap.timeline({
        paused: true,
        onComplete: () => closeBtnRef.current?.focus(),
        onReverseComplete: () => onCloseRef.current(),
      });

      // Overlay fades in, the panel translates/scales up from the clicked
      // paper while fading in (the existing container-transform), each
      // slightly overlapping the one before it — "background settles" —
      // then the content cascades in logical groups, each slightly
      // overlapping the last, with buttons held back until everything
      // else has visibly arrived.
      tl.to(backdrop, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0);
      tl.to(panel, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.36, ease: 'power3.out' }, 0.05);

      if (bodyBlocks.length) {
        tl.to(
          bodyBlocks,
          { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out', stagger: { each: 0.07, from: 'start' } },
          0.26
        );
      }
      if (buttonsBlock) {
        tl.to(buttonsBlock, { opacity: 1, y: 0, duration: 0.36, ease: 'power2.out' }, '+=0.08');
      }

      return tl;
    };

    const ctx = gsap.context(() => {
      const finalRect = panel.getBoundingClientRect();
      const tl = buildTimeline(finalRect);
      tlRef.current = tl;
      buildTimelineRef.current = buildTimeline;
      lastRectRef.current = finalRect;
      tl.play(0);
    });
    ctxRef.current = ctx;

    return () => {
      ctx.revert();
      tlRef.current = null;
      buildTimelineRef.current = null;
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [requestClose]);

  const architecture = project.architecture || {};
  const architectureRows = [
    { key: 'frontend', label: t('projects.architectureFrontend'), value: architecture.frontend },
    { key: 'backend', label: t('projects.architectureBackend'), value: architecture.backend },
    { key: 'database', label: t('projects.architectureDatabase'), value: architecture.database },
    { key: 'deployment', label: t('projects.architectureDeployment'), value: architecture.deployment },
  ].filter((row) => row.value);

  const infoRows = [
    { key: 'client', label: t('projects.clientLabel'), value: project.client },
    { key: 'year', label: t('projects.yearLabel'), value: project.year },
    { key: 'role', label: t('projects.roleLabel'), value: project.role },
    { key: 'status', label: t('projects.statusLabel'), value: project.status },
    {
      key: 'repository',
      label: t('projects.repositoryLabel'),
      value: project.isPrivate ? t('projects.repoPrivate') : t('projects.repoPublic'),
    },
  ].filter((row) => row.value);

  const overviewSegments = Array.isArray(project.overview) ? project.overview : [];
  const safeImageIndex = activeImageIndex < gallery.length ? activeImageIndex : 0;
  const activeImage = gallery[safeImageIndex];
  const activeImageAlt = getProjectImageAlt(project.title, activeImage);

  return (
    <div className="project-modal-backdrop" ref={backdropRef} onClick={requestClose}>
      <div
        className="project-modal-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative only — the project name tiled at ~2% opacity, giving
            the case file a faint printed-paper depth without distracting
            from the content in front of it. */}
        <div className="project-modal-watermark" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i}>{project.title}</span>
          ))}
        </div>

        <button
          type="button"
          className="project-modal-close"
          onClick={requestClose}
          ref={closeBtnRef}
          aria-label={t('projects.closeModal')}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="project-modal-scroll">
          <div className="project-case">
            <header className="project-case-header">
              <h3 id="project-modal-title" className="project-case-title">{project.title}</h3>
              {project.subtitle && <p className="project-case-subtitle">{project.subtitle}</p>}
              {project.badge && <span className="project-case-badge">{project.badge}</span>}
            </header>

            {infoRows.length > 0 && (
              <div className="project-case-info">
                {infoRows.map((row) => (
                  <div className="project-case-info-item" key={row.key}>
                    <span className="project-case-info-label">{row.label}</span>
                    <span className="project-case-info-value">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeImage && (
              <div className="project-case-media">
                <img src={activeImage.src} alt={activeImageAlt} decoding="async" />
              </div>
            )}

            {overviewSegments.length > 0 && (
              <section className="project-case-section">
                <h4 className="project-case-heading">{t('projects.overviewLabel')}</h4>
                <p className="project-case-overview">
                  {overviewSegments.map((seg, i) => (
                    <span key={i} className={seg.h ? 'project-case-highlight' : undefined}>{seg.t}</span>
                  ))}
                </p>
              </section>
            )}

            {architectureRows.length > 0 && (
              <section className="project-case-section">
                <h4 className="project-case-heading">{t('projects.architectureLabel')}</h4>
                <div className="project-case-architecture">
                  {architectureRows.map((row) => (
                    <div className="project-case-architecture-item" key={row.key}>
                      <span className="project-case-architecture-label">{row.label}</span>
                      <span className="project-case-architecture-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {project.highlights?.length > 0 && (
              <section className="project-case-section">
                <h4 className="project-case-heading">{t('projects.highlightsLabel')}</h4>
                <ul className="project-case-checklist">
                  {project.highlights.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            )}

            {project.challenges?.length > 0 && (
              <section className="project-case-section">
                <h4 className="project-case-heading">{t('projects.challengesLabel')}</h4>
                <ul className="project-case-list">
                  {project.challenges.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            )}

            {project.solutions?.length > 0 && (
              <section className="project-case-section">
                <h4 className="project-case-heading">{t('projects.solutionsLabel')}</h4>
                <ul className="project-case-list">
                  {project.solutions.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            )}

            {project.tags?.length > 0 && (
              <section className="project-case-section">
                <h4 className="project-case-heading">{t('projects.technologiesLabel')}</h4>
                <div className="project-case-tech-grid">
                  {project.tags.map((tag, i) => (
                    <span className="project-case-chip" key={i}>{tag}</span>
                  ))}
                </div>
              </section>
            )}

            {gallery.length > 1 && (
              <section className="project-case-section">
                <h4 className="project-case-heading">{t('projects.galleryLabel')}</h4>
                <div className="project-case-thumbs">
                  {gallery.map((image, i) => (
                    <button
                      type="button"
                      key={`${image.filename}:${image.src}`}
                      className={`project-case-thumb${i === safeImageIndex ? ' is-active' : ''}`}
                      onClick={() => setActiveImageIndex(i)}
                      aria-pressed={i === safeImageIndex}
                      aria-label={getProjectImageAlt(project.title, image)}
                    >
                      <img src={image.src} alt="" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="project-case-section">
              <h4 className="project-case-heading">{t('projects.linksLabel')}</h4>
              <div className="project-case-link-list">
                <a
                  className="project-case-link"
                  href={project.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowIcon />
                  {t('projects.openLive')}
                </a>
                {project.isPrivate ? (
                  <span className="project-case-link project-case-link--locked">
                    <LockIcon />
                    {t('projects.repositoryLabel')} — {t('projects.repoPrivate')}
                  </span>
                ) : (
                  <a
                    className="project-case-link"
                    href={project.codeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowIcon />
                    {t('projects.openRepository')}
                  </a>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;

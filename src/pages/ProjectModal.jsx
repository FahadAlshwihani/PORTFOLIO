import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { getProjectImageAlt } from '../utils/projectImages';

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
const ProjectModal = ({ project, gallery, originRect, reducedMotion, onClose, t }) => {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const closingRef = useRef(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const gallerySignature = gallery.map((image) => `${image.filename}:${image.src}`).join('|');

  useEffect(() => {
    setActiveImageIndex(0);
  }, [project.slug, gallerySignature]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const panel = panelRef.current;
    const backdrop = backdropRef.current;

    if (reducedMotion || !panel || !originRect) {
      onClose();
      return;
    }

    const finalRect = panel.getBoundingClientRect();
    const dx = (originRect.left + originRect.width / 2) - (finalRect.left + finalRect.width / 2);
    const dy = (originRect.top + originRect.height / 2) - (finalRect.top + finalRect.height / 2);
    const sx = Math.max(originRect.width / finalRect.width, 0.05);
    const sy = Math.max(originRect.height / finalRect.height, 0.05);

    gsap.to(backdrop, { opacity: 0, duration: 0.22, ease: 'power2.in' });
    gsap.to(panel, {
      x: dx,
      y: dy,
      scaleX: sx,
      scaleY: sy,
      opacity: 0,
      duration: 0.28,
      ease: 'power3.in',
      onComplete: onClose,
    });
  }, [onClose, originRect, reducedMotion]);

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

    const finalRect = panel.getBoundingClientRect();
    const dx = (originRect.left + originRect.width / 2) - (finalRect.left + finalRect.width / 2);
    const dy = (originRect.top + originRect.height / 2) - (finalRect.top + finalRect.height / 2);
    const sx = Math.max(originRect.width / finalRect.width, 0.05);
    const sy = Math.max(originRect.height / finalRect.height, 0.05);

    const ctx = gsap.context(() => {
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(panel, { x: dx, y: dy, scaleX: sx, scaleY: sy, opacity: 0 });
      gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(panel, {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        duration: 0.34,
        ease: 'power3.out',
        onComplete: () => closeBtnRef.current?.focus(),
      });
    });

    return () => ctx.revert();
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

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Folder, { ROW_CAPACITY } from './Folder';
import { getProjectImages } from './projectImages';
import Reveal from '../../components/ui/Reveal/Reveal';
import './Projects.css';

// Only ever rendered after a project card is clicked — no reason for it
// (or its image manifest) to sit in the initial bundle. The open FLIP is
// driven from inside the modal off an origin rect captured before this
// resolves, so a one-tick chunk fetch is imperceptible.
const ProjectModal = lazy(() => import('./ProjectModal'));

const FOLDER_COACH_KEY = 'portfolio.projects.folder-coach-complete';
const PROJECT_COACH_KEY = 'portfolio.projects.project-coach-complete';
const COACH_FADE_MS = 240;

const hasCompletedCoach = (key) => {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return true;
  }
};

const persistCoachCompletion = (key) => {
  try {
    window.localStorage.setItem(key, 'true');
  } catch {
    // Storage can be unavailable in private/restricted browsing contexts.
  }
};

// A plain useRef's `.current` is only ever read after the fact — mutating
// it doesn't itself cause a re-render, so a portal target that depends on
// "has the real DOM node mounted yet" can miss it. A callback ref backed by
// state does the opposite: React calls it (and we re-render) at the exact
// moment the node is attached or detached, which is what lets the coach
// mark below portal straight into the real element the instant it exists,
// with no separate "is it ready" effect/poll of its own.
const useAttachedElement = () => {
  const [element, setElement] = useState(null);
  const ref = useCallback((node) => setElement(node), []);
  return [element, ref];
};

// Lives inside the real target element (Folder's own .folder for Step 1,
// .folder__back for Step 2) via a portal — not document.body — so it never
// has its own position to keep in sync. It moves, scales, and hides when
// its host does, natively, because it physically is part of the same
// transformed box; there is nothing here computing a screen position.
const CoachMark = ({ container, variant, text, leaving, direction, style }) => {
  if (!container) return null;

  return createPortal(
    <span
      className={`projects-coach projects-coach--${variant}${leaving ? ' is-leaving' : ''}`}
      style={style}
      dir={direction}
    >
      {/* Siblings, not nested — the tooltip needs to reach assistive tech,
          so it can't sit inside an aria-hidden ancestor. All three position
          themselves off the same --coach-outset-* variables (set per
          variant below), not off each other. */}
      <span className="projects-coach-outline" aria-hidden="true" />
      <span className="projects-coach-arrow" aria-hidden="true" />
      <span className="projects-coach-tooltip" role="status">
        {text}
      </span>
    </span>,
    container
  );
};

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
};

const Projects = () => {
  const { t, i18n } = useTranslation();
  const direction = i18n.dir();
  // returnObjects hands back a fresh array/object graph every call;
  // pin it to the language so unrelated state changes (folder open,
  // modal, coach marks) don't rebuild it and everything derived from it.
  const items = useMemo(
    () => t('projects.items', { returnObjects: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language]
  );
  const reducedMotion = useReducedMotion();
  // A row holds up to ROW_CAPACITY papers before Folder starts a new arc
  // above it — reserve extra headroom above the folder per additional row
  // so a future, larger project list never fans up into the title.
  const rowCount = Math.max(1, Math.ceil(items.length / ROW_CAPACITY));

  const [folderOpen, setFolderOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFolderCoach, setShowFolderCoach] = useState(() => !hasCompletedCoach(FOLDER_COACH_KEY));
  const [showProjectCoach, setShowProjectCoach] = useState(() => !hasCompletedCoach(PROJECT_COACH_KEY));
  const [folderCoachLeaving, setFolderCoachLeaving] = useState(false);
  const [projectCoachLeaving, setProjectCoachLeaving] = useState(false);

  const originRectRef = useRef(null);
  const triggerElRef = useRef(null);
  const folderCoachTimerRef = useRef(null);
  const projectCoachTimerRef = useRef(null);
  // The coach marks portal into these real elements (Step 1: the folder
  // itself; Step 2: .folder__back, which holds every fanned-out paper) —
  // state-backed so mounting the target element re-renders this component
  // at the exact moment it's safe to portal into it. See useAttachedElement.
  const [folderElement, folderRef] = useAttachedElement();
  const [listElement, listRef] = useAttachedElement();

  // How far Step 2's highlight needs to extend beyond .folder__back's own
  // box to tightly enclose every actually-rendered paper — measured
  // straight from the real DOM (each .paper's own rect against the list
  // container's rect) rather than approximated from the fan's placement
  // formula, so the highlight always matches exactly what's on screen,
  // including any outlier row a future, larger project list might add.
  // Both rects come from the same scaled ancestor, so the ratio below is
  // scale-invariant — no need to know or divide by the folder's own size.
  const [listExtent, setListExtent] = useState({ topPercent: 0, sidePercent: 0, bottomPercent: 0 });

  useEffect(() => {
    if (!folderOpen || !showProjectCoach || !listElement) return undefined;

    const measure = () => {
      const containerRect = listElement.getBoundingClientRect();
      if (!containerRect.width || !containerRect.height) return;
      const papers = listElement.querySelectorAll('.paper');
      let topPercent = 0;
      let sidePercent = 0;
      let bottomPercent = 0;
      papers.forEach((paper) => {
        const rect = paper.getBoundingClientRect();
        topPercent = Math.max(topPercent, ((containerRect.top - rect.top) / containerRect.height) * 100);
        bottomPercent = Math.max(bottomPercent, ((rect.bottom - containerRect.bottom) / containerRect.height) * 100);
        sidePercent = Math.max(
          sidePercent,
          ((containerRect.left - rect.left) / containerRect.width) * 100,
          ((rect.right - containerRect.right) / containerRect.width) * 100
        );
      });
      setListExtent({
        topPercent: Math.max(0, topPercent),
        sidePercent: Math.max(0, sidePercent),
        bottomPercent: Math.max(0, bottomPercent),
      });
    };

    measure();

    // The fan animates open over ~0.3s with a per-paper stagger, so the
    // first measurement above is likely mid-flight — re-measure once the
    // papers actually stop moving (a settling debounce after the last
    // transitionend, not a guessed timeout duration), plus on resize since
    // the folder's own responsive breakpoints rescale the whole fan.
    let settleId = null;
    const handleTransitionEnd = (e) => {
      if (e.propertyName !== 'transform') return;
      window.clearTimeout(settleId);
      settleId = window.setTimeout(measure, 40);
    };
    listElement.addEventListener('transitionend', handleTransitionEnd);
    window.addEventListener('resize', measure);

    return () => {
      window.clearTimeout(settleId);
      listElement.removeEventListener('transitionend', handleTransitionEnd);
      window.removeEventListener('resize', measure);
    };
  }, [folderOpen, showProjectCoach, listElement]);

  useEffect(() => () => {
    window.clearTimeout(folderCoachTimerRef.current);
    window.clearTimeout(projectCoachTimerRef.current);
  }, []);

  const completeFolderCoach = () => {
    if (!showFolderCoach || folderCoachLeaving) return;
    persistCoachCompletion(FOLDER_COACH_KEY);
    setFolderCoachLeaving(true);
    folderCoachTimerRef.current = window.setTimeout(() => {
      setShowFolderCoach(false);
      setFolderCoachLeaving(false);
    }, COACH_FADE_MS);
  };

  const completeProjectCoach = () => {
    if (!showProjectCoach || projectCoachLeaving) return;
    persistCoachCompletion(PROJECT_COACH_KEY);
    setProjectCoachLeaving(true);
    projectCoachTimerRef.current = window.setTimeout(() => {
      setShowProjectCoach(false);
      setProjectCoachLeaving(false);
    }, COACH_FADE_MS);
  };

  const handleFolderToggle = (next) => {
    setFolderOpen(next);
    if (next) completeFolderCoach();
  };

  const openProject = (index, el) => {
    originRectRef.current = el.getBoundingClientRect();
    triggerElRef.current = el;
    completeProjectCoach();
    setSelectedProject(index);
    setModalOpen(true);
  };
  // Kept current every render so the memoized paper buttons below can
  // call the latest openProject without listing it (and the unstable
  // functions it closes over) as a memo dependency.
  const openProjectRef = useRef(openProject);
  openProjectRef.current = openProject;

  const closeModal = () => {
    setModalOpen(false);
    triggerElRef.current?.focus();
  };

  const activeProject = modalOpen && selectedProject !== null ? items[selectedProject] : null;

  // The papers are the project navigation itself — passed straight through
  // Folder's `items` prop and rendered as its real paper elements, per the
  // component's own physical open/close behavior. Each one is a genuine
  // button so it's independently keyboard-operable and never toggles the
  // folder it lives inside (stopPropagation on click/keydown).
  const paperElements = useMemo(
    () =>
      items.map((item, i) => {
        const handleSelect = (e) => {
          e.stopPropagation();
          openProjectRef.current(i, e.currentTarget);
        };
        return (
          <button
            key={item.slug}
            type="button"
            className={`paper-btn${i === selectedProject ? ' is-selected' : ''}`}
            onClick={handleSelect}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
            }}
            aria-label={item.title}
          >
            <span className="paper-btn-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <span className="paper-btn-title">{item.title}</span>
          </button>
        );
      }),
    [items, selectedProject]
  );

  return (
    <section className="projects-section">
      <div className="projects-inner">
        <Reveal as="p" preset="subtitle" className="projects-eyebrow">{t('projects.eyebrow')}</Reveal>
        <Reveal as="h2" preset="title" className="projects-title" delay={0.08}>{t('projects.title')}</Reveal>
        <Reveal as="p" preset="paragraph" className="projects-subtitle" delay={0.16}>{t('projects.subtitle')}</Reveal>

        <Reveal as="div" preset="card" className="projects-workspace" delay={0.1} style={{ '--row-count': rowCount }}>
          <div className="projects-folder-stage">
            <span className="projects-folder-icon-wrap">
              <Folder
                color="#5227FF"
                size={1.6}
                open={folderOpen}
                onToggle={handleFolderToggle}
                items={paperElements}
                interactiveRef={folderRef}
                contentRef={listRef}
              />
            </span>

            {showFolderCoach && (
              <CoachMark
                container={folderElement}
                variant="folder"
                text={t('projects.onboarding.folder')}
                leaving={folderCoachLeaving}
                direction={direction}
              />
            )}

            {folderOpen && showProjectCoach && (
              <CoachMark
                container={listElement}
                variant="list"
                text={t('projects.onboarding.project')}
                leaving={projectCoachLeaving}
                direction={direction}
                style={{
                  '--coach-top': listExtent.topPercent,
                  '--coach-side': listExtent.sidePercent,
                  '--coach-bottom': listExtent.bottomPercent,
                }}
              />
            )}
          </div>

          <p className="projects-folder-label" dir="ltr">{t('projects.explorerLabel')}</p>
        </Reveal>

        {folderOpen && (
          <div className="projects-controls-hint" aria-hidden="true">
            <p className="projects-controls-title">{t('projects.controlsTitle')}</p>
            <p>{t('projects.controlOpen')}</p>
            <p>{t('projects.controlClose')}</p>
          </div>
        )}
      </div>

      {activeProject && (
        <Suspense fallback={null}>
          <ProjectModal
            project={activeProject}
            gallery={getProjectImages(activeProject.slug)}
            originRect={originRectRef.current}
            reducedMotion={reducedMotion}
            onClose={closeModal}
            t={t}
          />
        </Suspense>
      )}
    </section>
  );
};

export default Projects;

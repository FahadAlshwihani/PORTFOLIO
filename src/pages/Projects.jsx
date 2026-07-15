import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Folder, { ROW_CAPACITY } from '../components/ui/Folder';
import { getProjectImages } from '../utils/projectImages';
import ProjectModal from './ProjectModal';
import Reveal from '../components/ui/Reveal';
import '../styles/Projects.css';

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
  const { t } = useTranslation();
  const items = t('projects.items', { returnObjects: true });
  const reducedMotion = useReducedMotion();
  // A row holds up to ROW_CAPACITY papers before Folder starts a new arc
  // above it — reserve extra headroom above the folder per additional row
  // so a future, larger project list never fans up into the title.
  const rowCount = Math.max(1, Math.ceil(items.length / ROW_CAPACITY));

  const [folderOpen, setFolderOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const originRectRef = useRef(null);
  const triggerElRef = useRef(null);

  const handleFolderToggle = (next) => {
    setFolderOpen(next);
    if (next) setHasOpenedOnce(true);
  };

  const openProject = (index, el) => {
    originRectRef.current = el.getBoundingClientRect();
    triggerElRef.current = el;
    setSelectedProject(index);
    setModalOpen(true);
  };

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
  const paperElements = items.map((item, i) => {
    const handleSelect = (e) => {
      e.stopPropagation();
      openProject(i, e.currentTarget);
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
  });

  return (
    <section className="projects-section">
      <div className="projects-inner">
        <Reveal as="p" preset="subtitle" className="projects-eyebrow">{t('projects.eyebrow')}</Reveal>
        <Reveal as="h2" preset="title" className="projects-title" delay={0.08}>{t('projects.title')}</Reveal>
        <Reveal as="p" preset="paragraph" className="projects-subtitle" delay={0.16}>{t('projects.subtitle')}</Reveal>

        <Reveal as="div" preset="card" className="projects-workspace" delay={0.1} style={{ '--row-count': rowCount }}>
          <div className="projects-folder-stage">
            <span className="projects-folder-icon-wrap">
              <Folder color="#5227FF" size={1.6} open={folderOpen} onToggle={handleFolderToggle} items={paperElements} />
            </span>

            {!hasOpenedOnce && (
              <p className="projects-open-hint" aria-hidden="true">
                {t('projects.openHint')}
              </p>
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
        <ProjectModal
          project={activeProject}
          gallery={getProjectImages(activeProject.slug)}
          originRect={originRectRef.current}
          reducedMotion={reducedMotion}
          onClose={closeModal}
          t={t}
        />
      )}
    </section>
  );
};

export default Projects;

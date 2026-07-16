import {
  siReact,
  siDjango,
  siPostgresql,
  siMysql,
  siNextdotjs,
  siJavascript,
  siTypescript,
  siHtml5,
  siCss,
  siSass,
  siI18next,
  siSwiper,
  siPython,
  siJsonwebtokens,
  siLinux,
  siDocker,
  siGunicorn,
  siNginx,
  siGit,
  siArduino,
  siBluetooth,
} from 'simple-icons';

// Simple Icons ships each mark as a full <svg> string rather than a bare
// path — pull just the `d` out once at module load so <TechIcon> can drop
// it straight into a single, fully color-controllable <path>.
const pathOf = (icon) => icon.svg.match(/<path d="([^"]+)"/)?.[1] ?? '';

const BRAND_PATHS = {
  react: pathOf(siReact),
  django: pathOf(siDjango),
  postgresql: pathOf(siPostgresql),
  mysql: pathOf(siMysql),
  nextjs: pathOf(siNextdotjs),
  javascript: pathOf(siJavascript),
  typescript: pathOf(siTypescript),
  html5: pathOf(siHtml5),
  css3: pathOf(siCss),
  scss: pathOf(siSass),
  i18next: pathOf(siI18next),
  swiper: pathOf(siSwiper),
  python: pathOf(siPython),
  jwt: pathOf(siJsonwebtokens),
  linux: pathOf(siLinux),
  docker: pathOf(siDocker),
  gunicorn: pathOf(siGunicorn),
  nginx: pathOf(siNginx),
  git: pathOf(siGit),
  arduino: pathOf(siArduino),
  bluetooth: pathOf(siBluetooth),
};

// Clean, neutral, hand-drawn marks for technologies with no official Simple
// Icons brand — kept in the same solid-shape spirit as the brand marks
// above (filled base shapes, occasional thin currentColor strokes for
// connective detail) so the two sets sit together without looking mismatched.
const FALLBACK_ICONS = {
  restapi: (
    <path d="M9 3c-1.66 0-3 1.34-3 3v2.5c0 .83-.67 1.5-1.5 1.5H3v4h1.5c.83 0 1.5.67 1.5 1.5V18c0 1.66 1.34 3 3 3v-2c-.55 0-1-.45-1-1v-2.5c0-1.2-.62-2.25-1.56-2.86v-.28C7.38 12.75 8 11.7 8 10.5V8c0-.55.45-1 1-1V3zm6 0v4c.55 0 1 .45 1 1v2.5c0 1.2.62 2.25 1.56 2.86v.28C16.62 14.25 16 15.3 16 16.5V19c0 .55-.45 1-1 1v2c1.66 0 3-1.34 3-3v-2.5c0-.83.67-1.5 1.5-1.5H21v-4h-1.5c-.83 0-1.5-.67-1.5-1.5V6c0-1.66-1.34-3-3-3z" />
  ),
  // Django REST Framework has no distinct Simple Icons mark of its own — a
  // "layers" glyph reads as "framework built on top of something" and stays
  // visually distinct from Django's own logo where both appear together.
  drf: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5z" />
      <path d="M3 12.5 12 17.5 21 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16.5 12 21.5 21 16.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  cloudpanel: (
    <path d="M7.5 19a4.5 4.5 0 0 1-.6-8.96A5.5 5.5 0 0 1 17.94 8.5 4 4 0 0 1 17.2 19H7.5z" />
  ),
  windowsserver: (
    <>
      <rect x="4" y="4" width="16" height="4.3" rx="1.1" />
      <rect x="4" y="9.85" width="16" height="4.3" rx="1.1" />
      <rect x="4" y="15.7" width="16" height="4.3" rx="1.1" />
    </>
  ),
  activedirectory: (
    <>
      <path d="M12 6.4V9M12 9 6.2 11.6M12 9l5.8 2.6M5.1 14.4v3.5M18.9 14.4v3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="4" r="2.1" />
      <circle cx="5.1" cy="12" r="2.1" />
      <circle cx="18.9" cy="12" r="2.1" />
      <circle cx="5.1" cy="20" r="2.1" />
      <circle cx="18.9" cy="20" r="2.1" />
    </>
  ),
  networking: (
    <>
      <path d="M6 8.1 12 12M18 8.1 12 12M12 12 6 17.9M12 12l6 5.9M6 6h12M6 18h12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="6" cy="6" r="2.1" />
      <circle cx="18" cy="6" r="2.1" />
      <circle cx="12" cy="12" r="2.1" />
      <circle cx="6" cy="18" r="2.1" />
      <circle cx="18" cy="18" r="2.1" />
    </>
  ),
  microsoft365: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.1" />
      <rect x="13" y="4" width="7" height="7" rx="1.1" />
      <rect x="4" y="13" width="7" height="7" rx="1.1" />
      <rect x="13" y="13" width="7" height="7" rx="1.1" />
    </>
  ),
  embeddedsystems: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.4" />
      <path
        d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  realtimemonitoring: (
    <path
      d="M2 12h3.3l1.8-6.5 3 13 2.2-10 1.4 3.5H22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

// Official brand colors, applied ONLY on hover (see .skill-pill:hover
// .skill-pill-icon in skills.css) — everything else about the pill stays
// monochrome. Technologies without a listed color (Next.js, CloudPanel,
// JWT, REST API, DRF, etc.) simply have no entry here and stay monochrome
// on hover too, via the CSS fallback.
const BRAND_COLORS = {
  react: '#61DAFB',
  django: '#092E20',
  python: '#3776AB',
  javascript: '#F7DF1E',
  typescript: '#3178C6',
  docker: '#2496ED',
  postgresql: '#336791',
  mysql: '#4479A1',
  linux: '#FCC624',
  git: '#F05032',
  nginx: '#009639',
  arduino: '#00979D',
  html5: '#E34F26',
  css3: '#1572B6',
};

const TechIcon = ({ icon }) => {
  const path = BRAND_PATHS[icon];
  const fallback = FALLBACK_ICONS[icon];
  if (!path && !fallback) return null;

  const brandColor = BRAND_COLORS[icon];

  return (
    <svg
      className="skill-pill-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={brandColor ? { '--skill-icon-brand': brandColor } : undefined}
    >
      {path ? <path d={path} /> : fallback}
    </svg>
  );
};

export default TechIcon;

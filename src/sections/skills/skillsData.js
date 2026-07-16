// Each category drives one independent LogoLoop (see Skills.js). Every
// technology listed here maps to something demonstrated in the Projects
// section — this is a summary of proven experience, not a logo wall.
// Names stay in English (proper nouns/brand names), matching how tech
// terms are handled everywhere else on the site (Experience, Projects);
// only the category titles and section copy go through i18next.
export const SKILL_CATEGORIES = [
  {
    id: 'core',
    titleKey: 'skills.categories.core',
    direction: 'left',
    speed: 30,
    items: [
      { name: 'React', icon: 'react' },
      { name: 'Django', icon: 'django' },
      { name: 'Django REST Framework', icon: 'drf' },
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'MySQL', icon: 'mysql' },
      { name: 'REST API', icon: 'restapi' },
    ],
  },
  {
    id: 'frontend',
    titleKey: 'skills.categories.frontend',
    direction: 'right',
    speed: 26,
    items: [
      { name: 'React', icon: 'react' },
      { name: 'Next.js', icon: 'nextjs' },
      { name: 'JavaScript', icon: 'javascript' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'HTML5', icon: 'html5' },
      { name: 'CSS3', icon: 'css3' },
      { name: 'SCSS', icon: 'scss' },
      { name: 'i18next', icon: 'i18next' },
      { name: 'Swiper', icon: 'swiper' },
    ],
  },
  {
    id: 'backend',
    titleKey: 'skills.categories.backend',
    direction: 'left',
    speed: 28,
    items: [
      { name: 'Python', icon: 'python' },
      { name: 'Django', icon: 'django' },
      { name: 'DRF', icon: 'drf' },
      { name: 'JWT', icon: 'jwt' },
      { name: 'REST API', icon: 'restapi' },
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'MySQL', icon: 'mysql' },
    ],
  },
  {
    id: 'infrastructure',
    titleKey: 'skills.categories.infrastructure',
    direction: 'right',
    speed: 24,
    items: [
      { name: 'Linux', icon: 'linux' },
      { name: 'Docker', icon: 'docker' },
      { name: 'Gunicorn', icon: 'gunicorn' },
      { name: 'Nginx', icon: 'nginx' },
      { name: 'Git', icon: 'git' },
      { name: 'CloudPanel', icon: 'cloudpanel' },
    ],
  },
  {
    id: 'itSystems',
    titleKey: 'skills.categories.itSystems',
    direction: 'left',
    speed: 20,
    items: [
      { name: 'Windows Server', icon: 'windowsserver' },
      { name: 'Active Directory', icon: 'activedirectory' },
      { name: 'Networking', icon: 'networking' },
      { name: 'Microsoft 365', icon: 'microsoft365' },
    ],
  },
  {
    id: 'iot',
    titleKey: 'skills.categories.iot',
    direction: 'right',
    speed: 18,
    items: [
      { name: 'Arduino', icon: 'arduino' },
      { name: 'Bluetooth', icon: 'bluetooth' },
      { name: 'Embedded Systems', icon: 'embeddedsystems' },
      { name: 'Real-Time Monitoring', icon: 'realtimemonitoring' },
    ],
  },
];

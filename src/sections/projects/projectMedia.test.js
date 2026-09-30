import {
  createProjectMediaManifest,
  getProjectImageAlt,
  getProjectMediaFromManifest,
} from './projectMediaManifest';

const createMockContext = (modules) => {
  const context = (key) => modules[key];
  context.keys = () => Object.keys(modules);
  return context;
};

describe('project media manifest', () => {
  const manifest = createProjectMediaManifest(createMockContext({
    './aarc/10-dashboard.webp': '/assets/10-dashboard.webp',
    './aarc/2-home.webp': { default: '/assets/2-home.webp' },
    './aarc/01-cover.png': '/assets/01-cover.png',
    './aarc/AARC.mp4': '/assets/AARC.mp4',
    './shahm-law/10-services.jpg': '/assets/shahm-services.jpg',
    './shahm-law/2-home.jpg': { default: '/assets/shahm-home.jpg' },
    './tripsplit/README.md': '/assets/README.md',
    './aarc/.hidden.png': '/assets/hidden.png',
    './social/vector.svg': '/assets/vector.svg',
  }));

  test('prefers a project video over screenshots from the same folder', () => {
    expect(manifest.aarc).toEqual({
      type: 'video',
      src: '/assets/AARC.mp4',
      filename: 'AARC.mp4',
    });
  });

  test('keeps naturally sorted image galleries when no video exists', () => {
    expect(manifest['shahm-law'].type).toBe('images');
    expect(manifest['shahm-law'].items.map((image) => image.filename)).toEqual([
      '2-home.jpg',
      '10-services.jpg',
    ]);
  });

  test('omits empty and unsupported folders', () => {
    expect(manifest.tripsplit).toBeUndefined();
    expect(manifest.social).toBeUndefined();
  });

  test('returns stable empty media for unknown or missing slugs', () => {
    expect(getProjectMediaFromManifest(manifest, 'unknown-project')).toEqual({ type: 'none', items: [] });
    expect(getProjectMediaFromManifest(manifest, '')).toEqual({ type: 'none', items: [] });
  });

  test('builds filename-derived alt text with translated project titles', () => {
    expect(getProjectImageAlt('شهم', manifest['shahm-law'].items[0])).toBe('شهم — Home');
  });

  test('freezes manifest media and image arrays', () => {
    expect(Object.isFrozen(manifest.aarc)).toBe(true);
    expect(Object.isFrozen(manifest['shahm-law'])).toBe(true);
    expect(Object.isFrozen(manifest['shahm-law'].items)).toBe(true);
    expect(Object.isFrozen(manifest['shahm-law'].items[0])).toBe(true);
  });
});

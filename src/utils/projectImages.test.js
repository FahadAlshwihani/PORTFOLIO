import {
  createProjectImageManifest,
  getProjectImageAlt,
  getProjectImagesFromManifest,
} from './projectImageManifest';

const createMockContext = (modules) => {
  const context = (key) => modules[key];
  context.keys = () => Object.keys(modules);
  return context;
};

describe('project image manifest', () => {
  const manifest = createProjectImageManifest(createMockContext({
    './aarc/10-dashboard.webp': '/assets/10-dashboard.webp',
    './aarc/2-home.webp': { default: '/assets/2-home.webp' },
    './aarc/01-cover.png': '/assets/01-cover.png',
    './shahm-law/01-home.jpg': '/assets/shahm-home.jpg',
    './tripsplit/README.md': '/assets/README.md',
    './aarc/.hidden.png': '/assets/hidden.png',
    './social/vector.svg': '/assets/vector.svg',
  }));

  test('groups by slug and sorts filenames using natural numeric order', () => {
    expect(manifest.aarc.map((image) => image.filename)).toEqual([
      '01-cover.png',
      '2-home.webp',
      '10-dashboard.webp',
    ]);
  });

  test('supports one image and omits empty or unsupported folders', () => {
    expect(manifest['shahm-law']).toHaveLength(1);
    expect(manifest.tripsplit).toBeUndefined();
    expect(manifest.social).toBeUndefined();
  });

  test('returns a stable empty array for unknown or missing slugs', () => {
    expect(getProjectImagesFromManifest(manifest, 'unknown-project')).toEqual([]);
    expect(getProjectImagesFromManifest(manifest, '')).toEqual([]);
  });

  test('builds filename-derived alt text with translated project titles', () => {
    expect(getProjectImageAlt('AARC', manifest.aarc[2])).toBe('AARC — Dashboard');
    expect(getProjectImageAlt('شهم', manifest['shahm-law'][0])).toBe('شهم — Home');
  });

  test('freezes manifest arrays so UI code cannot reorder shared data', () => {
    expect(Object.isFrozen(manifest.aarc)).toBe(true);
    expect(Object.isFrozen(manifest.aarc[0])).toBe(true);
  });
});

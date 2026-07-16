const EMPTY_IMAGES = Object.freeze([]);
const NATURAL_SORT_OPTIONS = { numeric: true, sensitivity: 'base' };

const normalizeFilename = (filename) => {
  const label = filename
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[\s._-]*/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return label ? label.charAt(0).toUpperCase() + label.slice(1) : '';
};

export const createProjectImageManifest = (context) => {
  const grouped = {};

  context.keys().forEach((key) => {
    const pathParts = key.replace(/^\.\//, '').split('/');

    if (pathParts.length < 2 || pathParts.some((part) => part.startsWith('.'))) return;

    const projectSlug = pathParts[0];
    const filename = pathParts[pathParts.length - 1];
    if (!/\.(png|jpe?g|webp|avif)$/i.test(filename)) return;

    try {
      const loadedModule = context(key);
      const src = loadedModule?.default || loadedModule;
      if (typeof src !== 'string' || !src) return;

      if (!grouped[projectSlug]) grouped[projectSlug] = [];
      grouped[projectSlug].push({
        src,
        filename,
        label: normalizeFilename(filename),
      });
    } catch {
      // Ignore one unreadable asset without blocking every other gallery.
    }
  });

  Object.keys(grouped).forEach((projectSlug) => {
    const sortedImages = grouped[projectSlug]
      .slice()
      .sort((a, b) => a.filename.localeCompare(b.filename, 'en', NATURAL_SORT_OPTIONS))
      .map((image) => Object.freeze(image));

    grouped[projectSlug] = Object.freeze(sortedImages);
  });

  return Object.freeze(grouped);
};

export const getProjectImagesFromManifest = (manifest, projectSlug) => {
  if (!projectSlug || typeof projectSlug !== 'string') return EMPTY_IMAGES;
  return manifest[projectSlug] || EMPTY_IMAGES;
};

export const getProjectImageAlt = (projectTitle, image) => {
  const title = typeof projectTitle === 'string' ? projectTitle.trim() : '';
  const label = image?.label || normalizeFilename(image?.filename || '');

  if (title && label) return `${title} — ${label}`;
  return title || label;
};


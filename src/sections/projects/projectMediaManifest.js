const EMPTY_IMAGES = Object.freeze([]);
const EMPTY_MEDIA = Object.freeze({ type: 'none', items: EMPTY_IMAGES });
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
const loadAsset = (context, key) => {
  try {
    const loadedModule = context(key);
    const src = loadedModule?.default || loadedModule;
    return typeof src === 'string' && src ? src : null;
  } catch {
    // One unreadable asset must not block every other project.
    return null;
  }
};

export const createProjectMediaManifest = (context) => {
  const grouped = {};

  context.keys().forEach((key) => {
    const pathParts = key.replace(/^\.\//, '').split('/');
    if (pathParts.length < 2 || pathParts.some((part) => part.startsWith('.'))) return;

    const projectSlug = pathParts[0];
    const filename = pathParts[pathParts.length - 1];
    const isVideo = /\.mp4$/i.test(filename);
    const isImage = /\.(png|jpe?g|webp|avif)$/i.test(filename);
    if (!isVideo && !isImage) return;

    const src = loadAsset(context, key);
    if (!src) return;

    if (!grouped[projectSlug]) grouped[projectSlug] = { videos: [], images: [] };
    grouped[projectSlug][isVideo ? 'videos' : 'images'].push({
      src,
      filename,
      label: normalizeFilename(filename),
    });
  });

  const manifest = {};

  Object.entries(grouped).forEach(([projectSlug, assets]) => {
    const sortAssets = (items) => items
      .slice()
      .sort((a, b) => a.filename.localeCompare(b.filename, 'en', NATURAL_SORT_OPTIONS))
      .map((item) => Object.freeze(item));

    const videos = sortAssets(assets.videos);
    const images = sortAssets(assets.images);

    // A real MP4 is the explicit source of truth for a video-first project.
    // Images remain available only when no showcase video exists, which keeps
    // Shahm Law image-based and makes its future migration a filesystem-only
    // change: add an MP4, rebuild, and the manifest switches automatically.
    if (videos.length > 0) {
      manifest[projectSlug] = Object.freeze({
        type: 'video',
        src: videos[0].src,
        filename: videos[0].filename,
      });
    } else if (images.length > 0) {
      manifest[projectSlug] = Object.freeze({
        type: 'images',
        items: Object.freeze(images),
      });
    }
  });

  return Object.freeze(manifest);
};

export const getProjectMediaFromManifest = (manifest, projectSlug) => {
  if (!projectSlug || typeof projectSlug !== 'string') return EMPTY_MEDIA;
  return manifest[projectSlug] || EMPTY_MEDIA;
};

export const getProjectImageAlt = (projectTitle, image) => {
  const title = typeof projectTitle === 'string' ? projectTitle.trim() : '';
  const label = image?.label || normalizeFilename(image?.filename || '');

  if (title && label) return `${title} — ${label}`;
  return title || label;
};

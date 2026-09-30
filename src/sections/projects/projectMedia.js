import {
  createProjectMediaManifest,
  getProjectImageAlt,
  getProjectMediaFromManifest,
} from './projectMediaManifest';

const mediaContext = require.context(
  '../../assets/images/projects',
  true,
  /\.(mp4|png|jpe?g|webp|avif)$/i
);

// Built once by Webpack. Media stays filesystem-driven: adding or removing a
// file may require a CRA dev-server restart and always requires a new build.
const PROJECT_MEDIA_MANIFEST = createProjectMediaManifest(mediaContext);

export const getProjectMedia = (projectSlug) => (
  getProjectMediaFromManifest(PROJECT_MEDIA_MANIFEST, projectSlug)
);

export { getProjectImageAlt };

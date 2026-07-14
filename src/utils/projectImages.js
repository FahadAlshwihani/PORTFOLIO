import {
  createProjectImageManifest,
  getProjectImageAlt,
  getProjectImagesFromManifest,
} from './projectImageManifest';

const imageContext = require.context(
  '../components/assets/images/projects',
  true,
  /\.(png|jpe?g|webp|avif)$/i
);

// Built once by Webpack. Adding or removing screenshots may require a CRA
// development-server restart; production always requires a new build.
const PROJECT_IMAGE_MANIFEST = createProjectImageManifest(imageContext);

export const getProjectImages = (projectSlug) => (
  getProjectImagesFromManifest(PROJECT_IMAGE_MANIFEST, projectSlug)
);

export { getProjectImageAlt };

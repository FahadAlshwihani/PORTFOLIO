module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.push({
        test: /\.glb$/,
        type: 'asset/resource',
      });

      // @react-three/drei depends on @mediapipe/tasks-vision, whose published
      // build's sourceMappingURL comment points at a file the package doesn't
      // actually ship (an upstream packaging defect). Ignore just that one
      // warning instead of disabling source maps project-wide.
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        {
          module: /@mediapipe[\\/]tasks-vision/,
          message: /Failed to parse source map/,
        },
      ];

      return webpackConfig;
    },
  },
};
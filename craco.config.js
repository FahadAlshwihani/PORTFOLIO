module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.push({
        test: /\.glb$/,
        type: 'asset/resource',
      });
      return webpackConfig;
    },
  },
};
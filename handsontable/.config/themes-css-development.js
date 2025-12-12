const configFactory = require('./base');
const CopyPlugin = require('copy-webpack-plugin');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function (c) {
    c.devtool = false;

    // Use a minimal entry to satisfy webpack
    c.entry = {};

    c.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: 'src/themes/css/**/*.css',
            to: '../styles/[name].css',
          },
        ],
      }),
    );
  });

  return config;
}

const rspack = require('@rspack/core');
const configFactory = require('./base');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function (c) {
    c.devtool = false;

    // Use a minimal entry to satisfy rspack
    c.entry = {};

    c.plugins.push(
      new rspack.CopyRspackPlugin({
        patterns: [
          {
            from: 'src/themes/static/css/**/*.css',
            to: '../styles/[name].css',
          },
        ],
      }),
    );
  });

  return config;
}

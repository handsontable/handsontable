const path = require('path');
const base = require('./jest.config');

/**
 * Jest config for Stryker mutation runs. Identical to the normal unit config,
 * except the Babel transform is pinned to this package's babel.config.js —
 * Stryker's jest worker changes cwd, which breaks babel-jest's cwd-relative
 * config discovery (raw `import` statements then crash the dry run).
 */
module.exports = {
  ...base,
  rootDir: __dirname,
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: path.resolve(__dirname, 'babel.config.js'), envName: 'commonjs' }],
  },
};

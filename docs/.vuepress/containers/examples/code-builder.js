const { transformSync } = require('@babel/core');

const babelConfig = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-syntax-class-properties',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
  ],
  targets: {
    ie: 9
  }
};
const buildCode = (filename, contentJs, relativePath = '') => {
  try {
    return transformSync(contentJs, { ...babelConfig, filename }).code;
  } catch (error) {
    // eslint-disable-next-line
    console.error(`Babel error when building ${relativePath}`);
    throw error;
  }
};

module.exports = { buildCode };

const { BROWSERS_LIST } = require('./browser-targets.js');

const babelPresetConfig = () => ({
  targets: `${BROWSERS_LIST.join(', ')}, Node >= 11`, // (Node 11) support for Webpack 4 and similar oldish bundlers
  modules: false,
  debug: false,
  useBuiltIns: false,
});

module.exports = {
  presets: [
    ['@babel/preset-env', babelPresetConfig()]
  ],
  plugins: [
    ['transform-inline-environment-variables'],
    '@babel/plugin-syntax-jsx'
  ],
};

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
  // No `transform-inline-environment-variables`: Babel only serves Jest here (the builds use swc
  // and rspack's DefinePlugin), and Jest reads `process.env` live. Inlining at transform time only
  // baked a stale `HOT_VERSION` into the cache (DEV-3746).
  plugins: [
    '@babel/plugin-syntax-jsx'
  ],
};

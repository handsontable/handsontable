const babelPresetConfig = () => ({
  targets: {
    chrome: '110',
    firefox: '110',
    safari: '14.1',
    node: '11', // support for Webpack 4 and similar oldish bundlers
  },
  modules: false,
  debug: false,
  useBuiltIns: 'usage',
  corejs: {
    version: '3.37'
  }
});

module.exports = {
  presets: [
    ['@babel/preset-env', babelPresetConfig()]
  ],
  plugins: [
    ['transform-inline-environment-variables'],
    '@babel/plugin-syntax-jsx'
  ]
};

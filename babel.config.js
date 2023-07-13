const babelPresetConfig = () => ({
  targets: {
    chrome: '110',
    firefox: '110',
    safari: '14.1'
  },
  modules: false,
  debug: false,
  useBuiltIns: 'usage',
  corejs: {
    version: '3.31'
  }
});

module.exports = {
  presets: [
    ['@babel/preset-env', babelPresetConfig()]
  ],
  plugins: [
    ['transform-inline-environment-variables']
  ]
};

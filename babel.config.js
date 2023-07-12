const babelPresetConfig = () => ({
  targets: {
    chrome: '110',
    firefox: '110',
    safari: '14.1'
  },
  modules: false,
  debug: false,
  useBuiltIns: 'usage',
  corejs: 3,
});

module.exports = {
  presets: [
    ['@babel/preset-env', babelPresetConfig()]
  ],
  plugins: [
    ['transform-inline-environment-variables']
  ]
};

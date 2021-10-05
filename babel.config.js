const babelPresetConfig = () => ({
  targets: {
    chrome: '41',
    firefox: '34',
    ie: '9',
    safari: '9'
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
    ['@babel/plugin-proposal-object-rest-spread', { useBuiltIns: true }],
    ['transform-inline-environment-variables'],
    ['@babel/plugin-proposal-class-properties']
  ]
};

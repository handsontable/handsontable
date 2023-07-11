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
    ['@babel/plugin-proposal-object-rest-spread', { useBuiltIns: true }],
    ['transform-inline-environment-variables'],
    ['@babel/plugin-proposal-class-properties']
  ]
};

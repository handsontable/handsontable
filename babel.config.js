const babelPresetConfig = () => ({
  modules: false,
  debug: false,
  useBuiltIns: false,
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

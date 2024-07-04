module.exports = {
  presets: [
    ['@babel/preset-env']
  ],
  plugins: [
    ['@babel/plugin-transform-typescript', {
      allExtensions: true,
      isTSX: true
    }]
  ]
};

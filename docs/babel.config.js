module.exports = {
  presets: [
    ['@babel/preset-env']
  ],
  plugins: [
    ['@babel/plugin-proposal-private-property-in-object', { 'loose': true }]
  ]
};

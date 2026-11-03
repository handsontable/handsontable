/**
 * Jest transform for `hyperformula-ui`, which ships ES modules only. The package lives outside this
 * package's root, so `.babelrc` does not reach it: give babel-jest the one preset it needs inline.
 */
const babelJest = require('babel-jest');

module.exports = (babelJest.default || babelJest).createTransformer({
  babelrc: false,
  configFile: false,
  presets: [require.resolve('@babel/preset-env')],
});

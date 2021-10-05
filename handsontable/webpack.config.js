const env = process.env.NODE_ENV;
// eslint-disable-next-line import/no-dynamic-require
const configFactory = require(`./.config/${env}`);

// In some cases, npm env variables become rewritten to lower case names. To prevent this it is rewritten to the
// original variable name so the --testPathPattern work in any case.
if (process.env.npm_config_testpathpattern) {
  process.env.npm_config_testPathPattern = process.env.npm_config_testpathpattern;
}

module.exports = function() {
  return configFactory.create({
    testPathPattern: process.env.npm_config_testPathPattern,
  });
};

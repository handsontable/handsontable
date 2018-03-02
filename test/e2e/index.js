require('babel-polyfill');
require('jasmine-co').install();

let testPathRegExp = null;

if (typeof __ENV_ARGS__ === 'object' && __ENV_ARGS__.testPathPattern) {
  // Remove string between % signs. On Windows' machines an empty env variable was visible as '%{variable_name}%' so it must be stripped.
  // See https://github.com/handsontable/handsontable/issues/4378).
  const pattern = __ENV_ARGS__.testPathPattern.replace(/^%(.*)%$/, '');

  if (pattern) {
    testPathRegExp = new RegExp(pattern, 'i');
  }
}

const ignoredE2ETestsPath = './mobile';

[
  require.context('.', true, /\.spec\.js$/),
  require.context('./../../src/plugins', true, /\.e2e\.js$/),
].forEach((req) => {
  req.keys().forEach((filePath) => {
    if (filePath.includes(ignoredE2ETestsPath) === false) {
      if (testPathRegExp === null || (testPathRegExp instanceof RegExp && testPathRegExp.test(filePath))) {
        req(filePath);
      }
    }
  });
});

require('./MemoryLeakTest');

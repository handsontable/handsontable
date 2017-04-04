require('babel-polyfill');
require('jasmine-co').install();

const regExp = new RegExp(typeof __ENV_ARGS__ === 'object' ? __ENV_ARGS__.testPathPattern : '.*', 'i');

[
  require.context('.', true, /\.spec\.js$/),
  require.context('./../../src/plugins', true, /\.e2e\.js$/),
].forEach((req) => {
  req.keys().forEach((key) => {
    if (regExp.test(key)) {
      req(key);
    }
  });
});

require('./MemoryLeakTest');

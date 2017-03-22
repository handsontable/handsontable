const regExp = new RegExp(typeof __ENV_ARGS__ === 'object' ? __ENV_ARGS__.testPathPattern : '.*');

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

[
  require.context('.', true, /\.spec\.js$/),
  require.context('./../../src/plugins', true, /\.e2e\.js$/),
].forEach((req) => {
  req.keys().forEach((key) => {
    req(key);
  });
});

require('./MemoryLeakTest');

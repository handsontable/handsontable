[
  require.context('.', true, /\.spec\.js$/),
  require.context('./../../src/plugins', true, /\.e2e\.js$/),
].forEach(function(req) {
  req.keys().forEach(function(key) {
    req(key);
  });
});

require('./MemoryLeakTest');

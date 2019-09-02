[
  require.context('.', true, /\.spec\.js$/),
].forEach((req) => {
  req.keys().forEach((key) => {
    req(key);
  });
});

require('./MemoryLeakTest');

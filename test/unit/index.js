[
  require.context('.', true, /\.spec\.js$/),
  require.context('./../../src/plugins', true, /\.unit\.js$/),
].forEach(function(req) {
  req.keys().forEach(function(key) {
    req(key);
  });
});

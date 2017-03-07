[
  require.context('.', true, /\.spec\.js$/),
  require.context('./../../src/plugins', true, /\.unit\.js$/),
].forEach((req) => {
  req.keys().forEach((key) => {
    req(key);
  });
});

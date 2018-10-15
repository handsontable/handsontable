[require.context('.', true, /\.spec\.js$/)].forEach(function (req) {
  req.keys().forEach(function (key) {
    req(key);
  });
});
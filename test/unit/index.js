var req = require.context('.', true, /\.spec\.js$/);

req.keys().forEach(function(key) {
    req(key);
});

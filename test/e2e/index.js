var req = require.context('.', true, /\.spec\.js$/);
// var req = require.context('./../plugins/**', true, /\.spec\.js$/);

req.keys().forEach(function(key) {
    req(key);
});

require('./MemoryLeakTest');

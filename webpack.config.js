'use strict';

var webpack = require('webpack');
var path = require('path');

var env = process.env.NODE_ENV;
var configFactory = require('./.config/' + env);

var configs = configFactory.create();

// if (env === 'development') {
//   config.plugins.push(
//     new webpack.HotModuleReplacementPlugin()
//   );
// }
//

module.exports = configs;

'use strict';

var webpack = require('webpack');
var path = require('path');

var env = process.env.NODE_ENV;
var configFactory = require('./.config/' + env);

module.exports = function(envArgs) {
  return configFactory.create(envArgs);
};

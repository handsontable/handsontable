var util = require('util');
var path = require('path');
var fs = require('fs');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var jasmineCore = require('jasmine-core');

var jasmineFiles = jasmineCore.files;
var jasminePath = toRelativePath(jasmineFiles.path);
var jasmineBootDir = toRelativePath(jasmineFiles.bootDir);

function JasmineWebpackPlugin(options) {
  options = options || {};

  return new HtmlWebpackPlugin({
    inject: true,
    filename: options.filename || 'SpecRunner.html',
    template: path.join(__dirname, 'template.ejs'),
    baseJasminePath: options.baseJasminePath || '',
    jasmineJsFiles: toRelativeFiles(jasminePath, jasmineFiles.jsFiles).concat(toRelativeFiles(jasmineBootDir, jasmineFiles.bootFiles)),
    jasmineCssFiles: toRelativeFiles(jasminePath, jasmineFiles.cssFiles),
    externalJsFiles: options.externalJsFiles || [],
    externalCssFiles: options.externalCssFiles || [],
    minify: false,
  });
}

function toRelativePath(dirname) {
  return dirname.replace(process.cwd(), '').replace(/^\//, '');
}

function toRelativeFiles(dirname, files) {
  return files.map(function(file) {
    return path.join(dirname, file);
  });
}

module.exports = JasmineWebpackPlugin;

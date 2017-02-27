var util = require('util');
var path = require('path');
var fs = require('fs');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var jasmineCore = require('jasmine-core');

var jasmineFiles = jasmineCore.files;
var jasminePath = resolveJasmineDir(jasmineFiles.path);
var jasmineBootDir = resolveJasmineDir(jasmineFiles.bootDir);

var jasmineJsFiles = resolveJasmineFiles(jasminePath, jasmineFiles.jsFiles);
var jasmineCssFiles = resolveJasmineFiles(jasminePath, jasmineFiles.cssFiles);
var jasmineBootFiles = resolveJasmineFiles(jasmineBootDir, jasmineFiles.bootFiles);

function JasmineWebpackPlugin(options) {
  options = options || {};

  return new HtmlWebpackPlugin({
    inject: true,
    filename: options.filename || 'SpecRunner.html',
    template: path.join(__dirname, 'template.ejs'),
    jasmineJsFiles: jasmineJsFiles.concat(jasmineBootFiles),
    jasmineCssFiles: jasmineCssFiles,
    externalJsFiles: options.externalJsFiles || [],
    externalCssFiles: options.externalCssFiles || [],
    minify: false,
  });
}

function resolveJasmineDir(dirname) {
  return dirname.replace(process.cwd(), '').replace(/^\//, '');
}

function resolveJasmineFiles(dirname, files) {
  return files.map(function(file) { return path.join(dirname, file); });
}

module.exports = JasmineWebpackPlugin;

/* eslint-disable jsdoc/require-jsdoc */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const jasmineCore = require('jasmine-core');

const jasmineFiles = jasmineCore.files;
const jasminePath = toRelativePath(jasmineFiles.path);
const jasmineBootDir = toRelativePath(jasmineFiles.bootDir);

function JasmineWebpackPlugin(options) {
  options = options || {};

  return new HtmlWebpackPlugin({
    inject: true,
    filename: options.filename || 'SpecRunner.html',
    template: path.join(__dirname, 'template.ejs'),
    baseJasminePath: options.baseJasminePath || '',
    jasmineJsFiles: toRelativeFiles(jasminePath, jasmineFiles.jsFiles)
      .concat(toRelativeFiles(jasmineBootDir, jasmineFiles.bootFiles)),
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
  return files.map(file => path.join(dirname, file));
}

module.exports = JasmineWebpackPlugin;

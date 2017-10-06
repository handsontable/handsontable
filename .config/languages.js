'use strict';

/**
 * Config responsible for building Handsontable `languages/` files.
 */
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StringReplacePlugin  = require('string-replace-webpack-plugin');
const fs  = require('fs');

const NEW_LINE_CHAR = '\n';
const LANGUAGES_DIRECTORY = 'src/i18n/languages'

const licenseBody = fs.readFileSync(path.resolve(__dirname, '../LICENSE'), 'utf8');

function getEntryJsFiles() {
  const entryObject = {};
  const filesInLanguagesDirectory = fs.readdirSync(LANGUAGES_DIRECTORY);

  filesInLanguagesDirectory.forEach((fileName, b) => {
    const jsExtensionRegExp = /\.js$/
    const isJsFile = (fileName) => jsExtensionRegExp.test(fileName);

    if (isJsFile(fileName)) {
      const fileNameWithoutExtension = fileName.replace(jsExtensionRegExp, '');

      entryObject[fileNameWithoutExtension] = path.resolve(LANGUAGES_DIRECTORY, fileName);
    }
  });

  return entryObject;
}

const ruleForSnippetsInjection = {
  test: /\.js$/,
  include: [
    path.resolve(__dirname, '../', LANGUAGES_DIRECTORY),
  ],
  loader: StringReplacePlugin.replace({
    replacements: [{
      pattern: /import.+constants.+/,
      replacement: function(match) {
        const snippet = `import Handsontable from '../../handsontable';`;

        return `${match}${NEW_LINE_CHAR}${snippet}`;
      }
    },
    {
      pattern: /export default dictionary.+/,
      replacement: function(match) {
        const snippet = `Handsontable.languages.registerLocaleDictionary(dictionary.languageCode, dictionary);`;

        return `${snippet}${NEW_LINE_CHAR.repeat(2)}${match}`;
      }
    }]
  })
};

module.exports.create = function create(envArgs) {
  const config = {
    entry: getEntryJsFiles(),
    output: {
      path: path.resolve(__dirname, '../languages'),
      libraryTarget: 'umd',
      filename: '[name].js',
      libraryExport: 'default',
      umdNamedDefine: true
    },
    externals: {
      '../../handsontable': {
        root: 'Handsontable',
        commonjs2: '../../handsontable',
        commonjs: '../../handsontable',
        amd: '../../handsontable',
      },
    },
    module: {
      rules: [
        {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
        ruleForSnippetsInjection
      ]
    },
    plugins: [
      new webpack.BannerPlugin(licenseBody)
    ]
  }

  return [config];
}

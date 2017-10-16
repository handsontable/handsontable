'use strict';

/**
 * Config responsible for building Handsontable `languages/` files.
 */

const NEW_LINE_CHAR = '\n';
const SOURCE_LANGUAGES_DIRECTORY = './node_modules/handsontable/src/i18n/languages';
const OUTPUT_LANGUAGES_DIRECTORY = 'languages';

const path = require('path');
const webpack = require('webpack');
const StringReplacePlugin  = require('string-replace-webpack-plugin');
const fs  = require('fs');

const licenseBody = fs.readFileSync(path.resolve(__dirname, '../LICENSE'), 'utf8');

function getEntryJsFiles() {
  const entryObject = {};
  const filesInLanguagesDirectory = fs.readdirSync(SOURCE_LANGUAGES_DIRECTORY);

  filesInLanguagesDirectory.forEach((fileName) => {
    const jsExtensionRegExp = /\.js$/;
    const isJsFile = (fileName) => jsExtensionRegExp.test(fileName);

    if (isJsFile(fileName)) {
      const fileNameWithoutExtension = fileName.replace(jsExtensionRegExp, '');

      entryObject[fileNameWithoutExtension] = path.resolve(SOURCE_LANGUAGES_DIRECTORY, fileName);
    }
  });

  return entryObject;
}

const ruleForSnippetsInjection = {
  test: /\.js$/,
  include: [
    path.resolve(__dirname, '../', SOURCE_LANGUAGES_DIRECTORY),
  ],
  loader: StringReplacePlugin.replace({
    replacements: [{
      pattern: /import.+constants.+/,
      replacement: function() {
        const snippet1 = `import Handsontable from '../../handsontable-pro';`;
        const snippet2 = `const C = Handsontable.languages.constants;`;

        return `${snippet1}${NEW_LINE_CHAR.repeat(2)}${snippet2}`;
      }
    },
      {
        pattern: /export default dictionary.+/,
        replacement: function(matchingPhrase) {
          const snippet = `Handsontable.languages.register(dictionary.languageCode, dictionary);`;

          return `${snippet}${NEW_LINE_CHAR.repeat(2)}${matchingPhrase}`;
        }
      }]
  })
};

module.exports.create = function create() {
  const config = {
    entry: getEntryJsFiles(),
    output: {
      path: path.resolve(__dirname, '../' + OUTPUT_LANGUAGES_DIRECTORY),
      libraryTarget: 'umd',
      filename: '[name].js',
      libraryExport: 'default',
      umdNamedDefine: true
    },
    externals: {
      '../../handsontable-pro': {
        root: 'Handsontable',
        commonjs2: '../../handsontable-pro',
        commonjs: '../../handsontable-pro',
        amd: '../../handsontable-pro',
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
  };

  return [config];
};

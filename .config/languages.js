'use strict';

/**
 * Config responsible for building Handsontable `languages/` files.
 */

const NEW_LINE_CHAR = '\n';
const SOURCE_LANGUAGES_DIRECTORY = 'src/i18n/languages';
const OUTPUT_LANGUAGES_DIRECTORY = 'languages';

const path = require('path');
const StringReplacePlugin  = require('string-replace-webpack-plugin');
const fs  = require('fs');

function getEntryJsFiles() {
  const entryObject = {};
  const filesInLanguagesDirectory = fs.readdirSync(SOURCE_LANGUAGES_DIRECTORY);

  filesInLanguagesDirectory.forEach((fileName) => {
    const jsExtensionRegExp = /\.js$/

    if (jsExtensionRegExp.test(fileName)) {
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
        const snippet1 = `import Handsontable from '../../handsontable';`;
        const snippet2 = `const C = Handsontable.languages.constants;`;

        return `${snippet1}${NEW_LINE_CHAR.repeat(2)}${snippet2}`;
      }
    },
    {
      pattern: /export default dictionary.+/,
      replacement: function(matchingPhrase) {
        const snippet = `Handsontable.languages.register(dictionary);`;

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
    }
  };

  return [config];
};

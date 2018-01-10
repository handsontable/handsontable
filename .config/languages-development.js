'use strict';

/**
 * Config responsible for building not minified Handsontable `languages/` files.
 */

const path = require('path');
const fs  = require('fs');
const fsExtra  = require('fs-extra');
const StringReplacePlugin  = require('string-replace-webpack-plugin');
const WebpackOnBuildPlugin = require('on-build-webpack');

const SOURCE_LANGUAGES_DIRECTORY = fs.realpathSync('./node_modules/handsontable/src/i18n/languages');
const NEW_LINE_CHAR = '\n';
const OUTPUT_LANGUAGES_DIRECTORY = 'languages';

function getEntryJsFiles() {
  const entryObject = {};
  const filesInLanguagesDirectory = fs.readdirSync(SOURCE_LANGUAGES_DIRECTORY);

  filesInLanguagesDirectory.forEach((fileName) => {
    const jsExtensionRegExp = /\.js$/;

    if (jsExtensionRegExp.test(fileName)) {
      let fileNameWithoutExtension = fileName.replace(jsExtensionRegExp, '');

      if (fileNameWithoutExtension === 'index') {
        fileNameWithoutExtension = 'all';
      }

      entryObject[fileNameWithoutExtension] = path.resolve(SOURCE_LANGUAGES_DIRECTORY, fileName);
    }
  });

  return entryObject;
}

const ruleForSnippetsInjection = {
  test: /\.js$/,
  loader: StringReplacePlugin.replace({
    replacements: [
      {
        pattern: /import.+constants.+/,
        replacement: function() {
          const snippet1 = `import Handsontable from '../../handsontable-pro';`;
          const snippet2 = `const C = Handsontable.languages.dictionaryKeys;`;

          return `${snippet1}${NEW_LINE_CHAR.repeat(2)}${snippet2}`;
        }
      },
      {
        pattern: /export default dictionary.+/,
        replacement: function(matchingPhrase) {
          const snippet = `Handsontable.languages.registerLanguageDictionary(dictionary);`;

          return `${snippet}${NEW_LINE_CHAR.repeat(2)}${matchingPhrase}`;
        }
      }
    ]
  })
};

module.exports.create = function create() {
  const config = {
    entry: getEntryJsFiles(),
    output: {
      path: path.resolve(__dirname, '../' + OUTPUT_LANGUAGES_DIRECTORY),
      libraryTarget: 'umd',
      filename: '[name].js',
      // Workaround below: Without this option webpack would export all language packs as globals
      libraryExport: '___',
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
        {test: /\.js$/, exclude: /node_modules\/(?!handsontable)/, loader: 'babel-loader'},
        ruleForSnippetsInjection
      ]
    },
    plugins: [
      new WebpackOnBuildPlugin(() => {
        const filesInOutputLanguagesDirectory = fs.readdirSync(OUTPUT_LANGUAGES_DIRECTORY);
        const indexFileName = 'index.js';
        const allLanguagesFileName = 'all.js';

        // copy files from `languages` directory to `dist/languages` directory
        filesInOutputLanguagesDirectory.forEach((fileName) => {
          if (fileName !== indexFileName) {
            fsExtra.copySync(`${OUTPUT_LANGUAGES_DIRECTORY}/${fileName}`, `dist/languages/${fileName}`);
          }
        });

        // copy from `languages/all.js` to `languages/index.js`
        if (filesInOutputLanguagesDirectory.includes(allLanguagesFileName)) {
          fsExtra.copySync(`${OUTPUT_LANGUAGES_DIRECTORY}/${allLanguagesFileName}`, `${OUTPUT_LANGUAGES_DIRECTORY}/${indexFileName}`);
        }
      })
    ]
  };

  return [config];
};

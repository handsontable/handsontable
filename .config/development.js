/**
 * Config responsible for building Handsontable `dist/` files:
 *  - handsontable.js
 *  - handsontable.css
 *  - handsontable.full.js
 *  - handsontable.full.css
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const configFactory = require('./base');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;

module.exports.create = function create(envArgs) {
  const configBase = configFactory.create(envArgs);
  const configFull = configFactory.create(envArgs);

  configBase.forEach(function(c) {
    c.output.filename = PACKAGE_FILENAME + '.js';
    c.devtool = 'source-map';
    // Exclude all external dependencies from 'base' bundle (handsontable.js and handsontable.css files)
    c.externals = {
      numbro: {
        root: 'numbro',
        commonjs2: 'numbro',
        commonjs: 'numbro',
        amd: 'numbro',
      },
      moment: {
        root: 'moment',
        commonjs2: 'moment',
        commonjs: 'moment',
        amd: 'moment',
      },
      pikaday: {
        root: 'Pikaday',
        commonjs2: 'pikaday',
        commonjs: 'pikaday',
        amd: 'pikaday',
      },
      dompurify: {
        root: 'DOMPurify',
        commonjs2: 'dompurify',
        commonjs: 'dompurify',
        amd: 'dompurify',
      },
    };
    c.module.rules.unshift({
      test: [
        // Disable loading css files from pikaday module
        /pikaday\/css/,
      ],
      loader: path.resolve(__dirname, 'loader/empty-loader.js'),
    });
    c.plugins.push(
      new MiniCssExtractPlugin({ filename: `${PACKAGE_FILENAME}.css` }),
    );
  });

  configFull.forEach(function(c) {
    c.entry = ['hyperformula', ...c.entry];
    c.output.filename = PACKAGE_FILENAME + '.full.js';
    // Export these dependencies to the window object. So they can be custom configured
    // before the Handsontable initializiation.
    c.module.rules.unshift({
      test: /numbro/,
      use: [
        {
          loader: path.resolve(__dirname, 'loader/exports-to-window-loader.js'),
          options: {
            globals: {
              numbro: 'numbro',
            }
          }
        }
      ]
    });
    c.module.rules.unshift({
      test: /moment/,
      use: [
        {
          loader: path.resolve(__dirname, 'loader/exports-to-window-loader.js'),
          options: {
            globals: {
              moment: 'moment',
            }
          }
        }
      ]
    });
    c.module.rules.unshift({
      test: /dompurify/,
      use: [
        {
          loader: path.resolve(__dirname, 'loader/exports-to-window-loader.js'),
          options: {
            globals: {
              DOMPurify: 'dompurify',
            }
          }
        }
      ]
    });
    c.module.rules.unshift({
      test: /hyperformula/,
      use: [
        {
          loader: path.resolve(__dirname, 'loader/exports-to-window-loader.js'),
          options: {
            globals: {
              HyperFormula: 'hyperformula',
            },
            defaultExport: true
          }
        }
      ]
    });

    c.plugins.push(
      new MiniCssExtractPlugin({ filename: `${PACKAGE_FILENAME}.full.css` })
    );
  });

  return [].concat(configBase, configFull);
}

/**
 * Config responsible for building the CDN file of `handsontable/settingsSchema`:
 *  - dist/handsontable.settings-schema.js
 *
 * The file reads what is registered on the `Handsontable` of the page and carries no registry of its own, so it
 * must load after `handsontable.js` or `handsontable.full.js`.
 */
const path = require('path');
const configFactory = require('./base');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.entry = [path.resolve(__dirname, '../src/settingsSchema.ts')];
    c.devtool = 'source-map';
    c.output.filename = `${PACKAGE_FILENAME}.settings-schema.js`;
    // Export the named exports (`settingsSchema` and `validateSettings`) on the global.
    c.output.library = 'HandsontableSettingsSchema';
    delete c.output.libraryExport;
    // Read the registries of the page's `Handsontable` instead of inlining a second, empty copy: the alias swaps the
    // registry adapter, and the external makes the page's `Handsontable` its source. The external is the global
    // `Handsontable`, or the module an AMD or CommonJS loader resolves for `handsontable` (as in the theme files).
    c.resolve.alias = {
      ...c.resolve.alias,
      [path.resolve(__dirname, '../src/settingsSchema/registries.ts')]:
        path.resolve(__dirname, '../src/settingsSchema/registries.umd.ts'),
    };
    c.externals = {
      './pageHandsontable': {
        root: 'Handsontable',
        commonjs2: PACKAGE_FILENAME,
        commonjs: PACKAGE_FILENAME,
        amd: PACKAGE_FILENAME,
      },
    };
  });

  return config;
};

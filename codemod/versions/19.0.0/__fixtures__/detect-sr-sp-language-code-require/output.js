const Handsontable = require('handsontable');

// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
require('handsontable/languages/sr-SP.js');
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
const serbianDist = require('handsontable/dist/languages/sr-SP.min.js');
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
require('handsontable/dist/languages/sr-SP.js');
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
const lazy = await import('handsontable/i18n/languages/sr-SP.mjs');

new Handsontable(document.querySelector('#grid'), { data: [[1]] });

// The new language file is not reported.
require('handsontable/dist/languages/sr-Latn-RS.js');
const other = await import('handsontable/i18n/languages/sr-Latn-RS.mjs');

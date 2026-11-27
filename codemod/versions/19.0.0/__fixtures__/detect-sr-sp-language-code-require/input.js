const Handsontable = require('handsontable');

require('handsontable/languages/sr-SP.js');
const serbianDist = require('handsontable/dist/languages/sr-SP.min.js');
require('handsontable/dist/languages/sr-SP.js');
const lazy = await import('handsontable/i18n/languages/sr-SP.mjs');

new Handsontable(document.querySelector('#grid'), { data: [[1]] });

// The new language file is not reported.
require('handsontable/dist/languages/sr-Latn-RS.js');
const other = await import('handsontable/i18n/languages/sr-Latn-RS.mjs');

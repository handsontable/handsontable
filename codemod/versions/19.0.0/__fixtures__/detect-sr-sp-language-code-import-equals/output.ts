import Handsontable = require('handsontable');
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
import serbian = require('handsontable/languages/sr-SP');
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
import serbianI18n = require('handsontable/i18n/languages/sr-SP.js');

new Handsontable(document.body, { data: [[1]] });

// The new language file and another language are not reported.
import latin = require('handsontable/languages/sr-Latn-RS');
import polish = require('handsontable/languages/pl-PL');
import local = require('./languages/sr-SP');

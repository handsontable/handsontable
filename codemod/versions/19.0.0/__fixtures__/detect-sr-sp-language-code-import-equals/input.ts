import Handsontable = require('handsontable');
import serbian = require('handsontable/languages/sr-SP');
import serbianI18n = require('handsontable/i18n/languages/sr-SP.js');

new Handsontable(document.body, { data: [[1]] });

// The new language file and another language are not reported.
import latin = require('handsontable/languages/sr-Latn-RS');
import polish = require('handsontable/languages/pl-PL');
import local = require('./languages/sr-SP');

import Handsontable from 'handsontable';
import 'handsontable/languages/sr-SP.js';
import 'handsontable/languages/sr-SP.mjs';
import 'handsontable/languages/sr-SP';
import serbianI18n from 'handsontable/i18n/languages/sr-SP.js';
import serbianMjs from 'handsontable/i18n/languages/sr-SP.mjs';

new Handsontable(document.querySelector('#grid'), { data: [[1]] });

// The new language file and other files that share a prefix are not reported.
import 'handsontable/languages/sr-Latn-RS.js';
import 'handsontable/i18n/languages/sr-Latn-RS';
import 'handsontable/dist/languages/sr-Latn-RS.min.js';
import 'handsontable/languages/sr-SPA.js';
import 'handsontable/languages/pl-PL.js';

// A date format for the same locale is not a language of the grid.
const format = new Intl.DateTimeFormat('sr-SP');

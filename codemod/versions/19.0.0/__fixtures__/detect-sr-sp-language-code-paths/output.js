import Handsontable from 'handsontable';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
import 'handsontable/languages/sr-SP.js';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
import 'handsontable/languages/sr-SP.mjs';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
import 'handsontable/languages/sr-SP';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
import serbianI18n from 'handsontable/i18n/languages/sr-SP.js';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
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

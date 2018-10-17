(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("../../handsontable-pro"));
	else if(typeof define === 'function' && define.amd)
		define(["../../handsontable-pro"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("../../handsontable-pro")) : factory(root["Handsontable"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE_0__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 15);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Stefan Salzl
                                                                                                                                                                                                                   * Last updated: Jan 08, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for German - Switzerland language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'de-CH'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Zeile einfügen oberhalb'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Zeile einfügen unterhalb'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Spalte einfügen links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Spalte einfügen rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Zeile löschen', 'Zeilen löschen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Spalte löschen', 'Spalten löschen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Rückgangig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Wiederholen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Nur Lesezugriff'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Spalteninhalt löschen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Ausrichtung'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Linksbündig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Zentriert'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Rechtsbündig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Blocksatz'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Oben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Mitte'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Unten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Spalte fixieren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Spaltenfixierung aufheben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Rahmen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Oben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Unten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Kein Rahmen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Kommentar hinzufügen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Kommentar bearbeiten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Kommentar löschen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Schreibschutz Kommentar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Zellen verbinden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Zellen teilen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopieren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Ausschneiden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Nachfolgerzeile einfügen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Von Vorgängerzeile abkoppeln'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Spalte ausblenden', 'Spalten ausblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Spalte einblenden', 'Spalten einblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Zeile ausblenden', 'Zeilen ausblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Zeile einblenden', 'Zeilen einblenden']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Kein Filter'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Ist leer'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Ist nicht leer'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Ist gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Ist ungleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Beginnt mit'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Endet mit'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Enthält'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Enthält nicht'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Grösser als'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Grösser gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Kleiner als'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Kleiner gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Zwischen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Ausserhalb'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Nach'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Vor'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Heute'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Morgen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Gestern'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Leere Zellen'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Per Bedingung filtern'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Nach Zahlen filtern'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'Und'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Oder'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Alles auswählen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Auswahl aufheben'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Abbrechen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Suchen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Wert'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Alternativwert'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Stefan Salzl
                                                                                                                                                                                                                   * Last updated: Jan 08, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for German - Germany language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'de-DE'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Zeile einfügen oberhalb'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Zeile einfügen unterhalb'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Spalte einfügen links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Spalte einfügen rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Zeile löschen', 'Zeilen löschen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Spalte löschen', 'Spalten löschen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Rückgangig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Wiederholen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Nur Lesezugriff'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Spalteninhalt löschen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Ausrichtung'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Linksbündig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Zentriert'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Rechtsbündig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Blocksatz'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Oben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Mitte'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Unten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Spalte fixieren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Spaltenfixierung aufheben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Rahmen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Oben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Unten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Kein Rahmen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Kommentar hinzufügen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Kommentar bearbeiten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Kommentar löschen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Schreibschutz Kommentar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Zellen verbinden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Zellen teilen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopieren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Ausschneiden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Nachfolgerzeile einfügen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Von Vorgängerzeile abkoppeln'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Spalte ausblenden', 'Spalten ausblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Spalte einblenden', 'Spalten einblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Zeile ausblenden', 'Zeilen ausblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Zeile einblenden', 'Zeilen einblenden']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Kein Filter'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Ist leer'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Ist nicht leer'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Ist gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Ist ungleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Beginnt mit'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Endet mit'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Enthält'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Enthält nicht'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Größer als'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Größer gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Kleiner als'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Kleiner gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Zwischen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Außerhalb'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Nach'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Vor'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Heute'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Morgen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Gestern'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Leere Zellen'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Per Bedingung filtern'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Nach Zahlen filtern'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'Und'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Oder'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Alles auswählen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Auswahl aufheben'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Abbrechen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Suchen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Wert'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Alternativwert'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Handsoncode
                                                                                                                                                                                                                   * Last updated: Nov 15, 2017
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for English - United States language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'en-US'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Insert row above'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Insert row below'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Insert column left'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Insert column right'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Remove row', 'Remove rows']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Remove column', 'Remove columns']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Undo'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Redo'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Read only'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Clear column'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Alignment'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Left'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Center'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Right'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Justify'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Top'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Middle'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Bottom'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Freeze column'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Unfreeze column'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Borders'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Top'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Right'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Bottom'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Left'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Remove border(s)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Add comment'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Edit comment'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Delete comment'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Read-only comment'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Merge cells'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Unmerge cells'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Copy'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Cut'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Insert child row'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Detach from parent'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Hide column', 'Hide columns']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Show column', 'Show columns']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Hide row', 'Hide rows']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Show row', 'Show rows']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'None'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Is empty'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Is not empty'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Is equal to'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Is not equal to'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Begins with'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Ends with'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Contains'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Does not contain'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Greater than'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Greater than or equal to'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Less than'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Less than or equal to'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Is between'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Is not between'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'After'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Before'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Today'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Tomorrow'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Yesterday'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Blank cells'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filter by condition'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filter by value'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'And'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Or'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Select all'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Clear'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Cancel'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Search'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Value'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Second value'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Last updated: Mar 05, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Spanish - Mexico language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'es-MX'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Insertar fila arriba'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Insertar fila abajo'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Insertar columna izquierda'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Insertar columna derecha'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Eliminar fila', 'Eliminar filas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Eliminar columna', 'Eliminar columnas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Deshacer'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Rehacer'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Solo lectura'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Limpiar columna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Alineación'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Izquierda'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Centro'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Derecha'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Justificar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Superior'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Medio'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Inferior'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Congelar columna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Descongelar columna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Bordes'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Superior'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Derecho'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Inferior'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Izquierdo'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Quitar borde(s)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Agregar comentario'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Editar comentario'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Borrar comentario'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Comentario Solo de lectura'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Unir celdas'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Separar celdas'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Copiar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Cortar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Insertar fila hija'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Separar del padre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Esconder columna', 'Esconder columnas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Mostrar columna', 'Mostrar columnas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Esconder fila', 'Esconder filas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Mostrar fila', 'Mostrar filas']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Ninguna'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Está vacío'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'No está vacío'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Es igual a'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'No es igual a'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Comienza con'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Termina con'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Contiene'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'No contiene'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Mayor que'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Mayor o igual que'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Menor que'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Menor o igual que'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Es entre'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'No es entre'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Después'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Antes'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Hoy'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Mañana'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Ayer'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Celdas vacías'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filtar por condición'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filtar por valor'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'Y'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'O'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Seleccionar todo'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Borrar'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Cancelar'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Buscar'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Valor'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Valor secundario'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Stefan Salzl, Thomas Senn
                                                                                                                                                                                                                   * Last updated: Feb 05, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for French - France language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'fr-FR'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Insérer une ligne en haut'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Insérer une ligne en bas'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Insérer une colonne à gauche'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Insérer une colonne à droite'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Supprimer une ligne', 'Supprimer les lignes']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Supprimer une colonne', 'Supprimer les colonnes']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Annuler'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Rétablir'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Lecture seule'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Effacer la colonne'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Alignement'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Gauche'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Centre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Droite'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Justifié'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'En haut'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Au milieu'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'En bas'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Figer la colonne'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Libérer la colonne'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Bordures'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Supérieure'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Droite'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Inférieure'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Gauche'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Pas de bordure'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Ajouter commentaire'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Modifier commentaire'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Supprimer commentaire'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Commentaire en lecture seule'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Fusionner les cellules'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Séparer les cellules'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Copier'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Couper'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Insérer une sous-ligne'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Détacher de la ligne précédente'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Masquer colonne', 'Masquer les colonnes']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Afficher colonne', 'Afficher les colonnes']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Masquer ligne', 'Masquer les lignes']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Afficher ligne', 'Afficher les lignes']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Aucun'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Est vide'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'N\'est pas vide'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Egal à'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Est différent de'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Commence par'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Finit par'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Contient'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Ne contient pas'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Supérieur à'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Supérieur ou égal à'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Inférieur à'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Inférieur ou égal à'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Est compris entre'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'N\'est pas compris entre'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Après le'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Avant le'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Aujourd\'hui'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Demain'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Hier'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Cellules vides'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filtrer par conditions'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filtrer par valeurs'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'Et'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Ou'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Tout sélectionner'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Effacer la sélection'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Annuler'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Chercher'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Valeur'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Valeur de remplacement'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Andrea Cattaneo
                                                                                                                                                                                                                   * Last updated: Sep 14, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Italian - Italy language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'it-IT'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Inserisci riga sopra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Inserisci riga sotto'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Inserisci colonna a sinistra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Inserisci colonna a destra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Rimuovi riga', 'Rimuovi righe']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Rimuovi colonna', 'Rimuovi colonne']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Annulla'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Ripeti'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Sola lettura'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Svuota colonna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Allineamento'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Sinistra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Centro'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Destra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Giustificato'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'In alto'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'A metà'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'In basso'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Blocca colonna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Sblocca colonna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Bordi'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Sopra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Destra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Sotto'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Sinistra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Rimuovi bordo(i)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Aggiungi commento'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Modifica commento'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Rimuovi commento'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Commento in sola lettura'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Unisci celle'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Separa celle'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Copia'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Taglia'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Inserisci riga figlia'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Scollega da riga madre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Nascondi colonna', 'Nascondi colonne']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Mostra colonna', 'Mostra colonne']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Nascondi riga', 'Nascondi righe']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Mostra riga', 'Mostra righe']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Nessuna'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'È vuoto'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Non è vuoto'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'È uguale a'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'È diverso da'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Inizia con'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Termina con'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Contiene'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Non contiene'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Maggiore'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Maggiore o uguale'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Minore'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Minore o uguale'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'È compreso tra'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Non è compreso tra'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Dopo'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Prima'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Oggi'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Domani'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Ieri'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Celle vuote'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filtra per condizione'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filtra per valore'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'E'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'O'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Seleziona tutto'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Pulisci'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Annulla'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Cerca'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Valore'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Sostituisci con'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: hand-dot
                                                                                                                                                                                                                   * Last updated: Jan 28, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Japanese - Japan language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'ja-JP'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, '行を上に挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, '行を下に挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, '列を左に挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, '列を右に挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['行を削除', '行を削除']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['列を削除', '列を削除']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, '元に戻す'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'やり直し'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, '読み取り専用'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, '列をクリア'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, '配置'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, '左揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, '中央揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, '右揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, '両端揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, '上揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, '中央揃え(垂直)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, '下揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, '列を固定'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, '列の固定を解除'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, '枠線'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, '上'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, '右'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, '下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, '左'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, '枠線を削除'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'コメントを追加'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'コメントを編集'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'コメントを削除'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, '読み取り専用コメント'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'セルを結合'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'セルの結合を解除'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'コピー'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, '切り取り'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, '子の行を挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, '親の行と切り離す'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['列を非表示', '列を非表示']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['列を表示', '列を表示']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['行を非表示', '行を非表示']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['行を表示', '行を表示']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'なし'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, '空白'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, '空白ではない'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, '次と等しい'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, '次と等しくない'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, '次で始まる'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, '次で終わる'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, '次を含む'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, '次を含まない'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, '次より大きい'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, '以上'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, '次より小さい'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, '以下'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, '次の間にある'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, '次の間にない'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, '次より後の日付'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, '次より前の日付'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, '今日'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, '明日'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, '昨日'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, '空白のセル'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, '条件でフィルタ'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, '値でフィルタ'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'かつ'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'もしくは'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'すべて選択'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'クリア'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'キャンセル'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, '検索'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, '値'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, '値2'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Simon Borøy-Johnsen (TheSimoms)
                                                                                                                                                                                                                   * Last updated: Dec 19, 2017
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Norwegian Bokmål - Norway language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'nb-NO'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Sett inn over'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Sett inn under'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Sett inn til venstre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Sett inn til høyre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Fjern rad', 'Fjern rader']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Fjern kolonne', 'Fjern kolonner']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Angre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Gjør om'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Skrivebeskyttet'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Tøm kolonne'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Juster'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Venstre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Midtstill'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Høyre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Tilpasset'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Øverst'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'På midten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Nederst'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Frys kolonne'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Frigi kolonne'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Kantlinjer'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Over'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Til høyre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Under'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Til venstre'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Fjern kantlinje(r)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Legg til kommentar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Endre kommentar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Fjern kommentar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Skrivebeskytt kommentar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Slå sammen celler'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Opphev sammenslåing'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopier'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Klipp ut'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Sett inn underrad'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Frigi fra gruppe'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Skjul kolonne', 'Skjul kolonner']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Vis kolonne', 'Vis kolonner']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Skjul rad', 'Skjul rader']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Vis rad', 'Vis rader']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Ingen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Er tom'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Er ikke tom'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Er lik'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Er ikke lik'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Begynner med'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Slutter med'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Inneholder'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Inneholder ikke'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Større enn'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Større enn eller lik'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Mindre enn'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Mindre enn eller lik'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Er mellom'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Er ikke mellom'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Etter'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Før'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'I dag'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'I morgen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'I går'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Tomme celler'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filtrer etter betingelse'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filtrer etter verdi'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'Og'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Eller'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Velg alle'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Tøm'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Avbryt'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Søk'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Verdi'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Andre verdi'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Tomas Rapkauskas, Anton Brouwer
                                                                                                                                                                                                                   * Last updated: Jun 07, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Dutch - The Netherlands language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'nl-NL'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Rij boven invoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Rij onder invoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Kolom links invoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Kolom rechts invoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Rij verwijderen', 'Rijen verwijderen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Kolom verwijderen', 'Kolommen verwijderen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Ongedaan maken'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Opnieuw uitvoeren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Alleen lezen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Kolom leegmaken'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Uitlijning'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Gecentreerd'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Uitvullen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Boven'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Midden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Onder'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Kolom blokkeren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Kolom blokkering opheffen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Randen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Boven'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Onder'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Rand(en) verwijderen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Opmerking toevoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Opmerking bewerken'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Opmerking verwijderen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Opmerking Alleen-lezen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Cellen samenvoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Samenvoeging van cellen opheffen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopiëren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Knippen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Geneste rij invoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Geneste rij ontkoppelen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Kolom verbergen', 'Kolommen verbergen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Kolom zichbaar maken', 'Kolommen zichtbaar maken']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Rij verbergen', 'Rijen verbergen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Rij zichtbaar maken', 'Rijen zichtbaar maken']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Geen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Is leeg'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Is niet leeg'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Is gelijk aan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Is niet gelijk aan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Begint met'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Eindigt op'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Bevat'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Bevat niet'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Is groter'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Is groter of gelijk aan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Is kleiner dan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Is kleiner dan of gelijk aan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Is tussen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Ligt niet tussen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Na'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Voor'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Vandaag'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Morgen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Gisteren'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Cellen leegmaken'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filteren op conditie'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filteren op waarde'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'En'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Of'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Alles selecteren'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Leeg maken'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Annuleren'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Zoeken'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Waarde'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Tweede waarde'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Handsoncode
                                                                                                                                                                                                                   * Last updated: Nov 17, 2017
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Polish - Poland language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'pl-PL'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Wstaw wiersz powyżej'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Wstaw wiersz poniżej'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Wstaw kolumnę z lewej'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Wstaw kolumnę z prawej'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Usuń wiersz', 'Usuń wiersze']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Usuń kolumnę', 'Usuń kolumny']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Cofnij'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Ponów'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Tylko do odczytu'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Wyczyść kolumnę'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Wyrównanie'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Do lewej'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Do środka'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Do prawej'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Wyjustuj'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Do góry'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Wyśrodkuj'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Do dołu'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Zablokuj kolumnę'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Odblokuj kolumnę'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Obramowanie'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Krawędź górna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Krawędź prawa'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Krawędź dolna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Krawędź lewa'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Usuń obramowanie(a)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Dodaj komentarz'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Edytuj komentarz'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Usuń komentarz'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Komentarz tylko do odczytu'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Scal komórki'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Rozdziel komórki'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopiuj'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Wytnij'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Wstaw wiersz podrzędny'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Odłącz od nadrzędnego'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Ukryj kolumnę', 'Ukryj kolumny']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Pokaż kolumnę', 'Pokaż kolumny']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Ukryj wiersz', 'Ukryj wiersze']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Pokaż wiersz', 'Pokaż wiersze']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Brak'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Komórka jest pusta'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Komórka nie jest pusta'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Jest równe'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Jest różne od'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Tekst zaczyna się od'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Tekst kończy się na'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Tekst zawiera fragment'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Tekst nie zawiera fragmentu'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Większe niż'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Większe lub równe'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Mniejsze niż'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Mniejsze lub równe'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Jest pomiędzy'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Nie jest pomiędzy'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Data późniejsza niż'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Data wcześniejsza niż'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Dzisiaj'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Jutro'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Wczoraj'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Puste miejsca'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filtruj wg warunku'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filtruj wg wartości'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'Oraz'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Lub'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Zaznacz wszystko'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Wyczyść'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Anuluj'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Szukaj'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Wartość'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Druga wartość'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Júlio C. Zuppa
                                                                                                                                                                                                                   * Last updated: Jan 12, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Portuguese - Brazil language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'pt-BR'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Inserir linha acima'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Inserir linha abaixo'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Inserir coluna esquerda'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Inserir coluna direita'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Excluir linha', 'Excluir linhas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Excluir coluna', 'Excluir colunas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Desfazer'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Refazer'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Somente leitura'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Limpar coluna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Alinhamento'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Esquerda'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Centralizado'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Direita'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Justificado'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Superior'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Meio'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Inferior'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Congelar coluna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Descongelar coluna'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Bordas'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Superior'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Direita'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Inferior'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Esquerda'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Excluir bordas(s)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Incluir comentário'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Editar comentário'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Remover comentário'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Comentário somente leitura'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Mesclar células'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Desfazer mesclagem de células'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Copiar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Recortar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Inserir linha filha'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Desanexar da linha pai'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Ocultar coluna', 'Ocultar colunas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Exibir coluna', 'Exibir colunas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Ocultar linha', 'Ocultar linhas']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Exibir linha', 'Exibir linhas']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Nenhum'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'É vazio'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Não é vazio'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'É igual a'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'É diferente de'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Começa com'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Termina com'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Contém'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Não contém'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Maior que'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Maior ou igual a'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Menor que'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Maior ou igual a'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Está entre'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Não está entre'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Depois'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Antes'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Hoje'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Amanhã'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Ontem'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Células vazias'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filtrar por condição'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filtrar por valor'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'E'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Ou'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Selecionar tudo'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Limpar'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Cancelar'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Localizar'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Valor'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Segundo valor'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Alexey Rogachev
                                                                                                                                                                                                                   * Last updated: Feb 28, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Russian - Russia language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'ru-RU'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Вставить строку выше'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Вставить строку ниже'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Вставить столбец слева'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Вставить столбец справа'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Удалить строку', 'Удалить строки']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Удалить столбец', 'Удалить столбцы']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Отменить'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Повторить'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Только для чтения'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Очистить столбец'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Выравнивание'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'По левому краю'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'По центру'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'По правому краю'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'По ширине'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'По верхнему краю'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'По центру'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'По нижнему краю'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Закрепить столбец'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Открепить столбец'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Границы'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Сверху'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Справа'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Снизу'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Слева'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Удалить границу(ы)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Добавить комментарий'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Редактировать комментарий'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Удалить комментарий'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Комментарий только для чтения'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Объединить ячейки'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Разделить ячейки'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Копировать'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Вырезать'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Вставить дочернюю строку'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Отделить от родителя'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Скрыть столбец', 'Скрыть столбцы']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Показать столбец', 'Показать столбцы']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Скрыть строку', 'Скрыть строки']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Показать строку', 'Показать строки']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Отсутствует'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Пусто'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Не пусто'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Равно'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Не равно'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Начинается на'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Заканчивается на'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Содержит'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Не содержит'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Больше чем'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Больше или равно'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Меньше чем'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Меньше или равно'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Между'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Не между'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'После'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'До'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Сегодня'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Завтра'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Вчера'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Пустые ячейки'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Фильтр по условию'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Фильтр по значению'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'И'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Или'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Выбрать все'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Убрать'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Отмена'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Поиск'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Значение'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Второе значение'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: soakit
                                                                                                                                                                                                                   * Last updated: Apr 28, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Chinese - China language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'zh-CN'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, '上方插入行'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, '下方插入行'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, '左方插入列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, '右方插入列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['移除该行', '移除多行']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['移除该列', '移除多列']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, '撤销'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, '恢复'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, '只读'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, '清空该列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, '对齐'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, '左对齐'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, '水平居中'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, '右对齐'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, '两端对齐'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, '顶端对齐'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, '垂直居中'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, '底端对齐'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, '冻结该列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, '取消冻结'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, '边框'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, '上'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, '右'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, '下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, '左'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, '移除边框'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, '插入批注'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, '编辑批注'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, '删除批注'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, '只读批注'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, '合并'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, '取消合并'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, '复制'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, '剪切'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, '插入子行'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, '与母行分离'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['隐藏该列', '隐藏多列']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['显示该列', '显示多列']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['隐藏该行', '隐藏多行']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['显示该行', '显示多行']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, '无'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, '为空'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, '不为空'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, '等于'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, '不等于'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, '开头是'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, '结尾是'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, '包含'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, '不包含'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, '大于'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, '大于或等于'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, '小于'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, '小于或等于'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, '在此范围'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, '不在此范围'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, '之后'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, '之前'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, '今天'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, '明天'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, '昨天'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, '空白单元格'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, '按条件过滤'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, '按值过滤'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, '且'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, '或'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, '全选'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, '清除'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, '确认'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, '取消'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, '搜索'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, '值'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, '第二值'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontablePro = __webpack_require__(0);

var _handsontablePro2 = _interopRequireDefault(_handsontablePro);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Phyllis Yen
                                                                                                                                                                                                                   * Last updated: Mar 9, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Chinese - Taiwan language-country.
                                                                                                                                                                                                                   */


var C = _handsontablePro2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'zh-TW'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, '上方插入列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, '下方插入列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, '左方插入欄'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, '右方插入欄'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['移除該列', '移除多列']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['移除該欄', '移除多欄']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, '復原'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, '取消復原'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, '唯讀'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, '清空該欄'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, '對齊'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, '靠左'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, '水平置中'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, '靠右'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, '左右對齊'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, '靠上'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, '垂直置中'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, '靠下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, '凍結欄位'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, '取消凍結欄位'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, '邊界'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, '上'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, '右'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, '下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, '左'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, '移除邊界'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, '加入評論'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, '編輯評論'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, '刪除評論'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, '唯讀評論'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, '合併欄位'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, '取消合併欄位'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, '複製'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, '剪下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, '插入子列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, '與母列分離'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['隱藏該欄', '隱藏多欄']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['顯示該欄', '顯示多欄']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['隱藏該列', '隱藏多列']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['顯示該列', '顯示多列']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, '無'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, '為空'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, '不為空'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, '等於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, '不等於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, '開頭是'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, '結尾是'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, '包含'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, '不包含'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, '大於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, '大於或等於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, '小於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, '小於或等於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, '在此範圍'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, '不在此範圍'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, '之後'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, '之前'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, '今天'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, '明天'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, '昨天'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, '空白格'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, '依條件過濾'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, '依值過濾'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, '且'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, '或'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, '全選'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, '清除'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, '確認'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, '取消'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, '搜尋'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, '值'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, '第二值'), _dictionary);

_handsontablePro2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.zhTW = exports.zhCN = exports.ruRU = exports.ptBR = exports.plPL = exports.nlNL = exports.nbNO = exports.jaJP = exports.itIT = exports.frFR = exports.esMX = exports.enUS = exports.deDE = exports.deCH = undefined;

var _deCH = __webpack_require__(1);

var _deCH2 = _interopRequireDefault(_deCH);

var _deDE = __webpack_require__(2);

var _deDE2 = _interopRequireDefault(_deDE);

var _enUS = __webpack_require__(3);

var _enUS2 = _interopRequireDefault(_enUS);

var _esMX = __webpack_require__(4);

var _esMX2 = _interopRequireDefault(_esMX);

var _frFR = __webpack_require__(5);

var _frFR2 = _interopRequireDefault(_frFR);

var _itIT = __webpack_require__(6);

var _itIT2 = _interopRequireDefault(_itIT);

var _jaJP = __webpack_require__(7);

var _jaJP2 = _interopRequireDefault(_jaJP);

var _nbNO = __webpack_require__(8);

var _nbNO2 = _interopRequireDefault(_nbNO);

var _nlNL = __webpack_require__(9);

var _nlNL2 = _interopRequireDefault(_nlNL);

var _plPL = __webpack_require__(10);

var _plPL2 = _interopRequireDefault(_plPL);

var _ptBR = __webpack_require__(11);

var _ptBR2 = _interopRequireDefault(_ptBR);

var _ruRU = __webpack_require__(12);

var _ruRU2 = _interopRequireDefault(_ruRU);

var _zhCN = __webpack_require__(13);

var _zhCN2 = _interopRequireDefault(_zhCN);

var _zhTW = __webpack_require__(14);

var _zhTW2 = _interopRequireDefault(_zhTW);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable import/prefer-default-export */

exports.deCH = _deCH2.default;
exports.deDE = _deDE2.default;
exports.enUS = _enUS2.default;
exports.esMX = _esMX2.default;
exports.frFR = _frFR2.default;
exports.itIT = _itIT2.default;
exports.jaJP = _jaJP2.default;
exports.nbNO = _nbNO2.default;
exports.nlNL = _nlNL2.default;
exports.plPL = _plPL2.default;
exports.ptBR = _ptBR2.default;
exports.ruRU = _ruRU2.default;
exports.zhCN = _zhCN2.default;
exports.zhTW = _zhTW2.default;

/***/ })
/******/ ])["___"];
});
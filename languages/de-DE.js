(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("../../handsontable"));
	else if(typeof define === 'function' && define.amd)
		define(["../../handsontable"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("../../handsontable")) : factory(root["Handsontable"]);
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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),
/* 1 */,
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontable = __webpack_require__(0);

var _handsontable2 = _interopRequireDefault(_handsontable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Stefan Salzl
                                                                                                                                                                                                                   * Last updated: Jan 08, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for German - Germany language-country.
                                                                                                                                                                                                                   */


var C = _handsontable2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'de-DE'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Zeile einfügen oberhalb'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Zeile einfügen unterhalb'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Spalte einfügen links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Spalte einfügen rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Zeile löschen', 'Zeilen löschen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Spalte löschen', 'Spalten löschen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Rückgangig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Wiederholen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Nur Lesezugriff'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Spalteninhalt löschen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Ausrichtung'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Linksbündig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Zentriert'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Rechtsbündig'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Blocksatz'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Oben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Mitte'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Unten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Spalte fixieren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Spaltenfixierung aufheben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Rahmen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Oben'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Unten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Kein Rahmen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Kommentar hinzufügen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Kommentar bearbeiten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Kommentar löschen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Schreibschutz Kommentar'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Zellen verbinden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Zellen teilen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopieren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Ausschneiden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Nachfolgerzeile einfügen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Von Vorgängerzeile abkoppeln'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Spalte ausblenden', 'Spalten ausblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Spalte einblenden', 'Spalten einblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Zeile ausblenden', 'Zeilen ausblenden']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Zeile einblenden', 'Zeilen einblenden']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Kein Filter'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Ist leer'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Ist nicht leer'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Ist gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Ist ungleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Beginnt mit'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Endet mit'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Enthält'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Enthält nicht'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Größer als'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Größer gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Kleiner als'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Kleiner gleich'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Zwischen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Außerhalb'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Nach'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Vor'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Heute'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Morgen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Gestern'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Leere Zellen'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Per Bedingung filtern'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Nach Zahlen filtern'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'Und'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Oder'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Alles auswählen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Auswahl aufheben'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Abbrechen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Suchen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Wert'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Alternativwert'), _dictionary);

_handsontable2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ })
/******/ ])["___"];
});
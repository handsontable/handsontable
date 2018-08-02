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
/******/ 	return __webpack_require__(__webpack_require__.s = 14);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),

/***/ 14:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontable = __webpack_require__(0);

var _handsontable2 = _interopRequireDefault(_handsontable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Handsoncode, Henk Siebelink (nl-NL)
                                                                                                                                                                                                                   * Last updated: February 18, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Dutch - The Netherlands language-country.
                                                                                                                                                                                                                   */


var C = _handsontable2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'nl-NL'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Rij invoegen boven'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Rij invoegen onder'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Kolom invoegen links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Kolom invoegen rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Rij verwijderen', 'Rijen verwijderen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Kolom verwijderen', 'Kolommen verwijderen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Herstel'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Opnieuw'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Alleen lezen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Kolom wissen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Uitlijnen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Midden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Uitvullen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Boven'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Midden'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Onder'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Kolom vastzetten'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Kolom losmaken'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Celrand'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Boven'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Rechts'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Onder'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Links'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Verwijder rand(en)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Opmerking toevoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Opmerking bewerken'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Opmerking verwijderen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Opmerking alleen lezen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Cellen samenvoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Cellen splitsen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopiëren'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Knippen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Onderliggende rij invoegen'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Losmaken van bovenliggend'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Verberg kolom', 'Verberg kolommen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Show column', 'Show columns']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Verberg rij', 'Verberg rijen']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Toon rij', 'Toon rijen']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Geen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Is leeg'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Is niet leeg'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Is gelijk aan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Is niet gelijk aan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Begint met'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Eindigt met'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Bevat'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Bevat niet'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Groter dan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Groter dan, of gelijk aan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Minder dan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Minder dan, of gelijk aan'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Ligt tussen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Ligt niet tussen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Na'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Voor'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Vandaag'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Morgen'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Gisteren'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Blanco cellen'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filter op voorwaarde'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filter op waarde'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'En'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Of'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Alles selecteren'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Wissen'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Annuleer'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Zoek'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Waarde'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Tweede waarde'), _dictionary);

_handsontable2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ })

/******/ })["___"];
});
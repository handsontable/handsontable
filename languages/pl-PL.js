/*!
 * (The MIT License)
 * 
 * Copyright (c) 2012-2014 Marcin Warpechowski
 * Copyright (c) 2015 Handsoncode sp. z o.o. <hello@handsoncode.net>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("../../handsontable"));
	else if(typeof define === 'function' && define.amd)
		define(["../../handsontable"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("../../handsontable")) : factory(root["Handsontable"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
/**
 * Constants for parts of translation.
 */

var CONTEXTMENU_ITEMS_ROW_ABOVE = exports.CONTEXTMENU_ITEMS_ROW_ABOVE = 'ContextMenu:items.insertRowAbove';
var CONTEXTMENU_ITEMS_ROW_BELOW = exports.CONTEXTMENU_ITEMS_ROW_BELOW = 'ContextMenu:items.insertRowBelow';
var CONTEXTMENU_ITEMS_INSERT_LEFT = exports.CONTEXTMENU_ITEMS_INSERT_LEFT = 'ContextMenu:items.insertColumnOnTheLeft';
var CONTEXTMENU_ITEMS_INSERT_RIGHT = exports.CONTEXTMENU_ITEMS_INSERT_RIGHT = 'ContextMenu:items.insertColumnOnTheRight';
var CONTEXTMENU_ITEMS_REMOVE_ROW = exports.CONTEXTMENU_ITEMS_REMOVE_ROW = 'ContextMenu:items.removeRow';
var CONTEXTMENU_ITEMS_REMOVE_COLUMN = exports.CONTEXTMENU_ITEMS_REMOVE_COLUMN = 'ContextMenu:items.removeColumn';
var CONTEXTMENU_ITEMS_UNDO = exports.CONTEXTMENU_ITEMS_UNDO = 'ContextMenu:items.undo';
var CONTEXTMENU_ITEMS_REDO = exports.CONTEXTMENU_ITEMS_REDO = 'ContextMenu:items.redo';
var CONTEXTMENU_ITEMS_READ_ONLY = exports.CONTEXTMENU_ITEMS_READ_ONLY = 'ContextMenu:items.readOnly';

var CONTEXTMENU_ITEMS_ALIGNMENT = exports.CONTEXTMENU_ITEMS_ALIGNMENT = 'ContextMenu:items.align';
var CONTEXTMENU_ITEMS_ALIGNMENT_LEFT = exports.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT = 'ContextMenu:items.align.left';
var CONTEXTMENU_ITEMS_ALIGNMENT_CENTER = exports.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER = 'ContextMenu:items.align.center';
var CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT = exports.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT = 'ContextMenu:items.align.right';
var CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY = exports.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY = 'ContextMenu:items.align.justify';
var CONTEXTMENU_ITEMS_ALIGNMENT_TOP = exports.CONTEXTMENU_ITEMS_ALIGNMENT_TOP = 'ContextMenu:items.align.top';
var CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE = exports.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE = 'ContextMenu:items.align.middle';
var CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM = exports.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM = 'ContextMenu:items.align.bottom';

var CONTEXTMENU_ITEMS_CLEAR_COLUMN = exports.CONTEXTMENU_ITEMS_CLEAR_COLUMN = 'ContextMenu:items.clearColumn';
var CONTEXTMENU_ITEMS_COPY = exports.CONTEXTMENU_ITEMS_COPY = 'ContextMenu:items.copy';
var CONTEXTMENU_ITEMS_CUT = exports.CONTEXTMENU_ITEMS_CUT = 'ContextMenu:items.cut';

var FILTERS_CONDITIONS_NONE = exports.FILTERS_CONDITIONS_NONE = 'Filters:conditions.none';
var FILTERS_CONDITIONS_EMPTY = exports.FILTERS_CONDITIONS_EMPTY = 'Filters:conditions.isEmpty';
var FILTERS_CONDITIONS_NOT_EMPTY = exports.FILTERS_CONDITIONS_NOT_EMPTY = 'Filters:conditions.isNotEmpty';
var FILTERS_CONDITIONS_EQUAL = exports.FILTERS_CONDITIONS_EQUAL = 'Filters:conditions.isEqualTo';
var FILTERS_CONDITIONS_NOT_EQUAL = exports.FILTERS_CONDITIONS_NOT_EQUAL = 'Filters:conditions.isNotEqualTo';
var FILTERS_CONDITIONS_BEGINS_WITH = exports.FILTERS_CONDITIONS_BEGINS_WITH = 'Filters:conditions.beginsWith';
var FILTERS_CONDITIONS_ENDS_WITH = exports.FILTERS_CONDITIONS_ENDS_WITH = 'Filters:conditions.endsWith';
var FILTERS_CONDITIONS_CONTAINS = exports.FILTERS_CONDITIONS_CONTAINS = 'Filters:conditions.contains';
var FILTERS_CONDITIONS_NOT_CONTAIN = exports.FILTERS_CONDITIONS_NOT_CONTAIN = 'Filters:conditions.doesNotContain';
var FILTERS_CONDITIONS_BY_VALUE = exports.FILTERS_CONDITIONS_BY_VALUE = 'Filters:conditions.byValue';
var FILTERS_CONDITIONS_GREATER_THAN = exports.FILTERS_CONDITIONS_GREATER_THAN = 'Filters:conditions.greaterThan';
var FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL = exports.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL = 'Filters:conditions.greaterThanOrEqualTo';
var FILTERS_CONDITIONS_LESS_THAN = exports.FILTERS_CONDITIONS_LESS_THAN = 'Filters:conditions.lessThan';
var FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL = exports.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL = 'Filters:conditions.lessThanOrEqualTo';
var FILTERS_CONDITIONS_BETWEEN = exports.FILTERS_CONDITIONS_BETWEEN = 'Filters:conditions.isBetween';
var FILTERS_CONDITIONS_NOT_BETWEEN = exports.FILTERS_CONDITIONS_NOT_BETWEEN = 'Filters:conditions.isNotBetween';
var FILTERS_CONDITIONS_FALSE = exports.FILTERS_CONDITIONS_FALSE = 'Filters:conditions.false';
var FILTERS_CONDITIONS_TRUE = exports.FILTERS_CONDITIONS_TRUE = 'Filters:conditions.true';
var FILTERS_CONDITIONS_AFTER = exports.FILTERS_CONDITIONS_AFTER = 'Filters:conditions.after';
var FILTERS_CONDITIONS_BEFORE = exports.FILTERS_CONDITIONS_BEFORE = 'Filters:conditions.before';
var FILTERS_CONDITIONS_TODAY = exports.FILTERS_CONDITIONS_TODAY = 'Filters:conditions.today';
var FILTERS_CONDITIONS_TOMORROW = exports.FILTERS_CONDITIONS_TOMORROW = 'Filters:conditions.tomorrow';
var FILTERS_CONDITIONS_YESTERDAY = exports.FILTERS_CONDITIONS_YESTERDAY = 'Filters:conditions.yesterday';

var FILTERS_LABELS_FILTER_BY_CONDITION = exports.FILTERS_LABELS_FILTER_BY_CONDITION = 'Filters:labels.filterByCondition';
var FILTERS_LABELS_FILTER_BY_VALUE = exports.FILTERS_LABELS_FILTER_BY_VALUE = 'Filters:labels.filterByValue';
var FILTERS_LABELS_CONJUNCTION = exports.FILTERS_LABELS_CONJUNCTION = 'Filters:labels.conjunction';
var FILTERS_LABELS_DISJUNCTION = exports.FILTERS_LABELS_DISJUNCTION = 'Filters:labels.disjunction';

var FILTERS_BUTTONS_SELECT_ALL = exports.FILTERS_BUTTONS_SELECT_ALL = 'Filters:buttons.searchAll';
var FILTERS_BUTTONS_CLEAR = exports.FILTERS_BUTTONS_CLEAR = 'Filters:buttons.clear';
var FILTERS_BUTTONS_OK = exports.FILTERS_BUTTONS_OK = 'Filters:buttons.ok';
var FILTERS_BUTTONS_CANCEL = exports.FILTERS_BUTTONS_CANCEL = 'Filters:buttons.cancel';

var FILTERS_BUTTONS_PLACEHOLDER_SEARCH = exports.FILTERS_BUTTONS_PLACEHOLDER_SEARCH = 'Filters:buttons.placeholder.search';
var FILTERS_BUTTONS_PLACEHOLDER_VALUE = exports.FILTERS_BUTTONS_PLACEHOLDER_VALUE = 'Filters:buttons.placeholder.value';
var FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE = exports.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE = 'Filters:buttons.placeholder.secondValue';

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _constants = __webpack_require__(0);

var C = _interopRequireWildcard(_constants);

var _handsontable = __webpack_require__(1);

var _handsontable2 = _interopRequireDefault(_handsontable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Wojciech Szymański
                                                                                                                                                                                                                   * Last updated: 12.10.2017
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Polish language.
                                                                                                                                                                                                                   */


var dictionary = (_dictionary = {
  languageCode: 'pl-PL'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Umieść wiersz powyżej'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Umieść wiersz poniżej'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Umieść kolumnę po lewej stronie'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Umieść kolumnę po prawej stronie'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Usuń wiersz', 'Usuń wiersze']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Usuń kolumnę', 'Usuń kolumny']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Cofnij'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Przywróć'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Tylko do odczytu'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Wyrównanie'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Lewo'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Środek'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Prawo'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Wyjustowane'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Góra'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Środek'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Dół'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Wyczyść kolumnę'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopiuj'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Wytnij'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Brak'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Jest pusty'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Nie jest pusty'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Jest równy'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Nie jest równy'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Zaczyna się'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Kończy się'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Zawiera'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Nie zawiera'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BY_VALUE, 'By value'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Większe niż'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Większe lub równe'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Mniejsze niż'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Mniejsze lub równe'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Pomiędzy'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Nie jest pomiędzy'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Po'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Przed'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Dzisiaj'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Jutro'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Wczoraj'), _defineProperty(_dictionary, C.FILTERS_LABELS_FILTER_BY_CONDITION, 'Filtruj na podstawie warunku'), _defineProperty(_dictionary, C.FILTERS_LABELS_FILTER_BY_VALUE, 'Filtruj na podstawie wartości'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'Oraz'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Lub'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Wybierz wszystkie'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Wyczyść'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Anuluj'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Szukaj...'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Wartość'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Druga wartość'), _dictionary);

_handsontable2.default.languages.registerLocaleDictionary(dictionary.languageCode, dictionary);

exports.default = dictionary;

/***/ })
/******/ ])["default"];
});
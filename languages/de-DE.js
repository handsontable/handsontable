/*!
 * Copyright (c) Handsoncode sp. z o.o.
 * 
 * This Handsontable Pro is a commercial software distributed by Handsoncode sp. z o. o., a limited liability
 * company registered under the laws of Poland, with its registered office in Gdynia, Poland, at 96/98 Aleja Zwycięstwa,
 * postal code 81-451, entered into the Entrepreneurs Register of the National Court Register under number 0000538651,
 * share capital: PLN 62,800.00., hereinafter referred to as "HANDSONCODE".
 * 
 * By installing, copying, or otherwise using this software, you agree to be bound by the terms
 * of its General Software License Terms ("Terms") outlined in a file "handsontable-pro-general-terms.pdf"
 * available in the main directory of the software repository.
 * This software is copyrighted and protected by copyright laws and international treaties.
 * 
 * You shall obtain a commercial license for this software at handsontable.com.
 * 
 * YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF THE SOFTWARE IS AT YOUR OWN RISK AND THAT THE SOFTWARE
 * IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES OR CONDITIONS WHATSOEVER. HANDSONCODE EXPRESSLY DISCLAIMS ANY WARRANTY,
 * EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGMENT. HANDSONCODE DOES NOT WARRANT THAT THE SOFTWARE AND ITS FUNCTIONALITY,
 * RELIABILITY AND PERFORMANCE WILL MEET YOUR REQUIREMENTS OR THAT THE OPERATION OF THE SOFTWARE WILL BE
 * UNINTERRUPTED OR ERROR FREE.
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("../../handsontable-pro"));
	else if(typeof define === 'function' && define.amd)
		define(["../../handsontable-pro"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("../../handsontable-pro")) : factory(root["Handsontable"]);
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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Constants for parts of translation.
 */

const CONTEXTMENU_ITEMS_ROW_ABOVE = 'ContextMenu:items.insertRowAbove';
/* harmony export (immutable) */ __webpack_exports__["r"] = CONTEXTMENU_ITEMS_ROW_ABOVE;

const CONTEXTMENU_ITEMS_ROW_BELOW = 'ContextMenu:items.insertRowBelow';
/* harmony export (immutable) */ __webpack_exports__["s"] = CONTEXTMENU_ITEMS_ROW_BELOW;

const CONTEXTMENU_ITEMS_INSERT_LEFT = 'ContextMenu:items.insertColumnOnTheLeft';
/* harmony export (immutable) */ __webpack_exports__["l"] = CONTEXTMENU_ITEMS_INSERT_LEFT;

const CONTEXTMENU_ITEMS_INSERT_RIGHT = 'ContextMenu:items.insertColumnOnTheRight';
/* harmony export (immutable) */ __webpack_exports__["m"] = CONTEXTMENU_ITEMS_INSERT_RIGHT;

const CONTEXTMENU_ITEMS_REMOVE_ROW = 'ContextMenu:items.removeRow';
/* harmony export (immutable) */ __webpack_exports__["q"] = CONTEXTMENU_ITEMS_REMOVE_ROW;

const CONTEXTMENU_ITEMS_REMOVE_COLUMN = 'ContextMenu:items.removeColumn';
/* harmony export (immutable) */ __webpack_exports__["p"] = CONTEXTMENU_ITEMS_REMOVE_COLUMN;

const CONTEXTMENU_ITEMS_UNDO = 'ContextMenu:items.undo';
/* harmony export (immutable) */ __webpack_exports__["t"] = CONTEXTMENU_ITEMS_UNDO;

const CONTEXTMENU_ITEMS_REDO = 'ContextMenu:items.redo';
/* harmony export (immutable) */ __webpack_exports__["o"] = CONTEXTMENU_ITEMS_REDO;

const CONTEXTMENU_ITEMS_READ_ONLY = 'ContextMenu:items.readOnly';
/* harmony export (immutable) */ __webpack_exports__["n"] = CONTEXTMENU_ITEMS_READ_ONLY;

const CONTEXTMENU_ITEMS_CLEAR_COLUMN = 'ContextMenu:items.clearColumn';
/* harmony export (immutable) */ __webpack_exports__["i"] = CONTEXTMENU_ITEMS_CLEAR_COLUMN;

const CONTEXTMENU_ITEMS_COPY = 'ContextMenu:items.copy';
/* harmony export (immutable) */ __webpack_exports__["j"] = CONTEXTMENU_ITEMS_COPY;

const CONTEXTMENU_ITEMS_CUT = 'ContextMenu:items.cut';
/* harmony export (immutable) */ __webpack_exports__["k"] = CONTEXTMENU_ITEMS_CUT;


const CONTEXTMENU_ITEMS_ALIGNMENT = 'ContextMenu:items.align';
/* harmony export (immutable) */ __webpack_exports__["a"] = CONTEXTMENU_ITEMS_ALIGNMENT;

const CONTEXTMENU_ITEMS_ALIGNMENT_LEFT = 'ContextMenu:items.align.left';
/* harmony export (immutable) */ __webpack_exports__["e"] = CONTEXTMENU_ITEMS_ALIGNMENT_LEFT;

const CONTEXTMENU_ITEMS_ALIGNMENT_CENTER = 'ContextMenu:items.align.center';
/* harmony export (immutable) */ __webpack_exports__["c"] = CONTEXTMENU_ITEMS_ALIGNMENT_CENTER;

const CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT = 'ContextMenu:items.align.right';
/* harmony export (immutable) */ __webpack_exports__["g"] = CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT;

const CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY = 'ContextMenu:items.align.justify';
/* harmony export (immutable) */ __webpack_exports__["d"] = CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY;

const CONTEXTMENU_ITEMS_ALIGNMENT_TOP = 'ContextMenu:items.align.top';
/* harmony export (immutable) */ __webpack_exports__["h"] = CONTEXTMENU_ITEMS_ALIGNMENT_TOP;

const CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE = 'ContextMenu:items.align.middle';
/* harmony export (immutable) */ __webpack_exports__["f"] = CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE;

const CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM = 'ContextMenu:items.align.bottom';
/* harmony export (immutable) */ __webpack_exports__["b"] = CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM;


const FILTERS_CONDITIONS_NAMESPACE = 'Filters:conditions';
/* unused harmony export FILTERS_CONDITIONS_NAMESPACE */

const FILTERS_CONDITIONS_NONE = 'Filters:conditions.none';
/* harmony export (immutable) */ __webpack_exports__["O"] = FILTERS_CONDITIONS_NONE;

const FILTERS_CONDITIONS_EMPTY = 'Filters:conditions.isEmpty';
/* harmony export (immutable) */ __webpack_exports__["H"] = FILTERS_CONDITIONS_EMPTY;

const FILTERS_CONDITIONS_NOT_EMPTY = 'Filters:conditions.isNotEmpty';
/* harmony export (immutable) */ __webpack_exports__["R"] = FILTERS_CONDITIONS_NOT_EMPTY;

const FILTERS_CONDITIONS_EQUAL = 'Filters:conditions.isEqualTo';
/* harmony export (immutable) */ __webpack_exports__["J"] = FILTERS_CONDITIONS_EQUAL;

const FILTERS_CONDITIONS_NOT_EQUAL = 'Filters:conditions.isNotEqualTo';
/* harmony export (immutable) */ __webpack_exports__["S"] = FILTERS_CONDITIONS_NOT_EQUAL;

const FILTERS_CONDITIONS_BEGINS_WITH = 'Filters:conditions.beginsWith';
/* harmony export (immutable) */ __webpack_exports__["D"] = FILTERS_CONDITIONS_BEGINS_WITH;

const FILTERS_CONDITIONS_ENDS_WITH = 'Filters:conditions.endsWith';
/* harmony export (immutable) */ __webpack_exports__["I"] = FILTERS_CONDITIONS_ENDS_WITH;

const FILTERS_CONDITIONS_CONTAINS = 'Filters:conditions.contains';
/* harmony export (immutable) */ __webpack_exports__["G"] = FILTERS_CONDITIONS_CONTAINS;

const FILTERS_CONDITIONS_NOT_CONTAIN = 'Filters:conditions.doesNotContain';
/* harmony export (immutable) */ __webpack_exports__["Q"] = FILTERS_CONDITIONS_NOT_CONTAIN;

const FILTERS_CONDITIONS_BY_VALUE = 'Filters:conditions.byValue';
/* harmony export (immutable) */ __webpack_exports__["F"] = FILTERS_CONDITIONS_BY_VALUE;

const FILTERS_CONDITIONS_GREATER_THAN = 'Filters:conditions.greaterThan';
/* harmony export (immutable) */ __webpack_exports__["K"] = FILTERS_CONDITIONS_GREATER_THAN;

const FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL = 'Filters:conditions.greaterThanOrEqualTo';
/* harmony export (immutable) */ __webpack_exports__["L"] = FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL;

const FILTERS_CONDITIONS_LESS_THAN = 'Filters:conditions.lessThan';
/* harmony export (immutable) */ __webpack_exports__["M"] = FILTERS_CONDITIONS_LESS_THAN;

const FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL = 'Filters:conditions.lessThanOrEqualTo';
/* harmony export (immutable) */ __webpack_exports__["N"] = FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL;

const FILTERS_CONDITIONS_BETWEEN = 'Filters:conditions.isBetween';
/* harmony export (immutable) */ __webpack_exports__["E"] = FILTERS_CONDITIONS_BETWEEN;

const FILTERS_CONDITIONS_NOT_BETWEEN = 'Filters:conditions.isNotBetween';
/* harmony export (immutable) */ __webpack_exports__["P"] = FILTERS_CONDITIONS_NOT_BETWEEN;

const FILTERS_CONDITIONS_AFTER = 'Filters:conditions.after';
/* harmony export (immutable) */ __webpack_exports__["B"] = FILTERS_CONDITIONS_AFTER;

const FILTERS_CONDITIONS_BEFORE = 'Filters:conditions.before';
/* harmony export (immutable) */ __webpack_exports__["C"] = FILTERS_CONDITIONS_BEFORE;

const FILTERS_CONDITIONS_TODAY = 'Filters:conditions.today';
/* harmony export (immutable) */ __webpack_exports__["T"] = FILTERS_CONDITIONS_TODAY;

const FILTERS_CONDITIONS_TOMORROW = 'Filters:conditions.tomorrow';
/* harmony export (immutable) */ __webpack_exports__["U"] = FILTERS_CONDITIONS_TOMORROW;

const FILTERS_CONDITIONS_YESTERDAY = 'Filters:conditions.yesterday';
/* harmony export (immutable) */ __webpack_exports__["V"] = FILTERS_CONDITIONS_YESTERDAY;


const FILTERS_LABELS_FILTER_BY_CONDITION = 'Filters:labels.filterByCondition';
/* harmony export (immutable) */ __webpack_exports__["Y"] = FILTERS_LABELS_FILTER_BY_CONDITION;

const FILTERS_LABELS_FILTER_BY_VALUE = 'Filters:labels.filterByValue';
/* harmony export (immutable) */ __webpack_exports__["Z"] = FILTERS_LABELS_FILTER_BY_VALUE;

const FILTERS_LABELS_CONJUNCTION = 'Filters:labels.conjunction';
/* harmony export (immutable) */ __webpack_exports__["W"] = FILTERS_LABELS_CONJUNCTION;

const FILTERS_LABELS_DISJUNCTION = 'Filters:labels.disjunction';
/* harmony export (immutable) */ __webpack_exports__["X"] = FILTERS_LABELS_DISJUNCTION;


const FILTERS_BUTTONS_SELECT_ALL = 'Filters:buttons.searchAll';
/* harmony export (immutable) */ __webpack_exports__["A"] = FILTERS_BUTTONS_SELECT_ALL;

const FILTERS_BUTTONS_CLEAR = 'Filters:buttons.clear';
/* harmony export (immutable) */ __webpack_exports__["v"] = FILTERS_BUTTONS_CLEAR;

const FILTERS_BUTTONS_OK = 'Filters:buttons.ok';
/* harmony export (immutable) */ __webpack_exports__["w"] = FILTERS_BUTTONS_OK;

const FILTERS_BUTTONS_CANCEL = 'Filters:buttons.cancel';
/* harmony export (immutable) */ __webpack_exports__["u"] = FILTERS_BUTTONS_CANCEL;


const FILTERS_BUTTONS_PLACEHOLDER_SEARCH = 'Filters:buttons.placeholder.search';
/* harmony export (immutable) */ __webpack_exports__["x"] = FILTERS_BUTTONS_PLACEHOLDER_SEARCH;

const FILTERS_BUTTONS_PLACEHOLDER_VALUE = 'Filters:buttons.placeholder.value';
/* harmony export (immutable) */ __webpack_exports__["z"] = FILTERS_BUTTONS_PLACEHOLDER_VALUE;

const FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE = 'Filters:buttons.placeholder.secondValue';
/* harmony export (immutable) */ __webpack_exports__["y"] = FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE;



/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__constants__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__handsontable_pro__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__handsontable_pro___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__handsontable_pro__);
/**
 * @preserve
 * Authors: Wojciech Szymański
 * Last updated: 28.09.2017
 *
 * Description: Definition file for German - Germany language.
 */



const dictionary = {
  languageCode: 'de-DE',
  [__WEBPACK_IMPORTED_MODULE_0__constants__["r" /* CONTEXTMENU_ITEMS_ROW_ABOVE */]]: 'Legen Sie die Zeile oben'
};

__WEBPACK_IMPORTED_MODULE_1__handsontable_pro___default.a.languages.registerLocaleDictionary(dictionary.languageCode, dictionary);

/* harmony default export */ __webpack_exports__["default"] = (dictionary);


/***/ })
/******/ ])["default"];
});
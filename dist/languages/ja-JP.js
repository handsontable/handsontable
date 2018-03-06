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
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontable = __webpack_require__(0);

var _handsontable2 = _interopRequireDefault(_handsontable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: hand-dot
                                                                                                                                                                                                                   * Last updated: Jan 28, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Japanese - Japan language-country.
                                                                                                                                                                                                                   */


var C = _handsontable2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'ja-JP'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, '行を上に挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, '行を下に挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, '列を左に挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, '列を右に挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['行を削除', '行を削除']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['列を削除', '列を削除']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, '元に戻す'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'やり直し'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, '読み取り専用'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, '列をクリア'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, '配置'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, '左揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, '中央揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, '右揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, '両端揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, '上揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, '中央揃え(垂直)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, '下揃え'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, '列を固定'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, '列の固定を解除'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, '枠線'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, '上'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, '右'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, '下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, '左'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, '枠線を削除'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'コメントを追加'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'コメントを編集'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'コメントを削除'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, '読み取り専用コメント'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'セルを結合'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'セルの結合を解除'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'コピー'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, '切り取り'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, '子の行を挿入'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, '親の行と切り離す'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['列を非表示', '列を非表示']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['列を表示', '列を表示']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['行を非表示', '行を非表示']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['行を表示', '行を表示']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'なし'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, '空白'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, '空白ではない'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, '次と等しい'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, '次と等しくない'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, '次で始まる'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, '次で終わる'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, '次を含む'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, '次を含まない'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, '次より大きい'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, '以上'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, '次より小さい'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, '以下'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, '次の間にある'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, '次の間にない'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, '次より後の日付'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, '次より前の日付'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, '今日'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, '明日'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, '昨日'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, '空白のセル'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, '条件でフィルタ'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, '値でフィルタ'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'かつ'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'もしくは'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'すべて選択'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'クリア'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'キャンセル'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, '検索'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, '値'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, '値2'), _dictionary);

_handsontable2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ })
/******/ ])["___"];
});
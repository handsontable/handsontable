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
/******/ 	return __webpack_require__(__webpack_require__.s = 12);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),

/***/ 12:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontable = __webpack_require__(0);

var _handsontable2 = _interopRequireDefault(_handsontable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Phyllis Yen
                                                                                                                                                                                                                   * Last updated: Mar 9, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Chinese - Taiwan language-country.
                                                                                                                                                                                                                   */


var C = _handsontable2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'zh-TW'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, '上方插入列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, '下方插入列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, '左方插入欄'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, '右方插入欄'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['移除該列', '移除多列']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['移除該欄', '移除多欄']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, '復原'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, '取消復原'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, '唯讀'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, '清空該欄'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, '對齊'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, '靠左'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, '水平置中'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, '靠右'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, '左右對齊'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, '靠上'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, '垂直置中'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, '靠下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, '凍結欄位'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, '取消凍結欄位'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, '邊界'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, '上'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, '右'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, '下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, '左'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, '移除邊界'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, '加入評論'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, '編輯評論'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, '刪除評論'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, '唯讀評論'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, '合併欄位'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, '取消合併欄位'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, '複製'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, '剪下'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, '插入子列'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, '與母列分離'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['隱藏該欄', '隱藏多欄']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['顯示該欄', '顯示多欄']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['隱藏該列', '隱藏多列']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['顯示該列', '顯示多列']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, '無'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, '為空'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, '不為空'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, '等於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, '不等於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, '開頭是'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, '結尾是'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, '包含'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, '不包含'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, '大於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, '大於或等於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, '小於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, '小於或等於'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, '在此範圍'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, '不在此範圍'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, '之後'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, '之前'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, '今天'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, '明天'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, '昨天'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, '空白格'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, '依條件過濾'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, '依值過濾'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, '且'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, '或'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, '全選'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, '清除'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, '確認'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, '取消'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, '搜尋'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, '值'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, '第二值'), _dictionary);

_handsontable2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ })

/******/ })["___"];
});
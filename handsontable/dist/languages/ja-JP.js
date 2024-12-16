(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("handsontable"));
	else if(typeof define === 'function' && define.amd)
		define(["handsontable"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("handsontable")) : factory(root["Handsontable"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, (__WEBPACK_EXTERNAL_MODULE__2__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    "default": e
  };
}
module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 2 */
/***/ ((module) => {

"use strict";
module.exports = __WEBPACK_EXTERNAL_MODULE__2__;

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;


var _interopRequireDefault = __webpack_require__(1);
exports.__esModule = true;
var _handsontable = _interopRequireDefault(__webpack_require__(2));
/**
 * @preserve
 * Authors: hand-dot
 * Last updated: Jan 9, 2023
 *
 * Description: Definition file for Japanese - Japan language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'ja-JP',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: '行を上に挿入',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: '行を下に挿入',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: '列を左に挿入',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: '列を右に挿入',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['行を削除', '行を削除'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['列を削除', '列を削除'],
  [C.CONTEXTMENU_ITEMS_UNDO]: '元に戻す',
  [C.CONTEXTMENU_ITEMS_REDO]: 'やり直し',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: '読み取り専用',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: '列をクリア',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: '配置',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: '左揃え',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: '中央揃え',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: '右揃え',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: '両端揃え',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: '上揃え',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: '中央揃え(垂直)',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: '下揃え',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: '列を固定',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: '列の固定を解除',
  [C.CONTEXTMENU_ITEMS_BORDERS]: '枠線',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: '上',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: '右',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: '下',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: '左',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: '枠線を削除',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'コメントを追加',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'コメントを編集',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'コメントを削除',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: '読み取り専用コメント',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'セルを結合',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'セルの結合を解除',
  [C.CONTEXTMENU_ITEMS_COPY]: 'コピー',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['ヘッダ付きでコピー', 'ヘッダ付きでコピー'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['グループヘッダ付きでコピー', 'グループヘッダ付きでコピー'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['ヘッダのみコピー', 'ヘッダのみコピー'],
  [C.CONTEXTMENU_ITEMS_CUT]: '切り取り',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: '子の行を挿入',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: '親の行と切り離す',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['列を非表示', '列を非表示'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['列を表示', '列を表示'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['行を非表示', '行を非表示'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['行を表示', '行を表示'],
  [C.FILTERS_CONDITIONS_NONE]: 'なし',
  [C.FILTERS_CONDITIONS_EMPTY]: '空白',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: '空白ではない',
  [C.FILTERS_CONDITIONS_EQUAL]: '次と等しい',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: '次と等しくない',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: '次で始まる',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: '次で終わる',
  [C.FILTERS_CONDITIONS_CONTAINS]: '次を含む',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: '次を含まない',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: '次より大きい',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: '以上',
  [C.FILTERS_CONDITIONS_LESS_THAN]: '次より小さい',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: '以下',
  [C.FILTERS_CONDITIONS_BETWEEN]: '次の間にある',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: '次の間にない',
  [C.FILTERS_CONDITIONS_AFTER]: '次より後の日付',
  [C.FILTERS_CONDITIONS_BEFORE]: '次より前の日付',
  [C.FILTERS_CONDITIONS_TODAY]: '今日',
  [C.FILTERS_CONDITIONS_TOMORROW]: '明日',
  [C.FILTERS_CONDITIONS_YESTERDAY]: '昨日',
  [C.FILTERS_VALUES_BLANK_CELLS]: '空白のセル',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: '条件でフィルタ',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: '値でフィルタ',
  [C.FILTERS_LABELS_CONJUNCTION]: 'かつ',
  [C.FILTERS_LABELS_DISJUNCTION]: 'もしくは',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'すべて選択',
  [C.FILTERS_BUTTONS_CLEAR]: 'クリア',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'キャンセル',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: '検索',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: '値',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: '値2'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
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
 * Authors: Handsoncode
 * Last updated: Nov 15, 2017
 *
 * Description: Definition file for English - United States language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'en-US',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'No available options',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Insert row above',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Insert row below',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Insert column left',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Insert column right',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Remove row', 'Remove rows'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Remove column', 'Remove columns'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Undo',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Redo',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Read only',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Clear column',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Alignment',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Left',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Center',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Right',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Justify',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Top',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Middle',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Bottom',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Freeze column',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Unfreeze column',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Borders',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Top',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Right',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Bottom',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Left',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Remove border(s)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Add comment',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Edit comment',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Delete comment',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Read-only comment',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Merge cells',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Unmerge cells',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Copy',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['Copy with header', 'Copy with headers'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['Copy with group header', 'Copy with group headers'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['Copy header only', 'Copy headers only'],
  [C.CONTEXTMENU_ITEMS_CUT]: 'Cut',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Insert child row',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Detach from parent',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Hide column', 'Hide columns'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Show column', 'Show columns'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Hide row', 'Hide rows'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Show row', 'Show rows'],
  [C.FILTERS_CONDITIONS_NONE]: 'None',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Is empty',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Is not empty',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Is equal to',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Is not equal to',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Begins with',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Ends with',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Contains',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Does not contain',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Greater than',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Greater than or equal to',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Less than',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Less than or equal to',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Is between',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Is not between',
  [C.FILTERS_CONDITIONS_AFTER]: 'After',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Before',
  [C.FILTERS_CONDITIONS_TODAY]: 'Today',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Tomorrow',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Yesterday',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Blank cells',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filter by condition',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filter by value',
  [C.FILTERS_LABELS_CONJUNCTION]: 'And',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Or',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Select all',
  [C.FILTERS_BUTTONS_CLEAR]: 'Clear',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Cancel',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Search',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Value',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Second value',
  [C.CHECKBOX_CHECKED]: 'Checked',
  [C.CHECKBOX_UNCHECKED]: 'Unchecked'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
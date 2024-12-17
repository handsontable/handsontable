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
 * Last updated: Feb 9, 2022
 *
 * Description: Definition file for Arabic - Without a specific country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'ar-AR',
  languageDirection: 'rtl',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'لا توجد خيارات متوفرة',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'إدراج صف للأعلى',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'إدراج صف للأسفل',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'إدراج عمود لليسار',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'إدراج عمود لليمين',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['احدف الصف', 'احذف الصفوف'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['احدف العمود', 'احدف الأعمدة'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'تراجع',
  [C.CONTEXTMENU_ITEMS_REDO]: 'إلغاء التراجع',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'للقراءة فقط',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'افرغ العمود',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'المحاذاة',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'يسار',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'وسط',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'يمين',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'بالتساوي',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'أعلى',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'متوسط',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'أسفل',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'تجميد العمود',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'إلغاء تجميد العمود',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'الحدود',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'أعلى',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'يمين',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'أسفل',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'يسار',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'أحذف الحد(ود)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'أضف تعليقاً',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'تعديل التعليق',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'احذف التعليق',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'تعليق للقراءة فقط',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'ادمج الخلايا',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'إلغاء دمج الخلايا',
  [C.CONTEXTMENU_ITEMS_COPY]: 'نسخ',
  [C.CONTEXTMENU_ITEMS_CUT]: 'قص',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'أدخل صفاً فرعياً',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'افصل عن الصف الأصلي',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['إخفاء العمود', 'إخفاء الأعمدة'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['إظهار العمود', 'إظهار الأعمدة'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['إخفاء السطر', 'إخفاء السطور'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['إظهار السطر', 'إظهار السطور'],
  [C.FILTERS_CONDITIONS_NONE]: 'بلا',
  [C.FILTERS_CONDITIONS_EMPTY]: 'فارغ',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'غير فارغ',
  [C.FILTERS_CONDITIONS_EQUAL]: 'يساوي',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'لا يساوي',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'يبداً بـ',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'ينتهي بـ',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'يحتوي',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'لا يحتوي',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'أكبر من',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'أكبر أو يساوي',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'أصغر',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'أصغر أو يساوي',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'بين',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'خارج المجال',
  [C.FILTERS_CONDITIONS_AFTER]: 'بعد',
  [C.FILTERS_CONDITIONS_BEFORE]: 'قبل',
  [C.FILTERS_CONDITIONS_TODAY]: 'اليوم',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'غداً',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'البارحة',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'خلايا فارغة',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'تصفية حسب الشرط',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'تصفية حسب القيمة',
  [C.FILTERS_LABELS_CONJUNCTION]: 'و',
  [C.FILTERS_LABELS_DISJUNCTION]: 'أو',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'اختيار الكل',
  [C.FILTERS_BUTTONS_CLEAR]: 'إلغاء',
  [C.FILTERS_BUTTONS_OK]: 'موافق',
  [C.FILTERS_BUTTONS_CANCEL]: 'إلغاء',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'البحث',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'القيمة',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'القيمة الثانية'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
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
 * Authors: Edgars Voroboks, NullIsNot0
 * Last updated: Dec 5, 2022
 *
 * Description: Definition file for Latvian - Latvia language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'lv-LV',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'Nav pieejamu opciju',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Ievietot rindu augšā',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Ievietot rindu apakšā',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Ievietot kolonnu pa kreisi',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Ievietot kolonnu pa labi',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Dzēst rindu', 'Dzēst rindas'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Dzēst kolonnu', 'Dzēst kolonnas'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Atsaukt',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Pārtaisīt',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Lasīšanas režīms',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Notīrīt kolonnu',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Izvietojums',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Pa kreisi',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Centrēts',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Pa labi',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Izlīdzināts',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Augšā',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Pa vidu',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Apakšā',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Iesaldēt kolonnu',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Atsaldēt kolonnu',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Robežas',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Augšā',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Pa labi',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Apakšā',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Pa kreisi',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Noņemt robežu(-as)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Pievienot komentāru',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Labot komentāru',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Dzēst komentāru',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Tikai lasāms komentārs',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Apvienot šūnas',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Atvienot šunas',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopēt',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['Kopēt ar galveni', 'Kopēt ar galvenēm'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['Kopēt ar grupas galveni', 'Kopēt ar grupas galvenēm'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['Kopēt tikai galveni', 'Kopēt tikai galvenes'],
  [C.CONTEXTMENU_ITEMS_CUT]: 'Izgriezt',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Ievietot pakārtoto rindu',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Atdalīt no vecāka',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Palēpt kolonnu', 'Palēpt kolonnas'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Rādīt kolonnu', 'Rādīt kolonnas'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Palēpt rindu', 'Paslēpt rindas'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Rādīt rindu', 'Rādīt rindas'],
  [C.FILTERS_CONDITIONS_NONE]: 'Nekas',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Ir tukšs',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Nav tukšs',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Vienāds ar',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Nav vienāds ar',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Sākas ar',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Beidzas ar',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Satur',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Nesatur',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Lielāks par',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Lielāks vai vienāds ar',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Mazāks par',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Mazāks vai vienāds ar',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Ir starp',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Nav starp',
  [C.FILTERS_CONDITIONS_AFTER]: 'Pēc',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Pirms',
  [C.FILTERS_CONDITIONS_TODAY]: 'Šodien',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Rītdien',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Vakar',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Tukšas šūnas',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtrēt pēc nosacījuma',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtrēt pēc vērtības',
  [C.FILTERS_LABELS_CONJUNCTION]: 'Un',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Vai',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Izvēlēties visu',
  [C.FILTERS_BUTTONS_CLEAR]: 'Notīrīt',
  [C.FILTERS_BUTTONS_OK]: 'Labi',
  [C.FILTERS_BUTTONS_CANCEL]: 'Atcelt',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Meklēt',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Vērtība',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Otra vērtība'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
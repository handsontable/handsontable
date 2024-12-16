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
 * Authors: Simon Borøy-Johnsen (TheSimoms)
 * Last updated: Dec 19, 2017
 *
 * Description: Definition file for Norwegian Bokmål - Norway language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'nb-NO',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Sett inn over',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Sett inn under',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Sett inn til venstre',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Sett inn til høyre',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Fjern rad', 'Fjern rader'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Fjern kolonne', 'Fjern kolonner'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Angre',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Gjør om',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Skrivebeskyttet',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Tøm kolonne',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Juster',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Venstre',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Midtstill',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Høyre',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Tilpasset',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Øverst',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'På midten',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Nederst',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Frys kolonne',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Frigi kolonne',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Kantlinjer',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Over',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Til høyre',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Under',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Til venstre',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Fjern kantlinje(r)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Legg til kommentar',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Endre kommentar',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Fjern kommentar',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Skrivebeskytt kommentar',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Slå sammen celler',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Opphev sammenslåing',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopier',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Klipp ut',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Sett inn underrad',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Frigi fra gruppe',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Skjul kolonne', 'Skjul kolonner'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Vis kolonne', 'Vis kolonner'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Skjul rad', 'Skjul rader'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Vis rad', 'Vis rader'],
  [C.FILTERS_CONDITIONS_NONE]: 'Ingen',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Er tom',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Er ikke tom',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Er lik',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Er ikke lik',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Begynner med',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Slutter med',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Inneholder',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Inneholder ikke',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Større enn',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Større enn eller lik',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Mindre enn',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Mindre enn eller lik',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Er mellom',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Er ikke mellom',
  [C.FILTERS_CONDITIONS_AFTER]: 'Etter',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Før',
  [C.FILTERS_CONDITIONS_TODAY]: 'I dag',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'I morgen',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'I går',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Tomme celler',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtrer etter betingelse',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtrer etter verdi',
  [C.FILTERS_LABELS_CONJUNCTION]: 'Og',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Eller',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Velg alle',
  [C.FILTERS_BUTTONS_CLEAR]: 'Tøm',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Avbryt',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Søk',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Verdi',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Andre verdi'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
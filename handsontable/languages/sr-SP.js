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
 * Author: Ivan Zarkovic
 * Last updated: May 9, 2022
 *
 * Description: Definition file for Serbian - Republic of Serbia language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'sr-SP',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'Nema dostupnih opcija',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Unesi red iznad',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Unesi red ispod',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Unesi kolonu levo',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Insert kolonu desno',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Ukloni red', 'Ukloni redove'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Ukloni kolonu', 'Ukloni kolone'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Poništi',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Ponovi',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Samo za čitanje',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Obriši kolonu',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Poravnanje',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Levo',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Centar',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Desno',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Složeno',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Gore',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Sredina',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Dole',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Zamrzni kolonu',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Odmrzni kolonu',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Ivica',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Gore',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Desno',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Dole',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Levo',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Ukloni ivicu(e)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Dodaj komentar',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Izmeni komentar',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Obriši komentar',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Komentar samo za čitanje',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Spoji ćelije',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Odvoji ćelije',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopiraj',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['Kopiraj sa zaglavljem', 'Kopiraj sa zaglavljima'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['Kopiraj sa zaglavljem grupe', 'Kopiraj sa zaglavljima grupe'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['Kopiraj samo zaglavlje', 'Kopiraj samo zaglavlja'],
  [C.CONTEXTMENU_ITEMS_CUT]: 'Iseci',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Unesi ugnježdeni red',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Odvoji ugnježdeni red',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Sakrij kolonu', 'Sakrij kolone'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Prikaži kolonu', 'Prikaži kolone'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Sakrij red', 'Sakrij redove'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Prikaži red', 'Prikaži redove'],
  [C.FILTERS_CONDITIONS_NONE]: 'Nema',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Je prazno',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Nije prazno',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Je jednako',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Nije jednako',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Počinje sa',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Završava se sa',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Sadrži',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Ne sadrži',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Veće od',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Veće od ili jednako',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Manje od',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Manje od ili jednako',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Je između',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Nije između',
  [C.FILTERS_CONDITIONS_AFTER]: 'Posle',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Pre',
  [C.FILTERS_CONDITIONS_TODAY]: 'Danas',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Sutra',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Juče',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Prazne ćelije',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtriraj po uslovu',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtriraj po vrednosti',
  [C.FILTERS_LABELS_CONJUNCTION]: 'I',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Ili',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Selektuj sve',
  [C.FILTERS_BUTTONS_CLEAR]: 'Očisti',
  [C.FILTERS_BUTTONS_OK]: 'U redu',
  [C.FILTERS_BUTTONS_CANCEL]: 'Otkaži',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Pretraga',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Vrednost',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Druga vrednost'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
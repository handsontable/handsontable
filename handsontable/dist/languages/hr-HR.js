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
 * Authors: Domagoj Lončarić & Ante Živković
 * Last updated: Jan 31, 2024
 *
 * Description: Definition file for Croatian - Croatia language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'hr-HR',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'Nema dostupnih mogućnosti',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Umetni redak iznad',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Umetni redak ispod',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Umetni stupac lijevo',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Umetni stupac desno',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Ukloni redak', 'Ukloni retke'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Ukloni stupac', 'Ukloni stupce'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Poništi',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Ponovi',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Samo za čitanje',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Očisti stupac',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Poravnanje',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Lijevo',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Centar',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Desno',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Obostrano',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Gore',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Sredina',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Dolje',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Zamrzni stupac',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Odmrzni stupac',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Granice',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Gore',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Desno',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Dolje',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Lijevo',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Ukloni granicu(e)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Dodaj komentar',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Uredi komentar',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Izbriši komentar',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Komentar samo za čitanje',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Spoji čelije',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Razdijeli čelije',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopiraj',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['Kopiraj sa zaglavljem', 'Kopiraj sa zaglavljima'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['Kopiraj sa grupnim zaglavljem', 'Kopiraj sa grupnim zaglavljima'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['Kopiraj samo zaglavlje', 'Kopiraj samo zaglavlja'],
  [C.CONTEXTMENU_ITEMS_CUT]: 'Izreži',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Umetni ugniježđeni redak',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Odvoji ugniježđeni redak',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Sakrij stupac', 'Sakrij stupce'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Prikaži stupac', 'Prikaži stupce'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Sakrij redak', 'Sakrij retke'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Prikaži redak', 'Prikaži retke'],
  [C.FILTERS_CONDITIONS_NONE]: 'Ništa',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Prazno',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Nije prazno',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Jednako',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Nije jednako',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Počinje s',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Završava s',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Sadrži',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Ne sadrži',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Veće od',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Veće ili jednako od',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Manje od',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Manje ili jednako od',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Između',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Nije između',
  [C.FILTERS_CONDITIONS_AFTER]: 'Nakon',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Prije',
  [C.FILTERS_CONDITIONS_TODAY]: 'Danas',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Sutra',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Jučer',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Prazna polja',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtriraj po uvjetu',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtriraj po vrijednosti',
  [C.FILTERS_LABELS_CONJUNCTION]: 'I',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Ili',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Odaberi sve',
  [C.FILTERS_BUTTONS_CLEAR]: 'Očisti',
  [C.FILTERS_BUTTONS_OK]: 'U redu',
  [C.FILTERS_BUTTONS_CANCEL]: 'Odustani',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Pretraži',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Vrijednost',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Druga vrijednost',
  [C.CHECKBOX_CHECKED]: 'Označeno',
  [C.CHECKBOX_UNCHECKED]: 'Nije označeno'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
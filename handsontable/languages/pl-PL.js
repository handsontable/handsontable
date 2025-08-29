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
 * Last updated: Dec 5, 2022
 *
 * Description: Definition file for Polish - Poland language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'pl-PL',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'Brak dostępnych opcji',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Wstaw wiersz powyżej',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Wstaw wiersz poniżej',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Wstaw kolumnę z lewej',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Wstaw kolumnę z prawej',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Usuń wiersz', 'Usuń wiersze'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Usuń kolumnę', 'Usuń kolumny'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Cofnij',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Ponów',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Tylko do odczytu',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Wyczyść kolumnę',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Wyrównanie',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Do lewej',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Do środka',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Do prawej',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Wyjustuj',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Do góry',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Wyśrodkuj',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Do dołu',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Zablokuj kolumnę',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Odblokuj kolumnę',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Obramowanie',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Krawędź górna',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Krawędź prawa',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Krawędź dolna',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Krawędź lewa',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Usuń obramowanie(a)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Dodaj komentarz',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Edytuj komentarz',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Usuń komentarz',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Komentarz tylko do odczytu',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Scal komórki',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Rozdziel komórki',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopiuj',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['Kopiuj z nagłówkiem', 'Kopiuj z nagłówkami'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['Kopiuj z nagłówkiem grupowym', 'Kopiuj z nagłówkami grupowymi'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['Kopiuj sam nagłówek', 'Kopiuj same nagłówki'],
  [C.CONTEXTMENU_ITEMS_CUT]: 'Wytnij',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Wstaw wiersz podrzędny',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Odłącz od nadrzędnego',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Ukryj kolumnę', 'Ukryj kolumny'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Pokaż kolumnę', 'Pokaż kolumny'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Ukryj wiersz', 'Ukryj wiersze'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Pokaż wiersz', 'Pokaż wiersze'],
  [C.FILTERS_CONDITIONS_NONE]: 'Brak',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Komórka jest pusta',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Komórka nie jest pusta',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Jest równe',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Jest różne od',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Tekst zaczyna się od',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Tekst kończy się na',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Tekst zawiera fragment',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Tekst nie zawiera fragmentu',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Większe niż',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Większe lub równe',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Mniejsze niż',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Mniejsze lub równe',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Jest pomiędzy',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Nie jest pomiędzy',
  [C.FILTERS_CONDITIONS_AFTER]: 'Data późniejsza niż',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Data wcześniejsza niż',
  [C.FILTERS_CONDITIONS_TODAY]: 'Dzisiaj',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Jutro',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Wczoraj',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Puste miejsca',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtruj wg warunku',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtruj wg wartości',
  [C.FILTERS_LABELS_CONJUNCTION]: 'Oraz',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Lub',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Zaznacz wszystko',
  [C.FILTERS_BUTTONS_CLEAR]: 'Wyczyść',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Anuluj',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Szukaj',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Wartość',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Druga wartość',
  [C.CHECKBOX_CHECKED]: 'Zaznaczony',
  [C.CHECKBOX_UNCHECKED]: 'Odznaczony'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
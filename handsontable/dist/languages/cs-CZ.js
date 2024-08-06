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
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;


var _interopRequireDefault = __webpack_require__(1);
exports.__esModule = true;
var _handsontable = _interopRequireDefault(__webpack_require__(2));
/**
 * @preserve
 * Authors: Ashus
 * Last updated: Mar 22, 2022
 *
 * Description: Definition file for Czech - Czechia language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'cs-CZ',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'Žádné volby nejsou dostupné',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Vložit řádek nad',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Vložit řádek pod',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Vložit sloupec vlevo',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Vložit sloupec vpravo',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Smazat řádek', 'Smazat řádky'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Smazat sloupec', 'Smazat sloupce'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Zpět',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Znovu',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Pouze pro čtení',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Vymazat obsah sloupce',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Zarovnat',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Vlevo',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Na střed',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Vpravo',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Do bloku',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Nahoru',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Na střed',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Dolů',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Zmrazit sloupec',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Zrušit zmrazení sloupce',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Ohraničení',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Nahoře',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Vpravo',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Dole',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Vlevo',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Zrušit ohraničení',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Přidat komentář',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Upravit komentář',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Vymazat komentář',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Komenář pouze pro čtení',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Sloučit buňky',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Zrušit sloučení buněk',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopírovat',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Vyjmout',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Vložit podřízený řádek',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Oddělit od nadřízeného',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Skrýt sloupec', 'Skrýt sloupce'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Zobrazit sloupec', 'Zobrazit sloupce'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Skrýt řádek', 'Skrýt řádky'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Zobrazit řádek', 'Zobrazit řádky'],
  [C.FILTERS_CONDITIONS_NONE]: 'Žádné',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Prázdné',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Neprázdné',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Rovná se',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Nerovná se',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Začíná na',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Končí na',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Obsahuje',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Neobsahuje',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Větší než',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Větší nebo se rovná',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Menší než',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Menší nebo se rovná',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Je v rozsahu',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Není v rozsahu',
  [C.FILTERS_CONDITIONS_AFTER]: 'Po',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Před',
  [C.FILTERS_CONDITIONS_TODAY]: 'Dnes',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Zítra',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Včera',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Prádné buňky',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtrovat dle stavu',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtrovat dle hodnoty',
  [C.FILTERS_LABELS_CONJUNCTION]: 'A',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Nebo',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Vybrat vše',
  [C.FILTERS_BUTTONS_CLEAR]: 'Smazat',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Storno',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Hledat',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Hodnota',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Druhá hodnota'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
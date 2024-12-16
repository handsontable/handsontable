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
 * Authors: Tomas Rapkauskas, Anton Brouwer, webjazznl
 * Last updated: Dec 5, 2022
 *
 * Description: Definition file for Dutch - The Netherlands language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'nl-NL',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Rij boven invoegen',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Rij onder invoegen',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Kolom links invoegen',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Kolom rechts invoegen',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Rij verwijderen', 'Rijen verwijderen'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Kolom verwijderen', 'Kolommen verwijderen'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Ongedaan maken',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Opnieuw uitvoeren',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Alleen lezen',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Kolom leegmaken',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Uitlijning',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Links',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Gecentreerd',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Rechts',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Uitvullen',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Boven',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Midden',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Onder',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Kolom blokkeren',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Kolom blokkering opheffen',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Randen',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Boven',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Rechts',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Onder',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Links',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Rand(en) verwijderen',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Opmerking toevoegen',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Opmerking bewerken',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Opmerking verwijderen',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Opmerking Alleen-lezen',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Cellen samenvoegen',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Samenvoeging van cellen opheffen',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopiëren',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['Kopiëren met koptekst', 'Kopiëren met kopteksten'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['Kopiëren met groepskoptekst', 'Kopiëren met groepskopteksten'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['Kopiëren koptekst', 'Kopiëren kopteksten'],
  [C.CONTEXTMENU_ITEMS_CUT]: 'Knippen',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Geneste rij invoegen',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Geneste rij ontkoppelen',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Kolom verbergen', 'Kolommen verbergen'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Kolom zichbaar maken', 'Kolommen zichtbaar maken'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Rij verbergen', 'Rijen verbergen'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Rij zichtbaar maken', 'Rijen zichtbaar maken'],
  [C.FILTERS_CONDITIONS_NONE]: 'Geen',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Is leeg',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Is niet leeg',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Is gelijk aan',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Is niet gelijk aan',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Begint met',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Eindigt op',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Bevat',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Bevat niet',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Is groter',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Is groter of gelijk aan',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Is kleiner dan',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Is kleiner dan of gelijk aan',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Is tussen',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Ligt niet tussen',
  [C.FILTERS_CONDITIONS_AFTER]: 'Na',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Voor',
  [C.FILTERS_CONDITIONS_TODAY]: 'Vandaag',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Morgen',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Gisteren',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Cellen leegmaken',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filteren op conditie',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filteren op waarde',
  [C.FILTERS_LABELS_CONJUNCTION]: 'En',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Of',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Alles selecteren',
  [C.FILTERS_BUTTONS_CLEAR]: 'Leeg maken',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Annuleren',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Zoeken',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Waarde',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Tweede waarde'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
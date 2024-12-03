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
 * Authors: Andrea Cattaneo
 * Last updated: Sep 14, 2018
 *
 * Description: Definition file for Italian - Italy language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'it-IT',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Inserisci riga sopra',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Inserisci riga sotto',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Inserisci colonna a sinistra',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Inserisci colonna a destra',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Rimuovi riga', 'Rimuovi righe'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Rimuovi colonna', 'Rimuovi colonne'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Annulla',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Ripeti',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Sola lettura',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Svuota colonna',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Allineamento',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Sinistra',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Centro',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Destra',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Giustificato',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'In alto',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'A metà',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'In basso',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Blocca colonna',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Sblocca colonna',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Bordi',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Sopra',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Destra',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Sotto',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Sinistra',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Rimuovi bordo(i)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Aggiungi commento',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Modifica commento',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Rimuovi commento',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Commento in sola lettura',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Unisci celle',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Separa celle',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Copia',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Taglia',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Inserisci riga figlia',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Scollega da riga madre',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Nascondi colonna', 'Nascondi colonne'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Mostra colonna', 'Mostra colonne'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Nascondi riga', 'Nascondi righe'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Mostra riga', 'Mostra righe'],
  [C.FILTERS_CONDITIONS_NONE]: 'Nessuna',
  [C.FILTERS_CONDITIONS_EMPTY]: 'È vuoto',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Non è vuoto',
  [C.FILTERS_CONDITIONS_EQUAL]: 'È uguale a',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'È diverso da',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Inizia con',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Termina con',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Contiene',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Non contiene',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Maggiore',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Maggiore o uguale',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Minore',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Minore o uguale',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'È compreso tra',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Non è compreso tra',
  [C.FILTERS_CONDITIONS_AFTER]: 'Dopo',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Prima',
  [C.FILTERS_CONDITIONS_TODAY]: 'Oggi',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Domani',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Ieri',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Celle vuote',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtra per condizione',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtra per valore',
  [C.FILTERS_LABELS_CONJUNCTION]: 'E',
  [C.FILTERS_LABELS_DISJUNCTION]: 'O',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Seleziona tutto',
  [C.FILTERS_BUTTONS_CLEAR]: 'Pulisci',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Annulla',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Cerca',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Valore',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Sostituisci con'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
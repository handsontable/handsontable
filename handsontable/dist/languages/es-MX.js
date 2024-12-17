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
 * Authors: Handsoncode, Enrique Enciso
 * Last updated: Nov 18, 2022
 *
 * Description: Definition file for Spanish - Mexico language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'es-MX',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Insertar fila arriba',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Insertar fila abajo',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Insertar columna izquierda',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Insertar columna derecha',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Eliminar fila', 'Eliminar filas'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Eliminar columna', 'Eliminar columnas'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Deshacer',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Rehacer',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Solo lectura',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Limpiar columna',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Alineación',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Izquierda',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Centro',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Derecha',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Justificar',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Superior',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Medio',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Inferior',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Congelar columna',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Descongelar columna',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Bordes',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Superior',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Derecho',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Inferior',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Izquierdo',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Quitar borde(s)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Agregar comentario',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Editar comentario',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Borrar comentario',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Comentario Solo de lectura',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Unir celdas',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Separar celdas',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Copiar',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['Copiar con encabezado', 'Copiar con encabezados'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['Copiar con encabezado de grupo', 'Copiar con encabezados de grupos'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['Copiar solo el encabezado', 'Copiar solo los encabezados'],
  [C.CONTEXTMENU_ITEMS_CUT]: 'Cortar',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Insertar fila hija',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Separar del padre',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Esconder columna', 'Esconder columnas'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Mostrar columna', 'Mostrar columnas'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Esconder fila', 'Esconder filas'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Mostrar fila', 'Mostrar filas'],
  [C.FILTERS_CONDITIONS_NONE]: 'Ninguna',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Está vacío',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'No está vacío',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Es igual a',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'No es igual a',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Comienza con',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Termina con',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Contiene',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'No contiene',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Mayor que',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Mayor o igual que',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Menor que',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Menor o igual que',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Es entre',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'No es entre',
  [C.FILTERS_CONDITIONS_AFTER]: 'Después',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Antes',
  [C.FILTERS_CONDITIONS_TODAY]: 'Hoy',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Mañana',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Ayer',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Celdas vacías',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtrar por condición',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtrar por valor',
  [C.FILTERS_LABELS_CONJUNCTION]: 'Y',
  [C.FILTERS_LABELS_DISJUNCTION]: 'O',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Seleccionar todo',
  [C.FILTERS_BUTTONS_CLEAR]: 'Borrar',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Cancelar',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Buscar',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Valor',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Valor secundario'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
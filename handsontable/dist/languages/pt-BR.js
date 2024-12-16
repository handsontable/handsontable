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
 * Authors: Júlio C. Zuppa
 * Last updated: Jan 12, 2018
 *
 * Description: Definition file for Portuguese - Brazil language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'pt-BR',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Inserir linha acima',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Inserir linha abaixo',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Inserir coluna esquerda',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Inserir coluna direita',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Excluir linha', 'Excluir linhas'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Excluir coluna', 'Excluir colunas'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Desfazer',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Refazer',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Somente leitura',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Limpar coluna',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Alinhamento',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Esquerda',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Centralizado',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Direita',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Justificado',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Superior',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Meio',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Inferior',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Congelar coluna',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Descongelar coluna',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Bordas',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Superior',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Direita',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Inferior',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Esquerda',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Excluir bordas(s)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Incluir comentário',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Editar comentário',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Remover comentário',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Comentário somente leitura',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Mesclar células',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Desfazer mesclagem de células',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Copiar',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Recortar',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Inserir linha filha',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Desanexar da linha pai',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Ocultar coluna', 'Ocultar colunas'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Exibir coluna', 'Exibir colunas'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Ocultar linha', 'Ocultar linhas'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Exibir linha', 'Exibir linhas'],
  [C.FILTERS_CONDITIONS_NONE]: 'Nenhum',
  [C.FILTERS_CONDITIONS_EMPTY]: 'É vazio',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Não é vazio',
  [C.FILTERS_CONDITIONS_EQUAL]: 'É igual a',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'É diferente de',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Começa com',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Termina com',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Contém',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Não contém',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Maior que',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Maior ou igual a',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Menor que',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Maior ou igual a',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Está entre',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Não está entre',
  [C.FILTERS_CONDITIONS_AFTER]: 'Depois',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Antes',
  [C.FILTERS_CONDITIONS_TODAY]: 'Hoje',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Amanhã',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Ontem',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Células vazias',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtrar por condição',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtrar por valor',
  [C.FILTERS_LABELS_CONJUNCTION]: 'E',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Ou',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Selecionar tudo',
  [C.FILTERS_BUTTONS_CLEAR]: 'Limpar',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Cancelar',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Localizar',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Valor',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Segundo valor'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
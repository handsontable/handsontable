(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("handsontable"));
	else if(typeof define === 'function' && define.amd)
		define(["handsontable"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("handsontable")) : factory(root["Handsontable"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE__6__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 21);
/******/ })
/************************************************************************/
/******/ ({

/***/ 1:
/***/ (function(module, exports) {

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}
module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 2:
/***/ (function(module, exports, __webpack_require__) {

var toPropertyKey = __webpack_require__(3);
function _defineProperty(obj, key, value) {
  key = toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 21:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(1);
exports.__esModule = true;
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(__webpack_require__(2));
var _handsontable = _interopRequireDefault(__webpack_require__(6));
var _dictionary;
var C = _handsontable.default.languages.dictionaryKeys;
var dictionary = (_dictionary = {
  languageCode: 'pt-BR'
}, (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Inserir linha acima'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Inserir linha abaixo'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Inserir coluna esquerda'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Inserir coluna direita'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Excluir linha', 'Excluir linhas']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Excluir coluna', 'Excluir colunas']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Desfazer'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Refazer'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Somente leitura'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Limpar coluna'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Alinhamento'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Esquerda'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Centralizado'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Direita'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Justificado'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Superior'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Meio'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Inferior'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Congelar coluna'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Descongelar coluna'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Bordas'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Superior'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Direita'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Inferior'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Esquerda'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Excluir bordas(s)'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Incluir comentário'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Editar comentário'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Remover comentário'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Comentário somente leitura'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Mesclar células'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Desfazer mesclagem de células'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Copiar'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Recortar'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Inserir linha filha'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Desanexar da linha pai'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Ocultar coluna', 'Ocultar colunas']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Exibir coluna', 'Exibir colunas']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Ocultar linha', 'Ocultar linhas']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Exibir linha', 'Exibir linhas']), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Nenhum'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'É vazio'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Não é vazio'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'É igual a'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'É diferente de'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Começa com'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Termina com'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Contém'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Não contém'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Maior que'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Maior ou igual a'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Menor que'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Maior ou igual a'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Está entre'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Não está entre'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Depois'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Antes'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Hoje'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Amanhã'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Ontem'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Células vazias'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filtrar por condição'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filtrar por valor'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'E'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Ou'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Selecionar tudo'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Limpar'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Cancelar'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Localizar'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Valor'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Segundo valor'), _dictionary);
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = dictionary;
exports.default = _default;

/***/ }),

/***/ 3:
/***/ (function(module, exports, __webpack_require__) {

var _typeof = __webpack_require__(4)["default"];
var toPrimitive = __webpack_require__(5);
function _toPropertyKey(arg) {
  var key = toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}
module.exports = _toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 4:
/***/ (function(module, exports) {

function _typeof(obj) {
  "@babel/helpers - typeof";

  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(obj);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 5:
/***/ (function(module, exports, __webpack_require__) {

var _typeof = __webpack_require__(4)["default"];
function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
module.exports = _toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 6:
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__6__;

/***/ })

/******/ })["___"];
});
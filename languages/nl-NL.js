(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("../../handsontable"));
	else if(typeof define === 'function' && define.amd)
		define(["../../handsontable"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("../../handsontable")) : factory(root["Handsontable"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE__3__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 14);
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

module.exports = _interopRequireDefault;

/***/ }),

/***/ 14:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(1);

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(__webpack_require__(2));

var _handsontable = _interopRequireDefault(__webpack_require__(3));

var _dictionary;

var C = _handsontable.default.languages.dictionaryKeys;
var dictionary = (_dictionary = {
  languageCode: 'nl-NL'
}, (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Rij boven invoegen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Rij onder invoegen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Kolom links invoegen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Kolom rechts invoegen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Rij verwijderen', 'Rijen verwijderen']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Kolom verwijderen', 'Kolommen verwijderen']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Ongedaan maken'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Opnieuw uitvoeren'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Alleen lezen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Kolom leegmaken'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Uitlijning'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'Links'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'Gecentreerd'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'Rechts'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'Uitvullen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'Boven'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'Midden'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'Onder'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Kolom blokkeren'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Kolom blokkering opheffen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Randen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Boven'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Rechts'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Onder'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Links'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Rand(en) verwijderen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Opmerking toevoegen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Opmerking bewerken'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Opmerking verwijderen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Opmerking Alleen-lezen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Cellen samenvoegen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Samenvoeging van cellen opheffen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Kopiëren'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Knippen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Geneste rij invoegen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Geneste rij ontkoppelen'), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Kolom verbergen', 'Kolommen verbergen']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Kolom zichbaar maken', 'Kolommen zichtbaar maken']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Rij verbergen', 'Rijen verbergen']), (0, _defineProperty2.default)(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Rij zichtbaar maken', 'Rijen zichtbaar maken']), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Geen'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Is leeg'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Is niet leeg'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Is gelijk aan'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Is niet gelijk aan'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Begint met'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Eindigt op'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Bevat'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Bevat niet'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Is groter'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Is groter of gelijk aan'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Is kleiner dan'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Is kleiner dan of gelijk aan'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Is tussen'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Ligt niet tussen'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'Na'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'Voor'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Vandaag'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Morgen'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Gisteren'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Cellen leegmaken'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Filteren op conditie'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Filteren op waarde'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'En'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Of'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Alles selecteren'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Leeg maken'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Annuleren'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Zoeken'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Waarde'), (0, _defineProperty2.default)(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Tweede waarde'), _dictionary);

_handsontable.default.languages.registerLanguageDictionary(dictionary);

var _default = dictionary;
exports.default = _default;

/***/ }),

/***/ 2:
/***/ (function(module, exports) {

function _defineProperty(obj, key, value) {
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

module.exports = _defineProperty;

/***/ }),

/***/ 3:
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__3__;

/***/ })

/******/ })["___"];
});
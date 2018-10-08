(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("../../handsontable"));
	else if(typeof define === 'function' && define.amd)
		define(["../../handsontable"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("../../handsontable")) : factory(root["Handsontable"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE_0__) {
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
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
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
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),

/***/ 10:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _dictionary;

var _handsontable = __webpack_require__(0);

var _handsontable2 = _interopRequireDefault(_handsontable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @preserve
                                                                                                                                                                                                                   * Authors: Alexey Rogachev
                                                                                                                                                                                                                   * Last updated: Feb 28, 2018
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Description: Definition file for Russian - Russia language-country.
                                                                                                                                                                                                                   */


var C = _handsontable2.default.languages.dictionaryKeys;

var dictionary = (_dictionary = {
  languageCode: 'ru-RU'
}, _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_ABOVE, 'Вставить строку выше'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ROW_BELOW, 'Вставить строку ниже'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_LEFT, 'Вставить столбец слева'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_INSERT_RIGHT, 'Вставить столбец справа'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_ROW, ['Удалить строку', 'Удалить строки']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, ['Удалить столбец', 'Удалить столбцы']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNDO, 'Отменить'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REDO, 'Повторить'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY, 'Только для чтения'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CLEAR_COLUMN, 'Очистить столбец'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT, 'Выравнивание'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT, 'По левому краю'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER, 'По центру'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT, 'По правому краю'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY, 'По ширине'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP, 'По верхнему краю'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE, 'По центру'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM, 'По нижнему краю'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_FREEZE_COLUMN, 'Закрепить столбец'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN, 'Открепить столбец'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS, 'Границы'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_TOP, 'Сверху'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_RIGHT, 'Справа'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM, 'Снизу'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_BORDERS_LEFT, 'Слева'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_BORDERS, 'Удалить границу(ы)'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_ADD_COMMENT, 'Добавить комментарий'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_EDIT_COMMENT, 'Редактировать комментарий'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_REMOVE_COMMENT, 'Удалить комментарий'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT, 'Комментарий только для чтения'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_MERGE_CELLS, 'Объединить ячейки'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_UNMERGE_CELLS, 'Разделить ячейки'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_COPY, 'Копировать'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_CUT, 'Вырезать'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD, 'Вставить дочернюю строку'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD, 'Отделить от родителя'), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_COLUMN, ['Скрыть столбец', 'Скрыть столбцы']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_COLUMN, ['Показать столбец', 'Показать столбцы']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_HIDE_ROW, ['Скрыть строку', 'Скрыть строки']), _defineProperty(_dictionary, C.CONTEXTMENU_ITEMS_SHOW_ROW, ['Показать строку', 'Показать строки']), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NONE, 'Отсутствует'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EMPTY, 'Пусто'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EMPTY, 'Не пусто'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_EQUAL, 'Равно'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_EQUAL, 'Не равно'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEGINS_WITH, 'Начинается на'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_ENDS_WITH, 'Заканчивается на'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_CONTAINS, 'Содержит'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_CONTAIN, 'Не содержит'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN, 'Больше чем'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL, 'Больше или равно'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN, 'Меньше чем'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL, 'Меньше или равно'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BETWEEN, 'Между'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_NOT_BETWEEN, 'Не между'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_AFTER, 'После'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_BEFORE, 'До'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TODAY, 'Сегодня'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_TOMORROW, 'Завтра'), _defineProperty(_dictionary, C.FILTERS_CONDITIONS_YESTERDAY, 'Вчера'), _defineProperty(_dictionary, C.FILTERS_VALUES_BLANK_CELLS, 'Пустые ячейки'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_CONDITION, 'Фильтр по условию'), _defineProperty(_dictionary, C.FILTERS_DIVS_FILTER_BY_VALUE, 'Фильтр по значению'), _defineProperty(_dictionary, C.FILTERS_LABELS_CONJUNCTION, 'И'), _defineProperty(_dictionary, C.FILTERS_LABELS_DISJUNCTION, 'Или'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_SELECT_ALL, 'Выбрать все'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CLEAR, 'Убрать'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_OK, 'OK'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_CANCEL, 'Отмена'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH, 'Поиск'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_VALUE, 'Значение'), _defineProperty(_dictionary, C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE, 'Второе значение'), _dictionary);

_handsontable2.default.languages.registerLanguageDictionary(dictionary);

exports.default = dictionary;

/***/ })

/******/ })["___"];
});
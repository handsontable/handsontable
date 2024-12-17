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
 * Authors: Alexey Rogachev
 * Last updated: Feb 28, 2018
 *
 * Description: Definition file for Russian - Russia language-country.
 */

const C = _handsontable.default.languages.dictionaryKeys;
const dictionary = {
  languageCode: 'ru-RU',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Вставить строку выше',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Вставить строку ниже',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Вставить столбец слева',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Вставить столбец справа',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Удалить строку', 'Удалить строки'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Удалить столбец', 'Удалить столбцы'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Отменить',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Повторить',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Только для чтения',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Очистить столбец',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Выравнивание',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'По левому краю',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'По центру',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'По правому краю',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'По ширине',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'По верхнему краю',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'По центру',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'По нижнему краю',
  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Закрепить столбец',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Открепить столбец',
  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Границы',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Сверху',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Справа',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Снизу',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Слева',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Удалить границу(ы)',
  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Добавить комментарий',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Редактировать комментарий',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Удалить комментарий',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Комментарий только для чтения',
  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Объединить ячейки',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Разделить ячейки',
  [C.CONTEXTMENU_ITEMS_COPY]: 'Копировать',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Вырезать',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Вставить дочернюю строку',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Отделить от родителя',
  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Скрыть столбец', 'Скрыть столбцы'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Показать столбец', 'Показать столбцы'],
  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Скрыть строку', 'Скрыть строки'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Показать строку', 'Показать строки'],
  [C.FILTERS_CONDITIONS_NONE]: 'Отсутствует',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Пусто',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Не пусто',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Равно',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Не равно',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Начинается на',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Заканчивается на',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Содержит',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Не содержит',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Больше чем',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Больше или равно',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Меньше чем',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Меньше или равно',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Между',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Не между',
  [C.FILTERS_CONDITIONS_AFTER]: 'После',
  [C.FILTERS_CONDITIONS_BEFORE]: 'До',
  [C.FILTERS_CONDITIONS_TODAY]: 'Сегодня',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Завтра',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Вчера',
  [C.FILTERS_VALUES_BLANK_CELLS]: 'Пустые ячейки',
  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Фильтр по условию',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Фильтр по значению',
  [C.FILTERS_LABELS_CONJUNCTION]: 'И',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Или',
  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Выбрать все',
  [C.FILTERS_BUTTONS_CLEAR]: 'Убрать',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Отмена',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Поиск',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Значение',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Второе значение'
};
_handsontable.default.languages.registerLanguageDictionary(dictionary);
var _default = exports["default"] = dictionary;
})();

__webpack_exports__ = __webpack_exports__.___;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
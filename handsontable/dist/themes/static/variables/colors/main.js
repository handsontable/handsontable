/*!
 * Copyright (c) HANDSONCODE sp. z o. o.
 *
 * HANDSONTABLE is a software distributed by HANDSONCODE sp. z o. o., a Polish corporation based in
 * Gdynia, Poland, at Aleja Zwyciestwa 96-98, registered by the District Court in Gdansk under number
 * 538651, EU tax ID number: PL5862294002, share capital: PLN 62,800.00.
 *
 * This software is protected by applicable copyright laws, including international treaties, and dual-
 * licensed - depending on whether your use for commercial purposes, meaning intended for or
 * resulting in commercial advantage or monetary compensation, or not.
 *
 * If your use is strictly personal or solely for evaluation purposes, meaning for the purposes of testing
 * the suitability, performance, and usefulness of this software outside the production environment,
 * you agree to be bound by the terms included in the "handsontable-non-commercial-license.pdf" file.
 *
 * Your use of this software for commercial purposes is subject to the terms included in an applicable
 * license agreement.
 *
 * In any case, you must not make any such use of this software as to develop software which may be
 * considered competitive with this software.
 *
 * UNLESS EXPRESSLY AGREED OTHERWISE, HANDSONCODE PROVIDES THIS SOFTWARE ON AN "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, AND IN NO EVENT AND UNDER NO
 * LEGAL THEORY, SHALL HANDSONCODE BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY DIRECT,
 * INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY CHARACTER ARISING FROM
 * USE OR INABILITY TO USE THIS SOFTWARE.
 *
 * Version: 16.2.0
 * Release date: 25/11/2025 (built at 10/02/2026 21:00:03)
 */
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


var _interopRequireDefault = __webpack_require__(1);
var _handsontable = _interopRequireDefault(__webpack_require__(2));
/*
 * This file is auto-generated. Do not edit directly.
 */

const main = {
  white: '#ffffffff',
  black: '#000000ff',
  primary: {
    100: '#6180ffff',
    200: '#5573f0ff',
    300: '#4669f6ff',
    400: '#2e56fcff',
    500: '#1a42e8ff',
    600: '#1535bcff'
  },
  palette: {
    50: '#f7f7f9ff',
    100: '#ebebedff',
    200: '#e7e7e9ff',
    300: '#a3a3a3ff',
    400: '#68696cff',
    500: '#404144ff',
    600: '#313132ff',
    700: '#282829ff',
    800: '#222222ff',
    900: '#1e1e1fff',
    950: '#050506ff'
  },
  transparent: '#ffffff00'
};
if (typeof _handsontable.default !== 'undefined' && _handsontable.default.themes) {
  _handsontable.default.themes.variables = _handsontable.default.themes.variables || {};
  _handsontable.default.themes.variables.colors = _handsontable.default.themes.variables.colors || {};
  _handsontable.default.themes.variables.colors.main = main;
}
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
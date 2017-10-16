/*!
 * Copyright (c) Handsoncode sp. z o.o.
 * 
 * This Handsontable Pro is a commercial software distributed by Handsoncode sp. z o. o., a limited liability
 * company registered under the laws of Poland, with its registered office in Gdynia, Poland, at 96/98 Aleja Zwycięstwa,
 * postal code 81-451, entered into the Entrepreneurs Register of the National Court Register under number 0000538651,
 * share capital: PLN 62,800.00., hereinafter referred to as "HANDSONCODE".
 * 
 * By installing, copying, or otherwise using this software, you agree to be bound by the terms
 * of its General Software License Terms ("Terms") outlined in a file "handsontable-pro-general-terms.pdf"
 * available in the main directory of the software repository.
 * This software is copyrighted and protected by copyright laws and international treaties.
 * 
 * You shall obtain a commercial license for this software at handsontable.com.
 * 
 * YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF THE SOFTWARE IS AT YOUR OWN RISK AND THAT THE SOFTWARE
 * IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES OR CONDITIONS WHATSOEVER. HANDSONCODE EXPRESSLY DISCLAIMS ANY WARRANTY,
 * EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGMENT. HANDSONCODE DOES NOT WARRANT THAT THE SOFTWARE AND ITS FUNCTIONALITY,
 * RELIABILITY AND PERFORMANCE WILL MEET YOUR REQUIREMENTS OR THAT THE OPERATION OF THE SOFTWARE WILL BE
 * UNINTERRUPTED OR ERROR FREE.
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("../../handsontable-pro"));
	else if(typeof define === 'function' && define.amd)
		define(["../../handsontable-pro"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("../../handsontable-pro")) : factory(root["Handsontable"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__handsontable_pro__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__handsontable_pro___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__handsontable_pro__);
/**
 * @preserve
 * Authors: Wojciech Szymański
 * Last updated: 28.09.2017
 *
 * Description: Definition file for French - France language-country.
 */


const C = __WEBPACK_IMPORTED_MODULE_0__handsontable_pro___default.a.languages.constants;

const dictionary = {
  languageCode: 'fr-FR',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Placez la ligne ci-dessus',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Insérer la colonne à gauche'
};

__WEBPACK_IMPORTED_MODULE_0__handsontable_pro___default.a.languages.register(dictionary.languageCode, dictionary);

/* harmony default export */ __webpack_exports__["default"] = (dictionary);


/***/ })
/******/ ])["default"];
});
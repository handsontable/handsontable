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
 * Release date: 25/11/2025 (built at 11/02/2026 10:03:08)
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;


exports.__esModule = true;
/* eslint-disable max-len, quotes */

/*
 * This file is auto-generated. Do not edit directly.
 */

const icon = (icons, name) => {
  return `width: var(--ht-icon-size);
  height: var(--ht-icon-size);
  -webkit-mask-size: contain;
  -webkit-mask-image: url("${icons[name]}");
  background-color: currentColor;`;
};
const iconsMap = (icons, themePrefix) => {
  const prefix = themePrefix ? `[class*=${themePrefix}] ` : "";
  return `${prefix}.htDropdownMenu table tbody tr td.htSubmenu .htItemWrapper::after,
${prefix}.htContextMenu table tbody tr td.htSubmenu .htItemWrapper::after,
${prefix}.htFiltersConditionsMenu table tbody tr td.htSubmenu .htItemWrapper::after,
${prefix}.pika-single .pika-next {
  ${icon(icons, "arrowRight")}
}

${prefix}.pika-single .pika-prev {
  ${icon(icons, "arrowLeft")}
}

${prefix}.ht-page-size-section__select-wrapper::after {
  ${icon(icons, "arrowDown")}
}

${prefix}.changeType::before {
  ${icon(icons, "menu")}
}

${prefix}.htUISelectCaption::after,
.htAutocompleteArrow::after {
  ${icon(icons, "selectArrow")}
}

${prefix}.columnSorting.sortAction.ascending::before {
  ${icon(icons, "arrowNarrowUp")}
}

${prefix}.columnSorting.sortAction.descending::before {
  ${icon(icons, "arrowNarrowDown")}
}

${prefix}.ht-page-navigation-section .ht-page-first::before {
  ${icon(icons, "arrowLeftWithBar")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-first::before {
  ${icon(icons, "arrowRightWithBar")}
}

${prefix}.ht-page-navigation-section .ht-page-prev::before {
  ${icon(icons, "arrowLeft")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-prev::before {
  ${icon(icons, "arrowRight")}
}

${prefix}.ht-page-navigation-section .ht-page-next::before {
  ${icon(icons, "arrowRight")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-next::before {
  ${icon(icons, "arrowLeft")}
}

${prefix}.ht-page-navigation-section .ht-page-last::before {
  ${icon(icons, "arrowRightWithBar")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-last::before {
  ${icon(icons, "arrowLeftWithBar")}
}

${prefix}.htDropdownMenu table tbody tr td .htItemWrapper span.selected::after,
${prefix}.htContextMenu table tbody tr td .htItemWrapper span.selected::after,
${prefix}.htFiltersConditionsMenu table tbody tr td .htItemWrapper span.selected::after {
  ${icon(icons, "check")}
}

${prefix}.htCheckboxRendererInput {
  appearance: none;
}

${prefix}.htCheckboxRendererInput::after {
  ${icon(icons, "checkbox")}
}

${prefix}th.beforeHiddenColumn::after {
  ${icon(icons, "caretHiddenLeft")}
}

${prefix}th.afterHiddenColumn::before {
  ${icon(icons, "caretHiddenRight")}
}

${prefix}th.beforeHiddenRow::after {
  ${icon(icons, "caretHiddenUp")}
}

${prefix}th.afterHiddenRow::before {
  ${icon(icons, "caretHiddenDown")}
}

${prefix}.collapsibleIndicator::before,
${prefix}.ht_nestingButton::before {
  ${icon(icons, "collapseOff")}
}

${prefix}.collapsibleIndicator.collapsed::before,
${prefix}.ht_nestingButton.ht_nestingExpand::before {
  ${icon(icons, "collapseOn")}
}

${prefix}.htUIRadio > input[type="radio"]::after {
  ${icon(icons, "radio")}
}`;
};
exports.iconsMap = iconsMap;
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
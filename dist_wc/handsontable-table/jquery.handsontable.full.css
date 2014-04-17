/**
 * Handsontable 0.10.5
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: Mon Mar 31 2014 14:19:47 GMT+0200 (CEST)
 */

.handsontable {
  position: relative;
}

.handsontable.htAutoColumnSize {
  visibility: hidden;
  left: 0;
  position: absolute;
  top: 0;
}

.handsontable table,
.handsontable tbody,
.handsontable thead,
.handsontable td,
.handsontable th,
.handsontable div {
  box-sizing: content-box;
  -webkit-box-sizing: content-box;
  -moz-box-sizing: content-box;
}

.handsontable table.htCore {
  border-collapse: separate;
  /*it must be separate, otherwise there are offset miscalculations in WebKit: http://stackoverflow.com/questions/2655987/border-collapse-differences-in-ff-and-webkit*/
  position: relative;
  /*this actually only changes appearance of user selection - does not make text unselectable
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  -ms-user-select: none;
  /*user-select: none; /*no browser supports unprefixed version*/
  border-spacing: 0;
  margin: 0;
  border-width: 0;
  table-layout: fixed;
  width: 0;
  outline-width: 0;
  /* reset bootstrap table style. for more info see: https://github.com/warpech/jquery-handsontable/issues/224 */
  max-width: none;
  max-height: none;
}

.handsontable col {
  width: 50px;
}

.handsontable col.rowHeader {
  width: 50px;
}

.handsontable th,
.handsontable td {
  border-right: 1px solid #CCC;
  border-bottom: 1px solid #CCC;
  height: 22px;
  empty-cells: show;
  line-height: 21px;
  padding: 0 4px 0 4px;
  /* top, bottom padding different than 0 is handled poorly by FF with HTML5 doctype */
  background-color: #FFF;
  vertical-align: top;
  overflow: hidden;
  outline-width: 0;
  white-space: pre-line;
  /* preserve new line character in cell */
}

.handsontable td.htInvalid {
  -webkit-transition: background 0.75s ease;
  transition: background 0.75s ease;
  background-color: #ff4c42;
}

.handsontable th:last-child {
  /*Foundation framework fix*/
  border-right: 1px solid #CCC;
  border-bottom: 1px solid #CCC;
}

.handsontable tr:first-child th.htNoFrame,
.handsontable th:first-child.htNoFrame,
.handsontable th.htNoFrame {
  border-left-width: 0;
  background-color: white;
  border-color: #FFF;
}

.handsontable th:first-child,
.handsontable td:first-child,
.handsontable .htNoFrame + th,
.handsontable .htNoFrame + td {
  border-left: 1px solid #CCC;
}

.handsontable tr:first-child th,
.handsontable tr:first-child td {
  border-top: 1px solid #CCC;
}

.handsontable thead tr:last-child th {
  border-bottom-width: 0;
}

.handsontable thead tr.lastChild th {
  border-bottom-width: 0;
}

.handsontable th {
  background-color: #EEE;
  color: #222;
  text-align: center;
  font-weight: normal;
  white-space: nowrap;
}

.handsontable thead th {
  padding: 0;
}

.handsontable th.active {
  background-color: #CCC;
}

.handsontable thead th .relative {
  position: relative;
  padding: 2px 4px;
}

/* plugins */

.handsontable .manualColumnMover {
  position: absolute;
  left: 0;
  top: 0;
  background-color: transparent;
  width: 5px;
  height: 25px;
  z-index: 999;
  cursor: move;
}

.handsontable th .manualColumnMover:hover,
.handsontable th .manualColumnMover.active {
  background-color: #88F;
}

.handsontable .manualColumnResizer {
  position: absolute;
  top: 0;
  cursor: col-resize;
}

.handsontable .manualColumnResizerHandle {
  background-color: transparent;
  width: 5px;
  height: 25px;
}

.handsontable .manualColumnResizer:hover .manualColumnResizerHandle,
.handsontable .manualColumnResizer.active .manualColumnResizerHandle {
  background-color: #AAB;
}

.handsontable .manualColumnResizerLine {
  position: absolute;
  right: 0;
  top: 0;
  background-color: #AAB;
  display: none;
  width: 0;
  border-right: 1px dashed #777;
}

.handsontable .manualColumnResizer.active .manualColumnResizerLine {
  display: block;
}

.handsontable .columnSorting:hover {
  text-decoration: underline;
  cursor: pointer;
}

/* border line */

.handsontable .wtBorder {
  position: absolute;
  font-size: 0;
}

.handsontable td.area {
  background-color: #EEF4FF;
}

/* fill handle */

.handsontable .wtBorder.corner {
  font-size: 0;
  cursor: crosshair;
}

.handsontable .htBorder.htFillBorder {
  background: red;
  width: 1px;
  height: 1px;
}

.handsontableInput {
  border: 2px solid #5292F7;
  outline-width: 0;
  margin: 0;
  padding: 1px 4px 0 2px;
  font-family: Arial, Helvetica, sans-serif;
  /*repeat from .handsontable (inherit doesn't work with IE<8) */
  line-height: 1.3em;
  /*repeat from .handsontable (inherit doesn't work with IE<8) */
  font-size: inherit;
  -webkit-box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.4);
  box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.4);
  resize: none;
  /*below are needed to overwrite stuff added by jQuery UI Bootstrap theme*/
  display: inline-block;
  color: #000;
  border-radius: 0;
  background-color: #FFF;
  /*overwrite styles potentionally made by a framework*/
}

.handsontableInputHolder {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
}

.htSelectEditor {
  -webkit-appearance: menulist-button !important;
  position: absolute;
}

/*
TextRenderer readOnly cell
*/

.handsontable .htDimmed {
  color: #777;
}

/*
TextRenderer placeholder value
*/

.handsontable .htPlaceholder {
  color: #999;
}

/*
AutocompleteRenderer down arrow
*/

.handsontable .htAutocompleteArrow {
  float: right;
  font-size: 10px;
  color: #EEE;
  cursor: default;
  width: 16px;
  text-align: center;
}

.handsontable td .htAutocompleteArrow:hover {
  color: #777;
}

/*
CheckboxRenderer
*/

.handsontable .htCheckboxRendererInput.noValue {
  opacity: 0.5;
}

/*
NumericRenderer
*/

.handsontable .htNumeric {
  text-align: right;
}

/*context menu rules*/

ul.context-menu-list {
  color: black;
}

ul.context-menu-list li {
  margin-bottom: 0;
  /*Foundation framework fix*/
}

/**
 * dragdealer
 */

.handsontable .dragdealer {
  position: relative;
  width: 9px;
  height: 9px;
  background: #F8F8F8;
  border: 1px solid #DDD;
}

.handsontable .dragdealer .handle {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #C5C5C5;
}

.handsontable .dragdealer .disabled {
  background: #898989;
}

/**
 * Handsontable in Handsontable
 */

.handsontable .handsontable .wtHider {
  padding: 0 0 5px 0;
}

.handsontable .handsontable table {
  -webkit-box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.4);
  box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.4);
}

/**
 * Handsontable listbox theme
 */

.handsontable.listbox {
  margin: 0;
}

.handsontable.listbox table {
  border: 1px solid #ccc;
  border-collapse: separate;
  background: white;
}

.handsontable.listbox th,
.handsontable.listbox tr:first-child th,
.handsontable.listbox tr:last-child th,
.handsontable.listbox tr:first-child td,
.handsontable.listbox td {
  border-width: 0;
}

.handsontable.listbox th,
.handsontable.listbox td {
  white-space: nowrap;
  text-overflow: ellipsis;
}

.handsontable.listbox td.htDimmed {
  cursor: default;
  color: inherit;
  font-style: inherit;
}

.handsontable.listbox .wtBorder {
  visibility: hidden;
}

.handsontable.listbox tr td.current,
.handsontable.listbox tr:hover td {
  background: #eee;
}

.htContextMenu {
  display: none;
  position: absolute;
}

.htContextMenu table.htCore {
  outline: 1px solid #bbb;
}

.htContextMenu .wtBorder {
  visibility: hidden;
}

.htContextMenu table tbody tr td {
  background: white;
  border-width: 0;
  padding: 4px 6px 0px 6px;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.htContextMenu table tbody tr td:first-child {
  border: 0;
}

.htContextMenu table tbody tr td.htDimmed{
  font-style: normal;
  color: #323232;
}

.htContextMenu table tbody tr td.current{
  background: rgb(233, 233, 233);
}

.htContextMenu table tbody tr td.htSeparator {
  border-top: 1px solid #bbb;
  height: 0;
  padding: 0;
}

.htContextMenu table tbody tr td.htDisabled {
  color: #999;
}

.htContextMenu table tbody tr td.htDisabled:hover {
  background: white;
  color: #999;
  cursor: default;
}

.handsontable td.htSearchResult {
  background: #fcedd9;
  color: #583707;
}

/*WalkontableDebugOverlay*/

.wtDebugHidden {
  display: none;
}

.wtDebugVisible {
  display: block;
  -webkit-animation-duration: 0.5s;
  -webkit-animation-name: wtFadeInFromNone;
  animation-duration: 0.5s;
  animation-name: wtFadeInFromNone;
}

@keyframes wtFadeInFromNone {
  0% {
    display: none;
    opacity: 0;
  }

  1% {
    display: block;
    opacity: 0;
  }

  100% {
    display: block;
    opacity: 1;
  }
}

@-webkit-keyframes wtFadeInFromNone {
  0% {
    display: none;
    opacity: 0;
  }

  1% {
    display: block;
    opacity: 0;
  }

  100% {
    display: block;
    opacity: 1;
  }
}
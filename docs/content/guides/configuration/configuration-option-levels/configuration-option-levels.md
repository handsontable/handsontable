---
type: reference
title: Option levels
metaTitle: Option levels - JavaScript Data Grid | Handsontable
description: Check which configuration options take effect at the grid, column, and cell level, and search the full matrix of every built-in option.
permalink: /configuration-option-levels
canonicalUrl: /configuration-option-levels
tags:
  - options
  - cascading
  - levels
  - matrix
react:
  metaTitle: Option levels - React Data Grid | Handsontable
angular:
  metaTitle: Option levels - Angular Data Grid | Handsontable
vue:
  metaTitle: Option levels - Vue Data Grid | Handsontable
searchCategory: Guides
category: Configuration
menuTag: new
---

Check which configuration options take effect at the grid, column, and cell level.

[[toc]]

## Overview

You can write any option at any level. Handsontable resolves configuration through a prototype
chain, so putting an option inside [`columns`](@/api/options.md#columns) never throws an error.

Whether the option *does* anything is a different question. Each option is read at one specific
level, and that read decides where the option takes effect:

- An option read from the grid settings ignores column and cell values.
- An option read from a column ignores cell values.
- An option read from a cell responds to every level.

The matrix below answers that for every built-in option, so you don't have to guess.

::: tip

This page tells you **where** each option takes effect. For **how** to set options at each level,
including the syntax for your framework, see
[Setting options](@/guides/configuration/configuration-options/configuration-options.md).

:::

## How to read the matrix

Each option lists the levels it takes effect at:

| Level | Set it with |
| ----- | ----------- |
| Grid | The top-level settings object |
| `columns` | The [`columns`](@/api/options.md#columns) option |
| `cells` | The [`cells`](@/api/options.md#cells) function |
| `cell` | The [`cell`](@/api/options.md#cell) option |

Two facts explain most of the matrix:

- **There is no row level.** Handsontable has no `rows` option and no row-level layer. You
  configure a row through the [`cells`](@/api/options.md#cells) function, matching on the row
  coordinate - see
  [Set row options](@/guides/configuration/configuration-options/configuration-options.md#set-row-options).
- **Plugin options are grid level.** Every plugin reads its own setting from the grid settings, so
  you cannot switch a plugin on for one column or one cell. Some plugins still read per-cell
  options once they are on - [`comments`](@/api/options.md#comments) is turned on for the grid,
  then a comment is attached to a single cell. A few plugins go further and let you override
  their sub-options per column, which is why
  [`columnSorting`](@/api/options.md#columnsorting) and
  [`multiColumnSorting`](@/api/options.md#multicolumnsorting) are marked for `columns` too. You
  still turn them on for the whole grid; check the Notes column before assuming a plugin can be
  enabled per column.

## Options matrix

Search for an option by name, or filter the list down to a single level.

<div class="option-levels-controls" data-option-levels-controls>
  <label class="option-levels-search">
    <span class="option-levels-search__label">Search options</span>
    <input type="search" data-option-levels-search placeholder="For example: readOnly" autocomplete="off">
  </label>
  <fieldset class="option-levels-filters">
    <legend>Can be set at</legend>
    <label><input type="checkbox" data-option-levels-filter="grid"> Grid</label>
    <label><input type="checkbox" data-option-levels-filter="columns"> <code>columns</code></label>
    <label><input type="checkbox" data-option-levels-filter="cells"> <code>cells</code></label>
    <label><input type="checkbox" data-option-levels-filter="cell"> <code>cell</code></label>
  </fieldset>
  <p class="option-levels-status" data-option-levels-status aria-live="polite"></p>
</div>

<!-- option-levels:start -->

<div class="option-levels" data-option-levels>

| Option | Grid | `columns` | `cells` | `cell` | Category | Notes |
| ------ | :--: | :-------: | :-----: | :----: | -------- | ----- |
| <span data-option="activeHeaderClassName" data-levels="grid"></span>[`activeHeaderClassName`](@/api/options.md#activeheaderclassname) | Yes | No | No | No | Core |  |
| <span data-option="allowEmpty" data-levels="grid columns cells cell"></span>[`allowEmpty`](@/api/options.md#allowempty) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="allowHtml" data-levels="grid columns cells cell"></span>[`allowHtml`](@/api/options.md#allowhtml) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="allowInsertColumn" data-levels="grid"></span>[`allowInsertColumn`](@/api/options.md#allowinsertcolumn) | Yes | No | No | No | Core |  |
| <span data-option="allowInsertRow" data-levels="grid"></span>[`allowInsertRow`](@/api/options.md#allowinsertrow) | Yes | No | No | No | Core |  |
| <span data-option="allowInvalid" data-levels="grid columns cells cell"></span>[`allowInvalid`](@/api/options.md#allowinvalid) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="allowRemoveColumn" data-levels="grid"></span>[`allowRemoveColumn`](@/api/options.md#allowremovecolumn) | Yes | No | No | No | Core |  |
| <span data-option="allowRemoveRow" data-levels="grid"></span>[`allowRemoveRow`](@/api/options.md#allowremoverow) | Yes | No | No | No | Core |  |
| <span data-option="ariaTags" data-levels="grid"></span>[`ariaTags`](@/api/options.md#ariatags) | Yes | No | No | No | Core | The switch is grid level. A per-cell value only changes that cell's ARIA attributes. |
| <span data-option="autoColumnSize" data-levels="grid"></span>[`autoColumnSize`](@/api/options.md#autocolumnsize) | Yes | No | No | No | AutoColumnSize |  |
| <span data-option="autoRowHeaderSize" data-levels="grid"></span>[`autoRowHeaderSize`](@/api/options.md#autorowheadersize) | Yes | No | No | No | AutoRowHeaderSize |  |
| <span data-option="autoRowSize" data-levels="grid"></span>[`autoRowSize`](@/api/options.md#autorowsize) | Yes | No | No | No | AutoRowSize |  |
| <span data-option="autoWrapCol" data-levels="grid"></span>[`autoWrapCol`](@/api/options.md#autowrapcol) | Yes | No | No | No | Core |  |
| <span data-option="autoWrapRow" data-levels="grid"></span>[`autoWrapRow`](@/api/options.md#autowraprow) | Yes | No | No | No | Core |  |
| <span data-option="bindRowsWithHeaders" data-levels="grid"></span>[`bindRowsWithHeaders`](@/api/options.md#bindrowswithheaders) | Yes | No | No | No | BindRowsWithHeaders |  |
| <span data-option="cell" data-levels="grid"></span>[`cell`](@/api/options.md#cell) | Yes | No | No | No | Core |  |
| <span data-option="cells" data-levels="grid"></span>[`cells`](@/api/options.md#cells) | Yes | No | No | No | Core | A grid-level function that is called for every cell. |
| <span data-option="checkedTemplate" data-levels="grid columns cells cell"></span>[`checkedTemplate`](@/api/options.md#checkedtemplate) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="className" data-levels="grid columns cells cell"></span>[`className`](@/api/options.md#classname) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="colHeaders" data-levels="grid"></span>[`colHeaders`](@/api/options.md#colheaders) | Yes | No | No | No | Core |  |
| <span data-option="collapsibleColumns" data-levels="grid"></span>[`collapsibleColumns`](@/api/options.md#collapsiblecolumns) | Yes | No | No | No | CollapsibleColumns |  |
| <span data-option="colorScheme" data-levels="grid"></span>[`colorScheme`](@/api/options.md#colorscheme) | Yes | No | No | No | Core |  |
| <span data-option="columnHeaderHeight" data-levels="grid"></span>[`columnHeaderHeight`](@/api/options.md#columnheaderheight) | Yes | No | No | No | Core |  |
| <span data-option="columns" data-levels="grid"></span>[`columns`](@/api/options.md#columns) | Yes | No | No | No | Core |  |
| <span data-option="columnSorting" data-levels="grid columns"></span>[`columnSorting`](@/api/options.md#columnsorting) | Yes | Yes | No | No | ColumnSorting | Turn the plugin on at the grid level. Inside `columns` you can override its sub-options for one column, such as `indicator` and `headerAction`, but not enable sorting there. Read from the raw `columns` setting, like `title`. |
| <span data-option="columnSummary" data-levels="grid"></span>[`columnSummary`](@/api/options.md#columnsummary) | Yes | No | No | No | ColumnSummary |  |
| <span data-option="colWidths" data-levels="grid"></span>[`colWidths`](@/api/options.md#colwidths) | Yes | No | No | No | Core |  |
| <span data-option="commentedCellClassName" data-levels="grid columns cells cell"></span>[`commentedCellClassName`](@/api/options.md#commentedcellclassname) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="comments" data-levels="grid"></span>[`comments`](@/api/options.md#comments) | Yes | No | No | No | Comments |  |
| <span data-option="contextMenu" data-levels="grid"></span>[`contextMenu`](@/api/options.md#contextmenu) | Yes | No | No | No | ContextMenu |  |
| <span data-option="copyable" data-levels="grid columns cells cell"></span>[`copyable`](@/api/options.md#copyable) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="copyPaste" data-levels="grid"></span>[`copyPaste`](@/api/options.md#copypaste) | Yes | No | No | No | CopyPaste |  |
| <span data-option="currentColClassName" data-levels="grid"></span>[`currentColClassName`](@/api/options.md#currentcolclassname) | Yes | No | No | No | Core |  |
| <span data-option="currentHeaderClassName" data-levels="grid"></span>[`currentHeaderClassName`](@/api/options.md#currentheaderclassname) | Yes | No | No | No | Core |  |
| <span data-option="currentRowClassName" data-levels="grid"></span>[`currentRowClassName`](@/api/options.md#currentrowclassname) | Yes | No | No | No | Core |  |
| <span data-option="customBorders" data-levels="grid"></span>[`customBorders`](@/api/options.md#customborders) | Yes | No | No | No | CustomBorders |  |
| <span data-option="customBordersProgressive" data-levels="grid"></span>[`customBordersProgressive`](@/api/options.md#custombordersprogressive) | Yes | No | No | No | CustomBorders |  |
| <span data-option="data" data-levels="grid columns"></span>[`data`](@/api/options.md#data) | Yes | Yes | No | No | Core | Sets the data set at the grid level and the column's data property inside `columns`. |
| <span data-option="dataDotNotation" data-levels="grid"></span>[`dataDotNotation`](@/api/options.md#datadotnotation) | Yes | No | No | No | Core |  |
| <span data-option="dataProvider" data-levels="grid"></span>[`dataProvider`](@/api/options.md#dataprovider) | Yes | No | No | No | Core |  |
| <span data-option="dataSchema" data-levels="grid"></span>[`dataSchema`](@/api/options.md#dataschema) | Yes | No | No | No | Core |  |
| <span data-option="dateFormat" data-levels="grid columns cells cell"></span>[`dateFormat`](@/api/options.md#dateformat) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="dateTimeFormat" data-levels="grid columns cells cell"></span>[`dateTimeFormat`](@/api/options.md#datetimeformat) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="defaultDate" data-levels="grid columns cells cell"></span>[`defaultDate`](@/api/options.md#defaultdate) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="density" data-levels="grid"></span>[`density`](@/api/options.md#density) | Yes | No | No | No | Core |  |
| <span data-option="dialog" data-levels="grid"></span>[`dialog`](@/api/options.md#dialog) | Yes | No | No | No | Dialog |  |
| <span data-option="disableVisualSelection" data-levels="grid columns cells cell"></span>[`disableVisualSelection`](@/api/options.md#disablevisualselection) | Yes | Yes | Yes | Yes | Core | Row and column headers read the grid-level value only, and so does the check that gates dragging a selection with `moveCells`. |
| <span data-option="dragToScroll" data-levels="grid"></span>[`dragToScroll`](@/api/options.md#dragtoscroll) | Yes | No | No | No | DragToScroll |  |
| <span data-option="dropdownMenu" data-levels="grid"></span>[`dropdownMenu`](@/api/options.md#dropdownmenu) | Yes | No | No | No | DropdownMenu |  |
| <span data-option="editor" data-levels="grid columns cells cell"></span>[`editor`](@/api/options.md#editor) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="emptyDataState" data-levels="grid"></span>[`emptyDataState`](@/api/options.md#emptydatastate) | Yes | No | No | No | EmptyDataState |  |
| <span data-option="enterBeginsEditing" data-levels="grid"></span>[`enterBeginsEditing`](@/api/options.md#enterbeginsediting) | Yes | No | No | No | Core |  |
| <span data-option="enterCommits" data-levels="grid columns cells cell"></span>[`enterCommits`](@/api/options.md#entercommits) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="enterMoves" data-levels="grid"></span>[`enterMoves`](@/api/options.md#entermoves) | Yes | No | No | No | Core |  |
| <span data-option="exportFile" data-levels="grid"></span>[`exportFile`](@/api/options.md#exportfile) | Yes | No | No | No | ExportFile |  |
| <span data-option="fillHandle" data-levels="grid"></span>[`fillHandle`](@/api/options.md#fillhandle) | Yes | No | No | No | Core |  |
| <span data-option="filter" data-levels="grid columns cells cell"></span>[`filter`](@/api/options.md#filter) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="filteringCaseSensitive" data-levels="grid columns cells cell"></span>[`filteringCaseSensitive`](@/api/options.md#filteringcasesensitive) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="filters" data-levels="grid"></span>[`filters`](@/api/options.md#filters) | Yes | No | No | No | Filters |  |
| <span data-option="filterSelectedItems" data-levels="grid columns cells cell"></span>[`filterSelectedItems`](@/api/options.md#filterselecteditems) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="fixedColumnsLeft" data-levels="grid"></span>[`fixedColumnsLeft`](@/api/options.md#fixedcolumnsleft) | Yes | No | No | No | Core |  |
| <span data-option="fixedColumnsStart" data-levels="grid"></span>[`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) | Yes | No | No | No | Core |  |
| <span data-option="fixedRowsBottom" data-levels="grid"></span>[`fixedRowsBottom`](@/api/options.md#fixedrowsbottom) | Yes | No | No | No | Core |  |
| <span data-option="fixedRowsTop" data-levels="grid"></span>[`fixedRowsTop`](@/api/options.md#fixedrowstop) | Yes | No | No | No | Core |  |
| <span data-option="formulas" data-levels="grid"></span>[`formulas`](@/api/options.md#formulas) | Yes | No | No | No | Formulas |  |
| <span data-option="fragmentSelection" data-levels="grid"></span>[`fragmentSelection`](@/api/options.md#fragmentselection) | Yes | No | No | No | Core |  |
| <span data-option="hashLength" data-levels="grid columns cells cell"></span>[`hashLength`](@/api/options.md#hashlength) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="hashRevealDelay" data-levels="grid columns cells cell"></span>[`hashRevealDelay`](@/api/options.md#hashrevealdelay) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="hashSymbol" data-levels="grid columns cells cell"></span>[`hashSymbol`](@/api/options.md#hashsymbol) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="headerClassName" data-levels="grid columns"></span>[`headerClassName`](@/api/options.md#headerclassname) | Yes | Yes | No | No | Core | Applies to column headers, so it stops at the column level. |
| <span data-option="height" data-levels="grid"></span>[`height`](@/api/options.md#height) | Yes | No | No | No | Core |  |
| <span data-option="hiddenColumns" data-levels="grid"></span>[`hiddenColumns`](@/api/options.md#hiddencolumns) | Yes | No | No | No | HiddenColumns |  |
| <span data-option="hiddenRows" data-levels="grid"></span>[`hiddenRows`](@/api/options.md#hiddenrows) | Yes | No | No | No | HiddenRows |  |
| <span data-option="imeFastEdit" data-levels="grid"></span>[`imeFastEdit`](@/api/options.md#imefastedit) | Yes | No | No | No | Core |  |
| <span data-option="initialState" data-levels="grid"></span>[`initialState`](@/api/options.md#initialstate) | Yes | No | No | No | Core |  |
| <span data-option="injectCoreCss" data-levels="grid"></span>[`injectCoreCss`](@/api/options.md#injectcorecss) | Yes | No | No | No | Core |  |
| <span data-option="invalidCellClassName" data-levels="grid columns cells cell"></span>[`invalidCellClassName`](@/api/options.md#invalidcellclassname) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="isEmptyCol" data-levels="grid"></span>[`isEmptyCol`](@/api/options.md#isemptycol) | Yes | No | No | No | Core |  |
| <span data-option="isEmptyRow" data-levels="grid"></span>[`isEmptyRow`](@/api/options.md#isemptyrow) | Yes | No | No | No | Core |  |
| <span data-option="label" data-levels="grid columns cells cell"></span>[`label`](@/api/options.md#label) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="language" data-levels="grid"></span>[`language`](@/api/options.md#language) | Yes | No | No | No | Core |  |
| <span data-option="layout" data-levels="grid"></span>[`layout`](@/api/options.md#layout) | Yes | No | No | No | Core |  |
| <span data-option="layoutDirection" data-levels="grid"></span>[`layoutDirection`](@/api/options.md#layoutdirection) | Yes | No | No | No | Core |  |
| <span data-option="licenseKey" data-levels="grid"></span>[`licenseKey`](@/api/options.md#licensekey) | Yes | No | No | No | Core |  |
| <span data-option="loading" data-levels="grid"></span>[`loading`](@/api/options.md#loading) | Yes | No | No | No | Loading |  |
| <span data-option="locale" data-levels="grid columns cells cell"></span>[`locale`](@/api/options.md#locale) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="manualColumnFreeze" data-levels="grid"></span>[`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze) | Yes | No | No | No | ManualColumnFreeze |  |
| <span data-option="manualColumnMove" data-levels="grid"></span>[`manualColumnMove`](@/api/options.md#manualcolumnmove) | Yes | No | No | No | ManualColumnMove |  |
| <span data-option="manualColumnResize" data-levels="grid"></span>[`manualColumnResize`](@/api/options.md#manualcolumnresize) | Yes | No | No | No | ManualColumnResize |  |
| <span data-option="manualRowMove" data-levels="grid"></span>[`manualRowMove`](@/api/options.md#manualrowmove) | Yes | No | No | No | ManualRowMove |  |
| <span data-option="manualRowResize" data-levels="grid"></span>[`manualRowResize`](@/api/options.md#manualrowresize) | Yes | No | No | No | ManualRowResize |  |
| <span data-option="maxCols" data-levels="grid"></span>[`maxCols`](@/api/options.md#maxcols) | Yes | No | No | No | Core |  |
| <span data-option="maxRows" data-levels="grid"></span>[`maxRows`](@/api/options.md#maxrows) | Yes | No | No | No | Core |  |
| <span data-option="maxSelections" data-levels="grid columns cells cell"></span>[`maxSelections`](@/api/options.md#maxselections) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="mergeCells" data-levels="grid"></span>[`mergeCells`](@/api/options.md#mergecells) | Yes | No | No | No | MergeCells |  |
| <span data-option="minCols" data-levels="grid"></span>[`minCols`](@/api/options.md#mincols) | Yes | No | No | No | Core |  |
| <span data-option="minRowHeights" data-levels="grid"></span>[`minRowHeights`](@/api/options.md#minrowheights) | Yes | No | No | No | Core |  |
| <span data-option="minRows" data-levels="grid"></span>[`minRows`](@/api/options.md#minrows) | Yes | No | No | No | Core |  |
| <span data-option="minSpareCols" data-levels="grid"></span>[`minSpareCols`](@/api/options.md#minsparecols) | Yes | No | No | No | Core |  |
| <span data-option="minSpareRows" data-levels="grid"></span>[`minSpareRows`](@/api/options.md#minsparerows) | Yes | No | No | No | Core |  |
| <span data-option="moveCells" data-levels="grid"></span>[`moveCells`](@/api/options.md#movecells) | Yes | No | No | No | Core |  |
| <span data-option="multiColumnSorting" data-levels="grid columns"></span>[`multiColumnSorting`](@/api/options.md#multicolumnsorting) | Yes | Yes | No | No | MultiColumnSorting | Turn the plugin on at the grid level. Inside `columns` you can override its sub-options for one column, such as `indicator` and `headerAction`, but not enable sorting there. Read from the raw `columns` setting, like `title`. |
| <span data-option="navigableHeaders" data-levels="grid"></span>[`navigableHeaders`](@/api/options.md#navigableheaders) | Yes | No | No | No | Core |  |
| <span data-option="nestedHeaders" data-levels="grid"></span>[`nestedHeaders`](@/api/options.md#nestedheaders) | Yes | No | No | No | NestedHeaders |  |
| <span data-option="nestedRows" data-levels="grid"></span>[`nestedRows`](@/api/options.md#nestedrows) | Yes | No | No | No | NestedRows |  |
| <span data-option="notification" data-levels="grid"></span>[`notification`](@/api/options.md#notification) | Yes | No | No | No | Notification |  |
| <span data-option="noWordWrapClassName" data-levels="grid columns cells cell"></span>[`noWordWrapClassName`](@/api/options.md#nowordwrapclassname) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="numericFormat" data-levels="grid columns cells cell"></span>[`numericFormat`](@/api/options.md#numericformat) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="observeDOMVisibility" data-levels="grid"></span>[`observeDOMVisibility`](@/api/options.md#observedomvisibility) | Yes | No | No | No | Core |  |
| <span data-option="outsideClickDeselects" data-levels="grid"></span>[`outsideClickDeselects`](@/api/options.md#outsideclickdeselects) | Yes | No | No | No | Core |  |
| <span data-option="pagination" data-levels="grid"></span>[`pagination`](@/api/options.md#pagination) | Yes | No | No | No | Pagination |  |
| <span data-option="parsePastedValue" data-levels="grid columns cells cell"></span>[`parsePastedValue`](@/api/options.md#parsepastedvalue) | Yes | Yes | Yes | Yes | CopyPaste |  |
| <span data-option="placeholder" data-levels="grid columns cells cell"></span>[`placeholder`](@/api/options.md#placeholder) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="placeholderCellClassName" data-levels="grid columns cells cell"></span>[`placeholderCellClassName`](@/api/options.md#placeholdercellclassname) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="preserveNumericLiteral" data-levels="grid columns cells cell"></span>[`preserveNumericLiteral`](@/api/options.md#preservenumericliteral) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="preserveTextValue" data-levels="grid columns cells cell"></span>[`preserveTextValue`](@/api/options.md#preservetextvalue) | Yes | Yes | Yes | Yes | Formulas |  |
| <span data-option="preventOverflow" data-levels="grid"></span>[`preventOverflow`](@/api/options.md#preventoverflow) | Yes | No | No | No | Core |  |
| <span data-option="readOnly" data-levels="grid columns cells cell"></span>[`readOnly`](@/api/options.md#readonly) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="readOnlyCellClassName" data-levels="grid columns cells cell"></span>[`readOnlyCellClassName`](@/api/options.md#readonlycellclassname) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="renderAllColumns" data-levels="grid"></span>[`renderAllColumns`](@/api/options.md#renderallcolumns) | Yes | No | No | No | Core |  |
| <span data-option="renderAllRows" data-levels="grid"></span>[`renderAllRows`](@/api/options.md#renderallrows) | Yes | No | No | No | Core |  |
| <span data-option="renderer" data-levels="grid columns cells cell"></span>[`renderer`](@/api/options.md#renderer) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="rowHeaders" data-levels="grid"></span>[`rowHeaders`](@/api/options.md#rowheaders) | Yes | No | No | No | Core |  |
| <span data-option="rowHeaderWidth" data-levels="grid"></span>[`rowHeaderWidth`](@/api/options.md#rowheaderwidth) | Yes | No | No | No | Core |  |
| <span data-option="rowHeights" data-levels="grid"></span>[`rowHeights`](@/api/options.md#rowheights) | Yes | No | No | No | Core |  |
| <span data-option="sanitizer" data-levels="grid"></span>[`sanitizer`](@/api/options.md#sanitizer) | Yes | No | No | No | Core |  |
| <span data-option="search" data-levels="grid columns cells cell"></span>[`search`](@/api/options.md#search) | Yes | Yes | Yes | Yes | Search | The plugin toggle is grid level. `queryMethod` and `callback` resolve per cell. |
| <span data-option="searchInput" data-levels="grid columns cells cell"></span>[`searchInput`](@/api/options.md#searchinput) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="selectionHandles" data-levels="grid"></span>[`selectionHandles`](@/api/options.md#selectionhandles) | Yes | No | No | No | Core |  |
| <span data-option="selectionMode" data-levels="grid"></span>[`selectionMode`](@/api/options.md#selectionmode) | Yes | No | No | No | Core |  |
| <span data-option="selectOptions" data-levels="grid columns cells cell"></span>[`selectOptions`](@/api/options.md#selectoptions) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="skipColumnOnPaste" data-levels="grid columns cells cell"></span>[`skipColumnOnPaste`](@/api/options.md#skipcolumnonpaste) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="skipRowOnPaste" data-levels="grid columns cells cell"></span>[`skipRowOnPaste`](@/api/options.md#skiprowonpaste) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="sortByRelevance" data-levels="grid columns cells cell"></span>[`sortByRelevance`](@/api/options.md#sortbyrelevance) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="source" data-levels="grid columns cells cell"></span>[`source`](@/api/options.md#source) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="sourceDataValidator" data-levels="grid columns cells cell"></span>[`sourceDataValidator`](@/api/options.md#sourcedatavalidator) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="sourceDataWarningMessage" data-levels="grid columns cells cell"></span>[`sourceDataWarningMessage`](@/api/options.md#sourcedatawarningmessage) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="sourceSortFunction" data-levels="grid columns cells cell"></span>[`sourceSortFunction`](@/api/options.md#sourcesortfunction) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="startCols" data-levels="grid"></span>[`startCols`](@/api/options.md#startcols) | Yes | No | No | No | Core |  |
| <span data-option="startRows" data-levels="grid"></span>[`startRows`](@/api/options.md#startrows) | Yes | No | No | No | Core |  |
| <span data-option="stretchH" data-levels="grid"></span>[`stretchH`](@/api/options.md#stretchh) | Yes | No | No | No | Core |  |
| <span data-option="strict" data-levels="grid columns cells cell"></span>[`strict`](@/api/options.md#strict) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="tableClassName" data-levels="grid"></span>[`tableClassName`](@/api/options.md#tableclassname) | Yes | No | No | No | Core |  |
| <span data-option="tabMoves" data-levels="grid"></span>[`tabMoves`](@/api/options.md#tabmoves) | Yes | No | No | No | Core |  |
| <span data-option="tabNavigation" data-levels="grid"></span>[`tabNavigation`](@/api/options.md#tabnavigation) | Yes | No | No | No | Core |  |
| <span data-option="textEllipsis" data-levels="grid columns cells cell"></span>[`textEllipsis`](@/api/options.md#textellipsis) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="textExtractor" data-levels="grid"></span>[`textExtractor`](@/api/options.md#textextractor) | Yes | No | No | No | Core |  |
| <span data-option="theme" data-levels="grid"></span>[`theme`](@/api/options.md#theme) | Yes | No | No | No | Core |  |
| <span data-option="themeName" data-levels="grid"></span>[`themeName`](@/api/options.md#themename) | Yes | No | No | No | Core |  |
| <span data-option="timeFormat" data-levels="grid columns cells cell"></span>[`timeFormat`](@/api/options.md#timeformat) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="title" data-levels="columns"></span>[`title`](@/api/options.md#title) | No | Yes | No | No | Core | Read from the raw `columns` setting rather than the meta chain, so a `cells` function cannot set it. |
| <span data-option="trimDropdown" data-levels="grid columns cells cell"></span>[`trimDropdown`](@/api/options.md#trimdropdown) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="trimRows" data-levels="grid"></span>[`trimRows`](@/api/options.md#trimrows) | Yes | No | No | No | TrimRows |  |
| <span data-option="trimWhitespace" data-levels="grid columns cells cell"></span>[`trimWhitespace`](@/api/options.md#trimwhitespace) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="type" data-levels="grid columns cells cell"></span>[`type`](@/api/options.md#type) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="uncheckedTemplate" data-levels="grid columns cells cell"></span>[`uncheckedTemplate`](@/api/options.md#uncheckedtemplate) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="undo" data-levels="grid"></span>[`undo`](@/api/options.md#undo) | Yes | No | No | No | UndoRedo |  |
| <span data-option="validator" data-levels="grid columns cells cell"></span>[`validator`](@/api/options.md#validator) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="valueFormatter" data-levels="grid columns cells cell"></span>[`valueFormatter`](@/api/options.md#valueformatter) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="valueGetter" data-levels="grid columns cells cell"></span>[`valueGetter`](@/api/options.md#valuegetter) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="valueParser" data-levels="grid columns cells cell"></span>[`valueParser`](@/api/options.md#valueparser) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="valueSetter" data-levels="grid columns cells cell"></span>[`valueSetter`](@/api/options.md#valuesetter) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="viewportColumnRenderingOffset" data-levels="grid"></span>[`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset) | Yes | No | No | No | Core |  |
| <span data-option="viewportColumnRenderingThreshold" data-levels="grid"></span>[`viewportColumnRenderingThreshold`](@/api/options.md#viewportcolumnrenderingthreshold) | Yes | No | No | No | Core |  |
| <span data-option="viewportRowRenderingOffset" data-levels="grid"></span>[`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset) | Yes | No | No | No | Core |  |
| <span data-option="viewportRowRenderingThreshold" data-levels="grid"></span>[`viewportRowRenderingThreshold`](@/api/options.md#viewportrowrenderingthreshold) | Yes | No | No | No | Core |  |
| <span data-option="visibleRows" data-levels="grid columns cells cell"></span>[`visibleRows`](@/api/options.md#visiblerows) | Yes | Yes | Yes | Yes | Core |  |
| <span data-option="width" data-levels="grid columns cells cell"></span>[`width`](@/api/options.md#width) | Yes | Yes | Yes | Yes | Core | Sets the grid width at the grid level and the column width inside `columns`. Only row 0 is read, so a `cells` or `cell` value must target row 0. |
| <span data-option="wordWrap" data-levels="grid columns cells cell"></span>[`wordWrap`](@/api/options.md#wordwrap) | Yes | Yes | Yes | Yes | Core |  |

</div>

<!-- option-levels:end -->

## Options that change meaning by level

Two options mean different things depending on where you set them. Handsontable clears them on
the column layer on purpose, so the grid value never leaks into a column.

| Option | At the grid level | Inside `columns` |
| ------ | ----------------- | ---------------- |
| [`width`](@/api/options.md#width) | The width of the whole grid | The width of that column |
| [`data`](@/api/options.md#data) | The grid's data set | The property that feeds that column |

[`width`](@/api/options.md#width) has one more catch. Handsontable reads the column width from
row 0 only. So a [`cells`](@/api/options.md#cells) function changes a column's width only when it
returns `width` for row 0, and a [`cell`](@/api/options.md#cell) entry has to name row 0.

## Options that behave differently per level

For these options a single mark would mislead you:

- [`ariaTags`](@/api/options.md#ariatags) - the switch is grid level. A per-cell value only
  changes that cell's ARIA attributes.
- [`search`](@/api/options.md#search) - the plugin toggle is grid level, but `queryMethod` and
  `callback` resolve per cell.
- [`disableVisualSelection`](@/api/options.md#disablevisualselection) - cells respond to every
  level, but row and column headers read the grid-level value only.

## Related

<div class="boxes-list">

- [Setting options](@/guides/configuration/configuration-options/configuration-options.md)
- [Options API reference](@/api/options.md)
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)

</div>

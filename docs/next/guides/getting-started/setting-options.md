---
title: Setting options
metaTitle: Setting options - Guide - Handsontable Documentation
permalink: /next/setting-options
canonicalUrl: /setting-options
tags:
  - properties
  - config
---

# Setting options

[[toc]]

## Overview

## Available options

Opisać core i plugins i wrzucić linki do reference do obu

Najlepiej jakby to było dostępne też dla wrapperów

## The cascading configuration

### Entire grid

Contructor

### Single cell

Address by row / col order; A1, B2; ID column and row

### Single range of cells

### Multiple ranges of cells

### Single column

Address by col order; or ID

### Single range of columns

### Multiple ranges of columns

### Single row

Address by order or ID (from column 1)

### Single range of rows

### Multiple ranges of rows



## Introduction to cell options

Any constructor or column option may be overwritten for a particular cell (row/column combination), using `cell` array passed to the `Handsontable` constructor.

```js
var hot = new Handsontable(document.getElementById('example'), {
  cell: [
    {row: 0, col: 0, readOnly: true}
  ]
});
```

Alternatively, use cells function property to the `Handsontable` constructor.

```js
var hot = new Handsontable(document.getElementById('example'), {
  cells: function (row, col, prop) {
    var cellProperties = {}
    if (row === 0 && col === 0) {
      cellProperties.readOnly = true;
    }
    return cellProperties;
  }
})
```

## The cascading configuration

Handsontable utilizes cascading configuration, which is a fast way to provide configuration options for the entire grid, along with its columns and particular cells.

Consider the following example:

```js
var hot = new Handsontable(document.getElementById('example'), {
  readOnly: true,
  columns: [
    {readOnly: false},
    {},
    {}
  ],
  cells: function (row, col, prop) {
    var cellProperties = {}
    if (row === 0 && col === 0) {
      cellProperties.readOnly = true;
    }
    return cellProperties;
  }
});
```

The above notation will result in all TDs being read only, except for first column TDs which will be editable, except for the TD in top left corner which will still be read-only.

## The cascading configuration model

The cascading configuration model is based on prototypal inheritance.

### Constructor

Configuration options that are provided using first-level and `updateSettings` method.

```js
new Handsontable(document.getElementById('example'), {
  option: 'value'
});
```
  

### Columns

Configuration options that are provided using second-level object.

```js
new Handsontable(document.getElementById('example'), {
  columns: {
    option: 'value'
  }
});
```

### Cells

Configuration options that are provided using second-level function.

```js
new Handsontable(document.getElementById('example'), {
  cells: function(row, col, prop) {
  }
});
```

## All options

The most up to date list of options is available in the [Options](@/api/options.md) section of the API Reference. The table below is just a cheatsheet that can be useful if you're already familiar with the Handsontable API.

<div class="scrollable-table">

| First-level option | Second-level option | Core / Plugin name 	| Type 	| Default value 	|
|-	|-	|:-:	|:-:	|:-:	|
| activeHeaderClassName 	|  	| Core 	| string 	| "ht__active_highlight" 	|
| allowEmpty 	|  	| Core 	| boolean 	| TRUE 	|
| allowHtml 	|  	| Core 	| boolean 	| FALSE 	|
| allowInsertColumn 	|  	| Core 	| boolean 	| TRUE 	|
| allowInsertRow 	|  	| Core 	| boolean 	| TRUE 	|
| allowInvalid 	|  	| Core 	| boolean 	| TRUE 	|
| allowRemoveColumn 	|  	| Core 	| boolean 	| TRUE 	|
| allowRemoveRow 	|  	| Core 	| boolean 	| TRUE 	|
| autoColumnSize 	|  	| AutoColumnSize 	| object / boolean 	| undefined 	|
|  	| allowSampleDuplicates 	|   	|   	|   	|
|  	| samplingRation 	|   	|   	|   	|
|  	| syncLimit 	|   	|   	|   	|
|  	| userHeaders 	|   	|   	|   	|
| autoRowSize 	|  	| autoRowSize 	| object / boolean 	| undefined 	|
|  	| allowSampleDuplicates 	|   	|   	|   	|
|  	| syncLimit 	|   	|   	|   	|
| autoWrapCol 	|  	| Core 	| boolean 	| TRUE 	|
| autoWrapRow 	|  	| Core 	| boolean 	| TRUE 	|
| bindRowsWithHeaders 	|  	| BindRowsWithHeaders 	| boolean / string 	| undefined 	|
| cell 	|  	| Core 	| Array&lt;Array&gt; 	| 	&#91; 	&#93; 	|
| cells 	|  	| Core 	| function 	| undefined 	|
| checkedTemplate 	|  	| Core 	| boolean / string / number 	| TRUE 	|
| className 	|  	| Core 	| string / Array&lt;string&gt; 	| undefined 	|
| colHeaders 	|  	| Core 	| boolean / Array&lt;string&gt; / function 	| null 	|
| collapsibleColumns 	|  	| CollapsibleColumns 	| boolean / Array&lt;object&gt; 	| undefined 	|
| columnHeaderHeight 	|  	| Core 	| number / Array&lt;number&gt; 	| undefined 	|
| columns 	|  	| Core 	| Array&lt;object&gt; / function 	| undefined 	|
| columnSorting 	|  	| ColumnSorting 	| boolean / object 	| undefined 	|
|  	| compareFunctionFactory 	|   	|   	|   	|
|  	| headerAction 	|   	|   	|   	|
|  	| indicator 	|   	|   	|   	|
|  	| initialConfig 	|   	|   	|   	|
|  	| sortEmptyCells 	|   	|   	|   	|
|  	| sortOrder 	|   	|   	|   	|
| columnSummary 	|  	| ColumnSummary 	| Array&lt;object&gt; / function 	| undefined 	|
|  	| destinationColumn 	|   	|   	|   	|
|  	| destinationRow 	|   	|   	|   	|
|  	| forceNumeric 	|   	|   	|   	|
|  	| readOnly 	|   	|   	|   	|
|  	| reversedRowCoords 	|   	|   	|   	|
|  	| roundFloat 	|   	|   	|   	|
|  	| suppressDataTypeErrors 	|   	|   	|   	|
|  	| type 	|   	|   	|   	|
| colWidths 	|  	| Core 	| number / Array&lt;number&gt; / string / Array&lt;string&gt; /   Array&lt;undefined&gt; / function 	| undefined 	|
| commentedCellClassName 	|  	| Core 	| string 	| "htCommentCell" 	|
| comments 	|  	| Comments 	| boolean / Array&lt;object&gt; 	| FALSE 	|
|  	| displayDelay 	|   	|   	|   	|
|  	| readOnly 	|   	|   	|   	|
|  	| value 	|   	|   	|   	|
| contextMenu 	|  	| ContextMenu 	| boolean / Array&lt;string&gt; / object 	| undefined 	|
|  	| disableSelection 	|   	| boolean 	|   	|
|  	| isCommand 	|   	| boolean 	|   	|
|  	| items 	|   	|   	|   	|
| copyable 	|  	| Core 	| boolean 	| TRUE 	|
| copyPaste 	|  	| CopyPaste 	| object / boolean 	| TRUE 	|
|  	| columnsLimit 	|   	|   	|   	|
|  	| pasteMode 	|   	|   	|   	|
|  	| rowsLimit 	|   	|   	|   	|
|  	| uiContainer 	|   	|   	|   	|
| correctFormat 	|  	| Core 	| boolean 	| FALSE 	|
| currentColClassName 	|  	| Core 	| string 	| undefined 	|
| currentHeaderClassName 	|  	| Core 	| string 	| "ht__highlight" 	|
| currentRowClassName 	|  	| Core 	| string 	| undefined 	|
| customBorders 	|  	| CustomBorders 	| boolean / Array&lt;object&gt; 	| FALSE 	|
| data 	|  	| Core 	| Array&lt;Array&gt; / Array&lt;object&gt; 	| undefined 	|
| dataSchema 	|  	| Core 	| object 	| undefined 	|
| dateFormat 	|  	| Core 	| string 	| "DD/MM/YYYY" 	|
| defaultDate 	|  	| Core 	| string 	| undefined 	|
| disableVisualSelection 	|  	| Core 	| boolean / string / Array&lt;string&gt; 	| FALSE 	|
| dragToScroll 	|  	| DragToScroll 	| boolean 	| TRUE 	|
| dropdownMenu 	|  	| DropdownMenu 	| boolean / object / Array&lt;string&gt; 	| undefined 	|
| editor 	|  	| Core 	| string / function / boolean 	| undefined 	|
| enterBeginsEditing 	|  	| Core 	| boolean 	| TRUE 	|
| enterMoves 	|  	| Core 	| object / function 	| {col: 0, row: 1} 	|
| fillHandle 	|  	| Core 	| boolean / string / object 	| TRUE 	|
| filter 	|  	| Core 	| boolean 	| TRUE 	|
| filteringCaseSensitive 	|  	| Core 	| boolean 	| FALSE 	|
| filters 	|  	| Filters 	| boolean 	| undefined 	|
| fixedColumnsLeft 	|  	| Core 	| number 	| 0 	|
| fixedRowsBottom 	|  	| Core 	| number 	| 0 	|
| fixedRowsTop 	|  	| Core 	| number 	| 0 	|
| formulas 	|  	| Formulas 	| boolean / object 	| undefined 	|
| fragmentSelection 	|  	| Core 	| boolean / string 	| FALSE 	|
| headerTooltips 	|   	| HeaderTooltips 	| boolean / object 	| undefined 	|
| height 	|  	| Core 	| number / string / function 	| undefined 	|
| hiddenColumns 	|  	| HiddenColumns 	| boolean / object 	| undefined 	|
|  	| columns 	|   	|   	|   	|
|  	| copyPasteEnabled 	|   	| boolean 	| TRUE 	|
|  	| indicators 	|   	| boolean 	| FALSE 	|
| hiddenRows 	|  	| HiddenRows 	| boolean / object 	| undefined 	|
|  	| copyPasteEnabled 	|   	| boolean 	| TRUE 	|
|  	| indicators 	|   	| boolean 	| FALSE 	|
|  	| rows 	|   	|   	|   	|
| invalidCellClassName 	|  	| Core 	| string 	| "htInvalid" 	|
| label 	|  	| Core 	| object 	| undefined 	|
| language 	|  	| Core 	| string 	| "en-US" 	|
| licenseKey 	|  	| Core 	| string 	| undefined 	|
| manualColumnFreeze 	|  	| ManualColumnFreeze 	| boolean 	| undefined 	|
| manualColumnMove 	|  	| ManualColumnMove 	| boolean / Array&lt;number&gt; 	| undefined 	|
| manualColumnResize 	|  	| ManualColumnResize 	| boolean / Array&lt;number&gt; 	| undefined 	|
| manualRowMove 	|  	| ManualRowMove 	| boolean / Array&lt;number&gt; 	| undefined 	|
| manualRowResize 	|  	| ManualRowResize 	| boolean / Array&lt;number&gt; 	| undefined 	|
| maxCols 	|  	| Core 	| number 	| Infinity 	|
| maxRows 	|  	| Core 	| number 	| Infinity 	|
| mergeCells 	|  	| MergeCells 	| boolean / Array&lt;object&gt; 	| FALSE 	|
| minCols 	|  	| Core 	| number 	| 0 	|
| minRows 	|  	| Core 	| number 	| 0 	|
| minSpareCols 	|  	| Core 	| number 	| 0 	|
| minSpareRows 	|  	| Core 	| number 	| 0 	|
| multiColumnSorting 	|  	| MultiColumnSorting 	| boolean / object 	| undefined 	|
|  	| compareFunctionFactory 	|   	|   	|   	|
|  	| headerAction 	|   	|   	|   	|
|  	| indicator 	|   	|   	|   	|
|  	| initialConfig 	|   	|   	|   	|
|  	| sortEmptyCells 	|   	|   	|   	|
| nestedHeaders 	|  	| NestedHeaders 	| Array&lt;Array&gt; 	| undefined 	|
| nestedRows 	|  	| NestedRows 	| boolean 	| FALSE 	|
| noWordWrapClassName 	|  	| Core 	| string 	| "htNoWrap" 	|
| numericFormat 	|  	| Core 	| object 	| undefined 	|
| observeChanges 	|  	| ObserveChanges 	| boolean 	| undefined 	|
| observeDOMVisibility 	|  	| Core 	| boolean 	| TRUE 	|
| outsideClickDeselects 	|  	| Core 	| boolean / function 	| TRUE 	|
| persistentState 	|  	| PersistentState 	| boolean 	| FALSE 	|
| placeholder 	|  	| Core 	| string 	| undefined 	|
| placeholderCellClassName 	|  	| Core 	| string 	| "htPlaceholder" 	|
| preventOverflow 	|  	| Core 	| string / boolean 	| "false" 	|
| readOnly 	|  	| Core 	| boolean 	| FALSE 	|
| readOnlyCellClassName 	|  	| Core 	| string 	| "htDimmed" 	|
| renderAllRows 	|  	| Core 	| boolean 	| undefined 	|
| renderer 	|  	| Core 	| string / function 	| undefined 	|
| rowHeaders 	|  	| Core 	| boolean / Array&lt;string&gt; / function 	| undefined 	|
| rowHeaderWidth 	|  	| Core 	| number / Array&lt;number&gt; 	| undefined 	|
| rowHeights 	|  	| Core 	| number / Array&lt;number&gt; / string / Array&lt;string&gt; /   Array&lt;undefined&gt; / function 	| undefined 	|
| search 	|  	| Search 	| boolean 	| FALSE 	|
|  	| callback 	|   	|   	|   	|
|  	| queryMethod 	|   	|   	|   	|
|  	| searchResultClass 	|   	|   	|   	|
| selectionMode 	|  	| Core 	| string 	| "multiple" 	|
| selectOptions 	|  	| Core 	| Array&lt;string&gt; 	| undefined 	|
| skipColumnOnPaste 	|  	| Core 	| boolean 	| FALSE 	|
| skipRowOnPaste 	|  	| Core 	| boolean 	| FALSE 	|
| sortByRelevance 	|  	| Core 	| boolean 	| TRUE 	|
| source 	|  	| Core 	| Array / function 	| undefined 	|
| startCols 	|  	| Core 	| number 	| 5 	|
| startRows 	|  	| Core 	| number 	| 5 	|
| stretchH 	|  	| Core 	| string 	| "none" 	|
| strict 	|  	| Core 	| boolean 	| undefined 	|
| tableClassName 	|  	| Core 	| string / Array&lt;string&gt; 	| undefined 	|
| tabMoves 	|  	| Core 	| object / function 	| {row: 0, col: 1} 	|
| title 	|  	| Core 	| string 	| undefined 	|
| trimDropdown 	|  	| Core 	| boolean 	| TRUE 	|
| trimRows 	|  	| TrimRows 	| boolean / Array&lt;number&gt; 	| undefined 	|
| trimWhitespace 	|  	| Core 	| boolean 	| TRUE 	|
| type 	|  	| Core 	| string 	| "text" 	|
| uncheckedTemplate 	|  	| Core 	| boolean / string / number 	| FALSE 	|
| undo 	|  	| UndoRedo 	| boolean 	| undefined 	|
| validator 	|  	| Core 	| function / RegExp / string 	| undefined 	|
| viewportColumnRenderingOffset 	|  	| Core 	| number / string 	| auto' 	|
| viewportRowRenderingOffset 	|  	| Core 	| number / string 	| auto' 	|
| visibleRows 	|  	| Core 	| number 	| 10 	|
| width 	|  	| Core 	| number / string / function 	| undefined 	|
| wordWrap 	|  	| Core 	| boolean 	| TRUE 	|

</div>

# Handsontable [![Build Status](https://travis-ci.org/warpech/jquery-handsontable.png?branch=master)](https://travis-ci.org/warpech/jquery-handsontable)

Handsontable is a minimalistic approach to Excel-like table editor in HTML & jQuery. Requires jQuery 1.9+ or 2.0+ (may work with 1.7+ too, but there are known issues with [IE10](https://github.com/warpech/jquery-handsontable/issues/410)). 

Runs in IE7, IE8, IE9, IE10, Firefox, Chrome, Safari and Opera.

See the demos at http://handsontable.com/ or fork the example on [JSFiddle](http://jsfiddle.net/warpech/hU6Kz/).

## Usage

First, include all the dependencies. All the files that you need (apart from jQuery) are in the `dist\` directory:

```html
<script src="../lib/jquery.min.js"></script>
<script src="dist/jquery.handsontable.full.js"></script>
<link rel="stylesheet" media="screen" href="dist/jquery.handsontable.full.css">
```

Then, run `handsontable()` constructor on an empty div. After that, load some data if you wish:

```html
<div id="dataTable"></div>
<script>
  var data = [
    ["", "Kia", "Nissan", "Toyota", "Honda"],
    ["2008", 10, 11, 12, 13],
    ["2009", 20, 11, 14, 13],
    ["2010", 30, 15, 12, 13]
  ];
  $("#dataTable").handsontable({
    data: data,
    startRows: 6,
    startCols: 8
  });
</script>
```

## Changelog

To see the list of recent changes, see the [Changelog](https://github.com/warpech/jquery-handsontable/wiki/Changelog) wiki page.

## Questions

Before you open a new [Issue](https://github.com/warpech/jquery-handsontable/issues), please check out the [Frequently Asked Questions](https://github.com/warpech/jquery-handsontable/wiki/FAQ).

## Reporting bugs and feature requests

Please follow this guidelines when reporting bugs and feature requests:

1. Use [GitHub Issues](https://github.com/warpech/jquery-handsontable/issues) board to report bugs and feature requests (not my email address)
2. Please **always** write steps to reporoduce the error. That way I can focus on fixing the bug, not scratching my had how to reproduce it.
3. If possible, please add a JSFiddle link that shows the problem (start by forking [this fiddle](http://jsfiddle.net/warpech/hU6Kz/)). It saves me much time.
4. If you can't reproduce it on JSFiddle, please add a screenshot that shows the problem. JSFiddle is much more appreciated because it lets me start fixing straight away.

Thanks for understanding!

## Pull Requests

Your contributions to the project are very welcome! To help me merge your pull request, please make sure you follow these points:

1. Describe the problem in the Pull Request description (of course you would do it, why do I mention that?)
2. Please make your fix on a separate branch. This makes merging much easier.
3. Do not edit files `jquery.handsontable.js`, `jquery.handsontable.css`, `jquery.handsontable.full.js`, `jquery.handsontable.full.css`. Instead, try to edit files inside the `src/` directory and then use `grunt` to make a build. More information about this on wiki page [Building](https://github.com/warpech/jquery-handsontable/wiki/Building).
4. For any change that you make, please try to also add a test case(s) in `tests/jasmine/spec/` directory. This helps me understand the issue and make sure that it will stay fixed forever.

Thank you for your commitment! 

## API Reference

### Methods

  Option                                                                               | Role        | Description
---------------------------------------------------------------------------------------|-------------|-------------
 handsontable(options)                                                                 | Constructor | Accepts configuration object (see **Options**)
 handsontable('updateSettings', options)                                               | Method      | Use it if you need to change configuration after initialization
 handsontable('loadData', data)                                                        | Method      | Reset all cells in the grid to contain data from the `data` array
 handsontable('render')                                                                | Method      | Rerender the table
 handsontable('setDataAtCell',&nbsp;row,&nbsp;col,&nbsp;value)                         | Method      | Set new value to a cell. To change many cells at once, pass an array of changes in format [[row, col, value], ...] as the only parameter. Col is the index of **visible** column (note that if columns were reordered, the current order will be used)
 handsontable('setDataAtRowProp',&nbsp;row,&nbsp;prop,&nbsp;value)                     | Method      | Same as above, except instead of `col`, you provide name of the object property (eq. [0, 'first.name', 'Jennifer'])
 handsontable('getDataAtCell', row, col)                                               | Method      | Return cell value at `row`, `col`. Col is the index of **visible** column (note that if columns were reordered, the current order will be used)
 handsontable('getDataAtRowProp', row, prop)                                           | Method      | Same as above, except instead of `col`, you provide name of the object property (eq. [0, 'first.name'])
 handsontable('countRows')                                                             | Method      | Return total number of rows in the grid
 handsontable('countCols')                                                             | Method      | Return total number of columns in the grid
 handsontable('rowOffset')                                                             | Method      | Return index of first visible row
 handsontable('colOffset')                                                             | Method      | Return index of first visible column
 handsontable('countVisibleRows')                                                      | Method      | Return number of visible rows
 handsontable('countVisibleCols')                                                      | Method      | Return number of visible columns
 handsontable('clear')                                                                 | Method      | Empty all cells
 handsontable('clearUndo')                                                             | Method      | Clear undo history
 handsontable('getData', [r, c, r2, c2])                                               | Method      | Return the current data object (the same that was passed by `data` configuration option or `loadData` method). Optionally you can provide cell range `r`, `c`, `r2`, `c2` to get only a fragment of grid data
 handsontable('alter', 'insert_row', index, amount)                                    | Method      | Insert new row(s) above the row at given `index`. If index is `null` or `undefined`, the new row will be added after the current last row. Default `amount` equals 1
 handsontable('alter', 'insert_col', index, amount)                                    | Method      | Insert new column(s) before the column at given `index`. If index is `null` or `undefined`, the new column will be added after the current last column. Default `amount` equals 1
 handsontable('alter',&nbsp;'remove_row',&nbsp;index,&nbsp;amount)                     | Method      | Remove the row(s) at given `index`. Default `amount` equals 1
 handsontable('alter',&nbsp;'remove_col',&nbsp;index,&nbsp;amount)                     | Method      | Remove the column(s) at given `index`. Default `amount` equals 1
 handsontable('getCell', row, col)                                                     | Method      | Return &lt;td&gt; element for given `row,col`
 handsontable('getCellMeta', row, col)                                                 | Method      | Return cell properties for given `row`, `col` coordinates
 handsontable('selectCell', r, c, [r2, c2, scrollToSelection=true])                    | Method      | Select cell `r,c` or range finishing at `r2,c2`. By default, viewport will be scrolled to selection
 handsontable('deselectCell')                                                          | Method      | Deselect current selection
 handsontable('getSelected')                                                           | Method      | Return index of the currently selected cells as an array [`startRow`, `startCol`, `endRow`, `endCol`]. Start row and start col are the coordinates of the active cell (where the selection was started).
 handsontable('destroyEditor', [revertOriginal=false])                                 | Method      | Destroys current editor, renders and selects current cell. If revertOriginal == false, edited data is saved. Otherwise previous value is restored
 handsontable('getRowHeader', [row])                                                   | Method      | Return array of row headers (if they are enabled). If param `row` given, return header at given row as string
 handsontable('getColHeader', [col])                                                   | Method      | Return array of col headers (if they are enabled). If param `col` given, return header at given col as string
 handsontable('destroy')                                                               | Method      | Remove grid from DOM
 handsontable('isUndoAvailable')                                                       | Method      | Return true if undo can be performed, false otherwise
 handsontable('isRedoAvailable')                                                       | Method      | Return true if redo can be performed, false otherwise
 handsontable('undo')                                                                  | Method      | Undo last edit
 handsontable('redo')                                                                  | Method      | Redo edit (used to reverse an undo)
 handsontable('countEmptyRows', [ending])                                              | Method      | Returns number of empty rows. If the optional `ending` parameter is true, returns number of empty rows at the bottom of the table
 handsontable('countEmptyCols', [ending])                                              | Method      | Returns number of empty columns. If the optional `ending` parameter is true, returns number of empty columns at right hand edge of the table
 handsontable('isEmptyRow', row)                                                       | Method      | Return true if the row at the given index is empty, false otherwise
 handsontable('isEmptyCol', col)                                                       | Method      | Return true if the column at the given index is empty, false otherwise

### Options

The table below presents configuration options that are interpreted by `handsontable()` constructor:

  Option                 | Type                           | Default          | Description
-------------------------|--------------------------------|------------------|-------------
 `data`                  | array/object/function          | []               | Initial data source that will be bound to the data grid **by reference** (editing data grid alters the data source. See [Understanding binding as reference](http://handsontable.com/demo/understanding_reference.html))
 `width`                 | number/function                | _undefined_      | Height of the grid. Can be a number or a function that returns a number
 `height`                | number/function                | _undefined_      | Width of the grid. Can be a number or a function that returns a number
 `minRows`               | number                         | 0                | Minimum number of rows. At least that many of rows will be created during initialization
 `minCols`               | number                         | 0                | Minimum number of columns. At least that many of columns will be created during initialization
 `maxRows`               | number                         | _Infinity_       | Maximum number of rows
 `maxCols`               | number                         | _Infinity_       | Maximum number of columns
 `startRows`             | number                         | 5                | Initial number of rows. **Notice:** This option only has effect in Handsontable constructor and only if `data` is not provided
 `startCols`             | number                         | 5                | Initial number of columns. **Notice:** This option only has effect in Handsontable constructor and only if `data` is not provided
 `rowHeaders`            | boolean/array                  | false            | Defines if the row headers (1, 2, 3, ...) should be displayed. You can just set it to `true` or specify custom a array `["First", "Second", "Third", ...]`
 `colHeaders`            | boolean/array                  | false            | Defines if the column headers (A, B, C, ...) should be displayed. You can just set it to `true` or specify custom a array `["First Name", "Last Name", "Address", ...]`
 `colWidths`             | array                          | [50, ..]         | Defines if the column widths in pixels (array of numbers)
 `columns`               | array                          | _undefined_      | Defines the cell properties and data binding for certain columns. **Notice:** Using this option sets a fixed number of columns (options `startCols`, `minCols`, `maxCols` will be ignored). See [demo/datasources.html](https://github.com/warpech/jquery-handsontable/blob/reference/demo/datasources.html) for examples
 `cells`                 | function(`row`, `col`, `prop`) | _undefined_      | Defines the cell properties for given `row`, `col`, `prop` coordinates
 `dataSchema`            | object                         | _like first row_ | Defines the structure of a new row when data source is an object. See [demo/datasources.html](https://github.com/warpech/jquery-handsontable/blob/reference/demo/datasources.html) for examples
 `minSpareCols`          | number                         | 0                | When set to 1 (or more), Handsontable will add a new column at the end of grid if there are no more empty columns
 `minSpareRows`          | number                         | 0                | When set to 1 (or more), Handsontable will add a new row at the end of grid if there are no more empty rows
 `multiSelect`           | boolean                        | true             | If true, selection of multiple cells using keyboard or mouse is allowed
 `fillHandle`            | boolean/string                 | true             | Defines if the fill handle (drag-down and copy-down) functionality should be enabled. Possible values: `true` (to enable in all directions), `"vertical"` or `"horizontal"` (to enable in one direction), `false` (to disable completely).
 `contextMenu`           | boolean/array                  | false            | Defines if the right-click context menu should be enabled. Context menu allows to create new row or column at any place in the grid. Possible values: `true` (to enable basic options), `false` (to disable completely) or array of available strings: `row_above`, `row_below`, `col_left`, `col_right`, `remove_row`, `remove_col`, `undo`, `redo`, `sep1`, `sep2`, `sep3`.
 `undo`                  | boolean                        | true             | If true, undo/redo functionality is enabled
 `outsideClickDeselects` | boolean                        | true             | If true, mouse click outside the grid will deselect the current selection
 `enterBeginsEditing`    | boolean                        | true             | If true, ENTER begins editing mode (like Google Docs). If false, ENTER moves to next row (like Excel) and adds new row if necessary. TAB adds new column if necessary.
 `enterMoves`            | object/function                | {row: 1, col: 0} | Defines cursor move after Enter is pressed (Shift+Enter uses negative vector). Can be an object or a function that returns an object
 `tabMoves`              | object/function                | {row: 0, col: 1} | Defines cursor move after Tab is pressed (Shift+Tab uses negative vector). Can be an object or a function that returns an object
 `autoWrapRow`           | boolean                        | false            | If true, pressing TAB or right arrow in the last column will move to first column in next row
 `autoWrapCol`           | boolean                        | false            | If true, pressing ENTER or down arrow in the last row will move to first row in next column
 `autoComplete`          | array                          | _undefined_      | Autocomplete definitions. See **Defining autocomplete**
 `copyRowsLimit`         | number                         | 1000             | Maximum number of rows than can be copied to clipboard using CTRL+C
 `copyColsLimit`         | number                         | 1000             | Maximum number of columns than can be copied to clipboard using CTRL+C
 `stretchH`              | string                         | hybrid           | [Column stretching](http://handsontable.com/demo/scroll.html) mode. Possible values: `none, hybrid, last, all`. Hybrid mode works as `none` where there is no horizontal scrollbar, and as `last` when the horizontal scrollbar is present.
 `isEmptyRow`            | function(`r`)                  | _undefined_      | Lets you overwrite the default `isEmptyRow` method
 `isEmptyCol`            | function(`c`)                  | _undefined_      | Lets you overwrite the default `isEmptyCol` method
 `manualColumnResize`    | boolean                        | false            | Turn on [Manual column resize](http://handsontable.com/demo/column_resize.html)
 `manualColumnMove`      | boolean                        | false            | Turn on [Manual column move](http://handsontable.com/demo/column_move.html)
 `columnSorting`         | boolean                        | false            | Turn on [Column sorting](http://handsontable.com/demo/sorting.html)
 `currentRowClassName`   | string                         | _undefined_      | Class name for all visible rows in current selection
 `currentColClassName`   | string                         | _undefined_      | Class name for all visible columns in current selection
 `observeDOMVisibility`  | boolean                        | true             | Attempt to rerender Handsontable once it is attached to DOM or style changed to `display: block`
 `onSelection`           | function(`r`, `c`, `r2`, `c2`) | _undefined_      | Callback fired while one or more cells are being selected (on mouse move). Parameters: <ul><li>`r` selection start row</li><li>`c` selection start column</li><li>`r2` selection end column</li><li>`c2` selection end column</li></ul>
 `onSelectionByProp`     | function(`r`, `p`, `r2`, `p2`) | _undefined_      | The same as above, but data source object property name is used instead of the column number
 `onSelectionEnd`        | function(`r`, `c`, `r2`, `c2`) | _undefined_      | Callback fired after one or more cells are selected (on mouse up). Parameters: <ul><li>`r` selection start row</li><li>`c` selection start column</li><li>`r2` selection end column</li><li>`c2` selection end column</li></ul>
 `onSelectionEndByProp`  | function(`r`, `p`, `r2`, `p2`) | _undefined_      | The same as above, but data source object property name is used instead of the column number
 `onBeforeChange`        | function(`changes`)            | _undefined_      | Callback fired before one or more cells is changed. Its main purpose is to validate the input. Parameters: <ul><li>`changes` is a 2D array containing information about each of the edited cells `[ [row, prop, oldVal, newVal], ... ]`. You can disregard a single change by setting `changes[i][3]` to false, or cancel all edit by returning false.</li></ul>
 `onChange`              | function(`changes`, `source`)  | _undefined_      | Callback fired after one or more cells is changed. Its main use case is to save the input. Parameters: <ul><li>`changes` is a 2D array containing information about each of the edited cells `[ [row, prop, oldVal, newVal], ... ]`. </li><li>`source` is one of the strings: `"alter"`, `"empty"`, `"edit"`, `"populateFromArray"`, `"loadData"`, `"autofill"`, `"paste"`.</li></ul> Note: for performance reasons, the `changes` array is null for `"loadData"` source.
 `onCopyLimit`           | function()                     | _undefined_      | Callback fired if `copyRowsLimit` or `copyColumnsLimit` was reached. Callback parameters are: `selectedRowsCount`, `selectedColsCount`, `copyRowsLimit`, `copyColsLimit`

## Similar projects

I want to stay motivated to keep Handsontable the best possible editable datagrid on the Web. Therefore, I invite you to check out alternative projects. I would love to receive feedback if you would like to import some of their features to Handsontable.

 - [DataTables](http://datatables.net/)
 - [SlickGrid](https://github.com/mleibman/SlickGrid)
 - [jqGrid](http://www.trirand.com/blog/)
 - [jTable](http://www.jtable.org/)
 - [jui_datagrid](http://www.pontikis.net/labs/jui_datagrid/)
 - [ParamQuery](http://paramquery.com/)
 - [Ember Table](http://addepar.github.io/ember-table/)
 - [Backgrid.js](http://backgridjs.com/)

## License 

(The MIT License)

Copyright (c) 2012 Marcin Warpechowski &lt;marcin@nextgen.pl&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

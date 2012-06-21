# Handsontable

Handsontable is a minimalistic approach to Excel-like table editor in HTML & jQuery

See the live demo at: http://warpech.github.com/jquery-handsontable/

## Usage

First, include all the dependencies:

```html
<script src="jquery.handsontable.js"></script>
<script src="lib/bootstrap-typeahead.js"></script><!-- if you need the autocomplete feature -->
<script src="lib/jquery.autoresize.js"></script><!-- if you need the autoexpanding textarea -->
<script src="lib/jQuery-contextMenu/jquery.contextMenu.js"></script><!-- if you need the context menu -->
<script src="lib/jQuery-contextMenu/jquery.ui.position.js"></script><!-- if you need the context menu -->
<link rel="stylesheet" media="screen" href="lib/jQuery-contextMenu/jquery.contextMenu.css">
<link rel="stylesheet" media="screen" href="jquery.handsontable.css">
```

Then, run `handsontable()` constructor on an empty div:

```html
<div id="dataTable" class="dataTable"></div>
<script>
  $("#dataTable").handsontable({
    rows: 6,
    cols: 8
});
</script>
```
    
Maybe you want to show some default data. Use the `handsontable('loadData', data)` method:

```html
<script>
  var data = [
    ["", "Kia", "Nissan", "Toyota", "Honda"],
    ["2008", 10, 11, 12, 13],
    ["2009", 20, 11, 14, 13],
    ["2010", 30, 15, 12, 13]
  ];
  $("#dataTable").handsontable("loadData", data);
</script>
```

## Changelog

18 Jun 2012 - feature: row and column headers (`rowHeaders`, `colHeaders`); new public methods `selectCell`, `deselectCell`  
15 Jun 2012 - new parameter `allowHtml` to public methods `setDataAtCell`, `loadData`  
04 Jun 2012 - feature: undo/redo  

## Methods

  Option                                                                               | Role        | Description
---------------------------------------------------------------------------------------|-------------|-------------
 handsontable(options)                                                                 | Constructor | Accepts configuration object (see **Options**)
 handsontable('updateSettings', options)                                               | Method      | Use it if you need to change configuration after initialization
 handsontable('loadData', data, [allowHtml=false])                                     | Method      | Reset all cells in the grid to contain data from the `data` array. Any HTML in `data` is escaped unless you set `allowHtml` to true
 handsontable('setDataAtCell',&nbsp;row,&nbsp;col,&nbsp;value,&nbsp;[allowHtml=false]) | Method      | Set new value to a cell. Any HTML in `value` is escaped unless you set `allowHtml` to true
 handsontable('clear')                                                                 | Method      | Empty all cells
 handsontable('getData')                                                               | Method      | Return 2-dimensional array with the current grid data
 handsontable('alter', 'insert_row', index)                                            | Method      | Insert new row above the row at given index
 handsontable('alter', 'insert_col', index)                                            | Method      | Insert new column before the column at given index
 handsontable('alter',&nbsp;'remove_row',&nbsp;index,&nbsp;[toIndex])                  | Method      | Remove the row at given index [optionally to another index]
 handsontable('alter',&nbsp;'remove_col',&nbsp;index,&nbsp;[toIndex])                  | Method      | Remove the column at given index [optionally to another index]
 handsontable('getCell', row, col)                                                     | Method      | Return &lt;td&gt; element for given `row,col`
 handsontable('selectCell', r, c, [r2, c2, scrollToSelection=true])                    | Method      | Select cell `r,c` or range finishing at `r2,c2`. By default, viewport will be scrolled to selection
 handsontable('deselectCell')                                                          | Method      | Deselect current selection

## Options

The table below presents configuration options that are interpreted by `handsontable()` constructor:

  Option              | Type              | Default     | Description
----------------------|-------------------|-------------|-------------
 `rows`               | Number            | 5           | Initial number of rows
 `cols`               | Number            | 5           | Initial number of columns
 `rowHeaders`         | Boolean/Array     | false       | Defines if the row headers (1, 2, 3, ...) should be displayed. You can just set it to `true` or specify custom a array `["First", "Second", "Third", ...]`
 `colHeaders`         | Boolean/Array     | false       | Defines if the column headers (A, B, C, ...) should be displayed. You can just set it to `true` or specify custom a array `["First Name", "Last Name", "Address", ...]`
 `minWidth`           | Number            | 0           | Handsontable will add as many columns as needed to meet the given width in pixels
 `minHeight`          | Number            | 0           | Handsontable will add as many rows as needed to meet the given height in pixels
 `minSpareCols`       | Number            | 0           | When set to 1 (or more), Handsontable will add a new column at the end of grid if there are no more empty columns
 `minSpareRows`       | Number            | 0           | When set to 1 (or more), Handsontable will add a new row at the end of grid if there are no more empty rows
 `multiSelect`        | Boolean           | true        | If true, selection of multiple cells using keyboard or mouse is allowed
 `fillHandle`         | Boolean/String    | true        | Defines if the fill handle (drag-down and copy-down) functionality should be enabled. Possible values: `true` (to enable in all directions), `"vertical"` or `"horizontal"` (to enable in one direction), `false` (to disable completely).
 `contextMenu`        | Boolean/Array     | false       | Defines if the right-click context menu should be enabled. Context menu allows to create new row or column at any place in the grid. Possible values: `true` (to enable basic options), `false` (to disable completely) or array of available strings: `row_above`, `row_below`, `col_left`, `col_right`, `remove_row`, `remove_col`, `undo`, `redo`, `sep1`, `sep2`, `sep3`.
 `undo`               | Boolean           | true        | If true, undo/redo functionality is enabled
 `enterBeginsEditing` | Boolean           | true        | If true, ENTER begins editing mode (like Google Docs). If false, ENTER moves to next row (like Excel) and adds new row if necessary. TAB adds new column if necessary.
 `legend`             | Array             | _undefined_ | Legend definitions. See **Defining legend**
 `autocomplete`       | Array             | _undefined_ | Autocomplete definitions. See **Defining autocomplete**
 `onBeforeChange`     | Function(changes) | _undefined_ | Callback to be fired before one or more cells is changed (with changes array as an argument). Its main purpose is validation of the input. You can disregard a single change by setting `changes[i][3]` to false, or cancel all edit by returning false.
 `onChange`           | Function(changes) | _undefined_ | Callback to be fired after one or more cells is changed (with changes array as an argument). Its main purpose is saving the input.

### Defining legend

The `legend` option is an array of mixins that define multiple legends for the grid. 

With your imagination, legend can be used to make any of the grid cells read-only, use different 
text color, or show a tooltip (title) when hovered with mouse cursor.

Example:

```js
legend: [
  {
    match: function (row, col, data) {
      return (row === 0); //if it is first row
    },
    style: {
      color: '#666', //make the text gray and bold
      fontWeight: 'bold'
    },
    title: 'Heading', //make some tooltip
    readOnly: true //make it read-only
  }
```

### Defining autocomplete

The `autocomplete` option is an array of mixins that define multiple autocomplete providers for the grid. 

To keep Handsontable lightweight, this feature has a dependency on another jQuery plugin: 
[bootstrap-typeahead](https://github.com/twitter/bootstrap/blob/master/js/bootstrap-typeahead.js). 
It is included in the repo.

Example:

```js
autoComplete: [
  {
    match: function (row, col, data) {
      if (data()[0][col].indexOf("color") > -1) { //if column name contains word "color"
        return true;
      }
      return false;
    },
    highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
      var label = item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>';
      });
      return '<span style="margin-right: 10px; background-color: ' + item + '">&nbsp;&nbsp;&nbsp;</span>' + label;
    },
    source: function () {
      return ["yellow", "red", "orange", "green", "blue", "gray", "black", "white"]
    }
  },
  {
    match: function (row, col, data) {
      return (col === 0); //if it is first column
    },
    source: function () {
      return ["BMW", "Chrysler", "Nissan", "Suzuki", "Toyota", "Volvo"]
    }
  }
],
```

## Similar projects

If you are interested in more complicated data grid solutions, consider:
 - [DataTables](http://datatables.net/)
 - [SlickGrid](https://github.com/mleibman/SlickGrid)

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
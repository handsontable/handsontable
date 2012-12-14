## [0.8.0-beta2](https://github.com/warpech/jquery-handsontable/tree/v0.8.0-beta2) (Dec 14, 2012)

Beta preview has been updated: http://handsontable.com/0.8.0/

New features since 0.8.0-beta1:
- now the table is rendered even faster with `requestAnimationFrame`

New known issues since 0.8.0-beta1:
- page up/page down scrolls to the first and the last row (should only scroll one screen)
- CTRL+A works slow on large data sets (as reported by @brivazac / #295)
- copy of large selection (5k, 10k, 100k rows etc) freezes IE8 (first reported by @itanex / #295). Below 1k rows works fine. The only solution I can think of right now is to set copy limit in IE8 to 1000 rows.
- when using `overflow: auto`, only relevant scrollbars should be displayed (first reported by @dansabirov / #295)

Bugfixes since 0.8.0-beta1:
- fixed known issue "selecting an area and clicking one of its cells within 500 ms starts editing of that cell"
- fixed known issue "table width and height is now configured using `width` and `height` settings"
- fixed error when clicking on row/column header (related to @cscribner / #295)
- fix copy-paste in Chrome (thanks @ravio  / #295)
- `getRowHeader()` referenced to colHeaders instead of rowHeaders (thanks @marint / #295)
- fix performance of `loadData` (thanks @codename- / #295)
- now works in IE8, still not yet in IE7

## [0.8.0-beta1](https://github.com/warpech/jquery-handsontable/tree/v0.8.0-beta1) (Dec 11, 2012)

Beta of new upcoming version 0.8.0 can be previewed here: http://handsontable.com/0.8.0/

Features:
- completely new rendering engine codenamed "Walkontable" that uses a `canvas` type approach to draw the visible part of the table on screen. Works smoothly even with data sources above 100 000k rows.

Known issues (all of them will be fixed before final 0.8.0):
- _fixed in beta2:_ table width and height is now configured using `width` and `height` settings, though it does not work accurately yet (guesses fixed cell size of 50x20px). This will be fixed in beta2.
- _fixed in beta2:_ selecting an area and clicking one of its cells within 500 ms starts editing of that cell
- methods `setCellReadOnly` and `setCellEditable` are currently broken. You can still define read only columns using the `columns` or `cells` settings
- fill handle (drag-down) feature is currently broken
- clicking on cell & row borders has no effect (first reported by @cscribner / #295, though now it does not crash)
- partially fixed in beta2:_ this version does not work in IE7-8 (but will work in final 0.8.0)

Bugfixes:
- fixed CSS problems with Foundation framework

Other changes:
- Handsontable core properties `colCount`, `rowCount` do not exist anymore. Use `countRows()` and `countCols()` public methods instead

## [0.7.5](https://github.com/warpech/jquery-handsontable/tree/v0.7.5) (Nov 26, 2012)

Features:

- new settings: `minRows`, `minCols`, `maxRows`, `maxCols` (fixes [#225](https://github.com/warpech/jquery-handsontable/issues/225))
- `startRows` and `startCols` should now be only used to define how many empty rows should be created on grid initialization
- now you can use `columns` to configure number of autocomplete items (fixes [#242](https://github.com/warpech/jquery-handsontable/issues/242))

Bugfixes:

- `loadData` now will remove empty rows from grid if new data source has less rows
- new rows are now correctly created when using nested object data source ([#255](https://github.com/warpech/jquery-handsontable/pull/255))
- copy and paste issues with nested object data source ([#250](https://github.com/warpech/jquery-handsontable/issues/250))

## [0.7.4](https://github.com/warpech/jquery-handsontable/tree/v0.7.4) (Nov 19, 2012)

Bugfixes:

- fix error when pasting values to a grid with dataSchema (issue #237)
- loadData should remove empty row if source data has more empty rows than allowed by minSpareRows (issue #239)
- textarea dimensions were not updated if grid was rerendered while editing

## [0.7.3](https://github.com/warpech/jquery-handsontable/tree/v0.7.3) (Nov 14, 2012)

Features:

- big news: build now contains full and minified JS and CSS packages. See [dist/](https://github.com/warpech/jquery-handsontable/tree/master/dist) directory for details.
- added experimental "Edit in jsFiddle" link in [autocomplete example](http://handsontable.com/demo/autocomplete.html). If no issues are observed, I will add it to all example pages.

Bugfixes:

- fixed [issue with setCellReadOnly](http://stackoverflow.com/questions/13127501/sets-cell-to-be-readonly) that was reported on Stack Overflow.
- fixed performance issue with cells being rendered twice in `loadData` (issue #233)

## [0.7.2](https://github.com/warpech/jquery-handsontable/tree/v0.7.2) (Nov 12, 2012)

Fixes exeption when editing cell in IE8 (issue #232) and problems when using Autocomplete with Ajax.

Added Ajax example on [autocomplete.html](handsontable.com/demo/autocomplete.html)

## [0.7.1](https://github.com/warpech/jquery-handsontable/tree/v0.7.1) (Nov 9, 2012)

Mosty fixes for the Autocomplete feature as well as a new (easier) syntax for the Autocompelte. See [autocomplete.html](http://handsontable.com/demo/autocomplete.html) for examples. Old syntax should still work due to the [legacy layer](https://github.com/warpech/jquery-handsontable/blob/master/src/plugins/legacy.js).

Features (described in [README.md](https://github.com/warpech/jquery-handsontable)):

  - new public method `destroyEditor` (#229). 

## [0.7.0](https://github.com/warpech/jquery-handsontable/tree/v0.7.0) (Nov 5, 2012)

Please note that this release has partial incompability with previous releases. It is step in a direction to make Handsontable more flexible and customisable.

Adds binding to object data source (prior versions only allow 2-dimensional array data source)  
Adds selective column rendering (using `columns` option)
Now data is assigned to Handsontable as reference (prior versions had data copied)
Adds custom cell types (currently text, autocomplete or checkbox)

Features removed:

 - Legend (use [cell renderers](http://handsontable.com/demo/renderers.html) instead)

## [0.6.0](https://github.com/warpech/jquery-handsontable/tree/v0.6.0) (Sep 27, 2012)

Please note that this release has partial incompability with previous releases, though it should affect only border cases.

Potential incompabilities with version 0.5.1:
  - public method `getData` no longer has `asReference` parameter (use `getDataReference` instead)
  - to have scrollable grid, you must set "overflow: scroll" or "overflow: auto" directly on Handsontable container. Until now, it worked also when you set overflow scroll/auto on any of the container parents, but that turned out to be not compatible with Twitter Bootstrap

Features added in 0.6.0 (described in [README.md](https://github.com/warpech/jquery-handsontable)):
  - virtual scrolling that solves problem with row/column header flicker in IE and FF when the grids quickly scrolled
  - public method `getData` now accepts optional arguments to return only fragment of grid data (e.g. current selection)
  - new public method `getDataReference` works the same as `getData` but returns data as reference, which is faster but can mess up if manipulated outside the plugin

Bugfixes:
  - keyword `this` in onChange, onBeforeChange, onSelection callbacks points to container HTML element
  - editing a field in Firefox 3.6.28 skipped the first character
  - added default font-family and font-size for .typeahead
  - TAB does not move cell selection if cell is not being edited (#151)
  - HTML special chars should be preserved in data map but escaped in DOM (#147)
  - rowHeaders/colHeaders false should not init row/col headers (#141)
  - legend icon did not resize column header

## [0.5.1](https://github.com/warpech/jquery-handsontable/tree/v0.5.1) (Sep 7, 2012)

- features (described in [README.md](https://github.com/warpech/jquery-handsontable)):
  - allow icons in Legends (see [example](http://warpech.github.com/jquery-handsontable/#example2))
  - new public method `refreshLegend`
  - new configuration option `outsideClickDeselects`
  - added data function reference in autocomplete match (`match: function (row, col, data)`)
- bugfix:
  - option `fillHandle: 'horizontal'` and `'vertical'` did not work 

## [0.5.0](https://github.com/warpech/jquery-handsontable/tree/v0.5.0) (Aug 15, 2012)

- features (described in [README.md](https://github.com/warpech/jquery-handsontable)):
  - public methods `getDataAtCell`, `setCellReadOnly` - thanks @Dinesh-Ramakrishnan
  - public methods `getSelected` - thanks @littley!
  - public methods `getRowHeader`, `getColHeader`, `getCellMeta`
  - configuration `autoWrapRow`, `autoWrapCol`, `enterBeginsEditing`
  - now Enter key behaves more like in Excel (see issue #56)
- code quality:
  - add `"use strict";` (ECMAScript strict mode) to all components
  - allow to run in jQuery noConflict mode
  - namespace was changed from `handsontable` to `Handsontable` to avoid var name conflicts that people were having by accident
  - now code is divided into components and built with [Grunt](http://weblog.bocoup.com/introducing-grunt/)
- tests: added four Selenium IDE tests to automate testing of bugfixes. This is a start - more tests will be added in future versions. Tests are located in [test/](https://github.com/warpech/jquery-handsontable/tree/master/test) directory.
- 75 bugfixes

## [0.4.2](https://github.com/warpech/jquery-handsontable/tree/v0.4.2) (Jun 18, 2012)

- features:
  - row and column headers (options: `rowHeaders`, `colHeaders`)
  - public methods `selectCell`, `deselectCell`

## [0.4.1](https://github.com/warpech/jquery-handsontable/tree/v0.4.1) (Jun 15, 2012)

- feature: public methods `setDataAtCell`, `loadData` now have a new parameter `allowHtml` that will omit escaping of HTML code

## [0.4.0](https://github.com/warpech/jquery-handsontable/tree/v0.4.0) (Jun 04, 2012)

- first version number to be documented here
- feature: undo/redo
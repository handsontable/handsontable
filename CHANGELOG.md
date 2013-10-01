## [0.9.19](https://github.com/warpech/jquery-handsontable/tree/v0.9.19) (Oct 01, 2013)

Two features that come in handy for plugin developers:
- new plugin hook: `afterRenderer`
- (previously private) DOM helpers are now exposed as `Handosontable.Dom` (see [api](https://github.com/warpech/jquery-handsontable/blob/master/src/3rdparty/walkontable/src/dom.js))

## [0.9.18](https://github.com/warpech/jquery-handsontable/tree/v0.9.18) (Sep 19, 2013)

Features:
- native browser scrollbars feature becomes usable, but currently only works vertically ([demo](http://handsontable.com/demo/scroll_native.html))

Bugfixes:
- it was possible to move a column by just double clicking on move handle ([#963](https://github.com/warpech/jquery-handsontable/issues/963))
- can't edit a cell that is outside of the viewport ([#1035](https://github.com/warpech/jquery-handsontable/issues/1035))
- context-menu-layer was not removed from DOM after $.contextMenu destroy
- cleanup CSS from excessive vendor prefixes
- performance improvement of scrolling with autoColumnSize

## [0.9.17](https://github.com/warpech/jquery-handsontable/tree/v0.9.17) (Sep 5, 2013)

Features:
- `beforeRemoveRow` and `beforeRemoveCol` events are now invoked with absolute index
- if table has custom column headers, removing column will also remove the corresponding header

Bugfix:

- fixed crashing the whole page when autocomplete is on ([#1011](https://github.com/warpech/jquery-handsontable/issues/1011))
- fixed changing multiple cells values when using autocomplete ([#1021](https://github.com/warpech/jquery-handsontable/issues/1021))
- fixed handling multiple tables with different sorting options on the same page ([#1020](https://github.com/warpech/jquery-handsontable/issues/1020))
- fixed undoing row removal from tables which data source is array of objects ([#966](https://github.com/warpech/jquery-handsontable/issues/966))
- fixed undoing column removal
- fixed removing columns form table which has more rows than can be rendered in viewport ([#1012](https://github.com/warpech/jquery-handsontable/issues/1012))
- fixed marking Undo/Redo in context menu as enabled/disabled
- fixed adding new rows directly to data source, when table is sorted ([#858](https://github.com/warpech/jquery-handsontable/issues/858))

## [0.9.16](https://github.com/warpech/jquery-handsontable/tree/v0.9.16) (Aug 27, 2013)

Features:

- New cell type: `password`
- Rebuilt UndoRedo module

Bugfix:

- fixed using manualColumnMove with multiple HOT instances  ([#999](https://github.com/warpech/jquery-handsontable/issues/999))
- fixed autoWrapCol and autoWrapRow behaviour ([#992](https://github.com/warpech/jquery-handsontable/issues/992))
- autocomplete fields will now behave the same as regular fields after closing editor by clicking on another cell (if in non strict mode)  ([#991](https://github.com/warpech/jquery-handsontable/issues/991))
- fixed validation after changing column order ([#980](https://github.com/warpech/jquery-handsontable/issues/980))

## [0.9.15](https://github.com/warpech/jquery-handsontable/tree/v0.9.15) (Aug 26, 2013)

Features:
- `colWidths` property of the constructor may now be of type: number, string, array, function (was only array) ([#947](https://github.com/warpech/jquery-handsontable/issues/947), [#997](https://github.com/warpech/jquery-handsontable/issues/997))
- `widths` property of `columns` or `cells` option may now be of type: number, string (was only number)

Bugfix:
- autoColumnSize now calculates width using the actual cell renderer ([#486](https://github.com/warpech/jquery-handsontable/issues/486))

## [0.9.14](https://github.com/warpech/jquery-handsontable/tree/v0.9.14) (Aug 20, 2013)

Bugfixes:

- fixed selecting date using jQuery UI Datepicker ([#970](https://github.com/warpech/jquery-handsontable/issues/970))
- fixed opening cell editor after clearing cell data with Delete or Backspace ([#975](https://github.com/warpech/jquery-handsontable/issues/975))

## [0.9.13](https://github.com/warpech/jquery-handsontable/tree/v0.9.13) (Aug 16, 2013)

Features:
- removed the need to declare `.handsontable .htCore td` in user CSS. Now `.handsontable td` works ok ([#965](https://github.com/warpech/jquery-handsontable/issues/965), [#956](https://github.com/warpech/jquery-handsontable/issues/956))

Bugfixes:
- cellProperties were not refreshed after removing a row ([#959](https://github.com/warpech/jquery-handsontable/issues/959))
- manual column resize handles were misplaced when table changes width ([#949](https://github.com/warpech/jquery-handsontable/issues/949))
- when no cells have focus CTRL+V pastes into all cells up to last cell to have focus ([#946](https://github.com/warpech/jquery-handsontable/issues/946))
- afterColumnResize callback can be called with an incorrect size, or undefined ([#945](https://github.com/warpech/jquery-handsontable/issues/945))
- can't start cell editing while holding SHIFT ([#944](https://github.com/warpech/jquery-handsontable/issues/944))
- autocomplete text editor was throwing afterChange event twice ([#939](https://github.com/warpech/jquery-handsontable/issues/939))
- fixed inserting and removing rows when columnSorting is enabled, but table hasn't been sorted yet ([#915](https://github.com/warpech/jquery-handsontable/issues/915))
- toggling checkbox state using spacebar did not update the data source and trigger afterChange event ([#895](https://github.com/warpech/jquery-handsontable/issues/895))
- context menu functions did not work properly when the cell selection was performed upwards or leftwards  ([#674](https://github.com/warpech/jquery-handsontable/issues/674))
- `observeChanges` should register only external changes, not changes made with Handsontable (which led to plugin hooks triggered twice)
- ~~error adding row when column sorting is in effect ([#858](https://github.com/warpech/jquery-handsontable/issues/858))~~ - still not fixed. We will address it with high priority
- Opening autocomplete list, hovering over a list item and then clicking outside of the table will close the editor and won't change cell value ([#638](https://github.com/warpech/jquery-handsontable/issues/638))

## [0.9.12](https://github.com/warpech/jquery-handsontable/tree/v0.9.12) (Aug 7, 2013)

Features:

- closing cell editors when table is being scrolled ([#914](https://github.com/warpech/jquery-handsontable/issues/914))
- added `sort()` method to programmatically sort table
- plugin `contextMenu` can now be enabled or disabled using `updateSettings()` method
- extension `removeRow` can now be enabled or disabled using `updateSettings()` method ([#934](https://github.com/warpech/jquery-handsontable/issues/934))
- plugin `observeChanges` can now be enabled or disabled using `updateSettings()` method
- plugin `autoColumnSize` can now be enabled or disabled using `updateSettings()` method
- 2 new events: `beforColumnSort` and `afterColumnSort` fired before and after table sort

Bugfixes:

- fixed incorrect width of horizontal scrollbar when scrolled to rightmost column ([#909](https://github.com/warpech/jquery-handsontable/issues/909))
- fix ability to check/uncheck checkboxes using spacebar ([#895](https://github.com/warpech/jquery-handsontable/issues/895))
- added more specific selectors in CSS, so that jQuery UI styles and default HandsonTable styles does not interfere ([#498](https://github.com/warpech/jquery-handsontable/issues/498))
- fixed moving table column, when table is scrolled horizontally ([#527](https://github.com/warpech/jquery-handsontable/issues/527))
- `afterRender` event is now fired after every table scroll ([#733](https://github.com/warpech/jquery-handsontable/issues/733))
- fixed inserting and removing rows form sorted table ([#915](https://github.com/warpech/jquery-handsontable/issues/915))
- added proper mapping of cell properties when table is sorted ([#917](https://github.com/warpech/jquery-handsontable/issues/917))
- fixed IE `Array.filter()` shim ([#934](https://github.com/warpech/jquery-handsontable/issues/934))
- fixed tests, so that they all pass on Sauce Labs servers
- fixed support for legacy syntax in cells method `return {type: {renderer: function(){ /*...*/ }}`
- autoColumnSize plugin no longer tests column width using number '9999999999' (now it takes first value from data source)

## [0.9.11](https://github.com/warpech/jquery-handsontable/tree/v0.9.11) (Jul 29, 2013)

This version fixes some severe cell listener issues introduced in the last version.

Bugfixes:
- selecting a cell in another table when already focused on an existing table does not bring focus to the new table ([#924](https://github.com/warpech/jquery-handsontable/issues/924))
- cannot change more than 2 numeric cells ([#911](https://github.com/warpech/jquery-handsontable/issues/911), [#922](https://github.com/warpech/jquery-handsontable/issues/922))
- Focus lost after Ctrl+(A or Z or Y) ([#910](https://github.com/warpech/jquery-handsontable/issues/910), [#893](https://github.com/warpech/jquery-handsontable/issues/893))

## [0.9.10](https://github.com/warpech/jquery-handsontable/tree/v0.9.10) (Jul 23, 2013)

Features:
- New option: `persistentState` ([docs](https://github.com/warpech/jquery-handsontable/wiki/Options)). Settings of manualColumnMove, manualColumnResize and columnSorting can be restored on page load using localStorage. See [Column resize](http://handsontable.com/demo/column_resize.html) and [Sorting](http://handsontable.com/demo/sorting.html) demos

Bugfixes (sorting):
- issues with create/update/delete operations on a sorted table ([#793](https://github.com/warpech/jquery-handsontable/issues/793), [#542](https://github.com/warpech/jquery-handsontable/issues/542), [#746](https://github.com/warpech/jquery-handsontable/issues/746))
- added proper sorting for `date` column type ([#720](https://github.com/warpech/jquery-handsontable/issues/720))
- sorting tables with spare rows that contain not empty cells  ([#857](https://github.com/warpech/jquery-handsontable/issues/857))

Bugfixes (validation):
- cell editors now work better with async cell validators
- validator should add class name `htInvalid` to a cell without removing other classes

Bugfixes (big cells):
- remove maximum column width 200px limit ([#422](https://github.com/warpech/jquery-handsontable/issues/422))
- refactor manualColumnResize plugin, now it works ok also with columns wider than viewport
- refactor scrollViewport to correctly scroll to cells wider than viewport (should just cut the part that is not visible)
- refactor scrollViewport to correctly scroll to cells higher than viewport (should just cut the part that is not visible)
- cell editor could not handle long values correctly ([#393](https://github.com/warpech/jquery-handsontable/issues/393), [#441](https://github.com/warpech/jquery-handsontable/issues/441), [#804](https://github.com/warpech/jquery-handsontable/issues/804))
- scrollbar handle size does not depend on row height anymore, which solves problem of jumpy scrollbar behavior for rows of variable height [SC#527](https://github.com/Starcounter/Starcounter/issues/527)
- it should not be allowed to select fragments of Handsontable chrome (even if `fragmentSelection` set to true)
- fix cell selection positioning for tables with `<caption>`

Bugfixes (other):
- removing rows from table with fixed rows ([#805](https://github.com/warpech/jquery-handsontable/issues/805))
- issues with selecting inputs/textareas/selects outside of HOT ([#408](https://github.com/warpech/jquery-handsontable/issues/408))
- fixed API methods `addHook`, `addHookOnce`, `removeHook`, `runHooks`, `runHooksAndReturn` to manipulate local hooks
- fixed calling `beforeChange` and `afterChange` hooks multiple times while editing a single value in a column with synchronous validator ([#864](https://github.com/warpech/jquery-handsontable/issues/864))

Performance:
- replace jQuery `find` with `querySelector` where possible
- replace jQuery `index` with `wtDom.index` where possible - up to 8x faster
- replace jQuery `:visible` with `wtDom.isVisible` where possible

Other:
- updated Grunt packages
- added livereload to `grunt watch` - works with Chrome LiveReload extension. See: https://github.com/gruntjs/grunt-contrib-watch
- remove the deprecated `isWritable` cell property from code and demo; add it temporarily to `src/plugins/legacy.js` so it does not break your code (to be removed in 1.0 or sooner)
- now all tests pass in IE8-10, FF, Ch, also with `grunt sauce`

## [0.9.9](https://github.com/warpech/jquery-handsontable/tree/v0.9.9) (Jun 30, 2013)

Bugfix:
- version 0.9.8 contained a fatal typo in cut (CTRL+X) callback

## [0.9.8](https://github.com/warpech/jquery-handsontable/tree/v0.9.8) (Jun 30, 2013)

Bugfix:
- copy/cut/paste did not work since last version ([#846](https://github.com/warpech/jquery-handsontable/issues/846))

## [0.9.7](https://github.com/warpech/jquery-handsontable/tree/v0.9.7) (Jun 30, 2013)

Features:
- new option `fragmentSelection`, which unblocks free text selection within cells ([demo](http://handsontable.com/demo/options.html), [docs](https://github.com/warpech/jquery-handsontable/wiki/Options))

Bugfixes:
- `updateSettings` method did not take effect when updating `readOnly`, `columns`, `colHeaders`, `fixedColumnsLeft`, `fixedRowsTop` ([#824](https://github.com/warpech/jquery-handsontable/issues/824), [#715](https://github.com/warpech/jquery-handsontable/issues/715), [#524](https://github.com/warpech/jquery-handsontable/issues/524))
- numeric cell type did not respect the `readOnly` setting
- `demo/php.html` is now fixed (runs only when PHP is installed, does not work on handsontable.com)
- mousewheel not working in IE8 ([#817](https://github.com/warpech/jquery-handsontable/issues/817))
- HTML in cells and headers was escaped when it shouldn't be ([#845](https://github.com/warpech/jquery-handsontable/issues/845), [#815](https://github.com/warpech/jquery-handsontable/issues/815), [#821](https://github.com/warpech/jquery-handsontable/issues/821))
- fixed issues with asynchronous validators

Other:
- all Handsontable event listeners now listen on document body. This was needed to make `fragmentSelection` feature
- created the [Handsontable Google Group](https://groups.google.com/forum/#!forum/handsontable). Please use it for general questions - and keep GitHub Issues for bugfixes and feature requests

Tests:
- initial integration with Sauce Labs (`grunt sauce`). More info about testing coming soon in wiki
- dropped support for IE7, which now has [below 1%](http://gs.statcounter.com/#browser_version_partially_combined-ww-monthly-201306-201306-bar) of the global market share. IE8 is safe for now

## [0.9.6](https://github.com/warpech/jquery-handsontable/tree/v0.9.6) (Jun 18, 2013)

Bugfixes:
- `isEmptyRow` produced error `this.countCols is not a function` ([#632](https://github.com/warpech/jquery-handsontable/issues/632))
- delete row extension does not show the button when grid is inside a `<table>` ([#764](https://github.com/warpech/jquery-handsontable/issues/764))
- drag-down not working if Handsontable is inside a table ([#355](https://github.com/warpech/jquery-handsontable/issues/355), [#361](https://github.com/warpech/jquery-handsontable/issues/361), [#538](https://github.com/warpech/jquery-handsontable/issues/538), [#438](https://github.com/warpech/jquery-handsontable/issues/438), [#671](https://github.com/warpech/jquery-handsontable/issues/671), [#704](https://github.com/warpech/jquery-handsontable/issues/704)) - this makes me realize how many people still use tables to create a layout
- numeric cell renderer did not add class name `htDimmed` to a read only cell

Performance:
- avoid jQuery and expensive DOM operations in several places

Other:
- add more test cases
- upgrade jQuery contextMenu plugin to v1.6.5
- upgrade jquery-mousewheel plugin to v3.1.3

## [0.9.5](https://github.com/warpech/jquery-handsontable/tree/v0.9.5) (Jun 15, 2013)

Feature:
- cell validators! See the redone [Validation](http://handsontable.com/demo/validation.html) demo page. New plugin cell options: `validator`, `allowInvalid`. New plugin hooks: `beforeValidate`, `afterValidate`

Bugfixes:
- read only cells: `htDimmed` overrides all classes ([#699](https://github.com/warpech/jquery-handsontable/issues/699))
- calling 'loadData' after a change made by a paste event will produce an error in the hooks invocation ([#783](https://github.com/warpech/jquery-handsontable/issues/783))
- autoColumnSize did not take `<table>` class into account when measuring the column width
- column header width was not applied correctly where there were no rows in the data source
- methods `countVisibleRows` and `countVisibleCols` threw an exception if table is not rendered (now they return -1)

Performance:
- use `cloneNode` in cell built-in cell renderers for better performance
- fix double rendering in populateFromArray method
- cellProperties are now cached (not created on the fly)

Other:
- add `grunt-contrib-connect` to `Gruntfile.js` that allows to run an ad-hoc http://localhost:8080/ server with command `grunt connect`
- ensure good integration with [Bower](http://bower.io/) front-end package manager
- bind `cellProperties` as `this` in `cells` callback

## [0.9.4](https://github.com/warpech/jquery-handsontable/tree/v0.9.4) (Jun 7, 2013)

Bugfixes:
- should scroll to last row with very high rows respecting fixedRows ([#758](https://github.com/warpech/jquery-handsontable/issues/758))
- Native Scrollbar was listening to window scroll also after table was removed from DOM
- `numeric` cell type now correctly formats negative values and strings with dot character ([#658](https://github.com/warpech/jquery-handsontable/issues/658))
- fix for returning false on `beforeChange` callback has no effect ([#749](https://github.com/warpech/jquery-handsontable/issues/749))
- clicking on partially visible cell scrolled the table but did not select the desired cell

Other:
- [Numeric](http://handsontable.com/demo/numeric.html) cell type demo now shows default (USD) and custom (EUR) locale for currency formatting

## [0.9.3](https://github.com/warpech/jquery-handsontable/tree/v0.9.3) (Jun 4, 2013)

Bugfixes:
- scrolling to the last row/column did not work with rows of big height, or columns of big width ([#645](https://github.com/warpech/jquery-handsontable/issues/645), [#698](https://github.com/warpech/jquery-handsontable/issues/698), [#730](https://github.com/warpech/jquery-handsontable/issues/730))
- fix `observeChanges` in IE9-10 and Firefox (merge Object.observe shim fixes from https://github.com/Starcounter-Jack/JSON-Patch/pull/6)
- initial render was incomplete with Native Scrollbars on
- flat notation of options `cellProperties.renderer`, `cellProperties.editor` did not work as desired ([#713](https://github.com/warpech/jquery-handsontable/issues/713))
- cut and paste events did not work in a reliable way in Mac Chrome and Safari

Other:
- make [Callbacks](http://handsontable.com/demo/callbacks.html) demo faster and more convenient
- change async tests to sync where possible

## [0.9.2](https://github.com/warpech/jquery-handsontable/tree/v0.9.2) (May 28, 2013)

Features:
- initial release of Native Scrollbars feature (experimental, don't use yet)
- initial release of `observeChanges` option (experimental). Available for all supported browsers except IE 7-8 (uses Object.observe when possible or a custom shim based on [Starcounter-Jack/JSON-Patch](https://github.com/Starcounter-Jack/JSON-Patch))

Bugfixes:
- mouse wheel didn't scroll the window when cursor was over Handsontable ([#383](https://github.com/warpech/jquery-handsontable/issues/383), [#627](https://github.com/warpech/jquery-handsontable/issues/627))
- methods `countVisibleRows` and `countVisibleCols` were broken since version 0.9.0 ([#711](https://github.com/warpech/jquery-handsontable/issues/711))
- WalkontableDom.prototype.offset now returns offset relatively to the document also for position: fixed
- fix scrolling on border cases when table height was the size of the container

Docs:
- new demo page [Options](http://handsontable.com/demo/options.html). Currently features one option but this will improve over time
- added new file [CONTRIBUTING.md](CONTRIBUTING.md). Will be updated with more information soon

## [0.9.1](https://github.com/warpech/jquery-handsontable/tree/v0.9.1) (May 22, 2013)

Bugfix:
- `beforeKeyDown` event is now also triggered from text editor handler

Docs:
- demo page [Callbacks](http://handsontable.com/demo/callbacks.html) now features all callbacks
- new demo page for [beforeKeyDown](http://handsontable.com/demo/beforeKeyDown.html) event

## [0.9.0](https://github.com/warpech/jquery-handsontable/tree/v0.9.0) (May 21, 2013)

Features:
- cell renderer and editor may now be declared as strings provided they are aliased in the lookup map ([docs](https://github.com/warpech/jquery-handsontable/wiki/Options#column-options), [demo](http://handsontable.com/demo/conditional.html), [#667](https://github.com/warpech/jquery-handsontable/issues/667))
- new event hook `beforeKeyDown` ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events))

Bugfixes:
- fix demo page buttons.html ([#602](https://github.com/warpech/jquery-handsontable/issues/602))

Web Component updates:
- update [Web Component demo](http://handsontable.com/) with tiny dashboard
- update Toolkitchen Toolkit to Polymer (@3aec92c)
- use unmodified Handsontable JS and CSS files inside the component
- include all Web Component dependencies inside HTML Import (you just import Polymer and one HTML file!)
- Web Component now uses jQuery 2.0.0 (bundled in), but in future will not depend on jQuery
- remove jQuery UI datepicker from Web Component version (it won't work, as described here: http://bugs.jquery.com/ticket/13342)

Other:
- date cell type: upgrade to jQuery UI 1.10.3
- introduce WalkontableViewport abstraction
- fix problem with row header fixed width (now width is dynamically checked) ([#402](https://github.com/warpech/jquery-handsontable/issues/402), [#475](https://github.com/warpech/jquery-handsontable/issues/475))

## [0.9.0-beta2](https://github.com/warpech/jquery-handsontable/tree/v0.9.0-beta2) (May 15, 2013)

Features:
- consistency: now all `on*` events are renamed to `after*` (see [Events](https://github.com/warpech/jquery-handsontable/wiki/Events) wiki page)
- new paste methods ([docs](https://github.com/warpech/jquery-handsontable/wiki/Options))
- new methods:
  - getDataAtRow ([docs](https://github.com/warpech/jquery-handsontable/wiki/Methods))
  - getDataAtCol ([docs](https://github.com/warpech/jquery-handsontable/wiki/Methods))
  - getDataAtProp ([docs](https://github.com/warpech/jquery-handsontable/wiki/Methods))
  - spliceCol ([docs](https://github.com/warpech/jquery-handsontable/wiki/Methods))
  - spliceRow ([docs](https://github.com/warpech/jquery-handsontable/wiki/Methods))

Bugfixes:
- fix problem with clearing `animate` function interval ([#456](https://github.com/warpech/jquery-handsontable/issues/456))
- fix auto resize column when double clicked on `.manualColumnResizer` ([#594](https://github.com/warpech/jquery-handsontable/issues/594))
- fix undo/redo event handler (change `datachange.handsontable` event to `afterChange` hook)
- fix inline styles in "Edit in JSFiddle" code generation
- fix horizontal scrolling in IE8 ([#583](https://github.com/warpech/jquery-handsontable/issues/583))

Other:
<!--- NEEDS FIX: rewrite Handsontable removeRow plugin (while resolving issue [#602](https://github.com/warpech/jquery-handsontable/issues/602))-->
- new demo pages: [Pagination](http://handsontable.com/demo/pagination.html) and [Search](http://handsontable.com/demo/search.html)

## [0.9.0-beta1](https://github.com/warpech/jquery-handsontable/tree/v0.9.0-beta1) (May 7, 2013)

Features:
- improved [Options](https://github.com/warpech/jquery-handsontable/wiki/Options) model. Cell properties now inherit from Column properties constructor, which inherit from Handsontable Constructor. This is based on JavaScript prototypal inheritance, rather than `$.extend` as previously
- new [Events](https://github.com/warpech/jquery-handsontable/wiki/Events) architecture (common for callbacks and plugin hooks)
- new events available:
  - afterRender ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events), [#597](https://github.com/warpech/jquery-handsontable/issues/597))
  - afterColumnResize ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events), [#557](https://github.com/warpech/jquery-handsontable/issues/557))
  - afterColumnMove ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events), [#557](https://github.com/warpech/jquery-handsontable/issues/557))
  - afterCreateRow ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events), [#122](https://github.com/warpech/jquery-handsontable/issues/122), [#344](https://github.com/warpech/jquery-handsontable/issues/344))
  - afterCreateCol ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events), [#122](https://github.com/warpech/jquery-handsontable/issues/122))
  - afterRemoveRow ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events), [#69](https://github.com/warpech/jquery-handsontable/issues/69), [#227](https://github.com/warpech/jquery-handsontable/issues/227))
  - afterRemoveCol ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events))
  - beforeAutofill ([docs](https://github.com/warpech/jquery-handsontable/wiki/Events), [#200](https://github.com/warpech/jquery-handsontable/issues/200), [#133](https://github.com/warpech/jquery-handsontable/issues/133), [#36](https://github.com/warpech/jquery-handsontable/issues/36))
- `setDataAtCell` method now accepts `source` string as second parameter (if first parameter is `changes` array)

Bugfixes:
- fix problem of rendering an unspecified height table with no rows
- `onBeforeChange` now allows to remove one change from array by assigning it null value (`changes[i] = null`)

Other:
- move `jquery.handsontable.js` and `jquery.handsontable.css` to `dist/`

## [0.8.23](https://github.com/warpech/jquery-handsontable/tree/v0.8.23) (May 3, 2013)

Features:
- Handsontable will not be rendered if the container is not attached to DOM or it's style is `display: none`
- new configuration option `observeDOMVisibility` (default `true`) will attempt to rerender it once it is attached to DOM or style changed to `display: block`

Bugfixes:
- Backbone Collections throw error in loadData ([#606](https://github.com/warpech/jquery-handsontable/issues/606))
- auto column size did not consider CSS style of each instance separately
- vertical mousewheel scrolling does not work without horizontal scrollbar ([#541](https://github.com/warpech/jquery-handsontable/issues/541))

## [0.8.22](https://github.com/warpech/jquery-handsontable/tree/v0.8.22) (Apr 29, 2013)

Features:
- first version to support [W3C Web Components](http://handsontable.com/demo/web_component.html)! In this proof-of-concept state, better don't bother to follow that link in browser different than Chrome
- text renderer now adds class name `htDimmed` to read only cells
- `TD.htDimmed` rule added to CSS file

Bugfix:
- table with set `width` and undefined `height` was shrinking on window resize
- onChange fired twice when changing an autocomplete cell (fixes [#260](https://github.com/warpech/jquery-handsontable/issues/260), [#530](https://github.com/warpech/jquery-handsontable/issues/530), [#531](https://github.com/warpech/jquery-handsontable/issues/531), [#534](https://github.com/warpech/jquery-handsontable/issues/534))

## [0.8.21](https://github.com/warpech/jquery-handsontable/tree/v0.8.21) (Apr 24, 2013)

Feature:
- [Fixed rows & columns](http://handsontable.com/demo/fixed.html)

Bugfix:
- focusCatcher produced a 1x1 px red pixel in top left corner

## [0.8.20](https://github.com/warpech/jquery-handsontable/tree/v0.8.20) (Apr 19, 2013)

Bugfixes:
- source parameter should be `edit` when cell value is changed through editor ([#566](https://github.com/warpech/jquery-handsontable/issues/566))
- getRowHeaders returns NaN when no argument given - should return array of all row headers ([#568](https://github.com/warpech/jquery-handsontable/issues/568), [#352](https://github.com/warpech/jquery-handsontable/issues/352))
- getColHeaders returns NaN when no argument given - should return array of all column headers ([#569](https://github.com/warpech/jquery-handsontable/issues/569), [#382](https://github.com/warpech/jquery-handsontable/issues/382))
- selected area class name was not applied on scrolling (tdCache was not bound to instance)
- fix cell focusing problems ([#549](https://github.com/warpech/jquery-handsontable/issues/549), [#506](https://github.com/warpech/jquery-handsontable/issues/506), [#573](https://github.com/warpech/jquery-handsontable/issues/573))
- currentRowClassName and currentColClassName not kept while scrolling ([#455](https://github.com/warpech/jquery-handsontable/issues/455))

Other:
- refactor row and column header DOM operations to be consistently defined in `tableView.js`
- remove `asyncRendering` mode that was causing more trouble than benefit
- as the result, code is now 100 lines shorter and more stable!

## [0.8.19](https://github.com/warpech/jquery-handsontable/tree/v0.8.19) (Apr 12, 2013)

Bugfix:
- table width was not correctly read from container width

## [0.8.18](https://github.com/warpech/jquery-handsontable/tree/v0.8.18) (Apr 12, 2013)

Features:
- added "Maximize HOT table" button in first example on [Scroll demo](handsontable.com/demo/scroll.html) page ([#495](https://github.com/warpech/jquery-handsontable/issues/495))

Bugfixes:
- clicking on checkbox renderer does not change state ([#543](https://github.com/warpech/jquery-handsontable/issues/543))
- checkbox readonly is not working ([#555](https://github.com/warpech/jquery-handsontable/issues/555))

Other:
- refactored Walkontable code that measures column width strategy (for better performance and stability)
- moved reading DOM settings from tableView.js core.js (new method `parseSettingsFromDOM`)

## [0.8.17](https://github.com/warpech/jquery-handsontable/tree/v0.8.17) (Mar 31, 2013)

Features:
- performance: remove jQuery dependency from many places
- performance: in cell renderers, replace `innerHTML` with `createTextNode`
- better integration with Twitter Bootstrap (fixes [#78](https://github.com/warpech/jquery-handsontable/issues/78))

Bugfixes:
- empty cell not shown in Firefox when not in standards mode ([#418](https://github.com/warpech/jquery-handsontable/issues/418)). This is questionable as a bug but anyway we fixed it.
- continued fix for #461
- fix problems when removing rows/columns using context menu ([#523](https://github.com/warpech/jquery-handsontable/pull/523))

Other:
- new editor inheritance model ([#516](https://github.com/warpech/jquery-handsontable/pull/516))
- `src/3rdparty/walkontable.js` has been divided into many source files in `src/3rdparty/walkontable/src/*`. Build process is updated to use Walkontable source files now
- 3 Grunt test tasks are available now: `grunt test`, `grunt test:handsontable`, `grunt test:walkontable`

## [0.8.16](https://github.com/warpech/jquery-handsontable/tree/v0.8.16) (Mar 26, 2013)

Features:
- [Handsontable in Handsontable editor](http://handsontable.com/demo/handsontable.html)
- performance and code quality fixes
- `height` and `width` settings can now be functions (that return a number)

Bugfixes:
- autocomplete menu did not reset `<li>` margin
- `destroy()` of one Handsontable instance made other instances on the same page unfunctional
- Autocomplete (Bootstrap Typeahead) did not allow empty string as a value ([#254](https://github.com/warpech/jquery-handsontable/issues/254))
- outsideClickDeselects : false disables all focus in other inputs outside the table ([#408](https://github.com/warpech/jquery-handsontable/issues/408))
- can't scroll all the way horizontally ([#430](https://github.com/warpech/jquery-handsontable/issues/430))
- scrollable Handsontable does not work well with Twitter Bootstrap ([#224](https://github.com/warpech/jquery-handsontable/issues/224))
- weirdly shrinking table when height attribute was not set ([#461](https://github.com/warpech/jquery-handsontable/issues/461))

Other:
- trying to load a string as a data source now throws an error

## [0.8.15](https://github.com/warpech/jquery-handsontable/tree/v0.8.15) (Mar 18, 2013)

Features:
- new callbacks: `onSelectionEnd` and `onSelectionEndByProp` (see [README.md](https://github.com/warpech/jquery-handsontable) for usage information)
- new demo page [Callbacks](http://handsontable.com/demo/callbacks.html)
- **breaking change:** `getSelected` method output has slightly changed. Was: [`topLeftRow`, `topLeftCol`, `bottomRightRow`, `bottomRightCol`]. Is: [`startRow`, `startCol`, `endRow`, `endCol`]. This gives information about the direction of the selection - now you can tell if the selection started from left to right or otherwise.

Bugfixes:
- `outsideClickDeselects: false` disables all focus in other inputs outside the table ([#408](https://github.com/warpech/jquery-handsontable/issues/408))
- copy paste in Mac Safari didn't work ([#470](https://github.com/warpech/jquery-handsontable/issues/470))
- table jumps back and forth when scrolling ([#432](https://github.com/warpech/jquery-handsontable/issues/432))
- destroy doesn't unload context menu functionality ([#434](https://github.com/warpech/jquery-handsontable/issues/434))
- throwed error when Enter key was pressed on autocomplete cell in the last row ([#497](https://github.com/warpech/jquery-handsontable/issues/497))
- Autocomplete in strict mode allows values other than predefined ([#405](https://github.com/warpech/jquery-handsontable/issues/405))

## [0.8.14](https://github.com/warpech/jquery-handsontable/tree/v0.8.14) (Mar 14, 2013)

Features:
- now, your data source can be a function! See the last section of the [Array, object and function data sources](http://handsontable.com/demo/datasources.html) page for examples (fixes [#471](https://github.com/warpech/jquery-handsontable/pull/471), [#435](https://github.com/warpech/jquery-handsontable/pull/435), [#261](https://github.com/warpech/jquery-handsontable/issues/261))
- also the column `data` property can be a function as well! Again, see the last section of the [data sources](http://handsontable.com/demo/datasources.html) page for examples
- new methods: `countEmptyRows`, `countEmptyCols`, `isEmptyRow`, `isEmptyCol`. You can define your own functions for `isEmptyRow` and `isEmptyCol` (see [README.md](https://github.com/warpech/jquery-handsontable) for details)

Bugfix:
- replace reference to non-existent Exception with Error ([#494](https://github.com/warpech/jquery-handsontable/pull/494))
- textarea copyPaste covering page elements ([#488](https://github.com/warpech/jquery-handsontable/issues/488), [#490](https://github.com/warpech/jquery-handsontable/issues/490))

## [0.8.13](https://github.com/warpech/jquery-handsontable/tree/v0.8.13) (Mar 12, 2013)

This release adds a `min-width: 600px` to the test suite to make sure that 100% of current tests are passing in [Travis CI](https://travis-ci.org/warpech/jquery-handsontable) (PhantomJS) as well as in the desktop browsers.

There are still many bugs to be fixed, but now it should be much easier to keep the increasing quality of future versions.

## [0.8.12](https://github.com/warpech/jquery-handsontable/tree/v0.8.12) (Mar 12, 2013)

This release doesn't really bring any improvements for the end user but is a big step towards test automation. From now on, a push to the `master` branch triggers a [Travis CI](https://travis-ci.org/warpech/jquery-handsontable) build that performs automated testing using [grunt-contrib-jasmine](https://github.com/gruntjs/grunt-contrib-jasmine). Thanks @bollwyvl for your [help](https://github.com/warpech/jquery-handsontable/pull/474)!

As a side effect, tests are now be runnable using PhantomJS. To run the test suite in PhantomJS, type `grunt test` (first run `npm install` to make sure you have all dependencies installed). PhantomJS runs the test suite much faster than desktop browsers, so it may come handy.

Bugfixes:
- `destroy` method now clears all pending timeouts

## [0.8.11](https://github.com/warpech/jquery-handsontable/tree/v0.8.11) (Mar 8, 2013)

Features:
- this may be a **breaking change** for some applications: Now the third parameter to the `alter` method tells the amount of rows/columns to be inserted/removed. This adds more consistency to the API. ([#368](https://github.com/warpech/jquery-handsontable/issues/368), [67fe67c](https://github.com/warpech/jquery-handsontable/commit/67fe67c3cf6bf4df47c02ea8c7aa6802864e97de))
- merged pull request [#474](https://github.com/warpech/jquery-handsontable/pull/474) - Travis-CI integration. The tests don't pass yet but don't worry about it yet. It is a work in progress on complete test automation. Making all tests pass on Travis CI headless browser may take few more days or weeks :)

Bugfix:
- again, this may be a **breaking change** for some applications: Fix very long standing inconsistency. Restored original `setDataAtCell` requirement of the second parameter to be a column number (as described in [README.md](https://github.com/warpech/jquery-handsontable) since always). If you happen to experience an error in `setDataAtCell` after upgrade, change your usage of this method to the new method `setDataAtRowProp` ([#284](https://github.com/warpech/jquery-handsontable/issues/284), [90e1b67](https://github.com/warpech/jquery-handsontable/commit/90e1b6765cf3aa6e0e5c5a9156b9d45da74fa055))
- new methods `setDataAtRowProp` and `getDataAtRowProp` that set/get data according to the property name in data source. See [README.md](https://github.com/warpech/jquery-handsontable) for clarification ([#284](https://github.com/warpech/jquery-handsontable/issues/284), [90e1b67](https://github.com/warpech/jquery-handsontable/commit/90e1b6765cf3aa6e0e5c5a9156b9d45da74fa055))
- merged pull request [#266](https://github.com/warpech/jquery-handsontable/pull/266) - fix countCols for arrays with column settings

## [0.8.10](https://github.com/warpech/jquery-handsontable/tree/v0.8.10) (Mar 7, 2013)

Bugfix:
- inline cell styles applied by cell renderer were not removed on table scroll ([#353](https://github.com/warpech/jquery-handsontable/issues/353), [#376](https://github.com/warpech/jquery-handsontable/issues/376), [a9b328d](https://github.com/warpech/jquery-handsontable/commit/a9b328d2fcbcb7e7a05f1d2494a1f9062bd17a37))

Docs:
- simplify CSS for demo pages (get rid of `bottomSpace` classes)
- refresh the style of jsFiddle links

## [0.8.9](https://github.com/warpech/jquery-handsontable/tree/v0.8.9) (Mar 6, 2013)

This is a feature release of a new cell type. For people waiting for some bug fixes, I promise next release will focus on fixing some important bugs!

Features:
- **Date cell type**. Updated pages [Date](http://handsontable.com/demo/date.html) and [Cell types](http://handsontable.com/demo/renderers.html). Solves issue [#431](https://github.com/warpech/jquery-handsontable/issues/431)
- refactored the `text`, `autocomplete` and `date` cell editors to share as much code as possible

## [0.8.8](https://github.com/warpech/jquery-handsontable/tree/v0.8.8) (Mar 4, 2013)

Bugfixes:
- `startRows`/`startCols` option did not work as described in README.md. This parameters should be only taken into account when NO data source is provided ([5c865ba](https://github.com/warpech/jquery-handsontable/commit/5c865ba15dcb7d9f93a47b14aedfc96751bcbb7a))
- finish editing should move the focus aways from textarea to table cell ([f4f6496](https://github.com/warpech/jquery-handsontable/commit/f4f649600311ba527c19dc2e8f73af2e764c54d6))

## [0.8.7](https://github.com/warpech/jquery-handsontable/tree/v0.8.7) (Mar 1, 2013)

Bugfixes:
- use default cell editor for a cell that has declared only cell renderer ([#453](https://github.com/warpech/jquery-handsontable/issues/453), [a5c61a2](https://github.com/warpech/jquery-handsontable/commit/a5c61a26b9e833abd25afa31aee4199cc6810590))
- copy/paste did not work on Mac since 0.8.6 ([#348](https://github.com/warpech/jquery-handsontable/issues/348), [463d5c9](https://github.com/warpech/jquery-handsontable/commit/463d5c918b85b2dc74df2669047134c23ae15fcc))
- global shortcuts (like CTRL+A) should be blocked when cell is being edited ([8363008](https://github.com/warpech/jquery-handsontable/commit/8363008c3756ea869f50b2ad8a213839a50ad807))
- numeric cell editor did not convert cell data to number type when data source was an object ([b09f6d3](https://github.com/warpech/jquery-handsontable/commit/b09f6d3666d238ac0ae849937152baffa6fb2824))
- another attempt to solve scrolling to the top of table on any key press if the top is not on the screen ([#348](https://github.com/warpech/jquery-handsontable/issues/348), [d37859b](https://github.com/warpech/jquery-handsontable/commit/d37859b6acdaef0be8b886b33404144c7cf21227))

## [0.8.6](https://github.com/warpech/jquery-handsontable/tree/v0.8.6) (Feb 27, 2013)

Features:
- **Numeric cell type**. Updated pages [Numeric](http://handsontable.com/demo/numeric.html) and [Column sorting](http://handsontable.com/demo/sorting.html). Solves issues [#443](https://github.com/warpech/jquery-handsontable/issues/443), [#397](https://github.com/warpech/jquery-handsontable/issues/397), [#336](https://github.com/warpech/jquery-handsontable/issues/336). Partially solves issue [#121](https://github.com/warpech/jquery-handsontable/issues/121) ([a052013](https://github.com/warpech/jquery-handsontable/commit/a052013049ccf6ca75a7104ddeaaec2f84961f93))
- autoColumnSize feature is now aware of renderer functions (before this, cells rendered with autocomplete and numeric renderer were too narrow) ([7770f8a](https://github.com/warpech/jquery-handsontable/commit/7770f8a499e5c21891308bdb4d1111bfc79dd2dc))

Bugfix:
- scrolls to top of table on any key press if the top is not on the screen ([#348](https://github.com/warpech/jquery-handsontable/issues/348), [290cde9](https://github.com/warpech/jquery-handsontable/commit/290cde93503686f1a89e5533662e3c9ca80d880e), [408f29d](https://github.com/warpech/jquery-handsontable/commit/408f29d6a65e797572adf45873780c3adfc0bf4d))
- cell editor was using a wrong cell value if column order was manually changed ([#367](https://github.com/warpech/jquery-handsontable/issues/367))
- cell editor dimensions were not refreshed if table was rerendered during editing
- fix recalculation of container dimensions after window resize ([#400](https://github.com/warpech/jquery-handsontable/issues/400), [#428](https://github.com/warpech/jquery-handsontable/issues/428))

Other:
- reimplement cell editing abstraction. Now TextEditor `<textarea>` is decoupled from cell selection and copy/paste keyboard handling ([14e4cc1](https://github.com/warpech/jquery-handsontable/commit/14e4cc1d61d92b49317aed53604b87cdd1f522b0), [1eb01bd](https://github.com/warpech/jquery-handsontable/commit/1eb01bdcc975dec4fe8f2557a668d057d34b65d2), [f2b412f](https://github.com/warpech/jquery-handsontable/commit/f2b412f50027d3b4594bef464994ca8ad4f551a6), [e5af5d7](https://github.com/warpech/jquery-handsontable/commit/e5af5d7c8cbd8990398e8029c2955d7f8e22386c))
- upgrade Bootstrap Typeahead to v2.3.0
- build system now requires Grunt 0.4.0 (read instructions how to upgrade here: http://gruntjs.com/upgrading-from-0.3-to-0.4) ([3ebed1d](https://github.com/warpech/jquery-handsontable/commit/3ebed1ddb771b1d21ebf810f82df004755d420f4), [6d01ae5](https://github.com/warpech/jquery-handsontable/commit/6d01ae528ed84171d72f34eb3f25f4137f96a7ec))

## [0.8.5](https://github.com/warpech/jquery-handsontable/tree/v0.8.5) (Feb 18, 2013)

Bugfix:
- clear currentRowClassName and currentColumnClassName when refreshing selections ([#398](https://github.com/warpech/jquery-handsontable/issues/398), [8df5de9](https://github.com/warpech/jquery-handsontable/commit/8df5de9a345a650a8e588bc4fe3da5d3e2075972)) - thanks @jaycfields

## [0.8.4](https://github.com/warpech/jquery-handsontable/tree/v0.8.4) (Feb 17, 2013)

Features:
- add $.browser shim for compatibility with jQuery 1.9 ([#378](https://github.com/warpech/jquery-handsontable/issues/378), [#389](https://github.com/warpech/jquery-handsontable/issues/389), [13d72c8](https://github.com/warpech/jquery-handsontable/commit/13d72c8cb10f733e1149f71f156a6c6a4f8cb3dc))

Other:
- add jQuery Plugins Registry manifest file

## [0.8.3](https://github.com/warpech/jquery-handsontable/tree/v0.8.3) (Jan 23, 2013)

Features:
- optimize jquery-autoresize plugin: arclones element is emptied before injecting another node
- new configuration options `currentRowClassName` and `currentColClassName` along with new example page [Highlight current row & column](http://handsontable.com/demo/current.html) [TODO: write tests]
- [Manual column resize](http://handsontable.com/demo/column_resize.html)
- [Column sorting](http://handsontable.com/demo/sorting.html)
- compability: automatic column size is asserted `true` when `colWidths` option is not provided
- apply automatic column size when double clicked on manual resize handle [TODO: write tests]
- Scroll example page describes difference between available [column stretching modes](http://handsontable.com/demo/scroll.html) (all, last [default], none)
- manual column move

Breaking changes:
- `loadData` no longer sends list of changes to `onChange` callback. That was not performant. Now if sends `null` changes object and `loadData` as source string.

Bugfixes:
- overflow auto only worked when declared in inline style (not in CSS class) (issue #339 point 6)
- during initialization, sliders were shown for a while in the top left corner
- scrolling issues (#343, #331, partially #360)
- deselection when param `outsideClickDeselects` set to true (issue #351)
- order of callbacks when clicked outside of a cell (issue #269)
- context menu was shown when clicked outside of the table (issue #306)

## [0.8.2](https://github.com/warpech/jquery-handsontable/tree/v0.8.2) (Jan 7, 2013)

Features:
- new options `copyRowsLimit`, `copyColsLimit` and callback `onCopyLimit`. The options configure the amount of rows and columns that can be copied to clipboard (default 1000). The callback will ba called if the limit is exceeded (response to an issue first reported by @itanex / #295)
- performance fixes for selecting all cells (CTRL+A)
- auto width [TODO: write more]
- auto stretch [TODO: write more]

Bugfix:
- `selectCells` did not perform multiple selection when given 4 parameters

## [0.8.1](https://github.com/warpech/jquery-handsontable/tree/v0.8.1) (Jan 6, 2013)

Bugfixes:
- fixed error when loading a new data source with fewer rows/columns
- using `minCols` with `columns` option caused an infinite loop. Now `columns` length sets a fixed number of columns (options `startCols`, `minCols`, `maxCols` will be ignored when `columns` is set) (fix #334)
- onChange was triggered before data was rendered (fix #333)
- public `destroy` method did not unbind Handsontable events (fix #335)
- fix error when data row was externally removed while scrolling

Other changes:
- [Custom HTML demo page](http://handsontable.com/demo/renderers_html.html) (Rendering custom HTML in header) did not work well
- JSFiddle links now also work in [Context Menu demo page](http://handsontable.com/demo/contextmenu.html)
- tests are now passing 100% in Chrome, FF, IE9 and Opera. Tests are 99% passing in IE7-8, but remaining 1% does not affect normal operation in these browsers

## [0.8.0](https://github.com/warpech/jquery-handsontable/tree/v0.8.0) (Jan 2, 2013)

After series of bugfixes in last 3 beta version, this is the first stable release in 0.8.x branch. From now on, I will try to update critical issues more frequently.

New features since 0.8.0-beta3:
- new methods `rowOffset`, `colOffset`, `countVisibleRows`, `countVisibleCols`
- new callback `onCreateRow` [TODO: write tests]
- `dataSchema` can now be a function that returns object/array [TODO: write tests]
- when using `overflow: auto`, only relevant scrollbars should be displayed (first reported by @dansabirov / #295)
- fixed scrolling with arrow keys
- column title can be given as `columns[].title` (not only colHeaders[]) [TODO: write tests]
- column width can be given as `columns[].width` (not only colWidths[]) [TODO: write tests]
- column type can be set using simple strings: `autocomplete`, `checkbox`

Other changes:
- public methods `colCount`, `rowCount` are removed. Use `countRows()` and `countCols()` public methods instead
- public methods `setCellReadOnly`, `setCellEditable` are removed. Use `readOnly` cell property to make a cell read-only. See `demo/readonly.html` for examples
- options `minWidth`, `minHeight` are removed. Their definitions were to blurry and usage case too limited. Use `width` and `height` options instead and provide as many rows/columns in your data source as you need
- add `render` method to README.md

Bugfixes since 0.8.0-beta3:
- enter on last row/col should add more rows/cols if minSpareRows/minSpareCols > 0
- double clicking on fill handle fills the column to the last non-empty row
- pressing enter/tab in autocomplete moves to next row/column
- CTRL+A works slow on large data sets (as reported by @brivazac / #295)
- CTRL+A, CTRL+C sequence did not work well if CTRL was not released
- page up/page down worked wrongly

Known issues:
- clicking on cell & row borders has no effect (first reported by @cscribner / #295)
- copy of large selection (5k, 10k, 100k rows etc) freezes IE8 (first reported by @itanex / #295). Below 1k rows works fine. The only solution I can think of right now is to set copy limit in IE8 to 1000 rows.
- paste of large selection (100k rows) freezes Firefox (first reported by @ravio / #303)
- autocomplete does not work with empty field in source; autocomplete strict mode looks broken (as reported by @MDron / #303)
- scrolling mouse wheel/page up/page down should not block the window scroll if the first row/last row was reached
- page up/page down does not behave exactly as in Google Docs (moves selected cell to first visible row). This is because transformStart implies scrollToCell. It should be decoupled sometime in future

## [0.8.0-beta3](https://github.com/warpech/jquery-handsontable/tree/v0.8.0-beta3) (Dec 18, 2012)

Beta preview has been updated: http://handsontable.com/0.8.0/

Bugfixes since 0.8.0-beta2:
- fixed scrolling with touchpad (as reported by @codename- / #303)
- fixed double click on cell (as reported by @MDron, @ravio / #303)
- CTRL+A then Delete did not remove redundant empty rows in scroll example (as reported by @ravio / 303)
- fill handle (drag-down) feature is currently broken (as reported by @chaowarat / 301)
- CTRL+Enter while editing multiselection did not work (should apply the value to all the selected cells)
- now works in IE7

Other changes since 0.8.0-beta2:
- removed `jquery.ui.position.js` from `jquery.handsontable.full.js`, because it seems to have no effect (explained in `demo/contextmenu.html`)

## [0.8.0-beta2](https://github.com/warpech/jquery-handsontable/tree/v0.8.0-beta2) (Dec 14, 2012)

Beta preview has been updated: http://handsontable.com/0.8.0/

New features since 0.8.0-beta1:
- now the table is rendered even faster with `requestAnimationFrame`

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

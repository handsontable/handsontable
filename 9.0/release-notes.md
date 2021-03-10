---
title: Release notes
permalink: /9.0/release-notes
canonicalUrl: /release-notes
---

# {{ $frontmatter.title }}

[[toc]]

## 8.3.1
**Fixed**

* Fixed an issue where the CSS files could be eliminated during tree-shaking [#7516](https://github.com/handsontable/handsontable/issues/7516)
## 8.3.0

**Added**

* Introduced a new feature that allows postponing the table render and internal data cache update. The table rendering time can be reduced several-fold times by batching (using the `batch` method), multi-line API calls, or manually suspending rendering using the `suspendRender` and `resumeRender` methods. [#7274](https://github.com/handsontable/handsontable/issues/7274)
* Introduced a possibility to import:
  * plugins
  * cell types
  * editors
  * renderers
  * validators
    
  as separate modules, along with the Handsontable _base_. This change allows utilizing only the parts of Handsontable the end application is actually using, without the overhead of the full bundle. [#7403](https://github.com/handsontable/handsontable/issues/7403)
* Added a new workflow for managing and generating changelogs. [#7405](https://github.com/handsontable/handsontable/issues/7405)

**Fixed**

* Fixed a bug with auto-execution of the first item in the ContextMenu plugin. [#7364](https://github.com/handsontable/handsontable/issues/7364)
* Fixed a bug where column sorting with multi column sorting crashed the table. [#7415](https://github.com/handsontable/handsontable/issues/7415)
* Added a missing entry for the `skipRowOnPaste` option in the TypeScript definition file. [#7394](https://github.com/handsontable/handsontable/issues/7394)
* Added missing tests to prevent issue #7377 from resurfacing. [#7396](https://github.com/handsontable/handsontable/issues/7396)
* Fixed an issue where altering columns did not update filters attached to columns. [#6830](https://github.com/handsontable/handsontable/issues/6830)
* Fixed typos and wrong return types in the TypeScript definition file. [#7399](https://github.com/handsontable/handsontable/issues/7399), [#7400](https://github.com/handsontable/handsontable/issues/7400)
* Updated the dependencies causing potential security issues, as well as Babel configuration needed after the update. [#7463](https://github.com/handsontable/handsontable/issues/7463)

**Changed**

* Corrected a typo in a helper method from the Column Sorting plugin. [#7375](https://github.com/handsontable/handsontable/issues/7375)
* Optimized the performance of rendering the table with numerous spare rows (for `minSpareRows`, `minSpareCols`, `minRows`, and `minCols` options). [#7439](https://github.com/handsontable/handsontable/issues/7439)

## 8.2.0

Released on 12th of November, 2020

**Added**

* Added a new type of an Index Map named `LinkedPhysicalIndexToValueMap`. ([#7276](https://github.com/handsontable/handsontable/issues/7276))
* Added an external dependency, `DOMPurify`, to add HTML sanitization that should minimize the risk of inserting insecure code using Handsontable built-in functionalities. ([#7292](https://github.com/handsontable/handsontable/issues/7292))

**Fixed**

* Fixed an issue where the container was not updated after trimming rows. ([#7241](https://github.com/handsontable/handsontable/issues/7241))
* Fixed an issue where the `htmlToGridSettings` helper threw an error if a `<table>` with no rows was passed. ([#7311](https://github.com/handsontable/handsontable/issues/7311))
* Fixed an issue where the sorting indicator moved incorrectly when a column was added. ([#6397](https://github.com/handsontable/handsontable/issues/6397))
* Fixed an issue where untrimming previously trimmed rows would sometimes result in the table instance not refreshing its height, leaving the row headers improperly rendered. ([#6276](https://github.com/handsontable/handsontable/issues/6276))
* Fixed an issue where the hidden columns plugin caused unintended scrolling when some cells were hidden. ([#7322](https://github.com/handsontable/handsontable/issues/7322))
* Fixed an issue where an error was thrown while hovering over row/column headers. ([#6926](https://github.com/handsontable/handsontable/issues/6926))
* Fixed an issue where table validation caused incorrect data rendering if the hidden rows/column plugin was enabled. ([#7301](https://github.com/handsontable/handsontable/issues/7301))
* Fixed an issue where adding 0 rows to the table ended with doubled entries in index mappers' collections. ([#7326](https://github.com/handsontable/handsontable/issues/7326))
* Fixed a problem with the inconsistent behavior of the Context Menu's "Clear column" disabled status. ([#7003](https://github.com/handsontable/handsontable/issues/7003))
* Fixed an issue with parsing multiline cells on pasting `text/html` mime-type. ([#7369](https://github.com/handsontable/handsontable/issues/7369))

## 8.1.0

Released on 1st of October, 2020

**Added**

* Added support for resizing non-contiguous selected rows and columns. ([#7162](https://github.com/handsontable/handsontable/issues/7162))
* Added e2e tests and reorganized already existing ones. ([#6491](https://github.com/handsontable/handsontable/issues/6491))

**Changed**

* Updated dependencies to meet security requirements. ([#7222](https://github.com/handsontable/handsontable/issues/7222))
* Improved performance for `TrimRows`, `HiddenRows` and `HiddenColumns` plugins for big datasets with many trimmed/hidden indexes. ([#7223](https://github.com/handsontable/handsontable/issues/7223))

**Fixed**

* Fixed an issue where the value did not show if the first part of the merged area was hidden. ([#6871](https://github.com/handsontable/handsontable/issues/6871))
* Fixed an issue where after selecting the top-left element, resizing the row range was not possible. ([#7162](https://github.com/handsontable/handsontable/issues/7162))
* Fixed a bug introduced within ([#6871](https://github.com/handsontable/handsontable/issues/6871))
* Fixed an issue where column headers were cut off after hiding and revealing the columns with the `HiddenColumns` plugin. ([#6395](https://github.com/handsontable/handsontable/issues/6395))
* Fixed an issue where a redundant row was added during copy/paste operations in some cases. ([#5961](https://github.com/handsontable/handsontable/issues/5961))
* Fixed an issue where too many values were pasted after a column was hidden. ([#6743](https://github.com/handsontable/handsontable/issues/6743))
* Fixed a bug where an attempt to move collapsed parent rows, with the `NestedRows` plugin enabled, resulted in an error. ([#7132](https://github.com/handsontable/handsontable/issues/7132))
* Fixed an issue where, after column or row alteration, Handsontable threw an error if `ColumnSummary` was enabled without defined row ranges. ([#7174](https://github.com/handsontable/handsontable/issues/7174))
* Fixed an issue where using `updateSettings` was breaking column sorting in specific cases. ([#7228](https://github.com/handsontable/handsontable/issues/7228))
* Fixed an issue where, if `fixedColumnsLeft` was defined, rows had their left borders missing after disabling the row headers using `updateSettings`. ([#5735](https://github.com/handsontable/handsontable/issues/5735))
* Fixed an issue where the Handsontable instance could fall into an infinite loop during vertical scrolling. It only happened when the scrollable element was the `window` object. ([#7260](https://github.com/handsontable/handsontable/issues/7260))
* Fixed an issue with moving rows to the last row of the table when the `NestedRows` plugin was enabled. Repaired some other minor moving-related bugs as well. ([#6067](https://github.com/handsontable/handsontable/issues/6067))
* Fixed an issue with adding an unnecessary extra empty line in cells on Safari. ([#7262](https://github.com/handsontable/handsontable/issues/7262))
* Fixed an issue with clipped column headers when they were changed before or within usage of `updateSettings`. ([#6004](https://github.com/handsontable/handsontable/issues/6004))

## 8.0.0

Released on 5th of August, 2020

**Major changes**

This version introduces a completely new architecture for row and column management - index mapper, which is responsible for the storage and management of index values. In prior versions, the calculation between physical and visual indexes was based on callbacks between hooks. That solution slowly led to inconsistencies and the calculation was imperfect in some cases. To fix that there was a major change in the whole system of mapping the indexes. The current solution offers an easier and more straightforward way to perform CRUD and move operations on rows and columns. It keeps all data in one place so getting and managing information is easier and less prone to bugs.

The existing features were adapted to benefit from the new architecture. Apart from that, extra methods and hooks were added and there are few depreciations and removals, too.

**Breaking changes**

* Modifying the table's data by reference and calling `render()` will not work properly anymore. From this point onward, all the data-related operations need to be performed using the API methods, such as `populateFromArray` or `setDataAtCell`.
* The `modifyRow`, `modifyCol`, `unmodifyRow`, `unmodifyCol` hooks are no longer needed and were removed. Their functionality can be achived by using API. [More information in the 8.0.0 migration guide](https://handsontable.com/docs/8.0.0/migration-guide.html).
* `skipLengthCache` hook was removed, `indexMapper` is now responsible for the cache and length.
* The `manualColumnFreeze` plugin doesn't use the `manualColumnMove` plugin anymore.
* The `collapsibleColumns` plugin doesn't use the `hiddenColumns` plugin anymore.
* The `nestedRows` and `filters` plugins don't use the `trimRows` plugin anymore.
* The `minSpareRows` and `minRows` options will ensure that the number of visible rows corresponds to the value provided to them (for example, the `trimRows` plugin won't have an impact on the number of displayed rows).
* `toPhysicalRow` and `toVisualColumn` now return `null` for non-existant rows/columns. [#5945](https://github.com/handsontable/handsontable/pull/5945)).
* The `afterLoadData` hook receives a different set of arguments. It used to be just the initialLoad flag, now the first argument is `sourceData`, followed by `initialLoad`.
* The `manualColumnFreeze` plugin will now put the unfrozen columns right next to the last frozen one.
* The `RecordTranslator` object and the `t` property available in the plugins were removed.
* After-prefixed hooks (`afterLoadData`, `afterFilter`, etc.) are now called just before the `render` call.
* Newly created rows and columns are now placed in the source data in the place calculated from its position in the visual context (they "stick" to their adjacent rows/columns). It also applies to moved rows and columns.
* When the `nestedRows` plugin is `enabled`, moving rows will be possible only using the UI or by calling the `dragRows` method of the `manualRowMove` plugin.
* The `beforeRowResize`, `afterRowResize`, `beforeColumnResize`, `afterColumnResize` hooks have the order of their arguments rearranged for the sake of consistency with other hooks and to fix an issue where multiple hooks didn't get the modified value in the pipeline: [#3328](https://github.com/handsontable/handsontable/issues/3328).
* Changed the argument structure in `collapsibleColumns`' `toggleCollapsibleSection` method: [#6193](https://github.com/handsontable/handsontable/issues/6193).
* The following sublist shows changes related to the refactor of `HiddenColumns` and `CollapsibleColumns`. They will be compatible with upcoming `IndexMappers` [#5945](https://github.com/handsontable/handsontable/pull/5945) along with other adjustments [#6547](https://github.com/handsontable/handsontable/pull/6547):
    * Hidden indexes aren’t rendered. As a consequence hooks `beforeValueRender`, `beforeRenderer`, `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` etc. will be executed just for some of the columns (just the rendered ones).
    * The `getColWidth` for hidden index will return 0 – it used to return 0.1. Also, it will no longer be called internally, the need can be now achieved by managers of rows and columns.
    * The `modifyColWidth` hook will not be called internally. However, it will be executed when the user will call the `getColWidth`.
    * Hidden indexes aren't rendered. As a consequence hooks `beforeValueRender`, `beforeRenderer`, `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` etc. will be executed just for some of the columns (just the rendered ones).
    * `listen` function from the core API used to accept `modifyDocumentFocus` as optional parameter, this parameter was removed.
    * `CustomBorders` plugin was adapted to work with `HiddenColumns` properly. From now on hiding cells at the start or the end of the range will also hide their borders. Hiding a single cell with borders will hide all of its borders. [#7083](https://github.com/handsontable/handsontable/pull/7083).
    * `CollapsibleColumns` will no longer use `HiddenColumns` plugin to work. [#6204](https://github.com/handsontable/handsontable/issues/6204).
    * Adjusted `HiddenColumns` to be compatible with upcoming `IndexMappers`. [#6547](https://github.com/handsontable/handsontable/pull/6547).
    * `hiddenRow` and `hiddenColumn` hooks were removed. They were used to check if a given index is hidden in the `HiddenColumns` and `HiddenRows` plugins. Since now there may be more sources of hiding indexes they have been replaced by `IndexMapper` with the new `isHidden` method. It keeps the broad information about hidden indexes and their sources.
    * `rowOffset` and `colOffset` were removed since they aliased the methods from Walkontable. [#6547](https://github.com/handsontable/handsontable/pull/6547).
* Changes related to adjusting `HiddenRows` to new `IndexMapper` architecture are [#6177](https://github.com/handsontable/handsontable/issues/6177):
    * Adjusted `HiddenRows` to new `IndexMapper` architecture. [#6177](https://github.com/handsontable/handsontable/issues/6177).
* Developed a unified way to identify HOT "input" elements. All input elements owned by HOT got an attribute "data-hot-input" which are identified by that key. [#6383](https://github.com/handsontable/handsontable/issues/6383).
* `NestedHeaders` plugin was rewritten, from now on, only a tree-like structure will be allowed, meaning, there will be no possibility to place nested headers in-between layers. [#6716](https://github.com/handsontable/handsontable/pull/6716)
* The right mouse button (`RMB`) click on the corner when there is no data will show all options disabled. [#6547](https://github.com/handsontable/handsontable/pull/6547).
* Left mouse button (`LMB`) click on the top left corner will now select all cells along with their headers. [#6547](https://github.com/handsontable/handsontable/pull/6547).
* Removed the experimental `GanttChart` plugin. [#7022](https://github.com/handsontable/handsontable/issues/7022).
* Adding properties which were not defined on initialization or by `updateSettings` to the source data is possible only by the usage of `setSourceDataAtCell`. [#6664](https://github.com/handsontable/handsontable/issues/6664).
* Passing `columns` or `data` inside the `settings` object when calling the `updateSettings` method will result in resetting states corresponding to rows and columns (ie. row/column sequence, column width, row height, freezed columns etc.). The same behavior can be seen when using `loadData`. In such cases, it is assumed that a new dataset is introduced upon calling `updateSettings` or `loadData` .[#6547](https://github.com/handsontable/handsontable/pull/6547).

**New features**

* Added the Index Mapper architecture and its API. [#5112](https://github.com/handsontable/handsontable/issues/5112) (more information available in the PRs [#5945](https://github.com/handsontable/handsontable/pull/5945) with additional changes in [#6547](https://github.com/handsontable/handsontable/pull/6547))
* Added a new `batch` method. [#5945](https://github.com/handsontable/handsontable/pull/5945) along with other adjustments ([#7068](https://github.com/handsontable/handsontable/pull/7068))

**Depreciations**

* The `observeChanges` plugin is no longer enabled by `columnSorting` and became deprecated. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* `HeaderTooltips` plugin becomes deprecated and will be removed in the next major version. [#7023](https://github.com/handsontable/handsontable/issues/7023)
* IE support is deprecated and will be removed by the end of the year. [#7026](https://github.com/handsontable/handsontable/issues/7026)

**Changelog**

* Added `modifySourceData` hook and `setSourceDataAtCell` method. [#6664](https://github.com/handsontable/handsontable/issues/6664)
* Added new argument to `scrollViewportTo` method: optional `considerHiddenIndexes` which is a `boolean`. [#6547](https://github.com/handsontable/handsontable/pull/6547)
* Added additional information available in the cell meta object - the language. [#6254](https://github.com/handsontable/handsontable/pull/6254).
* Added a possibility to allow cancelling of `autofill` in the `beforeAutofill` hook. [#4441](https://github.com/handsontable/handsontable/issues/4441)
* Added support for newer versions of moment, numbro and pikaday. [#5159](https://github.com/handsontable/handsontable/issues/5159)
* Added `afterAutoFill` hook. [#6135](https://github.com/handsontable/handsontable/issues/6135)
* Added deprecated warning messages mechanism for plugin hooks. [#6613](https://github.com/handsontable/handsontable/pull/6613)
* Added missing types for \`instance.undoRedo\`. [#6346](https://github.com/handsontable/handsontable/issues/6346)
* Added `countRenderableColumns` method to the `TableView`. [#6177](https://github.com/handsontable/handsontable/issues/6177)
* Added missing "hide" property in `CustomBorders` typings. [#6788](https://github.com/handsontable/handsontable/issues/6788)
* Added `beforeSetCellMeta` hook with an ability to cancel the changes. [#5388](https://github.com/handsontable/handsontable/issues/5388)
* Added additional test for autofill plugin. [#6756](https://github.com/handsontable/handsontable/issues/6756)
* Changed how `manualRowMove` and `manualColumnMove` plugins work [#5945](https://github.com/handsontable/handsontable/pull/5945)
* Click on a row header will select all cells (also hidden). [#2391](https://github.com/handsontable/handsontable/issues/2391)
* Extracted Cell-Meta logic from Core to separate module. [#6254](https://github.com/handsontable/handsontable/pull/6254)
* The `CellMeta` manager was refactored for future features and improvements. [#6233](https://github.com/handsontable/handsontable/issues/6233)
* Rows can be resized to less than `rowHeights`. [#6149](https://github.com/handsontable/handsontable/issues/6149)
* Left mouse button (LMB) click on the corner will now select all cells. [#6547](https://github.com/handsontable/handsontable/pull/6547)
* Passing `columns` or `data` inside the `settings` object when calling the `updateSettings` method will result in resetting states corresponding to rows and columns (ie. row/column sequence, column width, row height, freezed columns etc.). The same behavior can be seen when using `loadData`. In such cases, it is assumed that a new dataset is introduced upon calling `updateSettings` or `loadData` .[#6547](https://github.com/handsontable/handsontable/pull/6547).
* The right mouse button (`RMB`) click on the corner, column and row headers will show just some options, defined by newly created specification [#7082](https://github.com/handsontable/handsontable/pull/7082)
* Hidden indexes will no longer be rendered, as a consequence `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` will be executable only on visible (meaning, rendered) rows and columns. [#6547](https://github.com/handsontable/handsontable/pull/6547)
* The `getColWidth` for hidden index will return 0 - it used to return 0.1 [#6547](https://github.com/handsontable/handsontable/pull/6547)
* The `modifyColWidth` hook isn't called internally. However, it will be executed when the user will call the `getColWidth`. [#6547](https://github.com/handsontable/handsontable/pull/6547)
* Hidden rows/columns won't rendered anymore. As a consequence hooks `beforeValueRender`, `beforeRenderer`, `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` etc. will be executed just for some of the columns (just the renderable ones). [#6547](https://github.com/handsontable/handsontable/pull/6547)
* Selection behavior changed when hiding cells from the `ContextMenu`, now it is selecting a column on the right when there is space on right to the last selected column, selecting a column on the left otherwise. [#6547](https://github.com/handsontable/handsontable#6547)
* Developed a unified way to identify HOT "input" elements. All input elements owned by HOT got an attribute "data-hot-input" which are identified by that key. [#6383](https://github.com/handsontable/handsontable/issues/6383)
* `NestedHeaders` plugin was rewritten, from now on, only a tree-like structure will be allowed, meaning, there will be no possibility to place nested headers in-between layers. [#6716](https://github.com/handsontable/handsontable/pull/6716)
* `CustomBorders` plugin was adapted to work with `HiddenColumns` properly, from now on hiding cells at the start or at the end of a range will also hide their borders. Also, hiding a single cell with borders will hide all of its borders. [#7083](https://github.com/handsontable/handsontable/pull/7083)
* `CollapsibleColumns` will no longer use `HiddenColumns` plugin to work. [#6204](https://github.com/handsontable/handsontable/issue/6204)
* Modifying the table's data by reference and calling \`render()\` will not work properly anymore. From this point onward, all the data-related operations need to be performed using the API methods, such as `populateFromArray` or `setDataAtCell`. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* Removed dependencies between plugins: the `manualColumnFreeze` plugin doesn't use the `manualColumnMove`, the `collapsibleColumns` plugin doesn't use the `hiddenColumns` plugin, `nestedRows` plugin doesn't use the `trimRows` plugin, `filters` plugin doesn't use the `trimRows` plugin anymore. [#5945](https://github.com/handsontable/handsontable/pull/5945) along with other adjustments [#6547](https:// github.com/handsontable/handsontable/pull/6547):
* The `minSpareRows` and `minRows` options will ensure that the number of visible rows corresponds to the value provided to them (for example, the `trimRows` plugin won't have an impact on the number of displayed rows). [#5945](https://github.com/handsontable/handsontable/pull/5945)
* `toPhysicalRow` and `toVisualColumn` now return `null` for non-existant rows/columns. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* The `afterLoadData` hook receives a different set of arguments. It used to be just the initialLoad flag, now the first argument is `sourceData`, followed by `initialLoad`. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* The `manualColumnFreeze` plugin unfreezes the column just after the "line of freeze". [#5945](https://github.com/handsontable/handsontable/pull/5945)
* The `RecordTranslator` object and the `t` property available in the plugins were removed. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* After-prefixed hooks (`afterLoadData`, `afterFilter`, etc.) are now called just before the `render` call. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* Newly created rows and columns are now placed in the source data in the place calculated from its position in the visual context (they "stick" to their adjacent rows/columns). It also applies to moved rows and columns. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* When the `nestedRows` plugin is `enabled`, moving rows will be possible only using the UI or by calling the `dragRows` method of the `manualRowMove` plugin. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* The `beforeRowResize`, `afterRowResize`, `beforeColumnResize`, `afterColumnResize` hooks have the order of their arguments rearranged for the sake of consistency with other hooks. [#3328](https://github.com/handsontable/handsontable/issues/3328)
* Changed the argument structure in `collapsibleColumns`' `toggleCollapsibleSection` method. [#6193](https://github.com/handsontable/handsontable/issues/6193)
* Updated the `moment`, `numbro` and `pikaday` dependencies to their latest versions. [#6610](https://github.com/handsontable/handsontable/issues/6610)
* Standardize the \`z-index\` properties between the overlays. [#6269](https://github.com/handsontable/handsontable/pull/6269)
* `HeaderTooltips` plugin becomes deprecated and will be removed in the next major version. [#7023](https://github.com/handsontable/handsontable/issues/7023)
* IE support is depreacated and will removed by the end of the year. [#7026](https://github.com/handsontable/handsontable/issues/7026)
* Removed `firstVisibleColumn` CSS class as no longer needed. [#6547](https://github.com/handsontable/handsontable/pull/6547)
* Removed helpers that covered IE8 support or are not needed anymore. [#6525](https://github.com/handsontable/handsontable/issues/6525)
* Removed old unnecessary warning about `beforeChange` callback. [#6792](https://github.com/handsontable/handsontable/issues/6792)
* Removed `debug` key (key, css, docs). [#6672](https://github.com/handsontable/handsontable/issues/6672)
* Removed `hiddenRow` and `hiddenColumn` hooks. [#6547](https://github.com/handsontable/handsontable/pull/6547)
* Removed optional argument `modifyDocumentFocus` from the `listen` function. [#6547](https://github.com/handsontable/handsontable/pull/6547)
* Removed `rowOffset` and `colOffset` public API methods since they aliased the methods from Walkontable. [#6547](https://github.com/handsontable/handsontable/pull/6547)
* Removed the experimental `GanttChart` plugin. [#7022](https://github.com/handsontable/handsontable/issues/7022)
* Removed post-install warning from package.json file [#6608](https://github.com/handsontable/handsontable/pull/6608)
* The `modifyRow`, `modifyCol`, `unmodifyRow`, `unmodifyCol` and `skipLengthCache` hooks are no longer needed and were removed. [#5945](https://github.com/handsontable/handsontable/pull/5945)
* Fixed a problem with data not being added to the table properly with the `columnSorting` option enabled. [#2685](https://github.com/handsontable/handsontable/issues/2685)
* Fixed a problem with `loadData` not resetting the row order changed by the `manualRowMove` plugin. [#3568](https://github.com/handsontable/handsontable/issues/3568)
* Fixed a bug, where using `alter`'s `insert_row` after using the `loadData` method and sorting the data would add unintentional additional rows to the table. [#3809](https://github.com/handsontable/handsontable/issues/3809)
* Fixed a bug, where blank rows appeared in the middle of the table after using `loadData` along with the `minSpareRows` option. [#3937](https://github.com/handsontable/handsontable/issues/3937)
* Fixed a problem with the `columnSummary` plugin not working properly after adding new rows using the Context Menu and sorting the data. [#3924](https://github.com/handsontable/handsontable/issues/3924)
* Fixed a bug, where calling `loadData` with an object-based data source would not work properly. [#4204](https://github.com/handsontable/handsontable/issues/4204)
* Fixed a problem with the Hidden Columns settings being reset after calling `updateSettings`. [#4121](https://github.com/handsontable/handsontable/issues/4121)
* Fixed a bug with the `filters` plugin using incorrect indexes after moving and/or sorting the table. [#4442](https://github.com/handsontable/handsontable/issues/4442)
* Fixed a bug that caused a column to contain improper data after moving it to index `0`. [#4470](https://github.com/handsontable/handsontable/issues/4470)
* Fixed a bug with the `afterRowMove` hook receiving an improper `target` argument. [#4501](https://github.com/handsontable/handsontable/issues/4501)
* Fixed a problem with the `manualColumnFreeze` plugin enabling `manualColumnMove`, even if it was declared as `false`. [#4553](https://github.com/handsontable/handsontable/issues/4553)
* Fixed a problem with plugins using `arrayMappers` not working properly after updating the dataset. [#4567](https://github.com/handsontable/handsontable/issues/4567)
* Fixed a bug, where calling `loadData` with `minSpareRows` and `manualRowMove` enabled caused the table to improperly load the data. [#4576](https://github.com/handsontable/handsontable/issues/4576)
* Fixed a bug, where enabling `columnSorting` caused the `manualColumnFreeze` to be unusable. [#4601](https://github.com/handsontable/handsontable/issues/4601)
* Fixed a problem, where the columns were assigned improper widths after inserting additional columns or removing any of them. [#4666](https://github.com/handsontable/handsontable/issues/4666)
* Fixed a bug, where moving rows was impossible while `persistentState` was enabled. [#4713](https://github.com/handsontable/handsontable/issues/4713)
* Fixed a bug, where `manualColumnMove` didn't work if the dataset was empty. [#4926](https://github.com/handsontable/handsontable/issues/4926)
* Fixed a bug with the `collapseAll` method from the `collapsibleColumns` plugin did not work properly if `columnSorting` was enabled. [#4999](https://github.com/handsontable/handsontable/issues/4999)
* Fixed a bug, where calling `loadData` with `minSpareRows` enabled would cause unwanted blank rows to appear. [#5707](https://github.com/handsontable/handsontable/issues/5707)
* Fixed a bug with the `afterColumnMove` hook receiving an improper `target` argument. [#5173](https://github.com/handsontable/handsontable/issues/5173)
* Fixed a problem, where filtering data after moving rows would not work properly. [#5178](https://github.com/handsontable/handsontable/issues/5178)
* Fixed a bug, where calling `loadData` made `NaN` appear in the column headers. [#5369](https://github.com/handsontable/handsontable/issues/5369)
* Fixed a bug with the `skipColumnOnPaste` option not working properly when using `columnSorting` and `hiddenColumns`. [#5824](https://github.com/handsontable/handsontable/issues/5824)
* Fixed a bug with the `trimRows` plugin did not work properly after moving rows. [#5860](https://github.com/handsontable/handsontable/issues/5860)
* Fixed a problem with `minSpareRows` not working properly with the `trimRows` plugin being used. [#5862](https://github.com/handsontable/handsontable/issues/5862)
* Fixed a problem, where it was impossible to filter the data declared in the `nestedRows` plugin. [#5889](https://github.com/handsontable/handsontable/issues/5889)
* Fixed a bug, where filtering and sorting data would cause the `toVisualRow` method to return the wrong results. [#5890](https://github.com/handsontable/handsontable/issues/5890)
* Fixed a bug with the `filters` and `trimRows` plugins not working properly alongside each other. [#5915](https://github.com/handsontable/handsontable/issues/5915)
* Fixed a bug, where `manualColumnMove` would not work properly when the data object properties count would be lower than the table column count. [#5931](https://github.com/handsontable/handsontable/issues/5931)
* Fixed a bug with the `trimRows` plugin did not work properly with the `startRows` option. [#5953](https://github.com/handsontable/handsontable/issues/5953)
* Fixed a problem, where using `loadData` after sorting would not work as expected. [#5956](https://github.com/handsontable/handsontable/issues/5953)
* Fixed a problem with the `beforeColumnMove` and `afterColumnMove` hooks not containing information about their destination indexes. [#6005](https://github.com/handsontable/handsontable/issues/6005)
* Fixed a problem where using `filters` and `minSpareRows` would make the table add an empty row at the beginning of the table. [#6278](https://github.com/handsontable/handsontable/issues/5953)
* Fixed a bug with the `manualRowMove` plugin would duplicate data in the moved rows, when used with a row index greater than the table row count. [#6088](https://github.com/handsontable/handsontable/issues/5953)
* Fixed a bug, where the `toVisualRow` method returned `null` when using the `trimRows` and `columnSorting` plugins together. [#6310](https://github.com/handsontable/handsontable/issues/6310)
* Fixed a problem, where calling `updateSettings` in the `afterColumnMove` hook callback would have no effect. [#4480](https://github.com/handsontable/handsontable/issues/4480)
* Fixed a bug, where calling `loadData` would make the `filters` plugin to not behave as expected. [#5244](https://github.com/handsontable/handsontable/issues/5244)
* Fixed a bug, where detaching a child from a parent in the `nestedRows` plugin would cause a \`+/-\` button misalignment. [#5900](https://github.com/handsontable/handsontable/issues/5900)
* Fixed a problem with the `columnSummary` plugin creating a doubled summary row. [#5794](https://github.com/handsontable/handsontable/issues/5794)
* Fixed a bug, where moving children between parents using the `nestedRows` plugin would throw an error. [#6066](https://github.com/handsontable/handsontable/issues/6066)
* Fixed a bug, where adding rows by modifying the data by reference while using the `nestedRows` plugin would throw an error. [#3914](https://github.com/handsontable/handsontable/issues/3914)
* Fixed a bug, where merging cells would conflict with the `columnSorting` plugin. [#6086](https://github.com/handsontable/handsontable/issues/6086)
* Fixed a bug, where the row headers would stay visible after removing all the table columns. [#6412](https://github.com/handsontable/handsontable/issues/6412)
* Fixed an issue where Hidden columns become visible when the user ran `updateSettings`. [#4121](https://github.com/handsontable/handsontable/issues/4121)
* Fixed an issue where using `hiddenColumns` and `stretchH` showed a redundant horizontal scrollbar. [#4181](https://github.com/handsontable/handsontable/issues/4181)
* Fixed an issue in which if the last column was a hidden column and `stretchH` was enabled, the last column was displayed. [#4370](https://github.com/handsontable/handsontable/issues/4370)
* Fixed an issue where `updateSettings` performance was very low because of `hiddenColumns` being rendered. [#4381](https://github.com/handsontable/handsontable/issues/4381)
* Fixed an issue where collapse was not working correctly with custom cell renderers. [#4716](https://github.com/handsontable/handsontable/issues/4716)
* Fixed an incorrect header name when user defined more columns in the `nestedHeaders` plugin. [#4716](https://github.com/handsontable/handsontable/issues/4716)
* Fixed an issue where `hiddenColumns` did not work properly with `columnSorting`. [#5571](https://github.com/handsontable/handsontable/issues/5571)
* Fixed an issue where `manualColumnMove` should work with `hiddenColumns`. [#5598](https://github.com/handsontable/handsontable/issues/5598)
* Fixed an issue where `hiddenColumns` option interfered with the keyboard movement. [#5704](https://github.com/handsontable/handsontable/issues/5704)
* Fixed an issue where after hiding the first two rows, the row headers became de-synchronized by 1px. [#5817](https://github.com/handsontable/handsontable/issues/5817)
* Fixed an issue where hiding columns affected selection of hidden columns. [#5871](https://github.com/handsontable/handsontable/issues/5871)
* Fixed an issue where if `collapsibleColumns` were set to `true` it was impossible to exit selection mode. [#5875](https://github.com/handsontable/handsontable/issues/5875)
* Fixed an issue where `hiddenColumns` did not work properly with \`autoWrapRow/autoWrapCol\`. [#5877](https://github.com/handsontable/handsontable/issues/5877)
* Fixed an issue on IE where hiding the first column caused a display of double border for top left corner. [#5881](https://github.com/handsontable/handsontable/issues/5881)
* Fixed an issue where `nestedHeaders` duplicated a header name if more columns are added. [#5882](https://github.com/handsontable/handsontable/issues/5882)
* Fixed an issue where `hiddenColumns` plugin unset cell's `renderer`. [#5883](https://github.com/handsontable/handsontable/issues/5883)
* Fixed an issue where `hiddenColumns` had stored visual indexes and should have used physical indexes. [#5909](https://github.com/handsontable/handsontable/issues/5909)
* Fixed an issue where hidden columns should be unrecoverable. [#6113](https://github.com/handsontable/handsontable/issues/6113)
* Fixed an issue where row selection ignored columns that are hidden at the end. [#6181](https://github.com/handsontable/handsontable/issues/6181)
* Fixed an issue where defining data with more data than used in `columns` caused an issue with showing column once it was hidden. [#6426](https://github.com/handsontable/handsontable/issues/6426)
* Fixed an issue where hiding rows, while there was a merged area, involved caused data shifting and unexpected merged area coordinates. [#6376](https://github.com/handsontable/handsontable/issues/6376)
* Fixed an issue where `colHeader` was truncated after moving `hiddenColumn`. [#6463](https://github.com/handsontable/handsontable/issues/6463)
* Fixed an issue where the last hidden column was visible upon column resizing. [#6557](https://github.com/handsontable/handsontable/issues/6557)
* Fixed an issue where with hiding columns after moved them manually. [#6668](https://github.com/handsontable/handsontable/issues/6668)
* Fixed an issue where expanding a collapsed column caused expanding of a child columns except for the first one. [#5792](https://github.com/handsontable/handsontable/issues/5792)
* Fixed an issue where setting `columnSorting` to `true` (on initialization or via `updateSettings`) made headers non-collapsible programmatically via `collapseAll` method. [#4999](https://github.com/handsontable/handsontable/issues/4999)
* Fixed an issue where `customBorders` plugin was missing in the definition file. [#6477](https://github.com/handsontable/handsontable/issues/6477)
* Fixed incorrect size of `wtHider`and `wtHolder` in overlays. [#3873](https://github.com/handsontable/handsontable/issues/3873)
* Fixed an issue where `updateSettings` could not update `tableClassName`. [#6295](https://github.com/handsontable/handsontable/issues/6295)
* Fixed an issue where JSON data with empty value was losing some double quotes when pasted into a cell. [#6167](https://github.com/handsontable/handsontable/issues/6167)
* Fixed an issue where some classes for the table were missing if one of them was empty. [#6371](https://github.com/handsontable/handsontable/issues/6371)
* Fixed an issue where clicking in a contextmenu's border opened the native context menu. [#6218](https://github.com/handsontable/handsontable/issues/6218)
* Fixed the error that ocurred during loading of E2E test runner in Edge and IE. [#6713](https://github.com/handsontable/handsontable/issues/6713)
* Fixed the inconsistency and problems with adding rows from the corner when all rows are trimmed. [#7061](https://github.com/handsontable/handsontable/issues/7061)
* Fixed an issue where using read-only and alignment from the context menu was disabled when all columns were selected. [#7114](https://github.com/handsontable/handsontable/issues/7114)
* Fixed an issue where setting focus to a column to open context menu after applying a filter was impossible. [#7005](https://github.com/handsontable/handsontable/issues/7005)
* Fixed an issue where `minSpareCols` with `undo` added too many columns. [#6363](https://github.com/handsontable/handsontable/issues/6363)
* Fixed the inconsistency in selection when using the right mouse button for first row/column. [#6334](https://github.com/handsontable/handsontable/issues/6334)
* Fixed an issue where undoing column removal caused column headers to lack a header. [#6992](https://github.com/handsontable/handsontable/issues/6992)
* Fixed an issue where `readOnly` for column was erased (did not apply) if filters were used. [#6559](https://github.com/handsontable/handsontable/issues/6559)
* Fixed an issue where readonly property was lost after declining confirmation in `beforeRemoveCol` or `beforeRemoverow`. [#6332](https://github.com/handsontable/handsontable/issues/6332)
* Fixed an issue where `readOnly` state for some cells was lost when rows with `trimRows` turned on were removed. [#6990](https://github.com/handsontable/handsontable/issues/6990)
* Fixed incorrect column header highlight when merged cells were unmerged and `hiddenColumns` were used. [#6978](https://github.com/handsontable/handsontable/issues/6978)
* Fixed an issue where after hiding the first row, the second row top border disappeared. [#6977](https://github.com/handsontable/handsontable/issues/6977)
* Fixed an issue with incorrect selection after hiding the first row. [#6831](https://github.com/handsontable/handsontable/issues/6831)
* Fixed an issue where hiding the first row caused blue highlight in column headers selection to disappear. [#6976](https://github.com/handsontable/handsontable/issues/6976)
* Fixed wrong selection area after sorting with hidden rows. [#6386](https://github.com/handsontable/handsontable/issues/6386)
* Fixed an issue where it was not possible to use `selectAll` when the first row was hidden. [#6975](https://github.com/handsontable/handsontable/issues/6975)
* Fixed an issue where it was possible to select hidden row or column. [#6974](https://github.com/handsontable/handsontable/issues/6974)
* Fixed an issue where row indexes changed if the first row was hiding after moving row from bottom to top. [#6965](https://github.com/handsontable/handsontable/issues/6965)
* Fixed an issue where selection skipped the highest parent. [#6770](https://github.com/handsontable/handsontable/issues/6770)
* Fixed an iisue where `nestedRows` blocked table from loading if data was not provided. [#6928](https://github.com/handsontable/handsontable/issues/6928)
* Fixed an isse where it was impossible to go back to the original cell after dragging down. [#4233](https://github.com/handsontable/handsontable/issues/4233)
* Fixed an issue where keyboard navigation did not work on merged cells with hidden rows/columns. [#6973](https://github.com/handsontable/handsontable/issues/6973)
* Fixed an issue where `trimRows` and `hiddenRows` with specific settings broke borders. [#6904](https://github.com/handsontable/handsontable/issues/6904)
* Fixed wrong union type for `startPosition`. [#6840](https://github.com/handsontable/handsontable/issues/6840)
* Fixed type mismatch for \`Handsontable.plugins.ContextMenu\`. [#6347](https://github.com/handsontable/handsontable/issues/6347)
* Fixed an issue where `manualColumnMove` did not modify the `columns` in `updateSettings`. [#5200](https://github.com/handsontable/handsontable/issues/5200)
* Fixed rendering issue on column udpate with `updateSettings`. [#3770](https://github.com/handsontable/handsontable/issues/3770)
* Fixed an issue where expanding a collapsed column was also expanding 'child' collapsed columns, except the first child. [#5792](https://github.com/handsontable/handsontable/issues/5792)
* Fixed an issue with inproper selection for headers when the first column was hidden. [#5999](https://github.com/handsontable/handsontable/issues/5999)
* Fixed an issue where it was not possible to align cells if the selection was made upward. [#6600](https://github.com/handsontable/handsontable/issues/6600)
* Fixed an issue where `currentColClassName` did not work properly with `nestedHeaders`. [#5861](https://github.com/handsontable/handsontable/issues/5861)
* Fixed an issue with scrollbar and dimension calculation in Firefox for toggling column visibility with fixed columns and `stretchH`. [#6186](https://github.com/handsontable/handsontable/issues/6186)
* Fixed an issue with undoing the nested row removal. [#6433](https://github.com/handsontable/handsontable/issues/6433)
* Fixed an isse where `getSourceData` functions returned wrong data for nested rows. [#5771](https://github.com/handsontable/handsontable/issues/5771)
* Fixed na issue where formulas plugin did not work with `nestedRows`. [#4154](https://github.com/handsontable/handsontable/issues/4154)
* Fixed an issue where nested headers and hidden columns highlighted ad additional column when used together. [#6881](https://github.com/handsontable/handsontable/issues/6881)
* Fixed an issue where `getByRange` for sourceData did not work properly with nested object data. [#6548](https://github.com/handsontable/handsontable/issues/6548)
* Fixed an issue where \`window.frameElement\` threw errors in MSEdge, IE and Safari. [#6478](https://github.com/handsontable/handsontable/issues/6478)
* Fixed an issue where \`DataSource.countColumns\` returned invalid number of columns for nested objects. [#3958](https://github.com/handsontable/handsontable/issues/3958)
* Fixed an issue where `mergedCells` with hidden cells caused problems with rendering. [#7020](https://github.com/handsontable/handsontable/issues/7020)
* Fixed an issue where it was not possible to move column when all columns were selected by \`ctrl + a\`. [#6355](https://github.com/handsontable/handsontable/issues/6355)
* Fixed an issue where double click on the column resize handle did not adjust size correctly. [#6755](https://github.com/handsontable/handsontable/issues/6755)
* Fixed an issue where the cell meta was retrieved using the wrong coordinates. [#6703](https://github.com/handsontable/handsontable/issues/6703)
* Fixed nested rows incorrect state after changing data. [#5753](https://github.com/handsontable/handsontable/issues/5753)
* Fixed an issue in EDGE where the dropdown menu `onMouseOut` event caused critical errors when hovering over vertical scrollbar. [#6699](https://github.com/handsontable/handsontable/issues/6699)
* Fixed an issue with too many layers of highlight with noncontinuous selection on merged cells. [#7028](https://github.com/handsontable/handsontable/issues/7028)
* Fixed an issue where `NestedHeaders` did not allow to define header level as an empty array. [#7035](https://github.com/handsontable/handsontable/issues/7035)
* Fixed an issue where passing `nestedHeaders` as a single empty array stoped the table from rendering. [#7036](https://github.com/handsontable/handsontable/issues/7036)
* Fixed an issue where opening a context menu for a column when its hidden data was selected did not block adding of rows by the menu. [#7050](https://github.com/handsontable/handsontable/issues/7050)
* Fixed an issue where it was not possible to navigate past hidden column using keyboard if\` hot.updateSettings\` was called in `afterSelection`. [#3726](https://github.com/handsontable/handsontable/issues/3726)
* Fixed an issue where headers did not export with `exportToFile` in the specific case. [#4176](https://github.com/handsontable/handsontable/issues/4176)
* Fixed an issue with types mismatch. [#6035](https://github.com/handsontable/handsontable/issues/6035)
* Fixed an issue where manual row resize handler threw an error when bottom rows overlay was enabled. [#6435](https://github.com/handsontable/handsontable/issues/6435)
* Fixed an issue where the `afterRowResize` hook shared incorrect results in the second parameter. [#6430](https://github.com/handsontable/handsontable/issues/6430)
* Fixed an issue where the row/column resize hooks should not have returned `null`. [#7074](https://github.com/handsontable/handsontable/issues/7074)
* Fixed the loss of selection after merging from headers. [#7076](https://github.com/handsontable/handsontable/issues/7076)
* Fixed an issue where calling `updateSettings` changed the index of frozen columns via `freezeColumn` method. [#6843](https://github.com/handsontable/handsontable/issues/6843)
* Fixed an issue where deleting the last column via `updateSettings` which was part of the selection caused scroll to the bottom. [#5849](https://github.com/handsontable/handsontable/issues/5849)
* Fixed an issue where it was not possible to hide rows and merge cells at the same time. [#6224](https://github.com/handsontable/handsontable/issues/6224)
* Fixed the wrong data in merge cells after the hidden column and additionally an error occurs. [#6888](https://github.com/handsontable/handsontable/issues/6888)
* Fixed an issue where it was not possible to change cell type via `setCellMeta`. [#4793](https://github.com/handsontable/handsontable/issues/4793)
* Fixed an issue where cell editor did not dynamically changed while changing the cell type. [#4360](https://github.com/handsontable/handsontable/issues/4360)
* Fixed an issue where it was not possible to unmerge cells if part of them was hidden. [#7095](https://github.com/handsontable/handsontable/issues/7095)
* Fixed an issue where calling `clear` method removed the focus from the table. [#7099](https://github.com/handsontable/handsontable/issues/7099)
* Fixed an issue where `clear` method did not work for hidden data. [#7097](https://github.com/handsontable/handsontable/issues/7097)
* Fixed an issue where the editor was moved by 1px when the first row / column was hidden. [#6982](https://github.com/handsontable/handsontable/issues/6982)
* Fixed an issue where headers were deselected after undoing removal. [#6670](https://github.com/handsontable/handsontable/issues/6670)
* Fixed an issue with improper selection after insert column/row when mergeCells was enabled. [#4897](https://github.com/handsontable/handsontable/issues/4897)
* Fixed an issue where wrong cell meta was removed when deleting rows. [#6051](https://github.com/handsontable/handsontable/issues/6051)
* Fixed wrong types of `beforeRowMove` arguments. [#6539](https://github.com/handsontable/handsontable/issues/6539)
* Fixed an issue where selection of a whole row did not happen consequently after selecting a row header. [#5906](https://github.com/handsontable/handsontable/issues/5906)
* Fixed an issue where it was not possible to use physical row index instead of visual one. [#6309](https://github.com/handsontable/handsontable/issues/6309)
* Fixed an issue where incorrect data was returned after undoing the remove column option. [#5000](https://github.com/handsontable/handsontable/issues/5000)
* Fixed - Copy and paste works properly also when selecting hidden columns when: all columns within a selected range are hidden and when just some columns within a selected range are hidden. [#7043](https://github.com/handsontable/handsontable/issues/7043).
* Fixed an issue where it was impossible to add new row in the `nestedRows`. [#5133](https://github.com/handsontable/handsontable/issues/5133)
* Fixed an issue where `afterOnCellMouseDown` returned (0,0) coords after clicking on the topleft corner. [#3978](https://github.com/handsontable/handsontable/issues/3978)
* Fixed an issue where persisted `manualColumnMove` was not restored when using `loadData`. [#5207](https://github.com/handsontable/handsontable/issues/5207)
* Fixed issues with filtering results in blank rows. [#5208](https://github.com/handsontable/handsontable/issues/5208)
* Fixed an issue where changing data on collapsed rows resulted in error. [#5328](https://github.com/handsontable/handsontable/issues/5328)
* Fixed an issue where the `manualColumnMove` operation affected the column order of data loaded by `loadData`. [#5591](https://github.com/handsontable/handsontable/issues/5591)
* Fixed an issue where `nestedRows` did not allow to keep `rowHeaders` after collapsing. [#5874](https://github.com/handsontable/handsontable/issues/5874)
* Fixed performance and CPU issue caused by using some handsontable properties. [#6058](https://github.com/handsontable/handsontable/issues/6058)
* Fixed an error with columnSummary plugin when trying to create a row. [#6300](https://github.com/handsontable/handsontable/issues/6300)
* Fixed an error where \`walkontable.css\` and \`handsontable.css\` stylesheets were out of sync. [#6381](https://github.com/handsontable/handsontable/issues/6381)
* Fixed an issue where `colHeaders` order was not updated after manual move with empty object data source. [#6413](https://github.com/handsontable/handsontable/issues/6413)
* Fixed "detach from parent" option. [#6432](https://github.com/handsontable/handsontable/issues/6432)
* Fixed an issue where `PreventOverflow` feature did not work if `multiColumnSorting` plugin was enabled. [#6514](https://github.com/handsontable/handsontable/issues/6514)
* Fixed an issue where old CSS classes were not removed after `updateSettings`. [#6575](https://github.com/handsontable/handsontable/issues/6575)
* Fixed an issue where `columnSummary`, `Filters` and spare rows were causing 'RangeError: Maximum call stack size exceeded'. [#6695](https://github.com/handsontable/handsontable/issues/6695)
* Fixed an issue where `afterSelectionEnd` returned incorrect data when clicking on a column when all rows were hidden. [#7045](https://github.com/handsontable/handsontable/issues/7045)
* Fixed an issue where wrapping was not applied after setting `trimWhitespace` to `false`. [#6232](https://github.com/handsontable/handsontable/issues/6232)
* Fixed an issue with additional selection border in iOS. [#7103](https://github.com/handsontable/handsontable/issues/7103)
* Fixed an issue with rendering different borders. [#6955](https://github.com/handsontable/handsontable/issues/6955)
* Fixed an issue with `BACKSPACE` not working properly in the filter by value input. [#6842](https://github.com/handsontable/handsontable/issues/6842)
* Fixed an issue with Undo/Redo not working with fixing columns. [#6869](https://github.com/handsontable/handsontable/issues/6869)
* Added a missing argument in the `deepObjectSize` function. [#6821](https://github.com/handsontable/handsontable/pull/6821)
* Fixed an issue where the table threw errors while clicking the cells if the Handsontable was initialized with `fixedRowsTop` and `fixedRowsBottom` higher than rows length. [#6718](https://github.com/handsontable/handsontable/issues/6718)
* Fixed an issue where it was not possible to change the state of checkbox-type, non-contiguous cells using `SPACE`. [#4882](https://github.com/handsontable/handsontable/issues/4882)
* Fixed an issue where resizing made rows shorter than expected and caused row misalignment. [#6429](https://github.com/handsontable/handsontable/issues/6429)
* Fixed an issue where Handsontable was missing rows when `preventOverflow` with `updateSettings` were used. [#4303](https://github.com/handsontable/handsontable/issues/4303)
* Adding properties which were not defined on initialization or by `updateSettings` to the source data is possible only by the usage of `setSourceDataAtCell`. [#6664](https://github.com/handsontable/handsontable/issues/6664).

## 7.4.2

Released on 19th of February, 2020

**Changes**

* Fixed an issue where the cell value could not be edited on mobile devices. ([#6707](https://github.com/handsontable/handsontable/issues/6707))
* Fixed an issue where white lines appeared at the bottom of cell headers. ([#6459](https://github.com/handsontable/handsontable/issues/6459))
* Fixed a bug, where resizing the window (while using Angular) would result in Handsontable not stretching properly and throwing an error. ([#6710](https://github.com/handsontable/handsontable/issues/6710))

## 7.4.1

Released on 19th of February, 2020

Due to technical issues, version 7.4.2 patch needed to be released.

**All the changes from 7.4.1 are included in the 7.4.2 release.**

## 7.4.0

Released on 12th of February, 2020

**Changes**

* Fixed the problem, where the `onCellMouseUp` hook was fired for all mouse buttons except `RMB`, which was not consistent with the `onCellMouseDown` hook.
    To make the changes more consistent with the native `dblclick` event (which is triggered only for the `LMB` button), the `onCellDblClick` and `onCellCornerDblClick` hooks were modified to also fire only for `LMB`. ([#6507](https://github.com/handsontable/handsontable/issues/6507))
* Updated `moment`, `pikaday` and `numbro` to their latest versions. ([#6610](https://github.com/handsontable/handsontable/issues/6610))
* Fixed a bug with numbers not being presented properly with the `pt_BR` culture setting. ([#5569](https://github.com/handsontable/handsontable/issues/5569))
* Extended the Babel config with the possibility to use private methods, optional chaining and nullish coalescing operator. ([#6308](https://github.com/handsontable/handsontable/issues/6308))
* Updated some of the internal configs, updated dev-dependencies, housekeeping etc. ([#6560](https://github.com/handsontable/handsontable/issues/6560), [#6609](https://github.com/handsontable/handsontable/issues/6609), [#6612](https://github.com/handsontable/handsontable/issues/6612), [#6629](https://github.com/handsontable/handsontable/issues/6629), [#6574](https://github.com/handsontable/handsontable/issues/6574), [#6565](https://github.com/handsontable/handsontable/issues/6565))

## 7.3.0

Released on 12th of December, 2019

**New Features**

* Version `7.3.0` introduces a new option to the Context Menu plugin - `uiContainer`. It allows declaring a DOM container, where all the Context Menu's element will be placed. It may come espacially handy when using Handsontable inside of an `iframe` or some other content-trimming context. ([#6283](https://github.com/handsontable/handsontable/issues/6283), [#6417](https://github.com/handsontable/handsontable/issues/6417))
* We also added a `uiContainer` option to the Copy/Paste plugin. It works in a similar way to the one described above, but is used to declare the container for the Copy/Paste plugin's DOM elements. ([#6343](https://github.com/handsontable/handsontable/issues/6343))

**Changes**

* Fixed a problem with table resizing on every scroll event on Firefox, when no table height was defined. ([#6344](https://github.com/handsontable/handsontable/issues/6344))
* Updated the `puppeteer` package in the `devDependencies` section to get rid of the \`npm audit\` security error. ([#6393](https://github.com/handsontable/handsontable/issues/6393))
* Removed the unneeded `CNAME_` file from the repo. ([#6389](https://github.com/handsontable/handsontable/issues/6389))
* Fixed a problem, where pasting data from Excel caused Handsontable to throw an error. ([#6217](https://github.com/handsontable/handsontable/issues/6217))
* Fixed a bug, where data pasted from Excel would get improperly formatted in Handsontable. ([#6258](https://github.com/handsontable/handsontable/issues/6258))
* Fixed a bug, where the `& < > ' "` characters in the pasted data would be automatically changed to their equivalent HTML entities. ([#1535](https://github.com/handsontable/handsontable/issues/1535))
* Fixed a bug, where opening the system's context menu, hitting `ESC` and moving the cursor outside of the container would scroll the table. ([#5846](https://github.com/handsontable/handsontable/issues/5846))
* Fixed a problem, where right-clicking on a disabled entry in Handsontable's context menu would open the system's context menu. ([#5846](https://github.com/handsontable/handsontable/issues/5846))
* Fixed a bug, where right-clicking on an active entry in Handsontable's context menu would open another context menu. ([#5846](https://github.com/handsontable/handsontable/issues/5846))
* Fixed a test case for Context Menu's scrolling. ([#6449](https://github.com/handsontable/handsontable/issues/6449))
* Modified the container size in the the tests' DOM helper file. ([#6446](https://github.com/handsontable/handsontable/issues/6446))

## 7.2.2

Released on 23rd of October, 2019

**Changes**

* Rolled back backward-incompatible changes in the TypeScript definition file introduced in `7.2.0`. ([#6351](https://github.com/handsontable/handsontable/issues/6351))
* Fixed a problem, where the `Handsontable.helper.htmlToGridSettings` threw an error on IE11, when the target table was a part of an `iframe`. ([#6350](https://github.com/handsontable/handsontable/issues/6350))

## 7.2.1

Released on 16th of October, 2019

**Changes**

* Fix a problem caused by [#6269](https://github.com/handsontable/handsontable/issues/6269), which made the move/resize handles hidden under the headers. ([#6341](https://github.com/handsontable/handsontable/issues/6341))

## 7.2.0

Released on 15th of October, 2019

**Changes**

* Added `cellProperties` to the arguments of search's `queryMethod` so that it would be possible to tell what kind of data was being queried. ([#4944](https://github.com/handsontable/handsontable/issues/4944))
* Fixed a bug with a disappearing column header, when the `height` option is was set to `auto`. ([#6302](https://github.com/handsontable/handsontable/issues/6302))
* Fixed a problem with an error being thrown when trying the clear a column with the first cell set to `readOnly`. ([#6246](https://github.com/handsontable/handsontable/issues/6246))
* Fixed a bug where it was impossible to set data for a `readOnly`\-typed cell, when any cell was selected. ([#6214](https://github.com/handsontable/handsontable/issues/6214))
* Fixed a problem with an error being thrown when pasting data to `readOnly`\-typed cells. ([#6209](https://github.com/handsontable/handsontable/issues/6209))
* Fixed a problem with the `Undo` feature not working for columns defined as functions. ([#6147](https://github.com/handsontable/handsontable/issues/6147))
* Fixed a bug where `this.TD` was `undefined` in the editor's `prepare` method when `fixedColumnsLeft` and `viewportColumnRenderingOffset` were both set. ([#6043](https://github.com/handsontable/handsontable/issues/6043))
* Fixed a bug where the cell selection frame overlapped the bottom fixed rows. ([#5947](https://github.com/handsontable/handsontable/issues/5947))
* Fixed a problem with an error being thrown after initializing an empty table or removing all the data from the table and clicking the corner header. ([#5126](https://github.com/handsontable/handsontable/issues/5126))
* Fixed a problem with reloading data with a new set in the Nested Rows plugin. ([#6339](https://github.com/handsontable/handsontable/issues/6339))
* Rewrote some of the Walkontable methods to return correct information about the table. ([#6191](https://github.com/handsontable/handsontable/issues/6191))
* Made some improvements to the TypeScript definition file. ([#6168](https://github.com/handsontable/handsontable/issues/6168), [#6107](https://github.com/handsontable/handsontable/issues/6107), [#6102](https://github.com/handsontable/handsontable/issues/6102), [#6239](https://github.com/handsontable/handsontable/issues/6239), [#6266](https://github.com/handsontable/handsontable/issues/6266))
* Improved the documentation and definition files regarding the `after-` hooks for creating and removing rows/columns. ([#6296](https://github.com/handsontable/handsontable/issues/6296))
* Improved the documentation for the `totalColumn` option. ([#6281](https://github.com/handsontable/handsontable/issues/6281))
* Added a `lint:fix` script to be able to fix the lint errors from the CLI. ([#6260](https://github.com/handsontable/handsontable/issues/6260))
* Fixed all the tests for Windows and added run-script, `walkontable.watch`. ([#6187](https://github.com/handsontable/handsontable/issues/6187))
* Removed the unused `check-es3-syntax-cli` package to fix Github's security alert. ([#6319](https://github.com/handsontable/handsontable/issues/6319))
* Updated the dependencies to fix errors thrown by `npm audit` ([#6318](https://github.com/handsontable/handsontable/issues/6318))

## 7.1.1

Released on 12th of August, 2019

**Changes**

* Refactored the Walkontable table renderers. ([#6089](https://github.com/handsontable/handsontable/issues/6089))
* Removed the `yarn.lock` file from the repository and updated the Node version in the Travis configuration file. ([#6161](https://github.com/handsontable/handsontable/issues/6161))
* Added a missing `rootInstanceSymbol` property to Handsontable to allow using \`new Handsontable.Core\` properly. ([#6040](https://github.com/handsontable/handsontable/issues/6040))
* Fixed a bug, where copying/pasting/deleting data for `autocomplete`\-typed cells caused an error to be thrown. ([#6033](https://github.com/handsontable/handsontable/issues/6033))
* Refactored the Custom Borders plugin to resolve problems with its performance. ([#6052](https://github.com/handsontable/handsontable/issues/6052))
* Optimized the use of arrays for the V8 engine in the `parseTable` module. ([#6060](https://github.com/handsontable/handsontable/issues/6060))
* Fixed a problem where scrolling the dropdown menu scrolled the entire table. ([#5913](https://github.com/handsontable/handsontable/issues/5913))
* Fixed a bug where removing a change in the `beforeChange` hook callback broke the table. ([#5893](https://github.com/handsontable/handsontable/issues/5893))
* Fixed a problem where cutting the value from a `checkbox`\-typed cell made it switch to `#bad-value#`. ([#4106](https://github.com/handsontable/handsontable/issues/4106))
* Fixed a bug where the `getCell` method returned `undefined`, while it wasn't supposed to. ([#6079](https://github.com/handsontable/handsontable/issues/6079))
* Updated Jasmine and made changes to the tests and tests configuration in order for them to pass in the browser and prevent memory leaks. ([#6077](https://github.com/handsontable/handsontable/issues/6077), [#6096](https://github.com/handsontable/handsontable/issues/6096))
* Changed the way the `afterColumnMove` hook works, now it won't fire if `beforeColumnMove` hook callback canceled the action. ([#5958](https://github.com/handsontable/handsontable/issues/5958))
* Fixed a problem with the `Undo` feature reverting the editing actions that didn't make any changes to the data. ([#4072](https://github.com/handsontable/handsontable/issues/4072))
* Fixed a bug, where the dropdown editor did not work properly, when there were multiple Handsontable instances implemented on the page. ([#6122](https://github.com/handsontable/handsontable/issues/6122))
* Fixed the tests for Windows. ([#5878](https://github.com/handsontable/handsontable/issues/5878))
* Fixed the npm audit security errors. ([#6130](https://github.com/handsontable/handsontable/issues/6130))
* Fixed a problem with scrolling not working properly when hovering over the Handsontable container. ([#5212](https://github.com/handsontable/handsontable/issues/5212))
* Refactored the `toMatchHTML` Jasmine matcher to make tests pass on Firefox. ([#6148](https://github.com/handsontable/handsontable/issues/6148))
* Fixed the `getCell` method for fixed bottom rows, which caused the selection not to work properly. ([#6084](https://github.com/handsontable/handsontable/issues/6084))
* Fixed a bug, where the table height increased every time the window had been resized. ([#3433](https://github.com/handsontable/handsontable/issues/3433))
* Corrected some minor mistakes in the JSDocs and Typescript definitions. ([#6123](https://github.com/handsontable/handsontable/issues/6123), [#6125](https://github.com/handsontable/handsontable/issues/6125), [#6142](https://github.com/handsontable/handsontable/issues/6142), [#6152](https://github.com/handsontable/handsontable/issues/6152), [#6158](https://github.com/handsontable/handsontable/issues/6158), [#6160](https://github.com/handsontable/handsontable/issues/6160), [#6129](https://github.com/handsontable/handsontable/issues/6129))

## 7.1.0

Released on 11th of June, 2019

**Changes**

* Added a new feature, allowing users to parse HTML tables into Handsontable settings and Handsontable instances to plain HTML tables. This change introduces these new API methods:

    * \`Handsontable.helper.instanceToHTML: (instance: Handsontable.Core) => string\` - parses the provided Handsontable instance to an HTML table as a `string`
    * \`Handsontable.helper.htmlToGridSettings(element: Element | string, rootDocument?: Document) => Handsontable.DefaultSettings\` - analyses a static HTML table and returns a Handsontable-compatible settings object
    * \`hotInstance.toTableElement: () => HTMLTableElement\` - converts the Handsontable instance to a static HTML table
    * \`hotInstance.toHTML: () => string\` - same as `Handsontable.helper.instanceToHTML`, but the instance is already bound

    ([#5684](https://github.com/handsontable/handsontable/issues/5684))
* Fixed a bug, where it wasn't possible to block `Undo/Redo` plugin keyboard shortcuts. ([#6028](https://github.com/handsontable/handsontable/issues/6028))
* Corrected the `ManualColumnMove` type definitions. ([#6011](https://github.com/handsontable/handsontable/issues/6011))
* Fixed a problem with pasting multi-line data from Excel and Google Sheets. ([#5970](https://github.com/handsontable/handsontable/issues/5970), [#5622](https://github.com/handsontable/handsontable/issues/5622))
* Fixed a bug, where it was impossible to paste merged cells from Excel. ([#5940](https://github.com/handsontable/handsontable/issues/5940))
* Fixed a problem with copying cells with longer contents from Excel or Google Sheets. ([#5925](https://github.com/handsontable/handsontable/issues/5925))
* Fixed a problem with Handsontable not adding the carriage return character to the pasted data. ([#5826](https://github.com/handsontable/handsontable/issues/5826), [#5647](https://github.com/handsontable/handsontable/issues/5647))
* Fixed some `NestedRows` performance issues on large datasets. ([#5711](https://github.com/handsontable/handsontable/issues/5711))
* Fixed a bug, where placing SVG in a cell caused a `ManualColumnMove` error. ([#4120](https://github.com/handsontable/handsontable/issues/4120))
* Fixed a bug, where using the `Undo` functionality, the selection was not reverted to its original position. ([#6017](https://github.com/handsontable/handsontable/issues/6017))
* Fixed a bug, where the `getCell` method, when used with the `topmost` argument set to `true`, did not return the correct cell elements from the bottom overlay. ([#5896](https://github.com/handsontable/handsontable/issues/5896))
* Added a possibility to return `false` from the `beforeCreateCol` hook to stop the column creation. ([#5691](https://github.com/handsontable/handsontable/issues/5691))

## 7.0.3

Released on 13th of May, 2019

**Changes**

* Fix the `skipRowOnPaste` option to work similarly to `skipColumnOnPaste` and add it to the documentation. ([#5845](https://github.com/handsontable/handsontable/issues/5845))
* Fix the font inconsistency in the dropdown menu. ([#5948](https://github.com/handsontable/handsontable/issues/5948))
* Fix a problem with the `manualColumnResize` option not working properly alongside `fixedColumnsLeft`. ([#5959](https://github.com/handsontable/handsontable/issues/5959))
* Fix a problem with the `TextEditor` not resizing the input field properly while being placed on the edge on the table and containing multi-line text. ([#5969](https://github.com/handsontable/handsontable/issues/5969))
* Updated some of the dependencies to get rid of the security vulnerabilities thrown by `npm audit`. ([#5995](https://github.com/handsontable/handsontable/issues/5995))
* Removed `eval()` from the `formula-parser` module to fulfill the _Content-Security-Policy_. ([#5990](https://github.com/handsontable/handsontable/issues/5990))

## 7.0.2

Released on 9th of April, 2019

**Changes**

* Fixed a bug from `7.0.1`, which made the scrolling on overlays (fixed rows/columns, headers) work improperly. ([#5938](https://github.com/handsontable/handsontable/pull/5938))

## 7.0.1

Released on 8th of April, 2019

**Changes**

* Fixed the `LICENSE.txt` file link in `README.md`. ([#5914](https://github.com/handsontable/handsontable/issues/5914))
* Replaced `fixed` positioning of the row/column resize handles with `absolute` to prevent misalignment issues in implementations based on CSS `transform`. ([#5050](https://github.com/handsontable/handsontable/issues/5050))
* Updated `webpack` to version `4`. ([#5912](https://github.com/handsontable/handsontable/issues/5912))
* Fixed a problem with Handsontable throwing errors on scroll by adding support for `EventListenerOption` in the `EventManager`. ([#5904](https://github.com/handsontable/handsontable/issues/5904), [#4526](https://github.com/handsontable/handsontable/issues/4526))
* Added `core-js` to Handsontable's dependencies. ([#5888](https://github.com/handsontable/handsontable/issues/5888))
* Added a `ghost-table` attribute to all cell elements generated with Ghost Table. ([#5927](https://github.com/handsontable/handsontable/issues/5927))
* Fixed a bug, where the editor was visible despite not being open, when the table was positioned using CSS `transform`. ([#5886](https://github.com/handsontable/handsontable/issues/5886))
* Fixed a bug, where the table scrolled up after clicking a cell when Handsontable was implemented inside of an `iframe`. ([#5910](https://github.com/handsontable/handsontable/issues/5910))

## 7.0.0

Released on 6th of March, 2019

**Breaking changes**

* **Starting with version 7.0.0, there is only one Handsontable, as Handsontable Pro has been merged with Handsontable Community Edition.**
* Handsontable is now "source-available" instead of "open source". The MIT license has been replaced with a custom, free for [non-commercial license](https://github.com/handsontable/handsontable/blob/master/handsontable-non-commercial-license.pdf).

    Read our [statement on GitHub](https://github.com/handsontable/handsontable/issues/5831) for more details.
* Added the `beforeTrimRows` and `beforeUntrimRows` hooks and modified the argument list for the existing ones in the Trim Rows plugin.

  * Was:
    * `afterTrimRow: (rows)`
    * `afterUntrimRow: (rows)`
  * Is:
    * `afterTrimRow: (currentTrimConfig, destinationTrimConfig, actionPossible, stateChanged)`
    * `afterUntrimRow: (currentTrimConfig, destinationTrimConfig, actionPossible, stateChanged)`

    ([#5662](https://github.com/handsontable/handsontable/issues/5662))
* Removed the deprecated `selectCellByProp` method. ([#5174](https://github.com/handsontable/handsontable/issues/5174))
* Added hooks for the Hidden Rows and Hidden Columns plugins + added validation of the provided rows.

    * Before this change, passing an invalid set of indexes (for example, \`\[-1, 0, 1\]\`) would still hide the valid elements from the set.
    * After this change, an invalid set of indexes passed to the plugin will result in the termination of the performed action.

    ([#165](https://github.com/handsontable/handsontable-pro/issues/165), [#163](https://github.com/handsontable/handsontable-pro/issues/163), [#5651](https://github.com/handsontable/handsontable/issues/5651), [#5522](https://github.com/handsontable/handsontable/issues/5522))
* We no longer support Bower. To install Handsontable, use Npm or CDN instead.

**Changes**

* Refactored the following classes to ES6:
  * `BaseEditor` ([#5628](https://github.com/handsontable/handsontable/issues/5628))
  * `AutocompleteEditor` ([#5650](https://github.com/handsontable/handsontable/issues/5650))
  * `HandsontableEditor` ([#5653](https://github.com/handsontable/handsontable/issues/5653))
  * `SelectEditor` ([#5618](https://github.com/handsontable/handsontable/issues/5618))
  * `TextEditor` ([#5646](https://github.com/handsontable/handsontable/issues/5646))
  * `Walkontable -> Event` ([#5655](https://github.com/handsontable/handsontable/issues/5655))
  * `EditorManager` ([#5683](https://github.com/handsontable/handsontable/issues/5683))
  * `MultiMap` (removed) ([#5660](https://github.com/handsontable/handsontable/issues/5660))
  * `TableView` ([#5690](https://github.com/handsontable/handsontable/issues/5690))
  * `DataMap` ([#5699](https://github.com/handsontable/handsontable/issues/5699))

    ([#5403](https://github.com/handsontable/handsontable/issues/5403))
* Fixed a problem where inserting a new row didn't update the TrimRows plugin properly. ([#5761](https://github.com/handsontable/handsontable/issues/5761))
* Fixed a problem where removing a row didn't update the TrimRows plugin properly. ([#5738](https://github.com/handsontable/handsontable/issues/5738))
* Added the possibility to declare the table's width/height using relative values (%, vh, vw, rem, em). ([#5749](https://github.com/handsontable/handsontable/issues/5749))
* Added support for creating a Handsontable instance inside an `iframe` when the instance is initialized. ([#5686](https://github.com/handsontable/handsontable/issues/5686), [#5744](https://github.com/handsontable/handsontable/issues/5744))
* Extended the Hidden Rows' plugin's hooks argument list. ([#5671](https://github.com/handsontable/handsontable/issues/5671))
* Updated the `hot-formula-parser` package in `package.json`. ([#5665](https://github.com/handsontable/handsontable/issues/5665))
* Fixed a bug where the `getCell` method returned `undefined` in some specific cases. ([#5608](https://github.com/handsontable/handsontable/issues/5608))
* Fixed a bug where an asynchronous validator would throw an exception when run after the table had been destroyed. ([#5567](https://github.com/handsontable/handsontable/issues/5567))
* Fixed a bug where an input defined in the headers would lose focus right after clicking on it. ([#5541](https://github.com/handsontable/handsontable/issues/5541))
* Fixed a bug where using `preventOverflow` would cause the editor offset to be incorrect when scrolling vertically. ([#5453](https://github.com/handsontable/handsontable/issues/5453))
* Fixed a bug where selecting a mixed merged/non-merged section would cause improper results. ([#4912](https://github.com/handsontable/handsontable/issues/4912))
* Fixed a problem where the `Handsontable` class export differed between UMD and other environments. ([#4605](https://github.com/handsontable/handsontable/issues/4605))
* Fixed a bug where disabling `colHeaders` using `updateSettings` would not work properly. ([#4136](https://github.com/handsontable/handsontable/issues/4136))
* Fixed a bug where the changes cancelled using the `beforeChange` hook were still validated. ([#3381](https://github.com/handsontable/handsontable/issues/3381))
* Updated the documentation for the `setSortConfig` method of the Column Sorting plugin. (handsontable/docs#19)
* Fixed a problem, where passing an `Array` as a cell value would cause the `populateFromArray` method to fail. ([#5675](https://github.com/handsontable/handsontable/issues/5675))
* Rewrote the TypeScript definition file, so it would match the actual structure of the library more precisely. ([#5767](https://github.com/handsontable/handsontable/issues/5767))
* Fixed a problem where resizing the table would not trigger the rendering process. ([#5730](https://github.com/handsontable/handsontable/issues/5730), [#2766](https://github.com/handsontable/handsontable/issues/2766))
* Fixed a memory leak in the Context Menu plugin. ([#5759](https://github.com/handsontable/handsontable/issues/5759))
* Fixed a problem with where it was impossible to add cell comments, due to the editor closing too early. ([#5614](https://github.com/handsontable/handsontable/issues/5614))
* Fixed a bug where the Trim Rows plugin passed an unwanted value from the `beforeCreateRow` hook callback. ([#5585](https://github.com/handsontable/handsontable/issues/5585))
* Fixed a problem with the context menu displaying an empty box when no available menu items were provided. ([#3865](https://github.com/handsontable/handsontable/issues/3865))

## 6.2.2

Released on 19th of December, 2018

**Changes**

* Fixed a bug, where it was impossible to use mouse selection on a device which supported both mouse and touch events. ([#5669](https://github.com/handsontable/handsontable/issues/5669))
* Fixed a bug, where the per-cell validation information was not shifted after removing rows. ([#5674](https://github.com/handsontable/handsontable/issues/5674))

## 6.2.1

Released on 12th of December, 2018

**Changes**

* Updated `babel` to `7.x`. ([#5398](https://github.com/handsontable/handsontable/issues/5398))
* Fixed a bug, where calling `updateSettings` or `loadData` with a new, larger dataset caused an error to be thrown. ([#5617](https://github.com/handsontable/handsontable/issues/5617))
* Fixed a bug, where the mobile keyboard opened on every cell selection on Android devices. ([#5586](https://github.com/handsontable/handsontable/issues/5586))
* Fixed a bug, where the date validation did not work properly in some cases. ([#5563](https://github.com/handsontable/handsontable/issues/5563))
* Fixed a problem with poor `updateSettings` performance when removing rows. ([#5561](https://github.com/handsontable/handsontable/issues/5561))
* Fixed a problem with improper \`carriage return\` symbol usage in the pasted data. ([#5477](https://github.com/handsontable/handsontable/issues/5477))
* Added some missing methods, options and hooks to the typescript definition file. ([#5639](https://github.com/handsontable/handsontable/issues/5639), [#5590](https://github.com/handsontable/handsontable/issues/5590))
* Corrected the CSS property assignment to zero from `0` to `'0'`; ([#5291](https://github.com/handsontable/handsontable/issues/5291))
* Fixed a bug, where the `autofill` feature did not work properly with the `mergeCells` plugin, while working on an object-based dataset. ([#5022](https://github.com/handsontable/handsontable/issues/5022))
* Fixed a problem with the `observeChanges` plugin causing a memory leak. ([#4400](https://github.com/handsontable/handsontable/issues/4400))
* Fixed a problem with the scientific notation not being supported in the numeric editor. ([#2030](https://github.com/handsontable/handsontable/issues/#2030))
* Fixed a bug, where setting `enterBeginsEditing` to `false` allowed changing the state of `checkbox`\-typed cells using the `ENTER` key. ([#4162](https://github.com/handsontable/handsontable/issues/#4162))

## 6.2.0

Released on 14th of November, 2018

**Changes**

* Added the Korean language support. ([#5356](https://github.com/handsontable/handsontable/issues/5356))
* Added the Latvian language support. ([#5186](https://github.com/handsontable/handsontable/issues/5186))
* Updated the TypeScript definition file for `ColumnSorting` and `MultiColumnSorting`. ([#5545](https://github.com/handsontable/handsontable/issues/5545), [#5445](https://github.com/handsontable/handsontable/issues/5445))
* Updated the TypeScript definition for `beforeRowMove` and `beforeColumnMove`. ([#5416](https://github.com/handsontable/handsontable/issues/5416))
* Updated the TypeScript definition for some selection and context menu related methods and hooks. ([#5307](https://github.com/handsontable/handsontable/issues/5307))
* Fixed a bug with the Copy/Paste plugin working incorrectly, when copying `0`. ([#5544](https://github.com/handsontable/handsontable/issues/5544))
* Fixed a problem with improper `autoRowSize` calculations. ([#5527](https://github.com/handsontable/handsontable/issues/5527))
* Fixed a problem with the keyboard opening on every selection on mobile. ([#5479](https://github.com/handsontable/handsontable/issues/5479))
* Refactored the `columnSorting` plugin to be reusable with the `multiColumnSorting` plugin. ([#5457](https://github.com/handsontable/handsontable/issues/5457))
* Refactored the `multiColumnSorting` plugin to use the `columnSorting` plugin. ([#148](https://github.com/handsontable/handsontable-pro/issues/148))
* Fixed a bug, where adding a new row cleared the data from the first row. ([#5446](https://github.com/handsontable/handsontable/issues/5446))
* Fixed a bug, where using the \`allowInvalid: false\` option on date-typed cells broke the table. ([#5419](https://github.com/handsontable/handsontable/issues/5419))
* Fixed a bug with the column header width being calculated incorrectly. ([#5359](https://github.com/handsontable/handsontable/issues/5359))
* Fixed a problem with building Handsontable `3.0.0+` using `hot-builder`. ([#5287](https://github.com/handsontable/handsontable/issues/5287))
* Fixed a bug, where opening the context menu on the column header sorted the column. ([#4676](https://github.com/handsontable/handsontable/issues/4676), [#176](https://github.com/handsontable/handsontable-pro/issues/176))
* Updated Jest to resolve a security issue with the `merge` package. ([#5564](https://github.com/handsontable/handsontable/issues/5564), [#179](https://github.com/handsontable/handsontable-pro/issues/179))
* Fixed some unstable tests, which caused the CI to fail frequently. ([#5562](https://github.com/handsontable/handsontable/issues/5562))
* Fixed the `ERR_ADDRESS_INVALID` error when running e2e tests. ([#5558](https://github.com/handsontable/handsontable/issues/5558))

## 6.1.1

Released on 23rd of October, 2018

**Changes**

* Fixed a bug, where the Context Menu's `copy` and `cut` options did not work.([#5535](https://github.com/handsontable/handsontable/issues/5535))
* Removed the unneeded `yarn` entry from the dependencies section in `package.json`

## 6.1.0

Released on 17th of October, 2018

**Changes**

* Moved the `fixedRowsBottom` functionality to Handsontable CE. ([#5404](https://github.com/handsontable/handsontable/issues/5404), [#146](https://github.com/handsontable/handsontable-pro/issues/146))
* Introduced a new functionality to the _Copy/Paste_ plugin. From version `6.1.0`, it supports the `text/html` data type alongside `text/plain`. This change, apart from allowing the user to copy data from Handsontable as an HTML table, allowed us to fix multiple bugs related to the plugin:
    * Fixed a bug, where it was impossible to copy the first row/column if it was declared as `readOnly`. (handsontable/handsontable#5392)
    * Fixed a bug, where the cell editor contained an unwanted empty line, if the previous value of the cell was pasted from Excel. ([#5330](https://github.com/handsontable/handsontable/issues/5330))
    * Fixed a problem with copying and pasting data from rows after clicking the row headers. ([#5300](https://github.com/handsontable/handsontable/issues/5300))
    * Fixed a bug where pasting multiple rows from Excel (below version `16`) did not work properly. ([#5277](https://github.com/handsontable/handsontable/issues/5277))
    * Fixed a bug with copying entire rows into Excel not working properly. ([#5176](https://github.com/handsontable/handsontable/issues/5176))
    * Fixed a bug, where pasting data from Excel to Handsontable did not work on Safari. ([#5121](https://github.com/handsontable/handsontable/issues/5121))
    * Fixed a problem with improper cell selection after pasting data into the table. ([#4849](https://github.com/handsontable/handsontable/issues/4849))
    * Fixed a bug with Handsontable crashing after using `updateSettings` inside the `afterSelectionEnd` callback. ([#4837](https://github.com/handsontable/handsontable/issues/4837))
    * Fixed a problem with pasting double quotation marks (`""`) into the table. ([#4790](https://github.com/handsontable/handsontable/issues/4790), [#4003](https://github.com/handsontable/handsontable/issues/4003))
    * Fixed a bug, where copying and pasting empty cells did not work properly. ([#4725](https://github.com/handsontable/handsontable/issues/4725))
    * Fixed a problem with copying data on IE and pasting it on Chrome/Firefox. ([#4717](https://github.com/handsontable/handsontable/issues/4717))
    * Fixed a bug, where copying and pasting entire columns did not work as expected. ([#4456](https://github.com/handsontable/handsontable/issues/4456))
    * Fixed a problem with pasting multiline content into a single cell. ([#4308](https://github.com/handsontable/handsontable/issues/4308))
* Added an Italian translation to the languages set. ([#5407](https://github.com/handsontable/handsontable/issues/5407))
* Added a Dutch translation to the languages set. ([#5156](https://github.com/handsontable/handsontable/issues/5156))
* Fixed a bug, where trying to open the cell editor while a cell outside of the viewport was being edited threw an error. ([#5119](https://github.com/handsontable/handsontable/issues/5119))
* Fixed a bug, where the cell editor rendered improperly when the `preventOverflow` option was enabled. ([#5073](https://github.com/handsontable/handsontable/issues/5073))
* Fixed a bug, where clicking on a cell caused the table container to scroll. ([#4656](https://github.com/handsontable/handsontable/issues/4656))
* Fixed a bug, where using the `Undo` functionality did not work properly after sorting and removing rows. ([#3188](https://github.com/handsontable/handsontable/issues/3188))
* Fixed a bug, where the contents of the `Filters` dropdown menu was scrollable horizontally. ([#151](https://github.com/handsontable/handsontable-pro/issues/151))
* Fix a bug, where multi-column sorting did not work with the `Filters` plugin. ([#149](https://github.com/handsontable/handsontable-pro/issues/149))
* Switched to using a CDN in the default jsfiddle link in the issue template. ([#154](https://github.com/handsontable/handsontable-pro/issues/154))

The corresponding Handsontable CE version is [6.1.0](https://github.com/handsontable/handsontable/releases/6.1.0).

## 6.0.1

Released on 2nd of October, 2018

**Changes**

* Fixed a bug where inserting new columns threw an error. ([#140](https://github.com/handsontable/handsontable-pro/issues/140), [#5422](https://github.com/handsontable/handsontable/issues/5422))
* Fixed a problem where the non-contiguous selection did not work properly in multiple scenarios. ([#5427](https://github.com/handsontable/handsontable/issues/5427))
* Fixed a bug where a newly edited cell had the background of the previously edited cell. ([#5402](https://github.com/handsontable/handsontable/issues/5402))
* Fixed a bug where an error was being thrown after clicking the top-left corner of the table. ([#144](https://github.com/handsontable/handsontable-pro/issues/144), [#5434](https://github.com/handsontable/handsontable/issues/5434))
* Fixed a bug where adding a new row cleared the data in the first row. ([#142](https://github.com/handsontable/handsontable-pro/issues/142), [#5431](https://github.com/handsontable/handsontable/issues/5431))

The corresponding Handsontable CE version is [6.0.1](https://github.com/handsontable/handsontable/releases/6.0.1).

## 6.0.0

Released on 27th of September, 2018

This release contains changes to the `ColumnSorting` plugin exclusively. Detailed information about the changes can be found in the description of pull request [#5411](https://github.com/handsontable/handsontable/issues/5411) and in [our documentation](https://handsontable.com/docs/6.0.0/sorting.html).

**Breaking changes**

* We refactored and rewrote parts of the `ColumnSorting` plugin in order for it to work seamlessly with the new `MultiColumnSorting` plugin for Handsontable Pro. This allowed us to fix multiple problems that the previous version of the plugin had.
    This introduced some backward-incompatible changes:
    * The configuration items (such as `sortIndicator`, `sortEmptyCells`, `sortFunction`) for the plugin were moved into the scope of the plugin config.
    * The initial plugin configuration is stored under the `initialConfig` property in the plugin configuration.
    * The `sortFunction` config item was renamed to `compareFunctionFactory` and converted to a factory returning a compare function (and moved into the plugin configuration scope, as mentioned above).
    * The `sortIndicator` config item was renamed to `indicator` (and moved into the plugin configuration scope, as mentioned above).
    * Comparator function structure changed:
    ```js
    // Was:
    function numericSort(sortOrder, columnMeta) { return function ([, value], [, nextValue]) {
    // Is:
    function numericSort(sortOrder, columnMeta) { return function (value, nextValue) {
    ```

    * The `sort` method arguments were reorganized, so it accepts the sorting configuration as an object: `hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });`

    * Some public methods were rewritten, renamed and set as private, namely:
        * `getNextOrderState`
        * `loadSortingState`
        * `saveSortingState`
    * The `beforeColumnSort` and `afterColumnSort` hooks receive a different set of arguments. For more information, check our [documentation](https://docs.handsontable.com/6.0.0/Hooks.html#beforecolumnsort).
    * Calling the `updateSettings` method with `columnSorting` defined will set a fresh sort configuration.

**Changes**

Apart from the breaking changes above, this release introduces some additional changes to the sorting plugin:

* Added a new plugin - `MultiColumnSorting`. It allows multiple columns to be used when sorting the table.
    While it works similarly to CE's `ColumnSorting`, it introduces multiple new functionalities. Detailed information about this new feature can be found in the [documentation](https://docs.handsontable.com/6.0.0/sorting.html) and in the description of pull request [#101](https://github.com/handsontable/handsontable-pro/issues/101).
* Replaced the current sorting indicators with new ones, in the form of arrows.
* The sorting indicators will be displayed by default.
* Added a possibility to disable the action of sorting by clicking on the headers, using the `headerAction` option.

The corresponding Handsontable CE version is [6.0.0](https://github.com/handsontable/handsontable/releases/6.0.0).

## 5.0.2

Released on 12th of September, 2018

**Changes**

* Fixed a bug where editor focusing caused the window to scroll. ([#5220](https://github.com/handsontable/handsontable/issues/5220))
* Fixed a problem where double-clicking the fill handle filled the cells towards the left instead of down. ([#5023](https://github.com/handsontable/handsontable/issues/5023))
* Fixed a bug where editing a cell showed improper values after sorting and using the `setDataAtRowProp` method. ([#4289](https://github.com/handsontable/handsontable/issues/4289))
* Fixed a problem with editing `autocomplete`\-typed cells after using similar cells in a different Handsontable instance. ([#3374](https://github.com/handsontable/handsontable/issues/3374))
* Corrected a typo in `AutoColumnSize` typescript definition file. ([#5364](https://github.com/handsontable/handsontable/issues/5364))
* Fixed a bug with calculating how many rows/columns need to be rendered. ([#5365](https://github.com/handsontable/handsontable/issues/5365))
* Fixed a bug with column headers improperly rendering after expanding a previously-collapsed column. ([#105](https://github.com/handsontable/handsontable-pro/issues/105))
* Finished the ESLint warning correction task ([#107](https://github.com/handsontable/handsontable-pro/issues/107), [#137](https://github.com/handsontable/handsontable-pro/issues/137)), which included resolving problems with:
    * `arrow-parens` ([#108](https://github.com/handsontable/handsontable-pro/issues/108))
    * `eqeqeq` ([#114](https://github.com/handsontable/handsontable-pro/issues/114))
    * `no-extra-semi` ([#115](https://github.com/handsontable/handsontable-pro/issues/115))
    * `newline-per-chained-call` ([#112](https://github.com/handsontable/handsontable-pro/issues/112))
    * `linebreak-style` ([#110](https://github.com/handsontable/handsontable-pro/issues/110))
    * `no-constant-condition` ([#113](https://github.com/handsontable/handsontable-pro/issues/113))
    * `no-unused-vars` ([#116](https://github.com/handsontable/handsontable-pro/issues/116))
    * `prefer-template` ([#119](https://github.com/handsontable/handsontable-pro/issues/119))
    * `consistent-return` ([#109](https://github.com/handsontable/handsontable-pro/issues/109))
    * `object-curly-spacing` ([#118](https://github.com/handsontable/handsontable-pro/issues/118))
    * `prefer-arrow-callback` ([#117](https://github.com/handsontable/handsontable-pro/issues/117))
    * `max-depth` ([#111](https://github.com/handsontable/handsontable-pro/issues/111))
    * `prefer-spread` ([#122](https://github.com/handsontable/handsontable-pro/issues/122))
    * `prefer-const` ([#125](https://github.com/handsontable/handsontable-pro/issues/125))
    * `no-unneeded-ternary` ([#126](https://github.com/handsontable/handsontable-pro/issues/126))
    * `object-shorthand` ([#121](https://github.com/handsontable/handsontable-pro/issues/121))
    * `space-before-function-paren` ([#124](https://github.com/handsontable/handsontable-pro/issues/124))
    * `prefer-rest-params` ([#127](https://github.com/handsontable/handsontable-pro/issues/127))
    * `no-plusplus` ([#123](https://github.com/handsontable/handsontable-pro/issues/123))
    * `no-eq-null` ([#120](https://github.com/handsontable/handsontable-pro/issues/120))
    * `one-var` ([#128](https://github.com/handsontable/handsontable-pro/issues/128))
    * `no-var` ([#129](https://github.com/handsontable/handsontable-pro/issues/129))
    * `no-undef` ([#130](https://github.com/handsontable/handsontable-pro/issues/130))
    * `vars-on-top` ([#131](https://github.com/handsontable/handsontable-pro/issues/131))
    * `no-use-before-define` ([#132](https://github.com/handsontable/handsontable-pro/issues/132))
    * `no-restricted-properties` ([#133](https://github.com/handsontable/handsontable-pro/issues/133))
    * `no-restricted-syntax` ([#134](https://github.com/handsontable/handsontable-pro/issues/134))
    * `no-param-reassign` ([#136](https://github.com/handsontable/handsontable-pro/issues/136))
    * `no-shadow` ([#135](https://github.com/handsontable/handsontable-pro/issues/135))

The corresponding Handsontable version is [5.0.2](https://github.com/handsontable/handsontable/releases/5.0.2).

## 5.0.1

Released on 16th of August, 2018

**Changes**

* Fixed a bug, where the `Cmd + F` / `Ctrl + F` key combination enabled the multiple selection mode. ([#5302](https://github.com/handsontable/handsontable/issues/5302))
* Added the `getRegistered` method to the typescript definition file. ([#5262](https://github.com/handsontable/handsontable/issues/5262))
* Fixed a bug, where hiding the custom border through the `setBorders` method did not work. ([#5240](https://github.com/handsontable/handsontable/issues/5240))
* Fixed a problem with opening the `handsontable`\-typed cell multiple times. ([#5195](https://github.com/handsontable/handsontable/issues/5195))
* Fixed a problem with inconsistent row height in certain situations. ([#4888](https://github.com/handsontable/handsontable/issues/4888))
* Fixed a bug with autofill border overlapping the selection border. ([#4810](https://github.com/handsontable/handsontable/issues/4810))
* Fixed a bug, where pressing the down arrow would not scroll the table, when the row header was selected. ([#3560](https://github.com/handsontable/handsontable/issues/3560))
* Fixed a problem with calculating the column with after selecting a in-cell checkbox. ([#3437](https://github.com/handsontable/handsontable/issues/3437))
* Updated an `README.md` entry regarding typescript. ([#29](https://github.com/handsontable/handsontable-pro/issues/29))
* Changed an improper link in `filters.js`. ([#103](https://github.com/handsontable/handsontable-pro/issues/103))
* Added tests for the `fixedRowsBottom` synchronization issue. ([#96](https://github.com/handsontable/handsontable-pro/issues/96))
* Fixed a bug, where the fixed rows on the bottom of the table would get out of sync. ([#5163](https://github.com/handsontable/handsontable/issues/5163))

The corresponding Handsontable version is [5.0.1](https://github.com/handsontable/handsontable/releases/5.0.1).

## 5.0.0

Released on 11th of July, 2018

**Breaking changes**

* Refactored the Custom Borders plugin. The API method was changed - added new methods such as `getBorders`, `setBorders` and `clearBorders`. The initial object configuration has been intact, it is still compatible with the previous releases. ([#5017](https://github.com/handsontable/handsontable/issues/5017))
* Improved colors, cursor style and sizes of some parts of Handsontable. ([#5170](https://github.com/handsontable/handsontable/issues/5170))

**Changes**

* Fixed an issue related with a lack of `afterSelectionEnd` hook being fired when `contextmenu` event is called for a cell. This fix additionally introduces two new hooks (`afterOnCellContextMenu`, `beforeOnCellContextMenu`). ([#5201](https://github.com/handsontable/handsontable/issues/5201), [#5232](https://github.com/handsontable/handsontable/issues/5232))
* Fixed an issue related with minifying CSS files where the `z-index` property was incorrectly modified by `OptimizeCssAssetsPlugin` webpack plugin. ([#87](https://github.com/handsontable/handsontable-pro/issues/87))
* Cleaned up and improved the code readability of the `ColumnSorting` plugin. ([#5228](https://github.com/handsontable/handsontable/issues/5228))
* Fixed sort indicator which didn't update after moving columns. ([#3900](https://github.com/handsontable/handsontable/issues/3900))
* Added an ability to disable Byte Order Mark (BOM) while exporting table to the CSV file. ([#86](https://github.com/handsontable/handsontable-pro/issues/86))

The corresponding Handsontable version is [5.0.0](https://github.com/handsontable/handsontable/releases/5.0.0).

## 4.0.0

Released on 13th of June, 2018

**Breaking changes**

* Changed the default values for the following configuration options ([#5135](https://github.com/handsontable/handsontable/issues/5135))
    * `autoInsertRow` (was: `true`, is: `false`)
    * `autoWrapCol` (was: `false`, is: `true`)
    * `autoWrapRow` (was: `false`, is: `true`)
* Updated our number-handling dependency, _Numbro_ to the latest version. ([#5081](https://github.com/handsontable/handsontable/issues/5081), [#77](https://github.com/handsontable/handsontable-pro/issues/77))
    In order to keep your implementation working correctly, you'll need to update the _Numbro 2.x_\-compatible language files.

    For more information on those, take a look at [the Numbro documentation](http://numbrojs.com/languages.html).

**Changes**

* Updated the API documentation for the language settings. ([#5099](https://github.com/handsontable/handsontable/issues/5099))
* Added a Norwegian translation to Handsontable. ([#4694](https://github.com/handsontable/handsontable/issues/4694))
* Fixed a problem with the IME API, where an unwanted first character remained in the editor. ([#4662](https://github.com/handsontable/handsontable/issues/4662))
* Fixed a bug, where there was a way to break the `allowInvalid` option, by making two editors active. ([#4551](https://github.com/handsontable/handsontable/issues/4551))
* Fixed a problem with incomplete table rendering after sorting columns. ([#4062](https://github.com/handsontable/handsontable/issues/4062))
* Fixed a problem with the filtering menu state after using any checkboxes in the table. ([#4780](https://github.com/handsontable/handsontable/issues/4780), [#72](https://github.com/handsontable/handsontable-pro/issues/72))

The corresponding Handsontable version is [4.0.0](https://github.com/handsontable/handsontable/releases/4.0.0).

## 3.0.0

Released on 16th of May, 2018

**Breaking changes**

The Column Sorting plugin is over the first stage of refactoring. ([#5014](https://github.com/handsontable/handsontable/issues/5014)) This resulted in the following breaking changes:

* The main instance's `sort` function was moved to the plugin
* The `sortIndex` property was removed from Handsontable's main instance
* Moved the `sortColumn` and `sortOrder` properties from the main instance to the plugin
* The `sortOrder` property now accepts string values (`asc`, `desc`, `none`), instead of booleans (`true`, `false`, `undefined`)

The Gantt Chart plugin had its API refactored, to allow generating year-related data for other years that the one displayed. ([#67](https://github.com/handsontable/handsontable-pro/issues/67)) Along the way, some of its lesser used API methods became private. Please refer to the documentation for the current state of the API.

**Changes**

* Added missing type definitions for the Search Plugin. ([#5039](https://github.com/handsontable/handsontable/issues/5039))
* Added the Chinese (CN, TW) translations. ([#5007](https://github.com/handsontable/handsontable/issues/5007), [#4923](https://github.com/handsontable/handsontable/issues/4923))
* Added the French translation. ([#4777](https://github.com/handsontable/handsontable/issues/4777))
* Added the Spanish (MX) translation. ([#4900](https://github.com/handsontable/handsontable/issues/4900))
* Fixed a problem, where an error was being thrown when using the `updateSettings` method. ([#4988](https://github.com/handsontable/handsontable/issues/4988))
* Fixed a problem, where using the `TAB` key removed some data, when `minSpareCols` was set to `1`. ([#4986](https://github.com/handsontable/handsontable/issues/4986))
* Fixed a bug, where an infinite hook loop was being created, when the table was initialized at the bottom of the page. ([#4961](https://github.com/handsontable/handsontable/issues/4961))
* Fixed some issues with the CI stability. ([#4925](https://github.com/handsontable/handsontable/issues/4925))
* Removed some unnecessary margins from the Filtering dropdown. ([#69](https://github.com/handsontable/handsontable-pro/issues/69))
* Added an option to the Gantt Chart plugin, which allows skipping the incomplete weeks at the beginning and/or end of the month. ([#65](https://github.com/handsontable/handsontable-pro/issues/65))

The corresponding Handsontable CE version is [3.0.0](https://github.com/handsontable/handsontable/releases/3.0.0).

## 2.0.0

Released on 11th of April, 2018

**Breaking changes**

* Rewritten the Search and Custom Borders plugins to ES6. ([#4892](https://github.com/handsontable/handsontable/issues/4892), [#4621](https://github.com/handsontable/handsontable/issues/4621))

These plugins will no longer be available from the main Handsontable instance. They will be accessible analogously to other plugins, as `hot.getPlugin('search')` and `hot.getPlugin('customBorders')`.

**Changes**

* Added the `beforeContextMenuShow` hook, triggered within the Context Menu plugin. ([#4973](https://github.com/handsontable/handsontable/issues/4973))
* Fixed problems with disappearing selection handles on mobile devices. ([#4943](https://github.com/handsontable/handsontable/issues/4943), [#4936](https://github.com/handsontable/handsontable/issues/4936))
* Fixed a problem, where clicking on links inside cells was not possible on mobile devices. ([#4570](https://github.com/handsontable/handsontable/issues/4570))
* Fixed a bug, where sorting didn't work when filtering was applied ([#4170](https://github.com/handsontable/handsontable/issues/4170))
* Fixed a problem with selecting entire columns, when multiple column header levels are declared. Mostly visible with Handsontable Pro's Nested Headers plugin. ([#4951](https://github.com/handsontable/handsontable/issues/4951))
* Fixed a problem, where the Context Menu was too narrow for its contents. ([#4933](https://github.com/handsontable/handsontable/issues/4933))
* Modified the look of the fill handle. ([#4921](https://github.com/handsontable/handsontable/issues/4921))
* Fixed a bug, where pressing ENTER multiple times on a merged cell at the bottom of the table was not working properly. ([#4915](https://github.com/handsontable/handsontable/issues/4915))
* Fixed a problem with highlighting headers, when selecting entire columns. ([#4875](https://github.com/handsontable/handsontable/issues/4875))
* Fixed a bug, where removing the first row of a merged cell sometimes caused an error. ([#3473](https://github.com/handsontable/handsontable/issues/3473))
* Added a Russian translation. ([#4854](https://github.com/handsontable/handsontable/issues/4854))
* Fixed a bug with handsontable editor headers overlapped the table cells. ([#4787](https://github.com/handsontable/handsontable/issues/4787))
* Fixed a problem, where the `afterRowMove` hook returned improper parameters. ([#4444](https://github.com/handsontable/handsontable/issues/4444))
* Fixed a bug, where the `afterCreateCol` hook returned a wrong `amount` parameter. ([#4210](https://github.com/handsontable/handsontable/issues/4210))
* Fixed problems with alignment and the undo/redo functionality. ([#3319](https://github.com/handsontable/handsontable/issues/3319))
* Fixed a problem, where selecting and entire merged cell with non-contiguous selections did not highlight that merged cell. ([#4860](https://github.com/handsontable/handsontable/issues/4860))
* Fixed a problem with the jsfiddle link in the issue templates. ([#4983](https://github.com/handsontable/handsontable/issues/4983))
* Updated the pull request templates. ([#4957](https://github.com/handsontable/handsontable/issues/4957))
* Added helpers for `console.log`, `console.warn` etc due to IE compatibility. ([#4924](https://github.com/handsontable/handsontable/issues/4924))
* Fixed a problem, where scrolling the table on Chrome on a retina display created empty spaces. ([#4498](https://github.com/handsontable/handsontable/issues/4498))
* Added an additional hook, `beforeDropdownMenuShow` for the dropdown menu plugin. ([#56](https://github.com/handsontable/handsontable-pro/issues/56))
* Fixed a problem with the Dropdown Menu being to narrow for its contents. ([#49](https://github.com/handsontable/handsontable-pro/issues/49))
* Added undo/redo test cases for the dropdown menu plugin. ([#47](https://github.com/handsontable/handsontable-pro/issues/47))
* Fixed a problem, where the size of the buttons in the dropdown menu wasn't dynamically updated. ([#44](https://github.com/handsontable/handsontable-pro/issues/44))
* Added extra parameters for the `beforeFilter` and `afterFilter` hooks. ([#43](https://github.com/handsontable/handsontable-pro/issues/43))
* Fixed a problem with the jsfiddle link in the issue template. ([#58](https://github.com/handsontable/handsontable-pro/issues/58))

The corresponding Handsontable CE version is [2.0.0](https://github.com/handsontable/handsontable/releases/2.0.0).

## 1.18.1

Released on 20th of March, 2018

**Changes**

* Fixed a bug with duplicate fill handles on the edges of the table's overlays. ([CE#4920](https://github.com/handsontable/handsontable/issues/4920))
* Fixed a problem, where the `MergeCells` class was added under `Core` in the docs. ([CE#4941](https://github.com/handsontable/handsontable/issues/4941))

The corresponding Handsontable CE version is [0.38.1](https://github.com/handsontable/handsontable/releases/0.38.1).

## 1.18.0

Released on 14th of March, 2018

**Breaking changes:**

* We removed the mobile editor from the repository. After this version, a standard editor will be used when using mobile devices. ([CE#4911](https://github.com/handsontable/handsontable/issues/4911))

**Changes**

* Fixed a bug, where merged cells declared outside of the table were still partially rendered. ([CE#4887](https://github.com/handsontable/handsontable/issues/4887))
* Added tests for mobile devices. ([CE#4868](https://github.com/handsontable/handsontable/issues/4868))
* Fixed a bug, where rows were not being rendered, when scrolling the table on a mobile device. ([CE#4856](https://github.com/handsontable/handsontable/issues/4856))
* Added some missing API for the non-contiguous selection feature. ([CE#4811](https://github.com/handsontable/handsontable/issues/4811))
* Change the `isObjectEquals` function to `isObjectEqual`. ([CE#4387](https://github.com/handsontable/handsontable/issues/4387))
* Fixed a problem with scrolling on Microsoft Edge. ([CE#4320](https://github.com/handsontable/handsontable/issues/4320))
* Added a proper `source` argument value for removing data from the table using the `Backspace` and `Delete` keys. ([CE#3916](https://github.com/handsontable/handsontable/issues/3916), [CE#3539](https://github.com/handsontable/handsontable/issues/3539))
* Added a `cellProperties` argument for the `beforeValueRender` hook. ([CE#4543](https://github.com/handsontable/handsontable/issues/4543))
* Fixed a problem, where the Filters dropdown contained misaligned elements. ([#33](https://github.com/handsontable/handsontable-pro/issues/33))

The corresponding Handsontable CE version is [0.38.0](https://github.com/handsontable/handsontable/releases/tag/0.38.0).

## 1.17.0

Released on 1st of March, 2018

**Breaking changes:**

* The Merge Cells plugin has been rewritten to ES6 and completely refactored. Before `0.37.0` (`1.17.0` with Handsontable Pro) the plugin was accessible from the `mergeCells` property in the main instance. After the refactor, you can access it just like every other plugin, which is with `hot.getPlugin(‘mergeCells’)`. ([#4214](https://github.com/handsontable/handsontable/issues/4214), [#4858](https://github.com/handsontable/handsontable/issues/4858), [#4870](https://github.com/handsontable/handsontable/issues/4870))

    | **Pre-`0.37.0`** | **Post-`0.37.0`** |
    | ---- | ---- |
    | `hot.mergeCells` | `hot.getPlugin('mergeCells')` |
    | `hot.mergeCells.mergedCellInfoCollection` | `hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells` |

    This update introduces new API (more information in the documentation) and four new hooks:

    * **beforeMergeCells**
    * **afterMergeCells**
    * **beforeUnmergeCells**
    * **afterUnmergeCells**

* The merged cells are now cleared (filled with `null`s). The only value that remains, is the top-left corner cell's value, which is the visible one. ([#2958](https://github.com/handsontable/handsontable/issues/2958))

**Changes**

* Added the `common.css` file, necessary for tests added to Handsontable CE.([#40](https://github.com/handsontable/handsontable-pro/issues/40))

The corresponding Handsontable CE version is [0.37.0](https://github.com/handsontable/handsontable/releases/tag/0.37.0).

## 1.16.0

Released on 16th of February, 2018

**Breaking changes:**

\- Rewritten the `PersistentState` plugin to ES6. ([#4618](https://github.com/handsontable/handsontable/issues/4618)) From this version onward you can access the plugin like all regular plugins (`hot.getPlugin('persistentState')`), not from the main instance (the `hot.storage` object is now accesible from `hot.getPlugin('persistentState').storage`)

\- Added support for selecting non-contiguous cells or ranges ([#4708](https://github.com/handsontable/handsontable/issues/4708)). That required some changes - some of them are backward incompatible:

**New API**

* `hot.getSelectedLast()` Returns an array with coordinates of the last selected layer (`[row, col, rowEnd, colEnd]`). This method behaves as `hot.getSelected()` before the breaking change.
* `hot.getSelectedRangeLast()` Returns a `CellRange` object containing the last selection coordinates applied to the table. This method behaves as `hot.getSelectedRange()` before the braking change.
* `hot.alter('remove_row', [[1, 4], [10, 1]])` Supports removing non-contiguous rows. Instead of passing the row index, we can pass an array of arrays, where the first item is the index of the row and at the second item is the amount of rows to be removed;
* `hot.alter('remove_col', [[1, 4], [10, 1]])` Same as above, but for the columns. Only "remove" actions support that new feature.

**Backward-incompatible changes**

* `hot.getSelected()` Returns an array of arrays with the coordinates of all layers (`[[row, col, rowEnd, colEnd], [row, col, rowEnd, colEnd] ...]`);
* `hot.getSelectedRange()` Returns an array of `CellRange` objects with the coordinates of all layers (`[{CellRange}, {CellRange} ...]`);
* Previously `hot.selection.empty()`, now `hot.emptySelectedCells()`;
* Changed selection colors:
  - area borders, was `#89aff9` -> is `#4b89ff`
  - area background, was `#b5d1ff` -> is `#005eff`
  - current selection border, was `#5292f7` -> is `#4b89ff`
* Removed the `multiSelect` setting and replaced it with `selectionMode: 'single'`;
* Added a new `selectionMode` option, which can be set either as `'single'` (previously as `multiSelect: false`), `'range'` (previously as `multiSelect: true`) or `'multiple'` (new non-contiguous mode);

**Backward-compatible changes**

* `afterSelection`
  - _previously_: `afterSelection(row, column, rowEnd, columnEnd, preventScrolling)`
  - _now_: `afterSelection(row, column, rowEnd, columnEnd, preventScrolling, selectionLayerLevel)`
* `afterSelectionByProp`
  - _previously_: `afterSelectionByProp(row, prop, rowEnd, propEnd, preventScrolling)`
  - _now_: `afterSelectionByProp(row, prop, rowEnd, propEnd, preventScrolling, selectionLayerLevel)`
* `afterSelectionEnd`
  - _previously_: `afterSelectionEnd(row, column, rowEnd, columnEnd)`
  - _now_: `afterSelectionEnd(row, column, rowEnd, columnEnd, selectionLayerLevel)`
* `afterSelectionEndByProp`
  - _previously_: `afterSelectionEndByProp(row, prop, rowEnd, propEnd)`
  - _now_: `afterSelectionEndByProp(row, prop, rowEnd, propEnd, selectionLayerLevel)`

We've added a `selectionLayerLevel` argument for all the hooks listed above. The `selectionLayerLevel` is a number indicating which selection layer is currently being modified. For the first selection, this value is `0`, with the new added layers this number increases.

**Changes**

* Fixed a problem with unneeded rows being added when using Filters along with minRows or minSpareRows. ([#24](https://github.com/handsontable/handsontable-pro/issues/24))

The corresponding Handsontable CE version is [0.36.0](https://github.com/handsontable/handsontable/releases/tag/0.36.0).

## 1.15.1

Released on 25th of January, 2018

**Changes:**

* Fixed a problem, where the language files were not generated properly in some specific cases. ([#23](https://github.com/handsontable/handsontable-pro/issues/23))
* Fixed a problem with the `afterValidate` hook's arguments with `trimRows` enabled. ([#11](https://github.com/handsontable/handsontable-pro/issues/11))
* Updated the `moment` version because of a ReDoS vulnerability.

The corresponding Handsontable CE version is `0.35.1`.

## 1.15.0

Released on 6th of December, 2017

**New feature:**

From now on you will able to translate messages and elements of the UI to your specific language. [Read more](https://docs.handsontable.com/internationalization.html) about this new feature.

**Breaking changes:**

* We have renamed our locale and language-related configuration options to free the namespace required for multi-language support introduced within this release.

What used to be defined as:
```js
{
  format: '0,0.00 $',
  language: 'de-DE'
}
```
will now look like this:
```js
{
  numericFormat: {
    pattern: '0,0.00 $',
    culture: 'de-DE'
  }
}
```
Take a look at our documentation for more insight:

* [to version 1.14.3](https://docs.handsontable.com/1.14.3/numeric.html)
* [from version 1.15.0](https://docs.handsontable.com/1.15.0/numeric.html)

**Other changes:**

* Removed unwanted dependencies. ([#13](https://github.com/handsontable/handsontable-pro/issues/13))
* Fixed problems in test cases for the `Filters` plugin. ([#12](https://github.com/handsontable/handsontable-pro/issues/12))
* Added multi-language support for the table. Please, take a look at https://docs.handsontable.com/internationalization.html for more information. ([#6](https://github.com/handsontable/handsontable-pro/issues/6))
* Added a `weekHeaderGenerator` option for the `GanttChart` plugin. ([#19](https://github.com/handsontable/handsontable-pro/issues/19))
* Fixed a bug, where formulas did not work on nested coordinates. ([#15](https://github.com/handsontable/handsontable-pro/issues/15))

The corresponding Handsontable CE version is [0.35.0](https://github.com/handsontable/handsontable/releases/tag/0.35.0).

## 1.14.3

Released on 12th of October, 2017

**Changes:**

* Added the `allowSplitWeeks` option for the Gantt Chart plugin (defaults to `true`) ([#2](https://github.com/handsontable/handsontable-pro/issues/2))

The corresponding Handsontable CE version is `0.34.5`.

## 1.14.2

Released on 13th of September, 2017

**Changes:**

* Added a missing `moment` import. ([#4514](https://github.com/handsontable/handsontable/issues/4514))

The corresponding Handsontable CE version is `0.34.4`.

## 1.14.1

Released on 12th of September, 2017

**Changes:**

* Fix a problem, with the table instance removed its sibling on `destroy`.

The corresponding Handsontable CE version is `0.34.3`.

## 1.14.0

Released on 12th of September, 2017

**Breaking changes:**

* Since version `1.14.0`, it is required to pass a valid Handsontable Pro license key in the settings object under the `licenseKey` property. If a valid key is not provided, Handsontable will display a small notification below the table.
  Please review your implementation to make sure your setup remains intact.

The corresponding Handsontable CE version is `0.34.2`.

## 1.13.1

Released on 6th of September, 2017

**Changes:**

* Fixed a problem with the Filters plugin improperly trimming the table rows.
* Updated documentation for the Trim Rows plugin.
* Fixed a problem with the Filters plugin dropdown components not being updated properly.
* Fixed a problem with `hot-table` not being initialized properly.
* Fixed a problem with Handsontable throwing an error when moving the cursor outside the table.
* Updated the `setDataAtCell` TypeScript definition.
* Updated the Bootstrap `css` files.

The corresponding Handsontable CE version is `0.34.1`.

## 1.13.0

Released on 2nd of August, 2017

**Breaking changes:**

* We've unified the types of coordinates passed to these plugin hooks: `beforeGetCellMeta`, `afterGetCellMeta`, `afterSetCellMeta`. Now they'll be operating on **visual** table coordinates (so do the `getCellMeta` and `setCellMeta` methods). Please make sure you update your hook callbacks to use them properly. ([#4409](https://github.com/handsontable/handsontable/issues/4409))

**Changes:**

* Updated the Filters documentation.
* Fixed a problem where the Filters plugin threw an error when there was a condition with too many arguments applied.
* Added support for the `EXP` formula in the Filters plugin.
* Changed the text in the warning message thrown when the amount of conditions exceeded the capacity of the dropdownMenu.
* Fixed the alignment of the checkboxes in the Filters dropdown menu.
* Fixed a problem where the Filters plugin threw an error when adding a condition with an improper name.
* Fixed a problem where the Filters plugin threw an error when using the `disablePlugin` method while the Dropdown Menu plugin was not enabled.

The corresponding Handsontable CE version is `0.34.0`.

## 1.12.0

Released on 11th of July, 2017

**Breaking changes:**

* We've refactored the Copy/Paste plugin and removed the ZeroClipboard dependency. Please make sure it works as expected in your setup before updating to this version.
* Some of the Filters plugin's API methods has changed. Please check [GH#4358](https://github.com/handsontable/handsontable/issues/4358) for detailed information.

**Changes:**

* Fixed a bug where Filters were broken when doing a custom build.
* Added a workaround for npm incorrectly generating the `package-lock.json` file.
* Removed ZeroClipboard from dependencies.
* Extended the Filters API for with extra operations between conditions.
* Updated the Handsontable dependencies.
* Fixed a problem with a missing method import. ([#4367](https://github.com/handsontable/handsontable/issues/4367))
* Added a new config option for the Comments plugin (`displayDelay`), allowing to customize the delay for showing the comment box. ([#4323](https://github.com/handsontable/handsontable/issues/4323))
* Fixed a problem, where using the Autofill option upwards with a group of cells gave unexpected results. ([#4298](https://github.com/handsontable/handsontable/issues/4298))
* Updated the Handsontable dependencies. ([#4280](https://github.com/handsontable/handsontable/issues/4280))
* Fixed an issue with different gap sizes in the dropdown menu for Firefox and Chrome. ([#2832](https://github.com/handsontable/handsontable/issues/2832))
* Updated documentation for some methods in our API. ([#4191](https://github.com/handsontable/handsontable/issues/4191), [#4032](https://github.com/handsontable/handsontable/issues/4032), [#3895](https://github.com/handsontable/handsontable/issues/3895), [#3876](https://github.com/handsontable/handsontable/issues/3876), [#3170](https://github.com/handsontable/handsontable/issues/3170), [#3025](https://github.com/handsontable/handsontable/issues/3025), [#2298](https://github.com/handsontable/handsontable/issues/2298), [#2259](https://github.com/handsontable/handsontable/issues/2259))
* Added a helper for template literals. ([#4354](https://github.com/handsontable/handsontable/issues/4354))
* Updated our ESlint rules list. ([#4366](https://github.com/handsontable/handsontable/issues/4366))

The corresponding Handsontable CE version is `0.33.0`.

## 1.11.0

Released on 31th of May, 2017

**Breaking changes:**

* Migration from Traceur to Babel. ([#4070](https://github.com/handsontable/handsontable/issues/4070))

We're now using Babel to transpile our code. That means that we had to make breaking changes, please take a look if you have to make some adjustments in your implementation before moving to this version.

* The Bootstrap CSS files were merged to Handsontable's default CSS.
* The `/plugins` directory was deleted (with the "removeRow plugin" included)
* Some global variables were reorganized and/or removed. Please take a look.

**Validators**

| Was | Is |
|-----|----|
| Handsontable.AutocompleteValidator | Handsontable.validators.AutocompleteValidator |
| Handsontable.DateValidator | Handsontable.validators.DateValidator |
| Handsontable.NumericValidator | Handsontable.validators.NumericValidator |
| Handsontable.TimeValidator | Handsontable.validators.TimeValidator |

**Renderers**

| Was | Is |
|-----|----|
| Handsontable.AutocompleteRenderer | Handsontable.renderers.AutocompleteRenderer |
| Handsontable.BaseRenderer | Handsontable.renderers.BaseRenderer |
| Handsontable.CheckboxRenderer | Handsontable.renderers.CheckboxRenderer |
| Handsontable.HtmlRenderer | Handsontable.renderers.HtmlRenderer |
| Handsontable.NumericRenderer | Handsontable.renderers.NumericRenderer |
| Handsontable.PasswordRenderer | Handsontable.renderers.PasswordRenderer |
| Handsontable.TextRenderer | Handsontable.renderers.TextRenderer |

**Cell types**

| Was | Is |
|-----|----|
| Handsontable.AutocompleteCell | Handsontable.cellTypes.autocomplete |
| Handsontable.CheckboxCell | Handsontable.cellTypes.checkbox |
| Handsontable.DateCell | Handsontable.cellTypes.date |
| Handsontable.DropdownCell | Handsontable.cellTypes.dropdown |
| Handsontable.HandsontableCell | Handsontable.cellTypes.handsontable |
| Handsontable.NumericCell | Handsontable.cellTypes.numeric |
| Handsontable.PasswordCell | Handsontable.cellTypes.password |
| Handsontable.TextCell | Handsontable.cellTypes.text |
| Handsontable.TimeCell | Handsontable.cellTypes.time |

**Plugins**

| Was | Is |
|-----|----|
| Handsontable.CustomBorders | Handsontable.plugins.CustomBorders |
| Handsontable.MergeCells | Handsontable.plugins.MergeCells |
| Handsontable.Search | Handsontable.plugins.Search |
| Handsontable.UndoRedo | Handsontable.plugins.UndoRedo |

**Helpers**

| Was | Is |
|-----|----|
| Handsontable.Dom | Handsontable.dom |

**Other**

| Was | Is |
|-----|----|
| Handsontable.EditorManager | (not available) |
| Handsontable.EditorState | (not available) |
| Handsontable.SearchCellDecorator | (not available) |
| Handsontable.TableView | (not available) |
| Handsontable.cellLookup | (not available) |
| Handsontable.eventManager | Handsontable.EventManager |
| Handsontable.utils | (not available) |

* Changed the way in which custom cell types are being registered. ([#4254](https://github.com/handsontable/handsontable/issues/4254))

  We improved the public API to give developers an ability to register cell behaviors and types separately. We strongly recommend to use a registered alias in Handsontable settings to increase the code maintainability.

  An example on how to add a custom editor/renderer/validator:

  ```js
  Handsontable.cellTypes.registerCellType('my-custom-select', {
    editor: MyCustomSelectEditor,
    renderer: MyCustomSelectRenderer,
    validator: MyCustomSelectValidator,
  });

  Handsontable.validators.registerValidator('credit-card', function(query, callback) {
    callback(/* passed `true` or `false` depending on a query value */);
  });

  new Handsontable(document.getElementById('element'), {
    data: data,
    columns: [{
      data: 'id',
      type: 'my-custom-select'
    }, {
      data: 'name',
      renderer: 'my-custom-select'
    }, {
      data: 'cardNumber',
      validator: 'credit-card'
    }]
  })
  ```

**Changes:**

* Fixed documentation for the `autoRowSize` config option. ([#4267](https://github.com/handsontable/handsontable/issues/4267))
* Fixed documentation for the `cells` config option. ([#4185](https://github.com/handsontable/handsontable/issues/4185))
* Fixed a problem with the `maxRows` functionality. ([#4180](https://github.com/handsontable/handsontable/issues/4180))
* Fixed a problem with the `maxCols` functionality. ([#4156](https://github.com/handsontable/handsontable/issues/4156))
* Fixed a bug, where passing integer values to a dropdown caused the cell to be marked as invalid. ([#4143](https://github.com/handsontable/handsontable/issues/4143))
* Added the TypeScript definitions to the repository. ([#4112](https://github.com/handsontable/handsontable/issues/4112))
* Fixed a bug with `getCoords` throwing an error when used on non-cell elements. ([#4074](https://github.com/handsontable/handsontable/issues/4074))
* Data copied from the table will no longer have a **newline** at the end. ([#3801](https://github.com/handsontable/handsontable/issues/3801))
* Fixed a problem with scrolling on IE9+. ([#2350](https://github.com/handsontable/handsontable/issues/2350))
* Fixed a wrong variable in a listener of the mouse wheel event. ([#4255](https://github.com/handsontable/handsontable/issues/4255))
* Fixed an issue related to defining a cell metadata for non-existing cells. ([#4024](https://github.com/handsontable/handsontable/issues/4024))

The corresponding Handsontable CE version is `0.32.0`.

## 1.11.0-beta2

Released on 24th of May, 2017

**Breaking changes:**

* Changed the way in which custom cell types are being registered. ([#4254](https://github.com/handsontable/handsontable/issues/4254))

  As you already know from beta1 release, we have migrated from Traceur to Babel. It required from us to standarize the code so we decided to stop using a Handsontable global variable in our internal projects. As a result, we changed the way of creating custom editors, validators, renderers and their combinations like 'cell types'. In this beta2 release we improved the public API to give developers an ability to register cell behaviors and types separately. We strongly recommend to use a registered alias in Handsontable settings to increase the code maintainability.

  An example on how to add a custom editor/renderer/validator:

  ```js
  Handsontable.cellTypes.registerCellType('my-custom-select', {
    editor: MyCustomSelectEditor,
    renderer: MyCustomSelectRenderer,
    validator: MyCustomSelectValidator,
  });

  Handsontable.validators.registerValidator('credit-card', function(query, callback) {
    callback(/* passed `true` or `false` depending on a query value */);
  });

  new Handsontable(document.getElementById('element'), {
    data: data,
    columns: [{
      data: 'id',
      type: 'my-custom-select'
    }, {
      data: 'name',
      renderer: 'my-custom-select'
    }, {
      data: 'cardNumber',
      validator: 'credit-card'
    }]
  })
  ```

**Changes:**

* Fixed a wrong variable in a listener of the mouse wheel event. ([#4255](https://github.com/handsontable/handsontable/issues/4255))
* Fixed an issue related to defining a cell metadata for non-existing cells. ([#4024](https://github.com/handsontable/handsontable/issues/4024))

The corresponding Handsontable CE version is `0.32.0-beta2`.

## 1.11.0-beta1

Released on 17th of May, 2017

**Breaking changes:**

* Migration from Traceur to Babel. ([#4070](https://github.com/handsontable/handsontable/issues/4070))

We're now using Babel to transpile our code. That means that we had to make breaking changes, please take a look if you have to make some adjustments in your implementation before moving to this version.

* The Bootstrap CSS files were merged to Handsontable's default CSS.
* The `/plugins` directory was deleted (with the "removeRow plugin" included)
* Some global variables were reorganized and/or removed. Please take a look.

**Validators**

| Was | Is |
|-----|----|
| Handsontable.AutocompleteValidator | Handsontable.validators.AutocompleteValidator |
| Handsontable.DateValidator | Handsontable.validators.DateValidator |
| Handsontable.NumericValidator | Handsontable.validators.NumericValidator |
| Handsontable.TimeValidator | Handsontable.validators.TimeValidator |

**Renderers**

| Was | Is |
|-----|----|
| Handsontable.AutocompleteRenderer | Handsontable.renderers.AutocompleteRenderer |
| Handsontable.BaseRenderer | Handsontable.renderers.BaseRenderer |
| Handsontable.CheckboxRenderer | Handsontable.renderers.CheckboxRenderer |
| Handsontable.HtmlRenderer | Handsontable.renderers.HtmlRenderer |
| Handsontable.NumericRenderer | Handsontable.renderers.NumericRenderer |
| Handsontable.PasswordRenderer | Handsontable.renderers.PasswordRenderer |
| Handsontable.TextRenderer | Handsontable.renderers.TextRenderer |

**Cell types**

| Was | Is |
|-----|----|
| Handsontable.AutocompleteCell | Handsontable.cellTypes.autocomplete |
| Handsontable.CheckboxCell | Handsontable.cellTypes.checkbox |
| Handsontable.DateCell | Handsontable.cellTypes.date |
| Handsontable.DropdownCell | Handsontable.cellTypes.dropdown |
| Handsontable.HandsontableCell | Handsontable.cellTypes.handsontable |
| Handsontable.NumericCell | Handsontable.cellTypes.numeric |
| Handsontable.PasswordCell | Handsontable.cellTypes.password |
| Handsontable.TextCell | Handsontable.cellTypes.text |
| Handsontable.TimeCell | Handsontable.cellTypes.time |

**Plugins**

| Was | Is |
|-----|----|
| Handsontable.CustomBorders | Handsontable.plugins.CustomBorders |
| Handsontable.MergeCells | Handsontable.plugins.MergeCells |
| Handsontable.Search | Handsontable.plugins.Search |
| Handsontable.UndoRedo | Handsontable.plugins.UndoRedo |

**Helpers**

| Was | Is |
|-----|----|
| Handsontable.Dom | Handsontable.dom |

**Other**

| Was | Is |
|-----|----|
| Handsontable.EditorManager | (not available) |
| Handsontable.EditorState | (not available) |
| Handsontable.SearchCellDecorator | (not available) |
| Handsontable.TableView | (not available) |
| Handsontable.cellLookup | (not available) |
| Handsontable.eventManager | Handsontable.EventManager |
| Handsontable.utils | (not available) |

**Changes in Handsontable CE:**

* Fixed documentation for the `cells` config option. ([#4185](https://github.com/handsontable/handsontable/issues/4185))
* Fixed a problem with the `maxRows` functionality. ([#4180](https://github.com/handsontable/handsontable/issues/4180))
* Fixed a problem with the `maxCols` functionality. ([#4156](https://github.com/handsontable/handsontable/issues/4156))
* Fixed a bug, where passing integer values to a dropdown caused the cell to be marked as invalid. ([#4143](https://github.com/handsontable/handsontable/issues/4143))
* Added the TypeScript definitions to the repository. ([#4112](https://github.com/handsontable/handsontable/issues/4112))
* Fixed a bug with `getCoords` throwing an error when used on non-cell elements. ([#4074](https://github.com/handsontable/handsontable/issues/4074))
* Data copied from the table will no longer have a **newline** at the end. ([#3801](https://github.com/handsontable/handsontable/issues/3801))
* Fixed a problem with scrolling on IE9+. ([#2350](https://github.com/handsontable/handsontable/issues/2350))

**Changes in Handsontable Pro:**

* Fixed a problem, where the `ESC` key did not work for the filtering menu.

The corresponding Handsontable CE version is `0.32.0-beta1`.

## 1.10.1

Released on 7th of March, 2017

**Changes**

* Fixed a problem where the column titles were trimmed when using the `nestedHeaders` plugin.
* Fixed a problem with the Nested Headers' `collapseAll` method.
* Updated Handsontable CE to `0.31.1`.

## 1.10.0

Released on 14th of February, 2017

**Backward incompatible changes**

* Changed the possible values of the `source` property provided by plugin hooks. [See the issue page for this problem for more information about the breaking change.](https://github.com/handsontable/handsontable/issues/4017#issuecomment-277200985) ([#4017](https://github.com/handsontable/handsontable/issues/4017))

**Changes**

* Updated the `hot-formula-parser` dependency.
* Added some fixes for Handsontable CE.
* Fixed a bug with `grunt test-pro` wasn't working properly.
* Updated Handsontable CE version to `0.31.0`.

## 1.9.1

Released on 17st of January, 2017

**Changes**

* Fixed a problem with copying/pasting values when `fixedRowsBottom` is enabled.
* Updated the Handsontable version to `0.30.1`.

## 1.9.0

Released on 11th of January, 2017

**Breaking Changes**

* The **AutoFill** plugin was refactored, thus introducing some breaking changes into the API. If your implementation uses the previous `autoFill` structure, please check if it everything works as expected. ([#3257](https://github.com/handsontable/handsontable/issues/3257))
* The `setCellMeta` method was changed to work on _visual_ row and column indexes, analogously to the `getCellMeta` method. If your implementation utilizes it, please check if you need to tweak it (it may cause issues especially when using it with the `columnSorting`, `manualRowMove` and `manualColumnMove` plugins).

**Changes**

* Fixed issues with manipulating the data structure with the `columnSummary` plugin enabled.
* Added tests for the Pro version concerning the maxRows option.
* Fixed a problem with building the Pro version with a different Handsontable branch than `master`
* Updated Handsontable to version `0.29.0`.

## 1.8.2

Released on 21st of December, 2016

**Changes**

* Fix a problem when longer header labels were cut with the `nestedHeaders` plugin.
* Fix a problem with selection and keyboard navigation when using the `hiddenRows` plugin.
* Updated the Handsontable version to `0.29.2`.

## 1.8.1

Released on 13th of December, 2016

**Changes**

* Refactored the `columnSummary` plugin, introducing a feature which allows providing custom functions to the plugin configuration.
* Updated Handsontable to version `0.29.1`.

## 1.8.0

Released on 8th of November, 2016

**Breaking changes**

* We've added a new cell property: `allowHtml`. If you set it to `true`, the `autocomplete` and `dropdown` cells will be able to render HTML elements correctly (as it was before). However, if you set it to `false`, no HTML will be rendered. This change is meant to decrease Handsontable's XSS vulnerability.
* We've refactored the Comments plugin, which caused some API and visual changes. Please see our documentation and check if you need to make some changes in your implementation. The `allowHtml` property defaults to \*\*false\*\*, so please make sure if you have to specify it in your implementation!

**Changes**

* Fixed problems with tests on macOS Sierra.
* Fixed a problem when typing `=` in a cell caused an error to be thrown.
* Tweaked invalid characters validation for the formulas.
* Fixed a problem with updating the `fixedRowsBottom` option.
* Updated Handsontable to the latest version. (`0.29.0`).

## 1.7.4

Released on 13th of October, 2016

**Changes**

* Updated Handsontable to the latest version. (`0.28.4`).

## 1.7.3

Released on 5th of October, 2016

**Changes**

* Updated Handsontable to the latest version. (`0.28.3`).

## 1.7.2

Released on 4th of October, 2016

**Changes**

* Fixed a problem where hiding the first column would also hide its border.
* Updated Handsontable to the latest version. (0.28.2)

## 1.7.1

Released on 29th of September, 2016

**Changes**

* Added the `hot-formula-parser` dependency to `bower.json`.
* Fixed the `firstWeekDay` functionality in the Gantt Chart plugin.
* Fixed a problem when it was impossible to create Gantt Chart plugin's range bars spanned between years.
* Fixed a problem with header selection in the Nested Headers plugin.
* Fixed a problem with the Formulas and Column Sorting plugins being used together.
* Updated to the latest Handsontable version (`0.28.1`)

## 1.7.0

Released on 15th of September, 2016

**Breaking changes**

* This release introduces a new feature - Formulas (currently in alpha stage, may not be stable). This required us to make some breaking changes, for example, the `afterCreateRow` and `afterCreateCol` changes their argument types (the third argument used to be `boolean`, now it has to be `string`). You can find more about the plugin in our docs: [http://docs.handsontable.com/formula-support.html](http://docs.handsontable.com/formula-support.html).
* We've refactored the Manual Column Move plugin to allow the user to move multiple columns at once. This made some backward-incompatible changes. For example the `beforeColumnMove` and `afterColumnMove` hooks had their arguments changed.

After updating to this version, please check if any changes need to made in your implementation.

**Changes**

* New plugin - Nested Rows. It's currently in alpha stage and may not be stable. It allows providing Handsontable with nested data structures and operating on data within the groups. You can find more information in our docs: [http://docs.handsontable.com/demo-nested-rows.html](http://docs.handsontable.com/demo-nested-rows.html).
* Added missing dependencies to `bower.json`.
* Updated to the latest Handsontable version (`0.28.0`).

## 1.6.0

Released on 2nd of September, 2016

**Breaking changes**

* We've refactored the Manual Row Move plugin to allow the user to move multiple rows at once. This made some backward-incompatible changes. For example the \`beforeRowMove\` and \`afterRowMove\` hooks had their arguments changed. After updating to this version, please check if any changes need to made in your implementation.
* We've added an additional default column/row header styling - now the column and row header corresponding to the selected cell will be rendered with a darker background. Please have that in mind when styling your Handsontable implementations.

**Changes**

* Fixed some performance problems connected with using both Dropdown Menu and Filters together.
* Added support for the refactored Manual Row Move plugin in the Hidden Rows plugin.
* Updated Handsontable to the latest version, which is 0.27.0. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.27.0)).

## 1.5.1

Released on 27th of July, 2016

**Changes**

* Improved rendering performance of GanttChart plugin.
* Updated Handsontable to the latest version, which is 0.26.1. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.26.1)).

## 1.5.0

Released on 27th of June, 2016

**Backward incompatible changes**

* Changed one of our core dependencies. We're using [Numbro](https://github.com/foretagsplatsen/numbro) instead of [Numeral.js](https://github.com/adamwdraper/Numeral-js). If you're including our dependencies independently, please update your setup. ([3487](https://github.com/handsontable/handsontable/issues/3487))
* Updated Handsontable to the latest version, which is 0.26.0. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.26.0)).

**Changes**

* Fixed a bug where hovering over the `Filter by value` items would throw errors.

## 1.4.1

Released on 6th of June, 2016

**Changes**

* Fixed problems with hiddenRows and hiddenColumns.
* New feature: Added a Select All and Clear options for the Filtering plugin.
* Fixed problems with filtering blank cells.
* Updated Handsontable to the latest version, which is 0.25.1. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.25.1)).

## 1.4.0

Released on 25th of May, 2016

**Changes**

* Fixed problems with selection in the nestedHeaders plugin.
* New feature: Added "show" and "hide column" to the Context Menu.
* Upgraded Handsontable to the latest version, which is 0.25.0. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.25.0)).

## 1.3.4

Released on 28th of April, 2016

**Changes**

* Upgraded Handsontable to the latest version, which is 0.24.3. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.24.3)).

## 1.3.3

Released on 11th of April, 2016

**Changes**

* Added the `afterFilter` hook.
* Replaced `keyup` with `input` in "Filter by Value" section.
* Fixed problems with not working ESC key.
* Added support for node environment.
* Upgraded Handsontable to the latest version, which is 0.24.2. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.24.2)).

## 1.3.2

Released on 18th of March, 2016

**Changes**

* Update with a working `handsontable.full.js` build. The `.full` build from `1.3.1` had major problems with the date and time cells.

## 1.3.1

Released on 16th of March, 2016

**Changes**

* Upgraded Handsontable to the latest version, which is 0.24.1. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.24.1)).

## 1.3.0

Released on 15th of March, 2016

**Backward incompatible change**

* Upgraded Handsontable to the latest version, which is 0.24.0. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.24.0)).
* A noticeable visual change in the Filters plugin: The filters menu gained a new section (Filter by Value).

**Changes**

* Fixed problem when enabling manualColumnMove and hiddenColumns displayed empty values in a column.
* Fixed a problem, when sometimes clicking a dropdown menu button caused the page to refresh.
* Extended the Filters functionality by adding the "filter by value" component.
* Added a possibility to undo/redo filtering.

## 1.2.0

Released on 19th of February, 2016

**Backward incompatible change**

* Upgraded Handsontable to the latest version, which is 0.23.0. ([See changes](https://github.com/handsontable/handsontable/releases/tag/0.23.0))

**Changes**

* Added an asynchronous calls in Gantt Chart plugin to reduce the time needed to update the data.
* Improvements to the Context/Dropdown menu, mainly a better UI handling.
* The Filter Data plugin is not shrinking the table anymore when there is no results.

## 1.1.1

Released on 4th of February, 2016

* Added a possibility to set up server-side filtering by adding the `beforeFilter` hook.
* Added cell meta cache'ing to the Gantt Chart plugin in order to properly use the `updateSettings` method.

## 1.1.0

Released on 3th of February, 2016

* **Backward incompatible change**

  Upgraded Handsontable to the latest version, which is 0.22.0.
* Fixed an error with selecting a row, with the last column being hidden.
* Fixed a memory leak problem with the GanttChart plugin.

## 1.0.0

Released on 20th of January, 2016

* **Backward incompatible change**

  The `afterValidate` hook will provide the _visual_ row indexes, instead of the _logical_ ones. For example, if the first row becomes the seventh row after sorting the table, the `afterValidate` hook will provide `6` as the row index. To translate the _visual_ row to the _logical_ row, you can use the `translateRow` method of the `columnSorting` plugin ([#3132](https://github.com/handsontable/handsontable/issues/3132)).
  ```js
  var logicalRow = hotInstance.getPlugin('columnSorting').translateRow(row);
  ```

* Fixed problem, where pasting a dataset which row count exceeds the number of rows in the table nothing happened.
* Fixed problems with dropdown menu and submenu positioning.
* Fixed problems with filtering the fixed rows.
* Fixed problem with filter options missing after filtering out all rows.

## 1.0.0-beta3

Released on 11th of January, 2016

* Fixed problem with the `columnSummary` plugin, which wasn't updating the calculation results when an object-based dataset was provided to the Handsontable instance.
* Prevent displaying the dropdown header buttons in higher levels of headers (for example, when using the nested headers plugin).

## 1.0.0-beta2

Released on 8th of January, 2016

* Fixed problems with columns being selected after collapsing a column (with the `collapsibleColumns` plugin).
* Fixed problems with `fixedRowsBottom` not working properly with window-scrollable tables.
* Fixed wrong position issues in the Filters plugin.
* Fixed column selection issues in the `nestedHeaders` plugin.

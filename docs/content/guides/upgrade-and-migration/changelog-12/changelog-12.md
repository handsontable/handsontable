---
type: reference
id: t93bqrh5
title: Changelog 12.0
metaTitle: Changelog 12.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 12.0 in each minor and patch release.
permalink: /changelog-12
canonicalUrl: /changelog-12
react:
  id: v49fpp8y
  metaTitle: Changelog 12.0 - React Data Grid | Handsontable
angular:
  id: w26ga6t8
  metaTitle: Changelog 12.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 12.x.

## 12.4.0

Released on May 23, 2023.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post (12.4.0)](https://handsontable.com/blog/handsontable-12-4-0-auto-updating-formulas)
- [Documentation (12.4)](https://handsontable.com/docs/12.4)

</div>

#### Added

- Added two new Handsontable hooks, [`afterColumnSequenceChange`](@/api/hooks.md#aftercolumnsequencechange) and [`afterRowSequenceChange`](@/api/hooks.md#afterrowsequencechange), which are fired after changing the order of columns or rows, respectively. [#10215](https://github.com/handsontable/handsontable/pull/10215)

#### Fixed

- Fixed numerous issues related to syncing Handsontable with HyperFormula. Now, formulas work properly with all the Handsontable features. [#10215](https://github.com/handsontable/handsontable/pull/10215)
- Fixed na issue where formulas didn't recalculate after rows or columns were moved. [#4668](https://github.com/handsontable/handsontable/issues/4668)
- Fixed an issue where Handsontable's dates didn't sync correctly with HyperFormula's dates. [#10085](https://github.com/handsontable/handsontable/issues/10085)
- Fixed an issue where calling [`updateSettings()`](@/api/core.md#updatesettings) would reset HyperFormula's undo/redo actions stack. [#10326](https://github.com/handsontable/handsontable/pull/10326)
- Fixed an issue where the [`Autofill`](@/api/autofill.md), [`TrimRows`](@/api/trimRows.md) and [`Formulas`](@/api/formulas.md) plugins didn't work properly together. [#10200](https://github.com/handsontable/handsontable/issues/10200)
- Fixed an issue where the [`modifySourceData`](@/api/hooks.md#modifysourcedata) hook used the wrong type of indexes. [#10215](https://github.com/handsontable/handsontable/pull/10215)
- Fixed an issue where text copied from Handsontable to Excel included wrong types of spaces. [#10017](https://github.com/handsontable/handsontable/issues/10017)
- Fixed an issue where mousing over the same cell twice didn't trigger the [`beforeOnCellMouseOver`](@/api/hooks.md#beforeoncellmouseover) and [`afterOnCellMouseOver`](@/api/hooks.md#afteroncellmouseover) hooks. [#10321](https://github.com/handsontable/handsontable/pull/10321)
- Updated TypeScript definition files related to the [`CustomBorders`](@/api/customBorders.md) plugin. [#10360](https://github.com/handsontable/handsontable/pull/10360)
- Fixed an issue where moving rows manually to the bottom was difficult due the misalignment between the backlight and guideline elements. [#9556](https://github.com/handsontable/handsontable/issues/9556)

## 12.3.3

Released on March 28, 2023.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post (12.3.3)](https://handsontable.com/blog/handsontable-12-3-3-better-support-for-react-18-and-large-data-sets)
- [Documentation (12.3)](https://handsontable.com/docs/12.3)

</div>

#### Added

- Added a Chinese (zh-CN) translation of the "Copy with headers" feature.
  [#10273](https://github.com/handsontable/handsontable/pull/10273)
- Added a new guide: [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md).
  [#10183](https://github.com/handsontable/handsontable/pull/10183)

#### Fixed

- Fixed an issue where column-filter checkboxes got reset when the table was scrolled out of view.
  We solved this by preventing the table from triggering a complete render each time it leaves the
  viewport. [#10206](https://github.com/handsontable/handsontable/pull/10206)
- Fixed an issue where clicking on a cell scrolled the table sideways in certain RTL configurations.
  [#10206](https://github.com/handsontable/handsontable/pull/10206)
- Fixed an issue where calling
  [`getDataAtCol()`](https://handsontable.com/docs/javascript-data-grid/api/core/#getdataatcol) or
  [`getDataAtProp()`](https://handsontable.com/docs/javascript-data-grid/api/core/#getdataatprop)
  caused an error when the data set had more than 125 000 rows.
  [#10226](https://github.com/handsontable/handsontable/pull/10226)
- React: Fixed React 18 warnings about deprecated lifecycle methods. We removed
  `componentWillMount()` and `componentWillUpdate()` from Handsontable's codebase and recreated
  their functionality by using React's portals.
  [#10263](https://github.com/handsontable/handsontable/pull/10263)

## 12.3.2

Released on March 23, 2023.

Handsontable 12.3.2 may not work properly with React's functional components. If you're using React,
you should upgrade to [12.3.3](#_12-3-3).

## 12.3.1

Released on February 6, 2023.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post (12.3.1)](https://handsontable.com/blog/articles/2023/2/handsontable-12.3.1-japanese-translation-and-improved-keyboard-interaction)
- [Documentation (12.3)](https://handsontable.com/docs/12.3)

</div>

#### Added

- Added a Japanese translation of the "Copy with headers" feature.
  [#10201](https://github.com/handsontable/handsontable/pull/10201)

#### Removed

- Removed the two-week delay in showing the console warning about license expiration.
  [#10175](https://github.com/handsontable/handsontable/pull/10175)

#### Fixed

- Fixed an issue where [`updateData()`](@/api/core.md#updatedata) didn't work with nested data
  structures ([`NestedRows`](@/api/nestedRows.md)).
  [#10178](https://github.com/handsontable/handsontable/pull/10178)
- Fixed an issue of unwanted pixels in the "Filter by condition" menu by removing a superfluous
  overlay. [#10174](https://github.com/handsontable/handsontable/pull/10174)
- Fixed an issue where merged cells could lack right and bottom borders due to a Chrome bug.
  [#10212](https://github.com/handsontable/handsontable/pull/10212)
- Fixed an issue where using some browser and system shortcuts could cause Handsontable to behave as
  if <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> was being held down.
  [#10210](https://github.com/handsontable/handsontable/pull/10210)

## 12.3.0

Released on December 14, 2022.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/articles/2022/12/handsontable-12-3-0-copying-cells-with-headers)
- [Documentation (12.3)](https://handsontable.com/docs/12.3/)

</div>

#### Added

- Added a new feature that lets you copy the contents of column headers by using 3 new context menu
  options: "Copy with headers", "Copy with group headers", and "Copy headers only".
  [#2288](https://github.com/handsontable/handsontable/issues/2288)
- Added 4 new API methods for copying column headers programmatically:
  [`copyCellsOnly()`](@/api/copyPaste.md#copycellsonly),
  [`copyWithColumnHeaders()`](@/api/copyPaste.md#copywithcolumnheaders),
  [`copyWithAllColumnHeaders()`](@/api/copyPaste.md#copywithallcolumnheaders), and
  [`copyColumnHeadersOnly()`](@/api/copyPaste.md#copycolumnheadersonly).
  [#2288](https://github.com/handsontable/handsontable/issues/2288)
- Added missing TypeScript definitions of the [`CellCoords`](@/api/cellCoords.md) and
  [`CellRange`](@/api/cellRange.md) classes, which are used in the arguments of some of the APIs.
  [#9755](https://github.com/handsontable/handsontable/issues/9755)
- Added missing TypeScript definitions for the following Handsontable hooks:
  [`beforeColumnFreeze`](@/api/hooks.md#beforecolumnfreeze),
  [`afterColumnFreeze`](@/api/hooks.md#aftercolumnfreeze),
  [`beforeColumnUnfreeze`](@/api/hooks.md#beforecolumnunfreeze), and
  [`afterColumnUnfreeze`](@/api/hooks.md#aftercolumnunfreeze).
  [#9859](https://github.com/handsontable/handsontable/issues/9859)

#### Fixed

- Fixed an issue where the [`UndoRedo`](@/api/undoRedo.md) plugin didn't work properly with
  preconfigured columns. [#10108](https://github.com/handsontable/handsontable/pull/10108)
- Fixed an issue where formulas inserted programmatically by using
  [`updateData()`](@/api/core.md#updatedata) were not evaluated.
  [#10011](https://github.com/handsontable/handsontable/issues/10011)
- Fixed a regression where setting a column's [`type`](@/api/options.md#type) could overwrite other
  custom-defined settings. [#10128](https://github.com/handsontable/handsontable/pull/10128)
- Fixed an issue where Handsontable didn't render properly when initialized inside of a hidden
  container. [#5322](https://github.com/handsontable/handsontable/issues/5322)
- Fixed an issue of desynchronization between configuration options (cell meta) and Handsontable's
  data. The issue occurred when Handsontable's options were modified through the following hooks:
  [`beforeCreateRow`](@/api/hooks.md#beforecreaterow),
  [`afterCreateRow`](@/api/hooks.md#aftercreaterow),
  [`beforeCreateCol`](@/api/hooks.md#beforecreatecol), and
  [`afterCreateCol`](@/api/hooks.md#aftercreatecol).
  [#10136](https://github.com/handsontable/handsontable/pull/10136)
- Fixed an issue where comments added to fixed columns didn't display properly after scrolling.
  [#9645](https://github.com/handsontable/handsontable/issues/9645)
- Fixed an issue where typing in a [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) editor
  caused the IME to disappear, resulting in wrong characters being typed.
  [#9672](https://github.com/handsontable/handsontable/issues/9672)
- React: Fixed an issue where [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cells weren't
  validated properly when using the [`HotColumn`](@/react/guides/columns/react-hot-column/react-hot-column.md)
  component. [#10065](https://github.com/handsontable/handsontable/issues/10065)

## 12.2.0

Released on October 25, 2022.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-12.2.0)
- [Documentation (12.2)](https://handsontable.com/docs/12.2/)

</div>

#### Added

- Added a new feature that lets you add rows and columns at a specified position. Now, the
  [`alter()`](@/api/core.md#alter) method takes 4 new parameter values: `insert_row_above`,
  `insert_row_below`, `insert_col_start`, and `insert_col_end`. The `insert_row` and `insert_col`
  parameters are marked as deprecated.
  [#9471](https://github.com/handsontable/handsontable/issues/9471)

#### Deprecated

- Deprecated the `insert_row` parameter of the `alter()` method. Instead, use `insert_row_above` or
  `insert_row_below`. [#9471](https://github.com/handsontable/handsontable/issues/9471)
- Deprecated the `insert_col` parameter of the `alter()` method. Instead, use `insert_col_start` or
  `insert_col_end`. [#9471](https://github.com/handsontable/handsontable/issues/9471)

#### Removed

- Removed a type definition for a non-existing method, `translateRowsToColumns()`.
  [#9919](https://github.com/handsontable/handsontable/issues/9919)

#### Fixed

- Fixed an issue where the width of the cell editor was calculated incorrectly.
  [#3815](https://github.com/handsontable/handsontable/issues/3815)
- Fixed an issue where formulas surrounded by merged cells were converted to values by mistake.
  [#6359](https://github.com/handsontable/handsontable/issues/6359)
- Fixed an issue where Handsontable could disappear on Firefox 93 (and later) in a specific use
  case. [#9545](https://github.com/handsontable/handsontable/issues/9545)
- Fixed an issue where changing a cell's [`type`](@/api/options.md#type) through
  [`setCellMeta()`](@/api/core.md#setcellmeta) didn't properly set the cell's
  [`editor`](@/api/options.md#editor) and [`renderer`](@/api/options.md#renderer).
  [#9734](https://github.com/handsontable/handsontable/issues/9734)
- Fixed an issue where the dropdown menu didn't display when the
  [`NestedHeaders`](@/api/nestedHeaders.md) plugin was enabled and all rows were trimmed out.
  [#9753](https://github.com/handsontable/handsontable/issues/9753)

## 12.1.3

Released on September 22, 2022.

For more information on this release, see:


<div class="boxes-list gray">

- [Documentation (12.1)](https://handsontable.com/docs/12.1/)

</div>

#### Removed

- Removed a custom stable sorting implementation in favor of the stable sorting algorithm guaranteed
  by ECMAScript 2019. [#6091](https://github.com/handsontable/handsontable/issues/6091)
- Removed type definitions for non-existing methods `rowOffset` and `colOffset` and a non-existing
  hook `modifyRowSourceData`. [#8659](https://github.com/handsontable/handsontable/issues/8659),
  [#7317](https://github.com/handsontable/handsontable/issues/7317)

#### Fixed

- Fixed incorrect date format conversion on input in the date editor.
  [#9681](https://github.com/handsontable/handsontable/issues/9681)
- Fixed an error when adding a large number of rows using the `alter` method.
  [#7840](https://github.com/handsontable/handsontable/issues/7840)
- Fixed IME text input in the editors.
  [#9586](https://github.com/handsontable/handsontable/issues/9586)
- Fixed an issue where the editor did not open on key events when the cell was outside the viewport.
  [#9022](https://github.com/handsontable/handsontable/issues/9022)
- Fixed an issue with "0" values being ignored by the Column Summary plugin.
  [#6385](https://github.com/handsontable/handsontable/issues/6385)
- Fixed an error when opening the column dropdown menu with the Filters plugin enabled.
  [#9561](https://github.com/handsontable/handsontable/issues/9561)
- Fixed an issue where the `trimWhitespace` option could not be used in the column and cell levels
  of the cascading configuration. [#7387](https://github.com/handsontable/handsontable/issues/7387)
- Fixed the flickering of the selection area at the edge of the table while scrolling.
  [#8317](https://github.com/handsontable/handsontable/issues/8317)
- Fixed misalignment on mobile devices when the edge cells were selected.
  [#9621](https://github.com/handsontable/handsontable/issues/9621)
- Fixed type definitions for the method `setSourceDataAtCell`.
  [#8599](https://github.com/handsontable/handsontable/issues/8599)

## 12.1.2

Released on July 8, 2022.

For more information on this release, see:


<div class="boxes-list gray">

- [Documentation (12.1)](https://handsontable.com/docs/12.1/)

</div>

#### Changed

- Changed the version of the Moment.js dependency from 2.29.3 to 2.29.4, in reaction to a
  recently-found Moment.js security vulnerability. The vulnerability did not affect a correct
  configuration of Handsontable. [#9638](https://github.com/handsontable/handsontable/issues/9638)
- Vue: Freezed the version of the Vue framework that is used in our build chain to ~2.6. This
  shouldn't affect apps that use Vue 2.7+.
  [#9624](https://github.com/handsontable/handsontable/issues/9624)

## 12.1.1

Released on July 5, 2022.

For more information on this release, see:


<div class="boxes-list gray">

- [Documentation (12.1)](https://handsontable.com/docs/12.1/)

</div>

#### Fixed

- Angular: Fixed an issue where the installation of `@handsontable/angular` package failed for
  versions of Angular other than 9 [#9622](https://github.com/handsontable/handsontable/issues/9622)

## 12.1.0

Released on June 28, 2022.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-12.1.0-data-grid-new-hooks-new-translations-and-rendering-improvements)
- [Documentation (12.1)](https://handsontable.com/docs/12.1/)

</div>

#### Added

- Added smoother row and column moving when some row or columns are hidden.
  [#7613](https://github.com/handsontable/handsontable/issues/7613)
- Added [`getNearestNotHiddenIndex()`](@/api/indexMapper.md#getnearestnothiddenindex), a new method
  that finds the visual index of the nearest not-hidden row or column and works even with large
  numbers of hidden rows or columns. The previous method,
  [`getFirstNotHiddenIndex()`](@/api/indexMapper.md#getfirstnothiddenindex), still works, but is
  marked as deprecated. [#9064](https://github.com/handsontable/handsontable/issues/9064)
- Added a Czech translation. [#9343](https://github.com/handsontable/handsontable/issues/9343)
- Added a Serbian translation. [#9469](https://github.com/handsontable/handsontable/issues/9469)
- Added new hooks: [`beforeColumnFreeze`](@/api/hooks.md#beforecolumnfreeze),
  [`afterColumnFreeze`](@/api/hooks.md#aftercolumnfreeze),
  [`beforeColumnUnfreeze`](@/api/hooks.md#beforecolumnunfreeze), and
  [`afterColumnUnfreeze`](@/api/hooks.md#aftercolumnunfreeze).
  [#9248](https://github.com/handsontable/handsontable/issues/9248)

#### Changed

- Replaced HTML entities appearing in Handsontable's license texts with canonical counterparts.
  [#9487](https://github.com/handsontable/handsontable/issues/9487)
- Updated the Pikaday optional dependency to 1.8.2, to let Handsontable work with Parcel 2 without
  errors. [#9410](https://github.com/handsontable/handsontable/issues/9410)
- React: Changed the wrapper's lifecycle methods, to let Handsontable work with React 17+ without
  warnings. [#8748](https://github.com/handsontable/handsontable/issues/8748)
- Angular: Moved the `@angular/core` dependency to peer dependencies.
  [#9574](https://github.com/handsontable/handsontable/issues/9574)

#### Deprecated

- Deprecated the `getFirstNotHiddenIndex()` method. Use `getNearestNotHiddenIndex()` instead.
  [#9064](https://github.com/handsontable/handsontable/issues/9064)

#### Fixed

- Fixed an issue where dropdown and autocomplete cell editors rendered incorrectly if the
  [`preventOverflow`](@/api/options.md#preventoverflow) option was set to `'horizontal'`.
  [#3828](https://github.com/handsontable/handsontable/issues/3828)
- Fixed an issue where frozen rows were getting duplicated.
  [#4454](https://github.com/handsontable/handsontable/issues/4454)
- Fixed an issue where comments rendered outside the viewport.
  [#4785](https://github.com/handsontable/handsontable/issues/4785)
- Fixed an issue where comments got positioned incorrectly when Handsontable ran within a scrollable
  element. [#6744](https://github.com/handsontable/handsontable/issues/6744)
- Fixed an issue that occurred when Handsontable ran within an HTML `<form>`: pressing
  <kbd>**Enter**</kbd> inside another form's `<input>` could open Handsontable's dropdown menu.
  [#9295](https://github.com/handsontable/handsontable/issues/9295)
- Fixed an issue where it was impossible to unmerge cells in the RTL layout direction.
  [#9362](https://github.com/handsontable/handsontable/issues/9362)
- Fixed an issue where columns wider than the viewport's width and rows higher than the viewport's
  height didn't render correctly. [#9473](https://github.com/handsontable/handsontable/issues/9473)
- Fixed an issue where dragging-to-scroll on mobile didn't work properly in the RTL layout
  direction. [#9475](https://github.com/handsontable/handsontable/issues/9475)
- Fixed an issue where hiding columns with nested headers caused incorrect column width calculation
  (for the [`stretchH: 'all'`](@/api/options.md#stretchh) option).
  [#9496](https://github.com/handsontable/handsontable/issues/9496)
- Fixed an issue where [`ShortcutManager`](@/api/shortcutManager.md) unnecessarily handled `keyup`
  events with no `key` defined. [#9562](https://github.com/handsontable/handsontable/issues/9562)

## 12.0.1

Released on May 16, 2022.

For more information on this release, see:


<div class="boxes-list gray">

- [Documentation (12.0)](https://handsontable.com/docs/12.0/)

</div>

#### Fixed

- Fixed an issue where checking or unchecking a checkbox in a row with
  [`autoRowSize: true`](@/api/options.md#autorowsize) and multi-line cell values caused rows to
  align incorrectly. [#7102](https://github.com/handsontable/handsontable/issues/7102)
- Fixed an issue where checking or unchecking a checkbox changed the cell width.
  [#8211](https://github.com/handsontable/handsontable/issues/8211)
- Fixed an issue where using a single Handsontable instance with multiple HyperFormula sheets could
  lead to an uncaught `TypeError`. [#8268](https://github.com/handsontable/handsontable/issues/8268)
- Fixed an issue where nested column headers didn't expand properly.
  [#9099](https://github.com/handsontable/handsontable/issues/9099)
- Fixed an issue where updating custom borders could lead to uncaught error exceptions.
  [#9455](https://github.com/handsontable/handsontable/issues/9455)

## 12.0.0

Released on April 28, 2022.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-12.0.0-data-grid-rtl-support-and-a-new-keyboard-shortcuts-api)
- [Documentation (12.0)](https://handsontable.com/docs/12.0/)
- [Migration guide (11.1 → 12.0)](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md)

</div>

#### Added

- Added [`ShortcutManager`](@/api/shortcutManager.md), a new API for customizing keyboard shortcuts.
  [#8942](https://github.com/handsontable/handsontable/issues/8942)
- Added support for right-to-left (RTL) languages, by introducing a new configuration option:
  [`layoutDirection`](@/api/options.md#layoutdirection).
  [#8760](https://github.com/handsontable/handsontable/issues/8760)
- Added an Arabic translation. [#9208](https://github.com/handsontable/handsontable/issues/9208)
- Added a new configuration option: [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart).
  [#8760](https://github.com/handsontable/handsontable/issues/8760)
- Added a new keyboard shortcut (<kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd>) for
  filling the selected range of cells with the value of the active cell.
  [#9366](https://github.com/handsontable/handsontable/issues/9366)
- Added support for the <kbd>**Home**</kbd> and <kbd>**End**</kbd> keys inside cell editors, for
  moving the cursor to the beginning or end of the text.
  [#9367](https://github.com/handsontable/handsontable/issues/9367)
- Added support for the latest Node LTS version.
  [#9149](https://github.com/handsontable/handsontable/issues/9149)

#### Changed

- **Breaking change**: Changed how [`updateSettings()`](@/api/core.md#updatesettings) handles data
  updates, to improve performance and the consistency of user experience. Now, when provided with a
  new data object, [`updateSettings()`](@/api/core.md#updatesettings) updates the data without
  resetting any states. [#7263](https://github.com/handsontable/handsontable/issues/7263)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#step-1-verify-your-updatesettings-calls)
- **Breaking change (React, Angular, Vue 2, Vue 3)**: Updating your data through a component
  property no longer resets your index mapper information and configuration options.
  [#7263](https://github.com/handsontable/handsontable/issues/7263)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#framework-wrappers)
- **Breaking change**: Changed how `updatePlugin()` reacts to
  [`updateSettings()`](@/api/core.md#updatesettings) calls, to improve performance and the
  consistency of user experience. Now, calls to [`updateSettings()`](@/api/core.md#updatesettings)
  update a plugin's state only when the options object contains a configuration option that's
  relevant to that particular plugin.
  [#9021](https://github.com/handsontable/handsontable/issues/9021)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#step-2-adjust-to-the-updateplugin-changes)
- **Breaking change**: Changed the order of execution for two hooks: now,
  [`beforeKeyDown`](@/api/hooks.md#beforekeydown) is properly fired before
  [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown).
  [#6236](https://github.com/handsontable/handsontable/issues/6236)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#step-3-adjust-to-the-afterdocumentkeydown-changes)
- **Breaking change**: Changed how default keyboard shortcuts are defined, to improve keyboard
  navigation consistency. Most of the shortcuts did not change and are now properly documented in
  the
  [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#default-keyboard-shorcuts)
  guide. However, some shortcuts that were not defined explicitly, and were not listed in the
  documentation, don't work anymore (e.g., <kbd>**Enter**</kbd> opens a cell's editor, but
  <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd> doesn't). This change doesn't affect custom keyboard
  shortcuts. [#8942](https://github.com/handsontable/handsontable/issues/8942)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#step-4-adjust-to-the-default-keyboard-shortcuts-changes)
- **Breaking change**: Split a cross-platform modifier key (<kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>)
  into two separate keys, to improve keyboard navigation consistency. Now, the <kbd>**Cmd**</kbd>
  key triggers actions on macOS where the <kbd>**Ctrl**</kbd> key triggers actions on Windows. For
  example, on macOS, <kbd>**Ctrl**</kbd>+<kbd>**A**</kbd> doesn't work anymore:
  <kbd>**Cmd**</kbd>+<kbd>**A**</kbd> is used instead.
  [#9369](https://github.com/handsontable/handsontable/issues/9369)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#ctrl-vs-cmd)
- **Breaking change**: Changed the actions of the following
  [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#default-keyboard-shorcuts),
  to match the usual spreadsheet software behavior, and provide a more intuitive user experience:
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**↑**</kbd>,
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↑**</kbd>,
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**↓**</kbd>,
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↓**</kbd>,
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**←**</kbd>,
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**←**</kbd>,
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**→**</kbd>,
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**→**</kbd>,
  <kbd>**Home**</kbd>, <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Home**</kbd>,
  <kbd>**End**</kbd>, <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**End**</kbd>,
  <kbd>**Shift**</kbd>+<kbd>**Page Up**</kbd>, and <kbd>**Shift**</kbd>+<kbd>**Page
  Down**</kbd>. [#9363](https://github.com/handsontable/handsontable/issues/9363)
  [#9364](https://github.com/handsontable/handsontable/issues/9364)
  [#9365](https://github.com/handsontable/handsontable/issues/9365)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#keyboard-shortcuts-changes-navigation)
- Changed two scripts of the main Handsontable workspace (`/`), to speed up the build process: now,
  the `npm run build` and `npm run test` scripts don't build or test the Handsontable examples
  (`/examples`). [#9412](https://github.com/handsontable/handsontable/issues/9412)
- Changed the version of the Moment.js dependency from 2.24.0 to 2.29.3, in reaction to a
  recently-found Moment.js security vulnerability that did not directly affect Handsontable.
  [#9381](https://github.com/handsontable/handsontable/issues/9381)
- Changed the version of the HyperFormula optional dependency from ^1.2.0 to ^2.0.0.
  [#9411](https://github.com/handsontable/handsontable/issues/9411)
- Changed an internal property name, from `handsontableInstance.view.wt` to
  `handsontableInstance.view._wt`, to make it clear that Walkontable (Handsontable's rendering
  engine) is not a part of Handsontable's public API.
  [#8760](https://github.com/handsontable/handsontable/issues/8760)

#### Removed

- **Breaking change**: Removed the <kbd>**Cmd**</kbd>+<kbd>**M**</kbd> keyboard shortcut (used for
  cell merging), as it conflicted with window minimizing on macOS. The <kbd>**Ctrl**</kbd> +
  <kbd>**M**</kbd> keyboard shortcut works the same as before.
  [#9368](https://github.com/handsontable/handsontable/issues/9368)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#keyboard-shortcuts-changes-cell-merging)
- **Breaking change**: Removed the <kbd>**Shift**</kbd>+<kbd>**Page Up**</kbd>/<kbd>**Page
  Down**</kbd> keyboard shortcuts from the cell editing context.
  [#9401](https://github.com/handsontable/handsontable/issues/9401)
  [[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#keyboard-shortcuts-changes-edition)
- Dropped support for Internet Explorer 11 and Edge Legacy (the non-Chromium version of Edge).
  Handsontable 11.x becomes the long-term support (LTS) version for Internet Explorer 11 and Edge
  Legacy, until the end of 2023. [#7026](https://github.com/handsontable/handsontable/issues/7026)
- React: Removed the `enzyme` dependency from the React wrapper.
  [#9151](https://github.com/handsontable/handsontable/issues/9151)

#### Fixed

- React, Angular, Vue 2, Vue 3: Fixed an issue where using
  [`updateSettings()`](@/api/core.md#updatesettings) caused problems for state managers.
  [#8372](https://github.com/handsontable/handsontable/issues/8372)
- Fixed an issue where using [`updateSettings()`](@/api/core.md#updatesettings) caused hidden
  columns to reappear. [#7165](https://github.com/handsontable/handsontable/issues/7165)
- Fixed an issue where using [`updateSettings()`](@/api/core.md#updatesettings) caused merged cells
  to unmerge. [#3315](https://github.com/handsontable/handsontable/issues/3315)
- Fixed an issue where using [`updateSettings()`](@/api/core.md#updatesettings) caused the state of
  nested rows to reset. [#8838](https://github.com/handsontable/handsontable/issues/8838)
- Fixed an issue where using [`updateSettings()`](@/api/core.md#updatesettings) caused problems with
  column sorting. [#7688](https://github.com/handsontable/handsontable/issues/7688)
- React: Fixed an issue where using React's `setState()` within the
  [`afterFilter`](@/api/hooks.md#afterfilter) hook broke filtering.
  [#7567](https://github.com/handsontable/handsontable/issues/7567)
- Vue 2: Fixed an issue where repeatedly changing Handsontable's height through
  [`updateSettings()`](@/api/core.md#updatesettings) caused Handsontable to crash.
  [#7546](https://github.com/handsontable/handsontable/issues/7546)
- Vue 2: Fixed an issue where the `failed` validation status got erased when editing a new row.
  [#7541](https://github.com/handsontable/handsontable/issues/7541)
- Fixed an issue where cell filtering did not use formula results.
  [#5455](https://github.com/handsontable/handsontable/issues/5455)
- Fixed a wrong TypeScript definition in the [`BasePlugin`](@/api/basePlugin.md) class.
  [#9175](https://github.com/handsontable/handsontable/issues/9175)
- Fixed an issue where the <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Z**</kbd> and
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Z**</kbd> keyboard
  shortcuts didn't behave properly inside cell editors.
  [#9367](https://github.com/handsontable/handsontable/issues/9367)
- Fixed an issue where the dropdown menu contained unwanted rectangle elements.
  [#9240](https://github.com/handsontable/handsontable/issues/9240)
- React, Vue 2, Vue 3: Fixed an issue with registering modules for the React, Vue 2, and Vue 3
  wrappers, by adding an `"exports"` field to their `package.json` files.
  [#9140](https://github.com/handsontable/handsontable/issues/9140)

## Related

- [Migrating from 11.1 to 12.0](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md)

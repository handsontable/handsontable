---
id: nbp8i3mk
title: Changelog
metaTitle: Changelog - JavaScript Data Grid | Handsontable
description:
  See the full history of changes made to Handsontable in each major, minor, and patch release.
permalink: /changelog
canonicalUrl: /changelog
tags:
  - change log
  - changelog
  - update
  - upgrade
  - breaking change
react:
  id: 7y9fco03
  metaTitle: Changelog - React Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Changelog

See the full history of changes made to Handsontable in each major, minor, and patch release.

[[toc]]

## 15.1.0

Released on February 20, 2025

For more information about this release see:
- [Blog post (15.1.0)](https://handsontable.com/blog/handsontable-15.1.0-performance-and-stability-improvements)
- [Documentation (15.1)](https://handsontable.com/docs/15.1)

#### Added
- Added the `TAB` and `SHIFT + TAB` functionality to the Comments editor. [#11345](https://github.com/handsontable/handsontable/pull/11345)

#### Changed
- Changed the approach to how the table is rendered by reusing the cell nodes. [#11264](https://github.com/handsontable/handsontable/pull/11264)
- Updated Hyperformula to v3. [#11373](https://github.com/handsontable/handsontable/pull/11373)
- Improved the performance of horizontal scrolling. [#11412](https://github.com/handsontable/handsontable/pull/11412)

#### Removed
- Removed the `getComputedStyle` function from the type declaration file. [#11421](https://github.com/handsontable/handsontable/pull/11421)

#### Fixed
- Fixed a bug where values passed to data-modifying hooks were not normalized. [#11346](https://github.com/handsontable/handsontable/pull/11346)
- Fixed a problem where data population via autofill handler was broken for merged cells. [#11291](https://github.com/handsontable/handsontable/pull/11291)
- Fixed a problem with a missing render call for the `minSpareRows` and `minSpareCols` options. [#11292](https://github.com/handsontable/handsontable/pull/11292)
- Fixed the undo/redo scrolling behavior after undoing the data deletion. [#11297](https://github.com/handsontable/handsontable/pull/11297)
- Fixed the `Page Up`/`Page Down` keyboard shortcuts for the oversized rows. [#11301](https://github.com/handsontable/handsontable/pull/11301)
- Fixed a bug where the Undo/Redo action caused the wrong cells to be affected when triggered after filtering data. [#11307](https://github.com/handsontable/handsontable/pull/11307)
- Fixed a bug where the selection was incorrectly expanded after closing the editor. [#11311](https://github.com/handsontable/handsontable/pull/11311)
- Fixed a bug where the viewport was incorrectly scrolled after moving rows with the Nested Rows plugin enabled. [#11312](https://github.com/handsontable/handsontable/pull/11312)
- Fixed dropdown-typed cells validation for custom editors. [#11314](https://github.com/handsontable/handsontable/pull/11314)
- Fixed Undo/Redo for rows/columns with enabled min spare indexes. [#11321](https://github.com/handsontable/handsontable/pull/11321)
- Fixed a problem with the table misalignment after changing the container size. [#11324](https://github.com/handsontable/handsontable/pull/11324)
- Fixed a bug with an uncaught error being thrown after changing the theme while some of the editors were not fully initialized. [#11325](https://github.com/handsontable/handsontable/pull/11325)
- Fixed a problem with a broken scroll on overlays when `batch` was used. [#11328](https://github.com/handsontable/handsontable/pull/11328)
- Fixed the date picker arrow icon positions for RTL, along with other minor RTL fixes. [#11329](https://github.com/handsontable/handsontable/pull/11329)
- Fixed the Autofill handler styles for the new themes. [#11330](https://github.com/handsontable/handsontable/pull/11330)
- Fixed a problem with an uncaught error being thrown after scrolling the viewport. [#11341](https://github.com/handsontable/handsontable/pull/11341)
- Fixed a problem where calling `updateSettings` with `themeName` set to the current theme name would clear the theme from the table. [#11343](https://github.com/handsontable/handsontable/pull/11343)
- Fixed a problem where the `getCellsMeta` method returned improper results.  [#11350](https://github.com/handsontable/handsontable/pull/11350)
- Fixed the row virtualization for Filter's "by value" component. [#11351](https://github.com/handsontable/handsontable/pull/11351)
- Fixed a problem with the columns shifting after the render calls with the new themes being enabled. [#11352](https://github.com/handsontable/handsontable/pull/11352)
- Fixed the cell editor width for the new themes. [#11354](https://github.com/handsontable/handsontable/pull/11354)
- Disabled the "Clear column" option for read-only cells. [#11355](https://github.com/handsontable/handsontable/pull/11355)
- Fixed a problem where autocomplete highlight was not rendered correctly in the new themes. [#11364](https://github.com/handsontable/handsontable/pull/11364)
- Fixed a problem where the cell borders were not rendered correctly for fixed rows and columns with the new themes being enabled. [#11369](https://github.com/handsontable/handsontable/pull/11369)
- Fixed the incorrect spacing between the checkboxes and their labels. [#11377](https://github.com/handsontable/handsontable/pull/11377)
- Fixed a problem where the Nested Headers' header selection was not rendered properly for the new themes. [#11381](https://github.com/handsontable/handsontable/pull/11381)
- Fixed a bug where the dropdown editor was not fully visible on fixed rows while the new themes were enabled. [#11399](https://github.com/handsontable/handsontable/pull/11399)
- Fixed a problem where the initial styles of the context menu and dropdown menu were not properly assigned in the new themes. [#11400](https://github.com/handsontable/handsontable/pull/11400)
- Fixed a misalignment of the Manual Row Move's "guide" in the new themes. [#11401](https://github.com/handsontable/handsontable/pull/11401)
- Fixed a bug where the selection was not rendered correctly when selecting both merged and non-merged cells with the new themes being enabled. [#11403](https://github.com/handsontable/handsontable/pull/11403)
- Fixed a bug where using the keyboard shortcuts to open the Context Menu would open it at a wrong position when the new themes were enabled. [#11404](https://github.com/handsontable/handsontable/pull/11404)
- Fixed the CodeQL warnings by modifying potentially problematic code fragments. [#11405](https://github.com/handsontable/handsontable/pull/11405)
- Fixed a bug where the date editor would not close after selecting a date on mobile devices. [#11406](https://github.com/handsontable/handsontable/pull/11406)
- Fixed a problem with the header widths when using Nested Headers with the new themes enabled. [#11410](https://github.com/handsontable/handsontable/pull/11410)
- Fixed the header text overlap in Nested Headers. [#11413](https://github.com/handsontable/handsontable/pull/11413)
- Fixed a problem with the merged cells height calculation in the new themes. [#11423](https://github.com/handsontable/handsontable/pull/11423)
- Fixed the copy/paste feature not working correctly in Chrome 133. [#11428](https://github.com/handsontable/handsontable/pull/11428)
- Fixed a problem, where clicking on the Comments' editor element deselected the currently selected cells. [#11446](https://github.com/handsontable/handsontable/pull/11446)


## 15.0.0

Released on December 16, 2024

For more information about this release see:
- [Blog post (15.0.0)](https://handsontable.com/blog/handsontable-15.0.0-introducing-themes-and-functional-react-wrapper)
- [Documentation (15.0)](https://handsontable.com/docs/15.0)

#### Added
- Added support for row and column virtualization of merged cells. [#11162](https://github.com/handsontable/handsontable/pull/11162)
- Added missing typings for the language files. [#11236](https://github.com/handsontable/handsontable/pull/11236)
- Added support for the new themes, including "main" and "horizon".  [#11144](https://github.com/handsontable/handsontable/pull/11144)
- React: Added `@handsontable/react-wrapper` to the monorepo. [#11212](https://github.com/handsontable/handsontable/pull/11212)

#### Changed
- **Breaking change**: Updated the production dependencies (replaced `pikaday` with `@handsontable/pikaday`, updated `numbro` and `dompurify`) [#10929](https://github.com/handsontable/handsontable/pull/10929)
- Refactored the column stretching logic, moved it to a separate plugin and fixed bugs related to the columns widths misalignment. [#11210](https://github.com/handsontable/handsontable/pull/11210)
- Updated the typing for dropdown and context menu options. [#11237](https://github.com/handsontable/handsontable/pull/11237)
- Updated the monorepo to utilize Node 22. [#11265](https://github.com/handsontable/handsontable/pull/11265)

#### Removed
- **Breaking change**: Removed check marks from the Context Menu's alignment submenu. [#11278](https://github.com/handsontable/handsontable/pull/11278)
- Removed `aria-hidden` from TextEditor's and PasswordEditor's `TEXTAREA` elements.  [#11218](https://github.com/handsontable/handsontable/pull/11218)

#### Fixed
- Fixed the Autocomplete and Dropdown editors' container size calculations. [#11201](https://github.com/handsontable/handsontable/pull/11201)
- Fixed the focus management for the Dropdown Menu after `updateSettings` calls. [#11205](https://github.com/handsontable/handsontable/pull/11205)
- Fixed the broken column selection when the column was being moved with the Nested Headers plugin enabled. [#11206](https://github.com/handsontable/handsontable/pull/11206)
- Fixed copying values when the Fast IME Edit option was enabled. [#11243](https://github.com/handsontable/handsontable/pull/11243)
- Fixed an issue with exporting of the common lib in `package.json`. [#11247](https://github.com/handsontable/handsontable/pull/11247)
- Fixed the checkbox switching in merged cells. [#11252](https://github.com/handsontable/handsontable/pull/11252)
- Fixed a problem with the missing "name" attribute of the Focus Catcher. [#11256](https://github.com/handsontable/handsontable/pull/11256)
- Fixed data deletion for the checkbox-typed cells. [#11263](https://github.com/handsontable/handsontable/pull/11263)
- Fixed the horizontal scrolling for Nested Headers. [#11269](https://github.com/handsontable/handsontable/pull/11269)
- Fixed a problem where the Filters' dropdown container did not match the dropdown content size. [#11273](https://github.com/handsontable/handsontable/pull/11273)
- Fixed an error thrown when hiding already selected columns. [#11277](https://github.com/handsontable/handsontable/pull/11277)
- Fixed the cell fast edit mode that did not work properly when a comment was displayed. [#11280](https://github.com/handsontable/handsontable/pull/11280)
- Fixed an error for cases where the keyboard event was triggered with `key` set as `undefined`. [#11281](https://github.com/handsontable/handsontable/pull/11281)
- Fixed the input width calculation for the password-typed cells. [#11283](https://github.com/handsontable/handsontable/pull/11283)
- Fixed the missing `source` argument for the `setDataAtCell` method. [#11287](https://github.com/handsontable/handsontable/pull/11287)
- Fixed the top overlay misalignment issue, visible after vertical scrollbar disappeared. [#11289](https://github.com/handsontable/handsontable/pull/11289)
- React: Made the build scripts of `@handsontable/react-wrapper` place the TS type definitions in the configured directory. [#11296](https://github.com/handsontable/handsontable/pull/11296)

## 14.6.1

Released on October 17, 2024

For more information about this release see:
- [Documentation (14.6)](https://handsontable.com/docs/14.6)

#### Removed
- Removed `aria-hidden` from the TextEditor and PasswordEditor's `TEXTAREA` elements.  [#11218](https://github.com/handsontable/handsontable/pull/11218)

## 14.6.0

Released on October 1, 2024

For more information about this release see:
- [Blog post (14.6.0)](https://handsontable.com/blog/handsontable-14-6-0-easier-styling-and-enhanced-undo-redo)
- [Documentation (14.6)](https://handsontable.com/docs/14.6)

#### Added
- Fix aria-label, aria-checked and menuitemcheckbox roles for the readOnly and alignment contextMenu items [#11091](https://github.com/handsontable/handsontable/pull/11091)
- Extended the `beforeFilter` hook with a second argument to allow correct Undo/Redo functionality. [#11170](https://github.com/handsontable/handsontable/pull/11170)
- Added even and odd class names to the TR elements. [#11183](https://github.com/handsontable/handsontable/pull/11183)
- Added new API to retrieve visible, partially visible and rendered row and columns indexes. [#11189](https://github.com/handsontable/handsontable/pull/11189)

#### Changed
- Make the focus visible for `select` cell type cells. [#11160](https://github.com/handsontable/handsontable/pull/11160)

#### Removed
- Remove -ms fix from css [#11055](https://github.com/handsontable/handsontable/issues/11055)

#### Fixed
- Fixed a bug that prevents copy valus from cell comments. [#11103](https://github.com/handsontable/handsontable/pull/11103)
- Fixed submenu misalignment after horizontal scroll. [#11106](https://github.com/handsontable/handsontable/pull/11106)
- Fixed rows misalign for cells that content produce heights with fractions. [#11110](https://github.com/handsontable/handsontable/pull/11110)
- Fixed dropdown menu misalignment after opening with a keyboard shortcut. [#11115](https://github.com/handsontable/handsontable/pull/11115)
- Fixed a bug where the data was saved in a wrong cell, when sorting a column with an open editor. [#11129](https://github.com/handsontable/handsontable/pull/11129)
- Fixed copy/paste/cut issues when `outsideClickDeselects` was disabled [#11139](https://github.com/handsontable/handsontable/pull/11139)
- Fixed merged cells that break after adding a new row. [#11145](https://github.com/handsontable/handsontable/pull/11145)
- Fixed F2 keyboard shortcut (enter into editing mode). [#11151](https://github.com/handsontable/handsontable/pull/11151)
- Fixed context/dropdown menu column width calculations depending on the content. [#11156](https://github.com/handsontable/handsontable/pull/11156)
- Updated TS typings for `selectCell` method. [#11161](https://github.com/handsontable/handsontable/pull/11161)
- Fixed a problem with deleting content from a selection when it contained both `checkbox` and non-`checkbox`-typed cells. [#11182](https://github.com/handsontable/handsontable/pull/11182)
- Fixed a problem where the Context Menu container wasn't reflecting the size of its contents. [#11190](https://github.com/handsontable/handsontable/pull/11190)
- Fixed an issue connected with throwing an error triggered by some keyboard shortcuts when there was no selection [#11195](https://github.com/handsontable/handsontable/pull/11195)


## 14.5.0

Released on July 30, 2024

For more information about this release see:
- [Blog post (14.5.0)](https://handsontable.com/blog/handsontable-14.5.0-improved-performance-and-flexible-column-header-class)
- [Documentation (14.5)](https://handsontable.com/docs/14.5)

#### Added
- Added support for other keyboard layouts besides QWERTY (e.g. AZERTY). [#11027](https://github.com/handsontable/handsontable/pull/11027)
- Added missing "this" typing for the ColumnSummary plugin. [#11036](https://github.com/handsontable/handsontable/pull/11036)
- Added Undo/Redo logic for the ColumnSorting/ManualColumnSorting plugins. [#11037](https://github.com/handsontable/handsontable/pull/11037)
- Added new option `headerClassName`, which allows adding custom CSS classes to the column headers. [#11076](https://github.com/handsontable/handsontable/pull/11076)

#### Changed
- Improved the precision of calculating the height and width of columns and rows. [#11049](https://github.com/handsontable/handsontable/pull/11049)
- Improved the rendering performance. [#11069](https://github.com/handsontable/handsontable/pull/11069)

#### Fixed
- Fixed Context.getShortcuts type.  [#10910](https://github.com/handsontable/handsontable/pull/10910)
- Improved performance of cell merging. [#10995](https://github.com/handsontable/handsontable/pull/10995)
- Fixed a problem where clicking and dragging on cells in window-controlled scrolled instances would result in unpredictable behavior. [#10996](https://github.com/handsontable/handsontable/pull/10996)
- Fixed a bug that prevented column sorting of the checkbox cell types. [#11004](https://github.com/handsontable/handsontable/pull/11004)
- Fixed merged cells misalignment in overlays. [#11007](https://github.com/handsontable/handsontable/pull/11007)
- Fixed selection expansion for merged cells. [#11010](https://github.com/handsontable/handsontable/pull/11010)
- Fixed a problem where the table could go into an endless resize loop when one of the instance's parents was using `dvh` values for sizing, and the table was not given any size itself. [#11021](https://github.com/handsontable/handsontable/pull/11021)
- Fixed a bug where the `afterSetCellMeta` was unnecessarily triggered after clicking on the comments textarea element. [#11033](https://github.com/handsontable/handsontable/pull/11033)
- Fixed invalid cell states after data population that was canceled in the `beforeChange` hook. [#11035](https://github.com/handsontable/handsontable/pull/11035)
- Fixed a problem with the Formulas plugin using wrong indexes when performing autofill.  [#11038](https://github.com/handsontable/handsontable/pull/11038)
- Fixed a problem where disabling `navigableHeaders` broke keyboard navigation in the first row if the option was previously enabled and used. [#11043](https://github.com/handsontable/handsontable/pull/11043)
- Fixed a problem where the dropdown menu would not close after tapping on the table cells on mobile browsers. [#11044](https://github.com/handsontable/handsontable/pull/11044)
- Fixed the header selection with `nestedHeaders` enabled not working on mobile devices. [#11051](https://github.com/handsontable/handsontable/pull/11051)

## 14.4.0

Released on June 11, 2024

For more information on this release, see:
- [Blog post (14.4.0)](https://handsontable.com/blog/handsontable-14.4.0-improved-stability)
- [Documentation (14.4)](https://handsontable.com/docs/14.4)

#### Added
- Extended the `manualRowResize` plugin with a method to retrieve the row height value from the last manual adjustment attempt. [#10941](https://github.com/handsontable/handsontable/pull/10941)
- Added an option to change the order of hook callbacks. [#10970](https://github.com/handsontable/handsontable/pull/10970)
- Added new `dataDotNotation` option which, when set as `false` allows using object keys with dots. [#10973](https://github.com/handsontable/handsontable/pull/10973)

#### Changed
- Improved editor behavior after dataset alterations. [#10963](https://github.com/handsontable/handsontable/pull/10963)
- React: Synchronized the `rollup` version between the wrappers and updated the `rollup` plugin dependencies.  [#10962](https://github.com/handsontable/handsontable/pull/10962)

#### Fixed
- Fixed unwanted table re-rendering for oversized rows/columns. [#10912](https://github.com/handsontable/handsontable/pull/10912)
- Fixed `Ctrl/Cmd` + `Enter` keyboard shortcut for comments. [#10920](https://github.com/handsontable/handsontable/pull/10920)
- Fixed issue with rows and columns not unfreezing when headers are disabled. [#10926](https://github.com/handsontable/handsontable/pull/10926)
- Fixed `imeFastEdit` option being reset after `updateSettings` call [#10933](https://github.com/handsontable/handsontable/pull/10933)
- Improved fast typing values between editors. [#10947](https://github.com/handsontable/handsontable/pull/10947)
- Removed double borders for column headers. [#10948](https://github.com/handsontable/handsontable/pull/10948)
- Fixed column width calculations with `stretchH: 'all'` option. [#10954](https://github.com/handsontable/handsontable/pull/10954)
- Fixed missing column summary cell meta state after `updateSettings` method call. [#10955](https://github.com/handsontable/handsontable/pull/10955)
- Fixed sorting issue for the `time` column type. [#10956](https://github.com/handsontable/handsontable/pull/10956)
- Fixed data populate error with `correctFormat` usage. [#10957](https://github.com/handsontable/handsontable/pull/10957)
- Fixed cell meta coordinates overwrite by `GhostTable`. [#10961](https://github.com/handsontable/handsontable/pull/10961)
- Fixed `setDataAtRowProp` error when saving data into a trimmed-out column. [#10964](https://github.com/handsontable/handsontable/pull/10964)
- Fixed table scrolling issue after inserting a new row over a table-wide selection. [#10965](https://github.com/handsontable/handsontable/pull/10965)
- Fixed copy/cut/paste issue from outside elements. [#10976](https://github.com/handsontable/handsontable/pull/10976)
- Fixed autocomplete dropdown dimensions after filtering out all choices. [#10977](https://github.com/handsontable/handsontable/pull/10977)
- Fixed dataset clearing issue for formulas. [#10983](https://github.com/handsontable/handsontable/pull/10983)
- Improved typings for the ContextMenu plugin. [#10984](https://github.com/handsontable/handsontable/pull/10984)
- Added missing type for `namedExpressions`. [#10986](https://github.com/handsontable/handsontable/pull/10986)
- Fixed double borders for row/column headers. [#10988](https://github.com/handsontable/handsontable/pull/10988)
- Fixed a problem, where trying to render a hidden instance made it render all of its rows by disabling the rendering for hidden instances. [#10989](https://github.com/handsontable/handsontable/pull/10989)
- Fixed error in numeric cell types after entering non-numeric values. [#10931](https://github.com/handsontable/handsontable/pull/10931)
- Fixed a bug that prevented column sorting of the checkbox cell types. [#11004](https://github.com/handsontable/handsontable/pull/11004)
- Updated the TS typings of the Shortcut Manager's `getShortcuts` method. [#10910](https://github.com/handsontable/handsontable/pull/10910)
- React: Prevented React wrapper from throwing errors on updating component props with init-only settings. [#10921](https://github.com/handsontable/handsontable/pull/10921)

## 14.3.0

Released on April 16, 2024

For more information on this release, see:
- [Blog post (14.3.0)](https://handsontable.com/blog/handsontable-14.3.0-enhanced-navigation-and-bug-fixes)
- [Documentation (14.3)](https://handsontable.com/docs/14.3)

#### Added
- Added new feature, Navigation within selection and edit cells within a range [#10732](https://github.com/handsontable/handsontable/pull/10732)

#### Changed
- Updated dependencies based on npm audit, most notably we upgraded to Angular 17.0 [#10889](https://github.com/handsontable/handsontable/pull/10889)

#### Fixed

- Ensured the cursor changes to 'grabbing' for all table elements during column or row movement[#10852](https://github.com/handsontable/handsontable/pull/10852)
- Resolved an issue where the `TAB` key failed to move selection when editing select-type cells in 'fast edit' mode. [#10849](https://github.com/handsontable/handsontable/pull/10849)
- Prevent the `Cmd/Ctrl + A` action when the focus is on headers. [#10853](https://github.com/handsontable/handsontable/pull/10853)
- Unified `source` arguments in `beforeChange` and `afterChange` hooks triggered by the Merge Cells plugin. [#10857](https://github.com/handsontable/handsontable/pull/10857)
- Ensured focus retention after column collapsing. [#10865](https://github.com/handsontable/handsontable/pull/10865)
- Fixed visibility issue with bottom/right cell borders after scrolling from the absolute top/left positions using the api. [#10887](https://github.com/handsontable/handsontable/pull/10887)
- Fixed Dropdown plugin logic to prevent blocking click events from custom editors. [#10888](https://github.com/handsontable/handsontable/pull/10888)
- Fixed datepicker position for the date cell type. [#10892](https://github.com/handsontable/handsontable/pull/10892)
- Vue: Fixed an issue in the Vue and Vue3 wrappers where updating the hook callback didn't reflect changes in the underlying instance's settings. [#10686](https://github.com/handsontable/handsontable/issues/10686)
- Vue: Fixed the behavior of the Vue/Vue3 wrappers' `simpleEqual` helper, which previously returned incorrect results when comparing identical objects. [#10896](https://github.com/handsontable/handsontable/pull/10896)

## 14.2.0

Released on March 6, 2024

For more information on this release, see:
- [Blog post (14.2.0)](https://handsontable.com/blog/handsontable-14-2-0-improved-react-rendering-new-hooks)
- [Documentation (14.2)](https://handsontable.com/docs/14.2)

#### Added

- Added a new Handsontable hook, [`beforeBeginEditing`](@/api/hooks.md#beforebeginediting), to conditionally control when to allow cell editing. [#10699](https://github.com/handsontable/handsontable/pull/10699)
- Added the ability to prevent viewport scrolling by using two existing Handsontable hooks: [`beforeViewportScrollVertically`](@/api/hooks.md#beforeviewportscrollvertically) and [`beforeViewportScrollHorizontally`](@/api/hooks.md#beforeviewportscrollhorizontally). [#10724](https://github.com/handsontable/handsontable/pull/10724)
- Added undo-and-redo support for column moving. [#10746](https://github.com/handsontable/handsontable/pull/10746)
- Added a new [`Filters`](@/api/filters.md) plugin hook: [`modifyFiltersMultiSelectValue`](@/api/hooks.md#modifyfiltersmultiselectvalue). Now, filtered values lists will show the formatted numeric value, not the raw data. [#10756](https://github.com/handsontable/handsontable/pull/10756)

#### Changed

- Improved the viewport scroll behavior after clicking on a cell. [#10709](https://github.com/handsontable/handsontable/pull/10709)
- Improved the response of checkboxes to double-clicks. [#10748](https://github.com/handsontable/handsontable/pull/10748)
- Improved the way [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cells react to pressing <kbd>**Space**</kbd> or <kbd>**Enter**</kbd>. [#10802](https://github.com/handsontable/handsontable/pull/10802)
- Improved the type inference of the [`propToCol()`](@/api/core.md#proptocol) method. [#10750](https://github.com/handsontable/handsontable/pull/10750)
- React: Improved React portal caching. [#10758](https://github.com/handsontable/handsontable/pull/10758)

#### Removed

- Removed versioned Handsontable examples and their GitHub publishing workflow. [#10766](https://github.com/handsontable/handsontable/pull/10766)

#### Fixed

- Fixed an issue where the sizes of rows and columns were calculated incorrectly for hidden indexes. [#10705](https://github.com/handsontable/handsontable/pull/10705)
- Fixed an issue where pasting arrays larger than the table's height caused data getter methods (such as [`getCellMeta()`](@/api/core.md#getcellmeta)) to throw an error. [#10710](https://github.com/handsontable/handsontable/pull/10710)
- Fixed an issue where HyperFormula and Handsontable didn't sync properly. [#10719](https://github.com/handsontable/handsontable/pull/10719)
- Fixed an issue where removing all rows and columns while HyperFormula was enabled caused an error. [#10720](https://github.com/handsontable/handsontable/pull/10720)
- Fixed an issue where very large text cells lacked the vertical scrollbar during editing. [#10722](https://github.com/handsontable/handsontable/pull/10722)
- Fixed an issue where non-contiguous selection caused too many [`afterSelectionEnd`](@/api/hooks.md#afterselectionend) and [`afterSelectionEndByProp`](@/api/hooks.md#afterselectionendbyprop) calls. [#10725](https://github.com/handsontable/handsontable/pull/10725)
- Fixed an issue where tables pasted from the clipboard contained redundant line breaks. [#10745](https://github.com/handsontable/handsontable/pull/10745)
- Fixed an issue where clicking outside the table didn't remove the focus from the table (when Handsontable was placed in an iframe). [#10752](https://github.com/handsontable/handsontable/pull/10752)
- Fixed an issue where hovering over the header handles of [`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) cells caused an error. [#10761](https://github.com/handsontable/handsontable/pull/10761)
- Fixed an issue where [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cells with long lists of options caused an error. [#10763](https://github.com/handsontable/handsontable/pull/10763)
- Fixed an issue where using the browser's autocomplete dropdown on an input outside of Handsontable caused errors. Also, fixed an event listener leak. [#10795](https://github.com/handsontable/handsontable/pull/10795)
- Fixed an issue where using context and dropdown menus on mobile caused unwanted selection handles to show up. [#10816](https://github.com/handsontable/handsontable/pull/10816)
- Fixed an issue where the [`Autofill`](@/api/autofill.md) plugin treated cells filled with `0` as empty. [#10817](https://github.com/handsontable/handsontable/pull/10817)
- React: Fixed a missing `HotTableClass` export. [#10760](https://github.com/handsontable/handsontable/pull/10760)
- React: Fixed missing `renderer` and `editor` props. [#10768](https://github.com/handsontable/handsontable/pull/10768)

## 14.1.0

Released on January 16, 2024

For more information on this release, see:
- [Blog post (14.1.0)](https://handsontable.com/blog/handsontable-14-1-0-typescript-ssr-improvements)
- [Documentation (14.1)](https://handsontable.com/docs/14.1)

#### Added

- Added a new configuration option, [`renderAllColumns`](@/api/options.md#renderallcolumns), which lets you disable column virtualization for improved accessibility. [#10599](https://github.com/handsontable/handsontable/pull/10599)
- Added a dedicated renderer (`DropdownRenderer`) and validator (`DropdownValidator`) for the dropdown cell type. [#10688](https://github.com/handsontable/handsontable/pull/10688)
- Added support for the <kbd>**Tab**</kbd> key in the select editor (`selectEditor`). [#10673](https://github.com/handsontable/handsontable/pull/10673)

#### Changed

- Improved how undoing changes affects the viewport. Now, when you undo a change, the view automatically scrolls back to the changed area. [#10639](https://github.com/handsontable/handsontable/pull/10639)
- Improved how pasting data affects the viewport. Now, even when the size of the pasted data is larger than the viewport, the viewport stays in place. [#10630](https://github.com/handsontable/handsontable/pull/10630)
- Improved how removing a row or column affects the selection. Now, when you remove a row or column, the selection moves to the nearest visible row or column. [#10690](https://github.com/handsontable/handsontable/pull/10690)
- Improved TypeScript definitions for multiple plugins. [#10670](https://github.com/handsontable/handsontable/pull/10670)
- Improved TypeScript definitions for the core modules. [#10671](https://github.com/handsontable/handsontable/pull/10671)
- Improved TypeScript definitions for the `CellCoords` and `CellRange` classes. [#10678](https://github.com/handsontable/handsontable/pull/10678)
- Improved TypeScript definitions for the [`CustomBorders`](@/api/customborders.md) plugin. [#10659](https://github.com/handsontable/handsontable/pull/10659)
- React: Improved support for SSR frameworks. [#10575](https://github.com/handsontable/handsontable/pull/10575)

#### Fixed

- Fixed an issue where double-clicking a cell resulted in highlighting the cell's contents. [#10595](https://github.com/handsontable/handsontable/pull/10595)
- Fixed an issue where pressing the <kbd>**Tab**</kbd> key when editing a cell in the last column caused an error. [#10632](https://github.com/handsontable/handsontable/pull/10632)
- Fixed an issue where pressing the <kbd>**Tab**</kbd> key with [`tabNavigation`](@/api/options.md#tabnavigation) set to `false` caused the grid to scroll. [#10634](https://github.com/handsontable/handsontable/pull/10634)
- Fixed an issue where the [`Filters`](@/api/filters.md) plugin threw a `TypeError` in specific setup cases. [#10637](https://github.com/handsontable/handsontable/pull/10637)
- Fixed an issue where changing Handsontable's configuration or data broke the focus position. [#10642](https://github.com/handsontable/handsontable/pull/10642)
- Fixed an issue where Handsontable didn't go into the "unlisten" state after clicking an element outside of the table. [#10648](https://github.com/handsontable/handsontable/pull/10648)
- Fixed an issue where recovering removed cells by using undo/redo didn't restore the cells' configuration options. [#10649](https://github.com/handsontable/handsontable/pull/10649)
- Fixed an issue where the [`ManualRowResize`](@/api/manualrowresize.md) and [`ManualColumnResize`](@/api/manualcolumnresize.md) plugins threw an error when a cell renderer used the HTML `<table>` element. [#10650](https://github.com/handsontable/handsontable/pull/10650)
- Fixed an issue where, in some situations, the table didn't scroll after navigating it with the keyboard. [#10655](https://github.com/handsontable/handsontable/pull/10655)
- Fixed an issue where the drag-to-scroll functionality was not working for window-scrolled instances. [#10655](https://github.com/handsontable/handsontable/pull/10655)
- Fixed an issue where some configurations of the [`CollapsibleColumns`](@/api/collapsiblecolumns.md) plugin caused an uncaught `TypeError`. [#10693](https://github.com/handsontable/handsontable/pull/10693)
- Fixed an issue where pressing the <kbd>**Backspace**</kbd> key in a date cell deleted the entire contents of the cell instead of a single character. [#10696](https://github.com/handsontable/handsontable/pull/10696)
- Fixed several issues related to the `roundFloat` option of the [`ColumnSummary`](@/api/columnsummary.md) plugin. [#10701](https://github.com/handsontable/handsontable/pull/10701)
- Fixed a missing TypeScript definition in the [`Formulas`](@/api/formulas.md) plugin.  [#10186](https://github.com/handsontable/handsontable/pull/10186)
- Added `pikaday` to `handsontable`s `dependencies`, to ensure backward compatibility of Handsontable 14.1.0. [#10715](https://github.com/handsontable/handsontable/pull/10715)
- React: Fixed a missing TypeScript definition for the `settings` prop. [#10661](https://github.com/handsontable/handsontable/pull/10661)
- Vue: Fixed an issue where passing `hyperformulaInstance` to `hotSettings` resulted in `TypeError: Converting circular structure to JSON`. [#8728](https://github.com/handsontable/handsontable/pull/8728)
- Vue: Updated the peer dependencies of the Vue 3 wrapper with the latest version of Vue. [#10571](https://github.com/handsontable/handsontable/pull/10571)

## 14.0.0

Released on November 30, 2023

For more information on this release, see:
- [Blog post (14.0.0)](https://handsontable.com/blog/whats-new-in-handsontable-14-improvements-to-accessibility)
- [Documentation (14.0)](https://handsontable.com/docs/14.0)
- [Migration guide (13.1.0 → 14.0)](@/guides/upgrade-and-migration/migrating-from-13.1-to-14.0/migrating-from-13.1-to-14.0.md)

#### Added

- Added multiple keyboard shortcuts. For more information, see the [release blogpost](https://handsontable.com/blog/handsontable-14-0-0-prioritizing-accessibility) and and the updated [Keyboard Shortcuts](https://handsontable.com/docs/javascript-data-grid/keyboard-shortcuts/) documentation page.
    [#10237](https://github.com/handsontable/handsontable/pull/10237) [#10389](https://github.com/handsontable/handsontable/pull/10389) [#10404](https://github.com/handsontable/handsontable/pull/10404)  [#10405](https://github.com/handsontable/handsontable/pull/10405) [#10410](https://github.com/handsontable/handsontable/pull/10410)  [#10413](https://github.com/handsontable/handsontable/pull/10413)  [#10417](https://github.com/handsontable/handsontable/pull/10417)  [#10419](https://github.com/handsontable/handsontable/pull/10419)  [#10420](https://github.com/handsontable/handsontable/pull/10420)  [#10421](https://github.com/handsontable/handsontable/pull/10421) [#10548](https://github.com/handsontable/handsontable/pull/10548)
- Added ARIA tags to various elements of the table to improve screen reader compatibility.
    [#10463](https://github.com/handsontable/handsontable/pull/10463)  [#10524](https://github.com/handsontable/handsontable/pull/10524)  [#10526](https://github.com/handsontable/handsontable/pull/10526)  [#10539](https://github.com/handsontable/handsontable/pull/10539) [#10548](https://github.com/handsontable/handsontable/pull/10548) [#10541](https://github.com/handsontable/handsontable/pull/10541)
- Added the ability to navigate the headers with the keyboard by introducing a new `navigableHeaders` option along with other changes. [#10265](https://github.com/handsontable/handsontable/pull/10265)  [#10301](https://github.com/handsontable/handsontable/pull/10301)
- Added the ability to traverse the grid within a webpage using the `TAB` key and introduced a new `tabNavigation` option. [#10430](https://github.com/handsontable/handsontable/pull/10430) [#10585](https://github.com/handsontable/handsontable/pull/10585)
- Added a new `beforeSelectionHighlightSet` hook that allows modifying logical selection coordinates before they are applied to the rendering engine. [#10513](https://github.com/handsontable/handsontable/pull/10513)
- Implemented the `select` renderer and cell type. [#10529](https://github.com/handsontable/handsontable/pull/10529)
- Added an accessibility demo for javascript and React. [#10532](https://github.com/handsontable/handsontable/pull/10532)
- Added `handsontable` and `date` renderers for their respective cell types to allow adding the a11y attributes. [#10535](https://github.com/handsontable/handsontable/pull/10535)
- Added new `beforeColumnWrap` and `beforeRowWrap` hooks. [#10550](https://github.com/handsontable/handsontable/pull/10550)

#### Changed

- **Breaking change**: Changed the way the table reacts to using the "select all cells" methods and shortcuts. [#10461](https://github.com/handsontable/handsontable/pull/10461)
- **Breaking change**: Changed the colors of the invalid cells and the arrow buttons of the autocomplete-typed cells. [#10520](https://github.com/handsontable/handsontable/pull/10520)
- **Breaking change**: Improved the navigation and accessibility of the Filtering Dropdown Menu. [#10530](https://github.com/handsontable/handsontable/pull/10530)
- **Breaking change**: Changed the way Handsontable handles focus by focusing the browser on cell elements. Introduced a new `imeFastEdit` option to minimize the negative effects affecting the "fast edit" feature for the IME users. [#10342](https://github.com/handsontable/handsontable/pull/10342)
- Improved the keyboard navigation for the context and dropdown menus and added a new `forwardToContext` option to the ShortcutManager. [#10519](https://github.com/handsontable/handsontable/pull/10519)
- Extended the Core's `scrollViewportTo` method to allow disabling of cell auto-snapping. [#10508](https://github.com/handsontable/handsontable/pull/10508)
- Upgraded the monorepo to utilize Node 20. [#10468](https://github.com/handsontable/handsontable/pull/10468)
- Improved DX by adding an exception to be thrown when trying to activate a shortcut context that has been not yet registered. [#10476](https://github.com/handsontable/handsontable/pull/10476)
- Improved the performance of the table for cases when the table is hidden. [#10490](https://github.com/handsontable/handsontable/pull/10490)
- Updated the TypeScript definitions.  [#10492](https://github.com/handsontable/handsontable/pull/10492) [#10493](https://github.com/handsontable/handsontable/pull/10493)  [#10494](https://github.com/handsontable/handsontable/pull/10494) [#10509](https://github.com/handsontable/handsontable/issues/10509)
- Changed the default styling of the "OK" button in the Filtering Dropdown when it's focus. [#10558](https://github.com/handsontable/handsontable/issues/10558)

#### Fixed

- Fixed an issue where copying values containing an ampersand resulted in a wrong values being pasted. [#10472](https://github.com/handsontable/handsontable/pull/10472)
- Fixed an issue related to the backlight position misalignment for the `ManualRowMove` and `ManualColumnMove` plugins. [#10475](https://github.com/handsontable/handsontable/pull/10475)
- Fixed a problem with row header widths changing sizes after adding/deleting rows. [#10479](https://github.com/handsontable/handsontable/pull/10479)
- Fixed a problem with the `offset` helper for elements placed in foreign object contexts. [#10480](https://github.com/handsontable/handsontable/issues/10480)
- Fixed problems with size and alignment of the table when placed under elements with the CSS `transform: scale` attribute applied. [#10482](https://github.com/handsontable/handsontable/pull/10482)
- Added the missing `updateData` value to the `ChangeSource` type. [#10488](https://github.com/handsontable/handsontable/pull/10488)
- Fixed a bug where pressing `Ctrl/Cmd` does not trigger non-contiguous selection. [#10502](https://github.com/handsontable/handsontable/pull/10502)
- Fixed a problem with the editor having incorrect width and height. [#10504](https://github.com/handsontable/handsontable/pull/10504)
- Fixed visual glitches (unwanted pixels) of the `Autocomplete` editor's list in cases when there were no items. [#10506](https://github.com/handsontable/handsontable/pull/10506)
- Fixed the Vue and React demo's dependencies to be able to use the demos with Stackblitz. [#10523](https://github.com/handsontable/handsontable/pull/10523)
- Fixed a problem with the merged cells having wrong row heights. [#10500](https://github.com/handsontable/handsontable/pull/10500)
- Fixed the accessibility issues in the documentation. [#10574](https://github.com/handsontable/handsontable/pull/10574)
- Updated the demos for better accessibility. [#10563](https://github.com/handsontable/handsontable/pull/10563)
- Fixed a problem with the text editor's width being calculated incorrectly. [#10590](https://github.com/handsontable/handsontable/pull/10590)
- Fixed a problem with two cells being selected after `Ctrl/Cmd + Shift` key combination. [#10622](https://github.com/handsontable/handsontable/pull/10622)

## 13.1.0

Released on August 31, 2023.

For more information on this release, see:

- [Blog post (13.1.0)](https://handsontable.com/blog/handsontable-13-1-0-reduced-bundle-size-and-bug-fixes)
- [Documentation (13.1)](https://handsontable.com/docs/13.1)

#### Changed

- Optimized the transpilation process of the distribution files. [#10440](https://github.com/handsontable/handsontable/pull/10440)
- Updated the internal monorepo scripts to utilize Node 20. [#10468](https://github.com/handsontable/handsontable/pull/10468)

#### Fixed

- Fixed a problem with errors being thrown when pressing `delete` or `backspace` keys after deselecting cells. [#10272](https://github.com/handsontable/handsontable/issues/10272)
- Fixed problems with [moving rows](@/api/manualRowMove.md) when there are [trimmed rows](@/api/trimRows.md) in the table. [#10399](https://github.com/handsontable/handsontable/pull/10399)
- Fixed a problem with the [column resize](@/api/manualColumnResize.md) handle being stuck after the user clicked the right mouse button.  [#10416](https://github.com/handsontable/handsontable/pull/10416)
- Extended the type definition of `CellChange` to match the actual implementation. [#10432](https://github.com/handsontable/handsontable/issues/10432)
- Fixed a typo in the [`CopyPaste`](@/api/copyPaste.md) plugin's [`copy`](@/api/copyPaste.md#copy) method argument. [#10446](https://github.com/handsontable/handsontable/pull/10446)
- Fixed the mobile selection handlers that disappeared below the table headers when multiple cells were selected. [#10447](https://github.com/handsontable/handsontable/pull/10447)
- Fixed the [`MergeCells`](@/api/mergeCells.md) plugin's problem with updating the cell meta after unmerging the previously-merged cells, which resulted in the Autofill plugin not working properly. [#10456](https://github.com/handsontable/handsontable/issues/10456)
- Added the missing type definition for [`BaseEditor`](@/api/baseEditor.md)'s [`getEditedCellRect`](@/api/baseEditor.md#geteditedcellrect) method. [#10459](https://github.com/handsontable/handsontable/issues/10459)
- Corrected the type definitions for the [`ContextMenu`](@/api/contextMenu.md). [#9566](https://github.com/handsontable/handsontable/issues/9566)
- React: Mark an internal prop of the React wrapper's base editor component as optional. [#10429](https://github.com/handsontable/handsontable/issues/10429)

## 13.0.0

Released on June 22, 2023.

For more information on this release, see:

- [Blog post (13.0.0)](https://handsontable.com/blog/handsontable-13-0-0-support-for-angular-16-and-new-frameworks-support-policy)
- [Documentation (13.0)](https://handsontable.com/docs/13.0)
- [Migration guide (12.4 → 13.0)](@/guides/upgrade-and-migration/migrating-from-12.4-to-13.0/migrating-from-12.4-to-13.0.md)

#### Added

- Angular: Added support for Angular 16. [#10396](https://github.com/handsontable/handsontable/pull/10396)

#### Changed

- **Breaking change (React, Angular, Vue 2, Vue 3)**: Changed Handsontable's policy toward older versions of supported frameworks. From now on, Handsontable supports only those versions of any supported frameworks that are officially supported by their respective teams. Dropping Handsontable's support for any older framework versions won't be treated as a breaking change. [#10396](https://github.com/handsontable/handsontable/pull/10396)
- **Breaking change**: Changed the order in which three hooks are executed: now, the [`beforeChange`](@/api/hooks.md#beforechange) hook is fired before the [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell) and [`afterSetDataAtRowProp`](@/api/hooks.md#aftersetdataatrowprop) hooks. [#10231](https://github.com/handsontable/handsontable/pull/10231)
- Changed the margins of the context menu in the RTL layout direction. [#10375](https://github.com/handsontable/handsontable/pull/10375)

#### Removed

- **Breaking change (Angular)**: Dropped support for Angular 13 and lower. From now on, Handsontable supports only those versions of Angular that are officially supported by the Angular team: currently, it's 14-16. However, Handsontable 13.0.0 was thoroughly tested and, to the best of our knowledge, works correctly with versions down to Angular 12. [#10396](https://github.com/handsontable/handsontable/pull/10396)
- **Breaking change**: Removed the deprecated [`beforeAutofillInsidePopulate`](https://handsontable.com/docs/12.4/javascript-data-grid/api/hooks/#beforeautofillinsidepopulate) hook. [#10407](https://github.com/handsontable/handsontable/pull/10407)
- **Breaking change**: Removed the deprecated [`getFirstNotHiddenIndex`](https://handsontable.com/docs/12.4/javascript-data-grid/api/index-mapper/#getfirstnothiddenindex) method. Instead, use the [`getNearestNotHiddenIndex()`](@/api/indexMapper.md#getnearestnothiddenindex) method. [#10407](https://github.com/handsontable/handsontable/pull/10407)
- **Breaking change**: Removed the deprecated parameters of the [`alter()`](@/api/core.md#alter) method: `insert_row` and `insert_col`. Instead, use the following parameters: `insert_row_above`, `insert_row_below`, `insert_col_start`, and `insert_col_end`. [#10407](https://github.com/handsontable/handsontable/pull/10407)
- **Breaking change**: Removed the deprecated parameters of the [`populateFromArray()`](@/api/core.md#populatefromarray) method: `direction` and `deltas`. [#10407](https://github.com/handsontable/handsontable/pull/10407)

#### Fixed

- Fixed an issue where the "Read only" icon of the context menu displayed incorrectly in the RTL layout direction. [#10375](https://github.com/handsontable/handsontable/pull/10375)

## 12.4.0

Released on May 23, 2023.

For more information on this release, see:

- [Blog post (12.4.0)](https://handsontable.com/blog/handsontable-12-4-0-auto-updating-formulas)
- [Documentation (12.4)](https://handsontable.com/docs/12.4)

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

- [Blog post (12.3.3)](https://handsontable.com/blog/handsontable-12-3-3-better-support-for-react-18-and-large-data-sets)
- [Documentation (12.3)](https://handsontable.com/docs/12.3)

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

- [Blog post (12.3.1)](https://handsontable.com/blog/articles/2023/2/handsontable-12.3.1-japanese-translation-and-improved-keyboard-interaction)
- [Documentation (12.3)](https://handsontable.com/docs/12.3)

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

- [Blog post](https://handsontable.com/blog/articles/2022/12/handsontable-12-3-0-copying-cells-with-headers)
- [Documentation (12.3)](https://handsontable.com/docs/12.3/)

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

- [Blog post](https://handsontable.com/blog/handsontable-12.2.0)
- [Documentation (12.2)](https://handsontable.com/docs/12.2/)

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

- [Documentation (12.1)](https://handsontable.com/docs/12.1/)

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

- [Documentation (12.1)](https://handsontable.com/docs/12.1/)

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

- [Documentation (12.1)](https://handsontable.com/docs/12.1/)

#### Fixed

- Angular: Fixed an issue where the installation of `@handsontable/angular` package failed for
  versions of Angular other than 9 [#9622](https://github.com/handsontable/handsontable/issues/9622)

## 12.1.0

Released on June 28, 2022.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-12.1.0-data-grid-new-hooks-new-translations-and-rendering-improvements)
- [Documentation (12.1)](https://handsontable.com/docs/12.1/)

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

- [Documentation (12.0)](https://handsontable.com/docs/12.0/)

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

- [Blog post](https://handsontable.com/blog/handsontable-12.0.0-data-grid-rtl-support-and-a-new-keyboard-shortcuts-api)
- [Documentation (12.0)](https://handsontable.com/docs/12.0/)
- [Migration guide (11.1 → 12.0)](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md)

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

## 11.1.0

Released on January 13, 2022

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-11.1.0-vue-3-support-and-updatedata)
- [Documentation (11.1)](https://handsontable.com/docs/11.1/)

#### Added

- Added [`updateData()`](@/api/core.md#updatedata), a new method that lets you replace
  Handsontable's [`data`](@/api/options.md#data) without resetting the states of cells, rows and
  columns. [#7263](https://github.com/handsontable/handsontable/issues/7263)
- Vue: Added [Vue 3](https://v3.vuejs.org/guide/migration/introduction.html#overview) support, by
  introducing a [new wrapper](@/javascript/guides/integrate-with-vue3/vue3-simple-example/vue3-simple-example.md).
  [#7545](https://github.com/handsontable/handsontable/issues/7545)

#### Changed

- Updated the TypeScript definition of the [`setDataAtCell()`](@/api/core.md#setdataatcell) method.
  [#8601](https://github.com/handsontable/handsontable/issues/8601)
- Extended the
  [`Code Examples Deployment` GitHub Actions workflow](https://github.com/handsontable/handsontable/actions/workflows/code-examples.yml),
  to allow for deploying code examples to [GitHub Pages](https://pages.github.com/)).
  [#9058](https://github.com/handsontable/handsontable/issues/9058)

#### Fixed

- Fixed an issue where the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) editor's
  suggestion list didn't update properly.
  [#7570](https://github.com/handsontable/handsontable/issues/7570)
- Fixed an issue where nested headers didn't render when [`data`](@/api/options.md#data) wasn't
  defined. [#8589](https://github.com/handsontable/handsontable/issues/8589)
- Fixed some end-to-end tests that failed on mobile devices.
  [#8749](https://github.com/handsontable/handsontable/issues/8749)
- Fixed an issue where the rendered selection could get shifted by 1px.
  [#8756](https://github.com/handsontable/handsontable/issues/8756)
- Fixed an issue where the first column's border didn't display properly.
  [#8767](https://github.com/handsontable/handsontable/issues/8767)
- Fixed an issue where the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin's
  [`expandAll()`](@/api/collapsibleColumns.md#expandall) method didn't expand collapsed columns.
  [#8900](https://github.com/handsontable/handsontable/issues/8900)
- Fixed end-to-end test scripts that occasionally crashed.
  [#8961](https://github.com/handsontable/handsontable/issues/8961)
- Fixed a typo in the `valueAccordingPercent()` helper.
  [#9006](https://github.com/handsontable/handsontable/issues/9006)
- Fixed an issue where the [`NestedRows`](@/api/nestedRows.md) plugin could throw a type error after
  calling the [`updateSettings()`](@/api/core.md#updatesettings) method.
  [#9018](https://github.com/handsontable/handsontable/issues/9018)
- Fixed an issue where performance was affected by removing events.
  [#9044](https://github.com/handsontable/handsontable/issues/9044)
- Fixed a wrong TypeScript definition of the [`MultiColumnSorting`](@/api/multiColumnSorting.md)
  plugin's [`sort()`](@/api/multiColumnSorting.md#sort) method.
  [#9067](https://github.com/handsontable/handsontable/issues/9067)
- Fixed an issue where the [`Comments`](@/api/comments.md) plugin's editor disappeared after adding
  a comment. [#9075](https://github.com/handsontable/handsontable/issues/9075)
  [#6661](https://github.com/handsontable/handsontable/issues/6661)
- React: Fixed a wrong return type.
  [#9000](https://github.com/handsontable/handsontable/issues/9000)

## 11.0.1

Released on November 17, 2021.

For more information on this release, see:

- [Documentation (11.0)](https://handsontable.com/docs/11.0/)

#### Fixed

- Fixed the UMD build of `@handsontable/angular`, which was not working properly in `11.0.0`.
  [#8946](https://github.com/handsontable/handsontable/pull/8946)

## 11.0.0

Released on November 17, 2021.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-11.0.0-modularization-for-react-angular-and-vue)
- [Documentation (11.0)](https://handsontable.com/docs/11.0/)
- [Migration guide (10.0 → 11.0)](@/guides/upgrade-and-migration/migrating-from-10.0-to-11.0/migrating-from-10.0-to-11.0.md)

#### Added

- **Breaking change**: Added TypeScript definition files for Handsontable's modularized version.
  [#7489](https://github.com/handsontable/handsontable/issues/7489)
- **Breaking change (Vue)**: Added support for modularization to the Vue wrapper.
  [#8820](https://github.com/handsontable/handsontable/issues/8820)
- **Breaking change (React)**: Added support for modularization to the React wrapper.
  [#8819](https://github.com/handsontable/handsontable/issues/8819)
- **Breaking change (Angular)**: Added support for modularization to the Angular wrapper.
  [#8818](https://github.com/handsontable/handsontable/issues/8818)
- Added a new package entry point that allows importing built-in modules in one function call:
  <span class="lg-code">`import { registerAllEditors, registerAllRenderers, registerAllValidators, registerAllCellTypes, registerAllPlugins } from 'handsontable/registry'`</span>.
  [#8816](https://github.com/handsontable/handsontable/issues/8816)
- Added a new `locale` option, to properly handle locale-based data.
  [#8897](https://github.com/handsontable/handsontable/issues/8897)
- Added a GitHub Actions workflow that covers testing Handsontable and the wrappers.
  [#8652](https://github.com/handsontable/handsontable/issues/8652)
- Added new direction helpers (internal API) that lay ground for future RTL support.
  [#8868](https://github.com/handsontable/handsontable/issues/8868)

#### Changed

- **Breaking change**: Changed how the `populateFromArray()` method works with its `method` argument
  set to `shift_down` or `shift_right`.
  [#888](https://github.com/handsontable/handsontable/issues/888)
- Moved the entire Handsontable package to its own, new subdirectory: `/handsontable`.
  [#8759](https://github.com/handsontable/handsontable/issues/8759)
- Replaced the license files with updated versions.
  [#8877](https://github.com/handsontable/handsontable/issues/8877)

#### Fixed

- Fixed an issue with incorrect filtering of locale-based data while using search input from a
  dropdown menu. [#6095](https://github.com/handsontable/handsontable/issues/6095)
- Fixed an error thrown when using the `populateFromArray()` method with its `method` argument set
  to `shift_right`. [#6929](https://github.com/handsontable/handsontable/issues/6929)
- Fixed an issue with the `beforeOnCellMouseDown` and `afterOnCellMouseDown` hooks using wrong
  coordinates. [#8498](https://github.com/handsontable/handsontable/issues/8498)
- Fixed a `TypeError` thrown when calling the [`updateSettings()`](@/api/core.md#updatesettings)
  method in Handsontable's modularized version.
  [#8830](https://github.com/handsontable/handsontable/issues/8830)
- Fixed two issues with the documentation's `canonicalUrl` entries.
  [#8886](https://github.com/handsontable/handsontable/issues/8886)
- Fixed an error thrown when autofill's source is a `date` cell.
  [#8894](https://github.com/handsontable/handsontable/issues/8894)
- React: Fixed a React wrapper issue where it's impossible to use different sets of props in editor
  components reused across multiple columns.
  [#8527](https://github.com/handsontable/handsontable/issues/8527)

## 10.0.0

Released on September 29, 2021.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-10.0.0-improved-performance-and-consistency)
- [Documentation (10.0)](https://handsontable.com/docs/10.0/)
- [Migration guide (9.0 → 10.0)](@/guides/upgrade-and-migration/migrating-from-9.0-to-10.0/migrating-from-9.0-to-10.0.md)

#### Changed

- **Breaking change**: Unified the naming and description of the fourth argument, `controller`, for
  selection manipulation in the [`beforeOnCellMouseDown`](@/api/hooks.md#beforeoncellmousedown) and
  [`beforeOnCellMouseOver`](@/api/hooks.md#beforeoncellmouseover) hooks.
  [#4996](https://github.com/handsontable/handsontable/issues/4996)
- **Breaking change**: Changed what the [`beforeRender`](@/api/hooks.md#beforerender) and
  [`afterRender`](@/api/hooks.md#afterrender) hooks are, and when they are triggered. Added two new
  hooks: [`beforeViewRender`](@/api/hooks.md#beforeviewrender) and
  [`afterViewRender`](@/api/hooks.md#afterviewrender).
  [#6303](https://github.com/handsontable/handsontable/issues/6303)
- **Breaking change**: Changed the optional
  [HyperFormula](https://github.com/handsontable/hyperformula) dependency from `0.6.2` to `^1.1.0`,
  which introduces breaking changes for the [`Formulas`](@/api/formulas.md) plugin users.
  [#8502](https://github.com/handsontable/handsontable/issues/8502)
- **Breaking change**: Changed the default values for the
  [`rowsLimit`](@/api/copyPaste.md#rowslimit) and [`columnsLimit`](@/api/copyPaste.md#columnslimit)
  options of the [`CopyPaste`](@/api/copyPaste.md) plugin.
  [#8660](https://github.com/handsontable/handsontable/issues/8660)
- **Breaking change**: Added a default font family, size, weight and color.
  [#8661](https://github.com/handsontable/handsontable/issues/8661)
- **Breaking change**: Changed the [`autoWrapRow`](@/api/options.md#autowraprow) and
  [`autoWrapCol`](@/api/options.md#autowrapcol) options\` default values from `true` to `false`.
  [#8662](https://github.com/handsontable/handsontable/issues/8662)
- Improved the performance of the [`getCellMeta()`](@/api/core.md#getcellmeta) method.
  [#6303](https://github.com/handsontable/handsontable/issues/6303)
- Improved the documentation and TypeScript definition of the
  [`selectOptions`](@/api/options.md#selectoptions) option.
  [#8488](https://github.com/handsontable/handsontable/issues/8488)
- Improved the arguments forwarding in the hooks
  [#8668](https://github.com/handsontable/handsontable/issues/8668)
- Added a Github Actions workflow covering the testing of Handsontable and all of the wrappers.
  [#8652](https://github.com/handsontable/handsontable/issues/8652)

#### Fixed

- Fixed an issue of not resetting the date picker's configuration
  [#6636](https://github.com/handsontable/handsontable/issues/6636)
- An error won't be thrown while inserting a new row for nested rows in a specific case
  [#7137](https://github.com/handsontable/handsontable/issues/7137)
- Fixed a few problems with the [`NestedRows`](@/api/nestedRows.md) plugin, occurring with the
  [`Formulas`](@/api/formulas.md) plugin enabled.
  [#8048](https://github.com/handsontable/handsontable/issues/8048)
- Fixed errors being thrown in the [`Formulas`](@/api/formulas.md) plugin if a provided sheet name
  contained a dash character [#8057](https://github.com/handsontable/handsontable/issues/8057)
- Fixed multiple bugs related to undo/redo actions while using the [`Formulas`](@/api/formulas.md)
  plugin [#8078](https://github.com/handsontable/handsontable/issues/8078)
- Fixed an issue where autofill was not able to be blocked/changed with the
  [`beforeChange`](@/api/hooks.md#beforechange) hook when the [`Formulas`](@/api/formulas.md) plugin
  was enabled [#8107](https://github.com/handsontable/handsontable/issues/8107)
- Data stored by the [`NestedRows`](@/api/nestedRows.md) plugin won't be corrupted by some actions
  [#8180](https://github.com/handsontable/handsontable/issues/8180)
- Collapsed parents won't be expanded after inserting rows
  [#8181](https://github.com/handsontable/handsontable/issues/8181)
- Fixed the cooperation of the dropdown menu and column sorting (menu closing on click)
  [#8232](https://github.com/handsontable/handsontable/issues/8232)
- Data won't be corrupted anymore when some alterations are performed
  [#8614](https://github.com/handsontable/handsontable/issues/8614)
- Adjusted directories and files related to
  [`dataMap`](https://github.com/handsontable/handsontable/tree/master/handsontable/src/dataMap), to
  prevent potential circular references.
  [#8704](https://github.com/handsontable/handsontable/issues/8704)
- Improved the performance of the regular expression used to detect numeric values, and fixed major
  code smells. [#8752](https://github.com/handsontable/handsontable/issues/8752)

## 9.0.2

Released on July 28, 2021.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/whats-new-in-handsontable-9.0.2)
- [Documentation (9.0)](https://handsontable.com/docs/9.0/)

#### Fixed

- Fixed an issue with an error being thrown when lazy loading columns on a setup with Nested
  Headers + Hidden Columns. [#7160](https://github.com/handsontable/handsontable/issues/7160)
- Fixed column header sizes not being updated on `updateSettings` calls containing `columns`.
  [#7689](https://github.com/handsontable/handsontable/issues/7689)
- Fixed functional keys' behavior to prevent unexpected editing.
  [#7838](https://github.com/handsontable/handsontable/issues/7838)
- Fixed missing collapsible indicator on IE.
  [#8028](https://github.com/handsontable/handsontable/issues/8028)
- Fixed support for row and column headers in the `parseTable` utility.
  [#8041](https://github.com/handsontable/handsontable/issues/8041)
- Fixed a bug where not providing a data object with the [`NestedRows`](@/api/nestedRows.md) plugin
  enabled crashed the table. [#8171](https://github.com/handsontable/handsontable/issues/8171)
- Vue: Fixed an issue where adding rows to a Handsontable instance wrapped for Vue resulted in
  additional rows being inserted at the end of the table.
  [#8148](https://github.com/handsontable/handsontable/issues/8148)
- Vue: Fixed a problem in the Vue wrapper, where destroying the underlying Handsontable instance
  caused it to throw errors and crash.
  [#8311](https://github.com/handsontable/handsontable/issues/8311)
- React: Fixed a problem in the React wrapper, where destroying the underlying Handsontable instance
  caused it to throw errors and crash.
  [#8311](https://github.com/handsontable/handsontable/issues/8311)
- Angular: Fixed a problem in the Angular wrapper, where destroying the underlying Handsontable
  instance caused it to throw errors and crash.
  [#8311](https://github.com/handsontable/handsontable/issues/8311)

#### Added

- Added new documentation engine [#7624](https://github.com/handsontable/handsontable/issues/7624)

## 9.0.1

Released on June 17, 2021.

For more information on this release, see:

- [Documentation (9.0)](https://handsontable.com/docs/9.0/)

#### Removed

- Removed the redundant internal `jsonpatch` library from the source code.
  ([#8140](https://github.com/handsontable/handsontable/issues/8140))

#### Fixed

- Fixed an issue where the validator function was called twice when the `Formulas` plugin was
  enabled. ([#8138](https://github.com/handsontable/handsontable/issues/8138))
- Introduced a new CSS style for cells of the `checkbox` type to restore previous behaviour.
  ([#8196](https://github.com/handsontable/handsontable/issues/8196))

## 9.0.0

Released on June 1, 2021.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-9.0.0-new-formula-plugin)
- [Documentation (9.0)](https://handsontable.com/docs/9.0/)
- [Migration guide (8.4 → 9.0)](@/guides/upgrade-and-migration/migrating-from-8.4-to-9.0/migrating-from-8.4-to-9.0.md)

#### Changed

- **Breaking change**: New `Formulas` plugin, with an entirely different API. See the migration
  guide for a full list of changes. Removed the required `hot-formula-parser` dependency for the
  sake of an optional one, `hyperformula`.
  ([#6466](https://github.com/handsontable/handsontable/issues/6466))
- **Breaking change**: Changed the `afterAutofill` and `beforeAutofill` hooks' signatures.
  ([#7987](https://github.com/handsontable/handsontable/issues/7987))
- Upgraded `eslint` and eslint-related modules.
  ([#7531](https://github.com/handsontable/handsontable/issues/7531))
- Added `fit` & `fdescribe` to restricted globals in test files.
  ([#8088](https://github.com/handsontable/handsontable/issues/8088))

#### Deprecated

- Deprecated the `beforeAutofillInsidePopulate` hook. It will be removed in the next major release.
  ([#8095](https://github.com/handsontable/handsontable/issues/8095))

#### Removed

- **Breaking change**: Removed the deprecated plugins - Header Tooltips and Observe Changes.
  ([#8083](https://github.com/handsontable/handsontable/issues/8083))

#### Fixed

- Fixed a problem with the column indicator of the `CollapsibleColumns` plugin not being displayed
  properly on styled headers. ([#7970](https://github.com/handsontable/handsontable/issues/7970))
- Fixed a problem with duplicated `afterCreateCol` hooks being triggered after undoing a removal of
  a column. ([#8076](https://github.com/handsontable/handsontable/issues/8076))
- Fixed a problem with formulas not being calculated in certain conditions.
  ([#4430](https://github.com/handsontable/handsontable/issues/4430))
- Fixed a bug with formulas displaying incorrect values after inserting new rows.
  ([#4654](https://github.com/handsontable/handsontable/issues/4654))
- Fixed a problem with the `AVARAGE` formula being updated incorrectly.
  ([#4675](https://github.com/handsontable/handsontable/issues/4675))
- Fixed a problem with the `IF` formulas not working properly.
  ([#5870](https://github.com/handsontable/handsontable/issues/5870))
- Fixed a bug with using the `clear` method broke the formulas in the table.
  ([#6248](https://github.com/handsontable/handsontable/issues/6248))

## 8.4.0

Released on May 11, 2021.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/whats-new-in-handsontable-8-4-0)
- [Documentation (8.4.0)](https://handsontable.com/docs/8.4.0/)

#### Added

- Introduced a `separated` attribute for the label options (the `label` DOM element may wrap `input`
  or be placed next to it). ([#3172](https://github.com/handsontable/handsontable/issues/3172))
- Introduced the `modifyAutoColumnSizeSeed` hook to let developers overwrite the default behaviour
  of the AutoColumnSize sampling.
  ([#3339](https://github.com/handsontable/handsontable/issues/3339))
- Added support for hiding columns for the `NestedHeaders` plugin.
  ([#6879](https://github.com/handsontable/handsontable/issues/6879))
- Added ability to skip stacking actions by the `UndoRedo` plugin and introduced new hooks.
  ([#6948](https://github.com/handsontable/handsontable/issues/6948))
- Added 2 new hooks,
  [`beforeHighlightingColumnHeader`](@/api/hooks.md#beforehighlightingcolumnheader) and
  [`beforeHighlightingRowHeader`](@/api/hooks.md#beforehighlightingrowheader). Use them to retrieve
  a header element (`<th>`) before it gets highlighted.
  ([#7528](https://github.com/handsontable/handsontable/pull/7528))
- Added a new method, [`indexMapper.unregisterAll()`](@/api/indexMapper.md#unregisterall). Use it to
  unregister all collected index maps from all map collections types.
  ([#7528](https://github.com/handsontable/handsontable/pull/7528))
- Added a new method,
  [`indexMapper.createChangesObserver()`](@/api/indexMapper.md#createchangesobserver). Use it to
  listen to any changes made to indexes while Handsontable is running.
  ([#7528](https://github.com/handsontable/handsontable/pull/7528))
- Added a new method,
  [`indexMapper.createAndRegisterIndexMap()`](@/api/indexMapper.md#createandregisterindexmap). Use
  it to create and register a new index map.
  ([#7528](https://github.com/handsontable/handsontable/pull/7528))

#### Fixed

- Fixed a problem with sorting the `checkbox`-typed cells and an issue with empty cells not being
  displayed properly. ([#4047](https://github.com/handsontable/handsontable/issues/4047))
- Fixed a problem where undoing the removal of row with `readOnly` cells was not performed properly.
  ([#4754](https://github.com/handsontable/handsontable/issues/4754))
- Fixed state-change resolving for externally added checkboxes.
  ([#5934](https://github.com/handsontable/handsontable/issues/5934))
- Fixed a problem with the native selection being removed with the `fragmentSelection` option
  enabled. ([#6083](https://github.com/handsontable/handsontable/issues/6083))
- Fixed a bug where number of columns rendered in the viewport was not correct.
  ([#6115](https://github.com/handsontable/handsontable/issues/6115))
- Fixed a bug with the Dropdown Menu not opening on Android devices.
  ([#6212](https://github.com/handsontable/handsontable/issues/6212))
- Fixed the double-tap issue on iOS.
  ([#6961](https://github.com/handsontable/handsontable/issues/6961))
- Fixed a problem with the Comments editor being destroyed after destroying another Handsontable
  instance. ([#7091](https://github.com/handsontable/handsontable/issues/7091))
- Fixed incorrect `numericFormat`'s type definition.
  ([#7420](https://github.com/handsontable/handsontable/issues/7420))
- Fixed the `trimWhitespace` tests on Firefox.
  ([#7593](https://github.com/handsontable/handsontable/issues/7593))
- Fixed the [NPM Audit] Github Action job to report found vulnerabilities.
  ([#7621](https://github.com/handsontable/handsontable/issues/7621))
- Fixed some minor iOS problems. ([#7659](https://github.com/handsontable/handsontable/issues/7659))
- Fixed the TypeScript definition for the suspended rendering feature.
  ([#7666](https://github.com/handsontable/handsontable/issues/7666))
- Fixed the `postbuild` and `examples:install` scripts on Windows.
  ([#7680](https://github.com/handsontable/handsontable/issues/7680))
- Fixed the contents of the production `package.json`.
  ([#7723](https://github.com/handsontable/handsontable/issues/7723))
- Fixed an issue, where the callbacks for the `UndoRedo` plugin were called twice.
  ([#7825](https://github.com/handsontable/handsontable/issues/7825))
- Vue: Fixed a problem with displaying and removing rows in the `NestedRows` plugin.
  ([#7548](https://github.com/handsontable/handsontable/issues/7548))
- React: Fixed an incompatibility in the property type definitions for the HotColumn component.
  ([#7612](https://github.com/handsontable/handsontable/issues/7612))

#### Changed

- Enhanced the ESLint config file by adding a rule that checks if there are new lines missing before
  some keywords or statements. ([#7691](https://github.com/handsontable/handsontable/issues/7691))

## 8.3.2

Released on March 16, 2021.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-8-3-2-introducing-monorepo)
- [Documentation (8.3.2)](https://handsontable.com/docs/8.3.2/)

#### Added

- Introduced the monorepo to this repository. From now
  on, `handsontable`, `@handsontable/angular`, `@handsontable/react`, and `@handsontable/vue` will
  all be developed in the same repo - `handsontable`.
  ([#7380](https://github.com/handsontable/handsontable/issues/7380))
- Added a custom ESLint rule which allows restricting specified modules from loading by `import` or
  re-exporting. ([#7473](https://github.com/handsontable/handsontable/issues/7473))

#### Fixed

- Fixed a bug where it was impossible to enable `disableVisualSelection` for cells/columns.
  ([#5082](https://github.com/handsontable/handsontable/issues/5082))
- Fixed wrong paddings for multi-level headers.
  ([#5086](https://github.com/handsontable/handsontable/issues/5086))
- Fixed problems with the `current` option of the `disableVisualSelection` setting.
  ([#5869](https://github.com/handsontable/handsontable/issues/5869))
- Fixed problems with the `header` option of the `disableVisualSelection` setting.
  ([#6025](https://github.com/handsontable/handsontable/issues/6025))
- Fixed a bug where the "double-tap-to-zoom" gesture prevented the editor from opening properly on
  some mobile devices. ([#7142](https://github.com/handsontable/handsontable/issues/7142))
- Fixed a bug where calling the `updateSettings` method in the body of some callbacks would break
  the table. ([#7231](https://github.com/handsontable/handsontable/issues/7231))
- Fixed an issue where the `maxRows` and `maxCols` options interfered with hidden index
  calculations. ([#7350](https://github.com/handsontable/handsontable/issues/7350))
- Fixed problems with doubled borders being displayed when `window` was a scrollable container.
  ([#7356](https://github.com/handsontable/handsontable/issues/7356))
- Fixed a bug where value population from an edited cell would result in a console error.
  ([#7382](https://github.com/handsontable/handsontable/issues/7382))
- Fixed a bug where the dropdown cell type would not work on Safari 14+.
  ([#7413](https://github.com/handsontable/handsontable/issues/7413))
- Fixed a bug where the `AutoRowSize` plugin would break the table when placed in an iframe.
  ([#7424](https://github.com/handsontable/handsontable/issues/7424))
- Fixed bugs in navigation by `HOME` and `END` keys with hidden rows/columns enabled.
  ([#7454](https://github.com/handsontable/handsontable/issues/7454))
- Fixed a bug with the `trimWhitespace` option not working properly.
  ([#7458](https://github.com/handsontable/handsontable/issues/7458))
- Fixed an issue with inconsistent documentation and TypeScript definitions
  for `colWidths` and `rowHeights` options.
  ([#7507](https://github.com/handsontable/handsontable/issues/7507))
- Fixed the incorrect `cellTypes` module paths in the `exports` entry of the `package.json` file.
  ([#7597](https://github.com/handsontable/handsontable/issues/7597))
- Vue: Fixed Remote Code Execution vulnerability in the dev dependencies.
  ([#7620](https://github.com/handsontable/handsontable/issues/7620))

## 8.3.1

Released on February 10, 2021.

For more information on this release, see:

- [Documentation (8.3.1)](https://handsontable.com/docs/8.3.1/)

#### Fixed

- Fixed an issue where the CSS files could be eliminated during tree-shaking.
  ([#7516](https://github.com/handsontable/handsontable/issues/7516))

## 8.3.0

Released on January 28, 2021.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-8.3.0-has-been-released)
- [Documentation (8.3.0)](https://handsontable.com/docs/8.3.0/)

#### Added

- Introduced a new feature that allows postponing the table render and internal data cache update.
  The table rendering time can be reduced several-fold times by batching (using the `batch` method),
  multi-line API calls, or manually suspending rendering using the `suspendRender` and
  `resumeRender` methods. ([#7274](https://github.com/handsontable/handsontable/issues/7274))
- Introduced a possibility to import:
  1.  plugins
  2.  cell types
  3.  editors
  4.  renderers
  5.  validators as separate modules, along with the Handsontable _base_. This change allows
      utilizing only the parts of Handsontable the end application is actually using, without the
      overhead of the full bundle.
      ([#7403](https://github.com/handsontable/handsontable/issues/7403))
- Added a new workflow for managing and generating changelogs.
  ([#7405](https://github.com/handsontable/handsontable/issues/7405))

#### Fixed

- Fixed a bug with auto-execution of the first item in the `ContextMenu` plugin.
  ([#7364](https://github.com/handsontable/handsontable/issues/7364))
- Fixed a bug where column sorting with multi column sorting crashed the table.
  ([#7415](https://github.com/handsontable/handsontable/issues/7415))
- Added a missing entry for the `skipRowOnPaste` option in the TypeScript definition file.
  ([#7394](https://github.com/handsontable/handsontable/issues/7394))
- Added missing tests to prevent issue #7377 from resurfacing.
  ([#7396](https://github.com/handsontable/handsontable/issues/7396))
- Fixed an issue where altering columns did not update filters attached to columns.
  ([#6830](https://github.com/handsontable/handsontable/issues/6830))
- Fixed typos and wrong return types in the TypeScript definition file.
  ([#7399](https://github.com/handsontable/handsontable/issues/7399))
- Updated the dependencies causing potential security issues, as well as Babel configuration needed
  after the update. ([#7463](https://github.com/handsontable/handsontable/issues/7463))

#### Changed

- Corrected a typo in a helper method from the `ColumnSorting` plugin.
  ([#7375](https://github.com/handsontable/handsontable/issues/7375))
- Optimized the performance of rendering the table with numerous spare rows (for `minSpareRows`,
  `minSpareCols`, `minRows`, and `minCols` options).
  ([#7439](https://github.com/handsontable/handsontable/issues/7439))

## 8.2.0

Released on November 12, 2020.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-8.2.0-has-been-released)
- [Documentation (8.2.0)](https://handsontable.com/docs/8.2.0/)

#### Added

- Added a new type of an Index Map named `LinkedPhysicalIndexToValueMap`.
  ([#7276](https://github.com/handsontable/handsontable/issues/7276))
- Added an external dependency, `DOMPurify`, to add HTML sanitization that should minimize the risk
  of inserting insecure code using Handsontable built-in functionalities.
  ([#7292](https://github.com/handsontable/handsontable/issues/7292))

#### Fixed

- Fixed an issue where the container was not updated after trimming rows.
  ([#7241](https://github.com/handsontable/handsontable/issues/7241))
- Fixed an issue where the `htmlToGridSettings` helper threw an error if a `<table>` with no rows
  was passed. ([#7311](https://github.com/handsontable/handsontable/issues/7311))
- Fixed an issue where the sorting indicator moved incorrectly when a column was added.
  ([#6397](https://github.com/handsontable/handsontable/issues/6397))
- Fixed an issue where untrimming previously trimmed rows would sometimes result in the table
  instance not refreshing its height, leaving the row headers improperly rendered.
  ([#6276](https://github.com/handsontable/handsontable/issues/6276))
- Fixed an issue where the hidden columns plugin caused unintended scrolling when some cells were
  hidden. ([#7322](https://github.com/handsontable/handsontable/issues/7322))
- Fixed an issue where an error was thrown while hovering over row/column headers.
  ([#6926](https://github.com/handsontable/handsontable/issues/6926))
- Fixed an issue where table validation caused incorrect data rendering if the hidden rows/column
  plugin was enabled. ([#7301](https://github.com/handsontable/handsontable/issues/7301))
- Fixed an issue where adding 0 rows to the table ended with doubled entries in index mappers'
  collections. ([#7326](https://github.com/handsontable/handsontable/issues/7326))
- Fixed a problem with the inconsistent behavior of the Context Menu's "Clear column" disabled
  status. ([#7003](https://github.com/handsontable/handsontable/issues/7003))
- Fixed an issue with parsing multiline cells on pasting `text/html` mime-type.
  ([#7369](https://github.com/handsontable/handsontable/issues/7369))

## 8.1.0

Released on October 1, 2020.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-8.1.0-has-been-released)
- [Documentation (8.1.0)](https://handsontable.com/docs/8.1.0/)

#### Added

- Added support for resizing non-adjacent selected rows and columns.
  ([#7162](https://github.com/handsontable/handsontable/issues/7162))
- Added e2e tests and reorganized already existing ones.
  ([#6491](https://github.com/handsontable/handsontable/issues/6491))

#### Changed

- Updated dependencies to meet security requirements.
  ([#7222](https://github.com/handsontable/handsontable/issues/7222))
- Improved performance for `TrimRows`, `HiddenRows` and `HiddenColumns` plugins for big datasets
  with many trimmed/hidden indexes.
  ([#7223](https://github.com/handsontable/handsontable/issues/7223))

#### Fixed

- Fixed an issue where the value did not show if the first part of the merged area was hidden.
  ([#6871](https://github.com/handsontable/handsontable/issues/6871))
- Fixed an issue where after selecting the top-left element, resizing the row range was not
  possible. ([#7162](https://github.com/handsontable/handsontable/issues/7162))
- Fixed a bug introduced within ([#6871](https://github.com/handsontable/handsontable/issues/6871))
- Fixed an issue where column headers were cut off after hiding and revealing the columns with the
  `HiddenColumns` plugin. ([#6395](https://github.com/handsontable/handsontable/issues/6395))
- Fixed an issue where a redundant row was added during copy/paste operations in some cases.
  ([#5961](https://github.com/handsontable/handsontable/issues/5961))
- Fixed an issue where too many values were pasted after a column was hidden.
  ([#6743](https://github.com/handsontable/handsontable/issues/6743))
- Fixed a bug where an attempt to move collapsed parent rows, with the
  [`NestedRows`](@/api/nestedRows.md) plugin enabled, resulted in an error.
  ([#7132](https://github.com/handsontable/handsontable/issues/7132))
- Fixed an issue where, after column or row alteration, Handsontable threw an error if
  `ColumnSummary` was enabled without defined row ranges.
  ([#7174](https://github.com/handsontable/handsontable/issues/7174))
- Fixed an issue where using `updateSettings` was breaking column sorting in specific cases.
  ([#7228](https://github.com/handsontable/handsontable/issues/7228))
- Fixed an issue where, if `fixedColumnsLeft` was defined, rows had their left borders missing after
  disabling the row headers using `updateSettings`.
  ([#5735](https://github.com/handsontable/handsontable/issues/5735))
- Fixed an issue where the Handsontable instance could fall into an infinite loop during vertical
  scrolling. It only happened when the scrollable element was the `window` object.
  ([#7260](https://github.com/handsontable/handsontable/issues/7260))
- Fixed an issue with moving rows to the last row of the table when the
  [`NestedRows`](@/api/nestedRows.md) plugin was enabled. Repaired some other minor moving-related
  bugs as well. ([#6067](https://github.com/handsontable/handsontable/issues/6067))
- Fixed an issue with adding an unnecessary extra empty line in cells on Safari.
  ([#7262](https://github.com/handsontable/handsontable/issues/7262))
- Fixed an issue with clipped column headers when they were changed before or within usage of
  `updateSettings`. ([#6004](https://github.com/handsontable/handsontable/issues/6004))

## 8.0.0

Released on August 5, 2020.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/the-new-handsontable-8-is-now-available)
- [Documentation (8.0.0)](https://handsontable.com/docs/8.0.0/)
- [Migration guide (7.4 → 8.0)](@/guides/upgrade-and-migration/migrating-from-7.4-to-8.0/migrating-from-7.4-to-8.0.md)

#### Major changes

This version introduces a completely new architecture for row and column management - index mapper,
which is responsible for the storage and management of index values. In prior versions, the
calculation between physical and visual indexes was based on callbacks between hooks. That solution
slowly led to inconsistencies and the calculation was imperfect in some cases. To fix that there was
a major change in the whole system of mapping the indexes. The current solution offers an easier and
more straightforward way to perform CRUD and move operations on rows and columns. It keeps all data
in one place so getting and managing information is easier and less prone to bugs.

The existing features were adapted to benefit from the new architecture. Apart from that, extra
methods and hooks were added and there are few depreciations and removals, too.

#### Breaking changes

- Modifying the table's data by reference and calling `render()` will not work properly anymore.
  From this point onward, all the data-related operations need to be performed using the API
  methods, such as `populateFromArray` or `setDataAtCell`.
- The `modifyRow`, `modifyCol`, `unmodifyRow`, `unmodifyCol` hooks are no longer needed and were
  removed. Their functionality can be achived by using API.
  [More information in the 8.0.0 migration guide](https://handsontable.com/docs/8.0.0/tutorial-migration-guide.html).
- `skipLengthCache` hook was removed, `indexMapper` is now responsible for the cache and length.
- The `ManualColumnFreeze` plugin doesn't use the `ManualColumnMove` plugin anymore.
- The `CollapsibleColumns` plugin doesn't use the `HiddenColumns` plugin anymore.
- The `NestedRows` and `Filters` plugins don't use the `TrimRows` plugin anymore.
- The `minSpareRows` and `minRows` options will ensure that the number of visible rows corresponds
  to the value provided to them (for example, the `TrimRows` plugin won't have an impact on the
  number of displayed rows).
- `toPhysicalRow` and `toVisualColumn` now return `null` for non-existant rows/columns.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)).
- The `afterLoadData` hook receives a different set of arguments. It used to be just the initialLoad
  flag, now the first argument is `sourceData`, followed by `initialLoad`.
- The `ManualColumnFreeze` plugin will now put the unfrozen columns right next to the last frozen
  one.
- The `RecordTranslator` object and the `t` property available in the plugins were removed.
- After-prefixed hooks (`afterLoadData`, `afterFilter`, etc.) are now called just before the
  `render` call.
- Newly created rows and columns are now placed in the source data in the place calculated from its
  position in the visual context (they "stick" to their adjacent rows/columns). It also applies to
  moved rows and columns.
- When the [`NestedRows`](@/api/nestedRows.md) plugin is `enabled`, moving rows will be possible
  only using the UI or by calling the `dragRows` method of the `ManualRowMove` plugin.
- The `beforeRowResize`, `afterRowResize`, `beforeColumnResize`, `afterColumnResize` hooks have the
  order of their arguments rearranged for the sake of consistency with other hooks and to fix an
  issue where multiple hooks didn't get the modified value in the pipeline:
  [#3328](https://github.com/handsontable/handsontable/issues/3328).
- Changed the argument structure in `collapsibleColumns`' `toggleCollapsibleSection` method:
  [#6193](https://github.com/handsontable/handsontable/issues/6193).
- The following sublist shows changes related to the refactor of `HiddenColumns` and
  `CollapsibleColumns`. They will be compatible with upcoming `IndexMappers`
  [#5945](https://github.com/handsontable/handsontable/pull/5945) along with other adjustments
  [#6547](https://github.com/handsontable/handsontable/pull/6547):
  - Hidden indexes aren’t rendered. As a consequence hooks `beforeValueRender`, `beforeRenderer`,
    `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` etc. will be executed just for
    some of the columns (just the rendered ones).
  - The `getColWidth` for hidden index will return 0 – it used to return 0.1. Also, it will no
    longer be called internally, the need can be now achieved by managers of rows and columns.
  - The `modifyColWidth` hook will not be called internally. However, it will be executed when the
    user will call the `getColWidth`.
  - Hidden indexes aren't rendered. As a consequence hooks `beforeValueRender`, `beforeRenderer`,
    `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` etc. will be executed just for
    some of the columns (just the rendered ones).
  - `listen` function from the core API used to accept `modifyDocumentFocus` as optional parameter,
    this parameter was removed.
  - `CustomBorders` plugin was adapted to work with `HiddenColumns` properly. From now on hiding
    cells at the start or the end of the range will also hide their borders. Hiding a single cell
    with borders will hide all of its borders.
    [#7083](https://github.com/handsontable/handsontable/pull/7083).
  - `CollapsibleColumns` will no longer use `HiddenColumns` plugin to work.
    [#6204](https://github.com/handsontable/handsontable/issues/6204).
  - Adjusted `HiddenColumns` to be compatible with upcoming `IndexMappers`.
    [#6547](https://github.com/handsontable/handsontable/pull/6547).
  - `hiddenRow` and `hiddenColumn` hooks were removed. They were used to check if a given index is
    hidden in the `HiddenColumns` and `HiddenRows` plugins. Since now there may be more sources of
    hiding indexes they have been replaced by `IndexMapper` with the new `isHidden` method. It keeps
    the broad information about hidden indexes and their sources.
  - `rowOffset` and `colOffset` were removed since they aliased the methods from Walkontable.
    [#6547](https://github.com/handsontable/handsontable/pull/6547).
- Changes related to adjusting `HiddenRows` to new `IndexMapper` architecture are
  [#6177](https://github.com/handsontable/handsontable/issues/6177):
  - Adjusted `HiddenRows` to new `IndexMapper` architecture.
    [#6177](https://github.com/handsontable/handsontable/issues/6177).
- Developed a unified way to identify HOT "input" elements. All input elements owned by HOT got an
  attribute "data-hot-input" which are identified by that key.
  [#6383](https://github.com/handsontable/handsontable/issues/6383).
- `NestedHeaders` plugin was rewritten, from now on, only a tree-like structure will be allowed,
  meaning, there will be no possibility to place nested headers in-between layers.
  [#6716](https://github.com/handsontable/handsontable/pull/6716)
- The right mouse button (`RMB`) click on the corner when there is no data will show all options
  disabled. [#6547](https://github.com/handsontable/handsontable/pull/6547).
- Left mouse button (`LMB`) click on the top left corner will now select all cells along with their
  headers. [#6547](https://github.com/handsontable/handsontable/pull/6547).
- Removed the experimental `GanttChart` plugin.
  [#7022](https://github.com/handsontable/handsontable/issues/7022).
- Adding properties which were not defined on initialization or by `updateSettings` to the source
  data is possible only by the usage of `setSourceDataAtCell`.
  [#6664](https://github.com/handsontable/handsontable/issues/6664).
- Passing `columns` or `data` inside the `settings` object when calling the `updateSettings` method
  will result in resetting states corresponding to rows and columns (ie. row/column sequence, column
  width, row height, freezed columns etc.). The same behavior can be seen when using `loadData`. In
  such cases, it is assumed that a new dataset is introduced upon calling `updateSettings` or
  `loadData` .[#6547](https://github.com/handsontable/handsontable/pull/6547).

#### New features

- Added the Index Mapper architecture and its API.
  [#5112](https://github.com/handsontable/handsontable/issues/5112) (more information available in
  the PRs [#5945](https://github.com/handsontable/handsontable/pull/5945) with additional changes in
  [#6547](https://github.com/handsontable/handsontable/pull/6547))
- Added a new `batch` method. [#5945](https://github.com/handsontable/handsontable/pull/5945) along
  with other adjustments ([#7068](https://github.com/handsontable/handsontable/pull/7068))

#### Deprecations

- The `ObserveChanges` plugin is no longer enabled by `columnSorting` and became deprecated.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- `HeaderTooltips` plugin becomes deprecated and will be removed in the next major version.
  [#7023](https://github.com/handsontable/handsontable/issues/7023)
- IE support is deprecated and will be removed by the end of the year.
  [#7026](https://github.com/handsontable/handsontable/issues/7026)

#### Changelog

- Added `modifySourceData` hook and `setSourceDataAtCell` method.
  [#6664](https://github.com/handsontable/handsontable/issues/6664)
- Added new argument to `scrollViewportTo` method: optional `considerHiddenIndexes` which is a
  `boolean`. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Added additional information available in the cell meta object - the language.
  [#6254](https://github.com/handsontable/handsontable/pull/6254).
- Added a possibility to allow cancelling of `autofill` in the `beforeAutofill` hook.
  [#4441](https://github.com/handsontable/handsontable/issues/4441)
- Added support for newer versions of moment, numbro and pikaday.
  [#5159](https://github.com/handsontable/handsontable/issues/5159)
- Added `afterAutoFill` hook. [#6135](https://github.com/handsontable/handsontable/issues/6135)
- Added deprecated warning messages mechanism for plugin hooks.
  [#6613](https://github.com/handsontable/handsontable/pull/6613)
- Added missing types for \`instance.undoRedo\`.
  [#6346](https://github.com/handsontable/handsontable/issues/6346)
- Added `countRenderableColumns` method to the `TableView`.
  [#6177](https://github.com/handsontable/handsontable/issues/6177)
- Added missing "hide" property in `CustomBorders` typings.
  [#6788](https://github.com/handsontable/handsontable/issues/6788)
- Added `beforeSetCellMeta` hook with an ability to cancel the changes.
  [#5388](https://github.com/handsontable/handsontable/issues/5388)
- Added additional test for autofill plugin.
  [#6756](https://github.com/handsontable/handsontable/issues/6756)
- Changed how `ManualRowMove` and `ManualColumnMove` plugins work
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Click on a row header will select all cells (also hidden).
  [#2391](https://github.com/handsontable/handsontable/issues/2391)
- Extracted Cell-Meta logic from Core to separate module.
  [#6254](https://github.com/handsontable/handsontable/pull/6254)
- The `CellMeta` manager was refactored for future features and improvements.
  [#6233](https://github.com/handsontable/handsontable/issues/6233)
- Rows can be resized to less than `rowHeights`.
  [#6149](https://github.com/handsontable/handsontable/issues/6149)
- Left mouse button (LMB) click on the corner will now select all cells.
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Passing `columns` or `data` inside the `settings` object when calling the `updateSettings` method
  will result in resetting states corresponding to rows and columns (ie. row/column sequence, column
  width, row height, freezed columns etc.). The same behavior can be seen when using `loadData`. In
  such cases, it is assumed that a new dataset is introduced upon calling `updateSettings` or
  `loadData` .[#6547](https://github.com/handsontable/handsontable/pull/6547).
- The right mouse button (`RMB`) click on the corner, column and row headers will show just some
  options, defined by newly created specification
  [#7082](https://github.com/handsontable/handsontable/pull/7082)
- Hidden indexes will no longer be rendered, as a consequence `afterRenderer`, `modifyColWidth`,
  `beforeStretchingColumnWidth` will be executable only on visible (meaning, rendered) rows and
  columns. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- The `getColWidth` for hidden index will return 0 - it used to return 0.1
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- The `modifyColWidth` hook isn't called internally. However, it will be executed when the user will
  call the `getColWidth`. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Hidden rows/columns won't rendered anymore. As a consequence hooks `beforeValueRender`,
  `beforeRenderer`, `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` etc. will be
  executed just for some of the columns (just the renderable ones).
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Selection behavior changed when hiding cells from the `ContextMenu`, now it is selecting a column
  on the right when there is space on right to the last selected column, selecting a column on the
  left otherwise. [#6547](https://github.com/handsontable/handsontable#6547)
- Developed a unified way to identify HOT "input" elements. All input elements owned by HOT got an
  attribute "data-hot-input" which are identified by that key.
  [#6383](https://github.com/handsontable/handsontable/issues/6383)
- `NestedHeaders` plugin was rewritten, from now on, only a tree-like structure will be allowed,
  meaning, there will be no possibility to place nested headers in-between layers.
  [#6716](https://github.com/handsontable/handsontable/pull/6716)
- `CustomBorders` plugin was adapted to work with `HiddenColumns` properly, from now on hiding cells
  at the start or at the end of a range will also hide their borders. Also, hiding a single cell
  with borders will hide all of its borders.
  [#7083](https://github.com/handsontable/handsontable/pull/7083)
- `CollapsibleColumns` will no longer use `HiddenColumns` plugin to work.
  [#6204](https://github.com/handsontable/handsontable/issue/6204)
- Modifying the table's data by reference and calling \`render()\` will not work properly anymore.
  From this point onward, all the data-related operations need to be performed using the API
  methods, such as `populateFromArray` or `setDataAtCell`.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Removed dependencies between plugins: the `ManualColumnFreeze` plugin doesn't use the
  `ManualColumnMove`, the `CollapsibleColumns` plugin doesn't use the `HiddenColumns` plugin,
  `NestedRows` plugin doesn't use the `TrimRows` plugin, `Filters` plugin doesn't use the `TrimRows`
  plugin anymore. [#5945](https://github.com/handsontable/handsontable/pull/5945) along with other
  adjustments [#6547](https:// github.com/handsontable/handsontable/pull/6547):
- The `minSpareRows` and `minRows` options will ensure that the number of visible rows corresponds
  to the value provided to them (for example, the `TrimRows` plugin won't have an impact on the
  number of displayed rows). [#5945](https://github.com/handsontable/handsontable/pull/5945)
- `toPhysicalRow` and `toVisualColumn` now return `null` for non-existant rows/columns.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `afterLoadData` hook receives a different set of arguments. It used to be just the initialLoad
  flag, now the first argument is `sourceData`, followed by `initialLoad`.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `ManualColumnFreeze` plugin unfreezes the column just after the "line of freeze".
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `RecordTranslator` object and the `t` property available in the plugins were removed.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- After-prefixed hooks (`afterLoadData`, `afterFilter`, etc.) are now called just before the
  `render` call. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Newly created rows and columns are now placed in the source data in the place calculated from its
  position in the visual context (they "stick" to their adjacent rows/columns). It also applies to
  moved rows and columns. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- When the [`NestedRows`](@/api/nestedRows.md) plugin is `enabled`, moving rows will be possible
  only using the UI or by calling the `dragRows` method of the `manualRowMove` plugin.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `beforeRowResize`, `afterRowResize`, `beforeColumnResize`, `afterColumnResize` hooks have the
  order of their arguments rearranged for the sake of consistency with other hooks.
  [#3328](https://github.com/handsontable/handsontable/issues/3328)
- Changed the argument structure in `collapsibleColumns`' `toggleCollapsibleSection` method.
  [#6193](https://github.com/handsontable/handsontable/issues/6193)
- Updated the `moment`, `numbro` and `pikaday` dependencies to their latest versions.
  [#6610](https://github.com/handsontable/handsontable/issues/6610)
- Standardize the \`z-index\` properties between the overlays.
  [#6269](https://github.com/handsontable/handsontable/pull/6269)
- `HeaderTooltips` plugin becomes deprecated and will be removed in the next major version.
  [#7023](https://github.com/handsontable/handsontable/issues/7023)
- IE support is depreacated and will removed by the end of the year.
  [#7026](https://github.com/handsontable/handsontable/issues/7026)
- Removed `firstVisibleColumn` CSS class as no longer needed.
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed helpers that covered IE8 support or are not needed anymore.
  [#6525](https://github.com/handsontable/handsontable/issues/6525)
- Removed old unnecessary warning about `beforeChange` callback.
  [#6792](https://github.com/handsontable/handsontable/issues/6792)
- Removed `debug` key (key, css, docs).
  [#6672](https://github.com/handsontable/handsontable/issues/6672)
- Removed `hiddenRow` and `hiddenColumn` hooks.
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed optional argument `modifyDocumentFocus` from the `listen` function.
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed `rowOffset` and `colOffset` public API methods since they aliased the methods from
  Walkontable. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed the experimental `GanttChart` plugin.
  [#7022](https://github.com/handsontable/handsontable/issues/7022)
- Removed post-install warning from package.json file
  [#6608](https://github.com/handsontable/handsontable/pull/6608)
- The `modifyRow`, `modifyCol`, `unmodifyRow`, `unmodifyCol` and `skipLengthCache` hooks are no
  longer needed and were removed. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Fixed a problem with data not being added to the table properly with the `columnSorting` option
  enabled. [#2685](https://github.com/handsontable/handsontable/issues/2685)
- Fixed a problem with `loadData` not resetting the row order changed by the `ManualRowMove` plugin.
  [#3568](https://github.com/handsontable/handsontable/issues/3568)
- Fixed a bug, where using `alter`'s `insert_row` after using the `loadData` method and sorting the
  data would add unintentional additional rows to the table.
  [#3809](https://github.com/handsontable/handsontable/issues/3809)
- Fixed a bug, where blank rows appeared in the middle of the table after using `loadData` along
  with the `minSpareRows` option. [#3937](https://github.com/handsontable/handsontable/issues/3937)
- Fixed a problem with the `ColumnSummary` plugin not working properly after adding new rows using
  the Context Menu and sorting the data.
  [#3924](https://github.com/handsontable/handsontable/issues/3924)
- Fixed a bug, where calling `loadData` with an object-based data source would not work properly.
  [#4204](https://github.com/handsontable/handsontable/issues/4204)
- Fixed a problem with the Hidden Columns settings being reset after calling `updateSettings`.
  [#4121](https://github.com/handsontable/handsontable/issues/4121)
- Fixed a bug with the `Filters` plugin using incorrect indexes after moving and/or sorting the
  table. [#4442](https://github.com/handsontable/handsontable/issues/4442)
- Fixed a bug that caused a column to contain improper data after moving it to index `0`.
  [#4470](https://github.com/handsontable/handsontable/issues/4470)
- Fixed a bug with the `afterRowMove` hook receiving an improper `target` argument.
  [#4501](https://github.com/handsontable/handsontable/issues/4501)
- Fixed a problem with the `ManualColumnFreeze` plugin enabling `ManualColumnMove`, even if it was
  declared as `false`. [#4553](https://github.com/handsontable/handsontable/issues/4553)
- Fixed a problem with plugins using `arrayMappers` not working properly after updating the dataset.
  [#4567](https://github.com/handsontable/handsontable/issues/4567)
- Fixed a bug, where calling `loadData` with `minSpareRows` and `manualRowMove` enabled caused the
  table to improperly load the data.
  [#4576](https://github.com/handsontable/handsontable/issues/4576)
- Fixed a bug, where enabling `columnSorting` caused the `manualColumnFreeze` to be unusable.
  [#4601](https://github.com/handsontable/handsontable/issues/4601)
- Fixed a problem, where the columns were assigned improper widths after inserting additional
  columns or removing any of them. [#4666](https://github.com/handsontable/handsontable/issues/4666)
- Fixed a bug, where moving rows was impossible while `persistentState` was enabled.
  [#4713](https://github.com/handsontable/handsontable/issues/4713)
- Fixed a bug, where `manualColumnMove` didn't work if the dataset was empty.
  [#4926](https://github.com/handsontable/handsontable/issues/4926)
- Fixed a bug with the `collapseAll` method from the `collapsibleColumns` plugin did not work
  properly if `columnSorting` was enabled.
  [#4999](https://github.com/handsontable/handsontable/issues/4999)
- Fixed a bug, where calling `loadData` with `minSpareRows` enabled would cause unwanted blank rows
  to appear. [#5707](https://github.com/handsontable/handsontable/issues/5707)
- Fixed a bug with the `afterColumnMove` hook receiving an improper `target` argument.
  [#5173](https://github.com/handsontable/handsontable/issues/5173)
- Fixed a problem, where filtering data after moving rows would not work properly.
  [#5178](https://github.com/handsontable/handsontable/issues/5178)
- Fixed a bug, where calling `loadData` made `NaN` appear in the column headers.
  [#5369](https://github.com/handsontable/handsontable/issues/5369)
- Fixed a bug with the `skipColumnOnPaste` option not working properly when using `columnSorting`
  and `hiddenColumns`. [#5824](https://github.com/handsontable/handsontable/issues/5824)
- Fixed a bug with the `TrimRows` plugin did not work properly after moving rows.
  [#5860](https://github.com/handsontable/handsontable/issues/5860)
- Fixed a problem with `minSpareRows` not working properly with the `trimRows` plugin being used.
  [#5862](https://github.com/handsontable/handsontable/issues/5862)
- Fixed a problem, where it was impossible to filter the data declared in the
  [`NestedRows`](@/api/nestedRows.md) plugin .
  [#5889](https://github.com/handsontable/handsontable/issues/5889)
- Fixed a bug, where filtering and sorting data would cause the `toVisualRow` method to return the
  wrong results. [#5890](https://github.com/handsontable/handsontable/issues/5890)
- Fixed a bug with the `filters` and `trimRows` plugins not working properly alongside each other.
  [#5915](https://github.com/handsontable/handsontable/issues/5915)
- Fixed a bug, where `manualColumnMove` would not work properly when the data object properties
  count would be lower than the table column count.
  [#5931](https://github.com/handsontable/handsontable/issues/5931)
- Fixed a bug with the `TrimRows` plugin did not work properly with the `startRows` option.
  [#5953](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a problem, where using `loadData` after sorting would not work as expected.
  [#5956](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a problem with the `beforeColumnMove` and `afterColumnMove` hooks not containing information
  about their destination indexes. [#6005](https://github.com/handsontable/handsontable/issues/6005)
- Fixed a problem where using `filters` and `minSpareRows` would make the table add an empty row at
  the beginning of the table. [#6278](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a bug with the `manualRowMove` plugin would duplicate data in the moved rows, when used with
  a row index greater than the table row count.
  [#6088](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a bug, where the `toVisualRow` method returned `null` when using the `trimRows` and
  `columnSorting` plugins together.
  [#6310](https://github.com/handsontable/handsontable/issues/6310)
- Fixed a problem, where calling `updateSettings` in the `afterColumnMove` hook callback would have
  no effect. [#4480](https://github.com/handsontable/handsontable/issues/4480)
- Fixed a bug, where calling `loadData` would make the `filters` plugin to not behave as expected.
  [#5244](https://github.com/handsontable/handsontable/issues/5244)
- Fixed a bug, where detaching a child from a parent in the [`NestedRows`](@/api/nestedRows.md)
  plugin would cause a \`+/-\` button misalignment.
  [#5900](https://github.com/handsontable/handsontable/issues/5900)
- Fixed a problem with the `ColumnSummary` plugin creating a doubled summary row.
  [#5794](https://github.com/handsontable/handsontable/issues/5794)
- Fixed a bug, where moving children between parents using the [`NestedRows`](@/api/nestedRows.md)
  plugin would throw an error. [#6066](https://github.com/handsontable/handsontable/issues/6066)
- Fixed a bug, where adding rows by modifying the data by reference while using the
  [`NestedRows`](@/api/nestedRows.md) plugin would throw an error.
  [#3914](https://github.com/handsontable/handsontable/issues/3914)
- Fixed a bug, where merging cells would conflict with the `columnSorting` plugin.
  [#6086](https://github.com/handsontable/handsontable/issues/6086)
- Fixed a bug, where the row headers would stay visible after removing all the table columns.
  [#6412](https://github.com/handsontable/handsontable/issues/6412)
- Fixed an issue where Hidden columns become visible when the user ran `updateSettings`.
  [#4121](https://github.com/handsontable/handsontable/issues/4121)
- Fixed an issue where using `hiddenColumns` and `stretchH` showed a redundant horizontal scrollbar.
  [#4181](https://github.com/handsontable/handsontable/issues/4181)
- Fixed an issue in which if the last column was a hidden column and `stretchH` was enabled, the
  last column was displayed. [#4370](https://github.com/handsontable/handsontable/issues/4370)
- Fixed an issue where `updateSettings` performance was very low because of `hiddenColumns` being
  rendered. [#4381](https://github.com/handsontable/handsontable/issues/4381)
- Fixed an issue where collapse was not working correctly with custom cell renderers.
  [#4716](https://github.com/handsontable/handsontable/issues/4716)
- Fixed an incorrect header name when user defined more columns in the `NestedHeaders` plugin.
  [#4716](https://github.com/handsontable/handsontable/issues/4716)
- Fixed an issue where `HiddenColumns` did not work properly with `ColumnSorting`.
  [#5571](https://github.com/handsontable/handsontable/issues/5571)
- Fixed an issue where `ManualColumnMove` should work with `HiddenColumns`.
  [#5598](https://github.com/handsontable/handsontable/issues/5598)
- Fixed an issue where `hiddenColumns` option interfered with the keyboard movement.
  [#5704](https://github.com/handsontable/handsontable/issues/5704)
- Fixed an issue where after hiding the first two rows, the row headers became de-synchronized by
  1px. [#5817](https://github.com/handsontable/handsontable/issues/5817)
- Fixed an issue where hiding columns affected selection of hidden columns.
  [#5871](https://github.com/handsontable/handsontable/issues/5871)
- Fixed an issue where if `collapsibleColumns` were set to `true` it was impossible to exit
  selection mode. [#5875](https://github.com/handsontable/handsontable/issues/5875)
- Fixed an issue where `hiddenColumns` did not work properly with \`autoWrapRow/autoWrapCol\`.
  [#5877](https://github.com/handsontable/handsontable/issues/5877)
- Fixed an issue on IE where hiding the first column caused a display of double border for top left
  corner. [#5881](https://github.com/handsontable/handsontable/issues/5881)
- Fixed an issue where `nestedHeaders` duplicated a header name if more columns are added.
  [#5882](https://github.com/handsontable/handsontable/issues/5882)
- Fixed an issue where `HiddenColumns` plugin unset cell's `renderer`.
  [#5883](https://github.com/handsontable/handsontable/issues/5883)
- Fixed an issue where `hiddenColumns` had stored visual indexes and should have used physical
  indexes. [#5909](https://github.com/handsontable/handsontable/issues/5909)
- Fixed an issue where hidden columns should be unrecoverable.
  [#6113](https://github.com/handsontable/handsontable/issues/6113)
- Fixed an issue where row selection ignored columns that are hidden at the end.
  [#6181](https://github.com/handsontable/handsontable/issues/6181)
- Fixed an issue where defining data with more data than used in `columns` caused an issue with
  showing column once it was hidden.
  [#6426](https://github.com/handsontable/handsontable/issues/6426)
- Fixed an issue where hiding rows, while there was a merged area, involved caused data shifting and
  unexpected merged area coordinates.
  [#6376](https://github.com/handsontable/handsontable/issues/6376)
- Fixed an issue where `colHeader` was truncated after moving `hiddenColumn`.
  [#6463](https://github.com/handsontable/handsontable/issues/6463)
- Fixed an issue where the last hidden column was visible upon column resizing.
  [#6557](https://github.com/handsontable/handsontable/issues/6557)
- Fixed an issue where with hiding columns after moved them manually.
  [#6668](https://github.com/handsontable/handsontable/issues/6668)
- Fixed an issue where expanding a collapsed column caused expanding of a child columns except for
  the first one. [#5792](https://github.com/handsontable/handsontable/issues/5792)
- Fixed an issue where setting `columnSorting` to `true` (on initialization or via `updateSettings`)
  made headers non-collapsible programmatically via `collapseAll` method.
  [#4999](https://github.com/handsontable/handsontable/issues/4999)
- Fixed an issue where `CustomBorders` plugin was missing in the definition file.
  [#6477](https://github.com/handsontable/handsontable/issues/6477)
- Fixed incorrect size of `wtHider`and `wtHolder` in overlays.
  [#3873](https://github.com/handsontable/handsontable/issues/3873)
- Fixed an issue where `updateSettings` could not update `tableClassName`.
  [#6295](https://github.com/handsontable/handsontable/issues/6295)
- Fixed an issue where JSON data with empty value was losing some double quotes when pasted into a
  cell. [#6167](https://github.com/handsontable/handsontable/issues/6167)
- Fixed an issue where some classes for the table were missing if one of them was empty.
  [#6371](https://github.com/handsontable/handsontable/issues/6371)
- Fixed an issue where clicking in a contextmenu's border opened the native context menu.
  [#6218](https://github.com/handsontable/handsontable/issues/6218)
- Fixed the error that ocurred during loading of E2E test runner in Edge and IE.
  [#6713](https://github.com/handsontable/handsontable/issues/6713)
- Fixed the inconsistency and problems with adding rows from the corner when all rows are trimmed.
  [#7061](https://github.com/handsontable/handsontable/issues/7061)
- Fixed an issue where using read-only and alignment from the context menu was disabled when all
  columns were selected. [#7114](https://github.com/handsontable/handsontable/issues/7114)
- Fixed an issue where setting focus to a column to open context menu after applying a filter was
  impossible. [#7005](https://github.com/handsontable/handsontable/issues/7005)
- Fixed an issue where `minSpareCols` with `undo` added too many columns.
  [#6363](https://github.com/handsontable/handsontable/issues/6363)
- Fixed the inconsistency in selection when using the right mouse button for first row/column.
  [#6334](https://github.com/handsontable/handsontable/issues/6334)
- Fixed an issue where undoing column removal caused column headers to lack a header.
  [#6992](https://github.com/handsontable/handsontable/issues/6992)
- Fixed an issue where `readOnly` for column was erased (did not apply) if filters were used.
  [#6559](https://github.com/handsontable/handsontable/issues/6559)
- Fixed an issue where readonly property was lost after declining confirmation in `beforeRemoveCol`
  or `beforeRemoverow`. [#6332](https://github.com/handsontable/handsontable/issues/6332)
- Fixed an issue where `readOnly` state for some cells was lost when rows with `trimRows` turned on
  were removed. [#6990](https://github.com/handsontable/handsontable/issues/6990)
- Fixed incorrect column header highlight when merged cells were unmerged and `hiddenColumns` were
  used. [#6978](https://github.com/handsontable/handsontable/issues/6978)
- Fixed an issue where after hiding the first row, the second row top border disappeared.
  [#6977](https://github.com/handsontable/handsontable/issues/6977)
- Fixed an issue with incorrect selection after hiding the first row.
  [#6831](https://github.com/handsontable/handsontable/issues/6831)
- Fixed an issue where hiding the first row caused blue highlight in column headers selection to
  disappear. [#6976](https://github.com/handsontable/handsontable/issues/6976)
- Fixed wrong selection area after sorting with hidden rows.
  [#6386](https://github.com/handsontable/handsontable/issues/6386)
- Fixed an issue where it was not possible to use `selectAll` when the first row was hidden.
  [#6975](https://github.com/handsontable/handsontable/issues/6975)
- Fixed an issue where it was possible to select hidden row or column.
  [#6974](https://github.com/handsontable/handsontable/issues/6974)
- Fixed an issue where row indexes changed if the first row was hiding after moving row from bottom
  to top. [#6965](https://github.com/handsontable/handsontable/issues/6965)
- Fixed an issue where selection skipped the highest parent.
  [#6770](https://github.com/handsontable/handsontable/issues/6770)
- Fixed an iisue where `nestedRows` blocked table from loading if data was not provided.
  [#6928](https://github.com/handsontable/handsontable/issues/6928)
- Fixed an isse where it was impossible to go back to the original cell after dragging down.
  [#4233](https://github.com/handsontable/handsontable/issues/4233)
- Fixed an issue where keyboard navigation did not work on merged cells with hidden rows/columns.
  [#6973](https://github.com/handsontable/handsontable/issues/6973)
- Fixed an issue where `trimRows` and `hiddenRows` with specific settings broke borders.
  [#6904](https://github.com/handsontable/handsontable/issues/6904)
- Fixed wrong union type for `startPosition`.
  [#6840](https://github.com/handsontable/handsontable/issues/6840)
- Fixed type mismatch for \`Handsontable.plugins.ContextMenu\`.
  [#6347](https://github.com/handsontable/handsontable/issues/6347)
- Fixed an issue where `manualColumnMove` did not modify the `columns` in `updateSettings`.
  [#5200](https://github.com/handsontable/handsontable/issues/5200)
- Fixed rendering issue on column udpate with `updateSettings`.
  [#3770](https://github.com/handsontable/handsontable/issues/3770)
- Fixed an issue where expanding a collapsed column was also expanding 'child' collapsed columns,
  except the first child. [#5792](https://github.com/handsontable/handsontable/issues/5792)
- Fixed an issue with inproper selection for headers when the first column was hidden.
  [#5999](https://github.com/handsontable/handsontable/issues/5999)
- Fixed an issue where it was not possible to align cells if the selection was made upward.
  [#6600](https://github.com/handsontable/handsontable/issues/6600)
- Fixed an issue where `currentColClassName` did not work properly with `nestedHeaders`.
  [#5861](https://github.com/handsontable/handsontable/issues/5861)
- Fixed an issue with scrollbar and dimension calculation in Firefox for toggling column visibility
  with fixed columns and `stretchH`.
  [#6186](https://github.com/handsontable/handsontable/issues/6186)
- Fixed an issue with undoing the nested row removal.
  [#6433](https://github.com/handsontable/handsontable/issues/6433)
- Fixed an isse where `getSourceData` functions returned wrong data for nested rows.
  [#5771](https://github.com/handsontable/handsontable/issues/5771)
- Fixed na issue where the `Formulas` plugin did not work with `nestedRows`.
  [#4154](https://github.com/handsontable/handsontable/issues/4154)
- Fixed an issue where nested headers and hidden columns highlighted ad additional column when used
  together. [#6881](https://github.com/handsontable/handsontable/issues/6881)
- Fixed an issue where `getByRange` for sourceData did not work properly with nested object data.
  [#6548](https://github.com/handsontable/handsontable/issues/6548)
- Fixed an issue where \`window.frameElement\` threw errors in MSEdge, IE and Safari.
  [#6478](https://github.com/handsontable/handsontable/issues/6478)
- Fixed an issue where \`DataSource.countColumns\` returned invalid number of columns for nested
  objects. [#3958](https://github.com/handsontable/handsontable/issues/3958)
- Fixed an issue where `mergedCells` with hidden cells caused problems with rendering.
  [#7020](https://github.com/handsontable/handsontable/issues/7020)
- Fixed an issue where it was not possible to move column when all columns were selected by \`ctrl +
  a\`. [#6355](https://github.com/handsontable/handsontable/issues/6355)
- Fixed an issue where double click on the column resize handle did not adjust size correctly.
  [#6755](https://github.com/handsontable/handsontable/issues/6755)
- Fixed an issue where the cell meta was retrieved using the wrong coordinates.
  [#6703](https://github.com/handsontable/handsontable/issues/6703)
- Fixed nested rows incorrect state after changing data.
  [#5753](https://github.com/handsontable/handsontable/issues/5753)
- Fixed an issue in EDGE where the dropdown menu `onMouseOut` event caused critical errors when
  hovering over vertical scrollbar.
  [#6699](https://github.com/handsontable/handsontable/issues/6699)
- Fixed an issue with too many layers of highlight with noncontinuous selection on merged cells.
  [#7028](https://github.com/handsontable/handsontable/issues/7028)
- Fixed an issue where `NestedHeaders` did not allow to define header level as an empty array.
  [#7035](https://github.com/handsontable/handsontable/issues/7035)
- Fixed an issue where passing `nestedHeaders` as a single empty array stoped the table from
  rendering. [#7036](https://github.com/handsontable/handsontable/issues/7036)
- Fixed an issue where opening a context menu for a column when its hidden data was selected did not
  block adding of rows by the menu.
  [#7050](https://github.com/handsontable/handsontable/issues/7050)
- Fixed an issue where it was not possible to navigate past hidden column using keyboard if\`
  hot.updateSettings\` was called in `afterSelection`.
  [#3726](https://github.com/handsontable/handsontable/issues/3726)
- Fixed an issue where headers did not export with `exportToFile` in the specific case.
  [#4176](https://github.com/handsontable/handsontable/issues/4176)
- Fixed an issue with types mismatch.
  [#6035](https://github.com/handsontable/handsontable/issues/6035)
- Fixed an issue where manual row resize handler threw an error when bottom rows overlay was
  enabled. [#6435](https://github.com/handsontable/handsontable/issues/6435)
- Fixed an issue where the `afterRowResize` hook shared incorrect results in the second parameter.
  [#6430](https://github.com/handsontable/handsontable/issues/6430)
- Fixed an issue where the row/column resize hooks should not have returned `null`.
  [#7074](https://github.com/handsontable/handsontable/issues/7074)
- Fixed the loss of selection after merging from headers.
  [#7076](https://github.com/handsontable/handsontable/issues/7076)
- Fixed an issue where calling `updateSettings` changed the index of frozen columns via
  `freezeColumn` method. [#6843](https://github.com/handsontable/handsontable/issues/6843)
- Fixed an issue where deleting the last column via `updateSettings` which was part of the selection
  caused scroll to the bottom. [#5849](https://github.com/handsontable/handsontable/issues/5849)
- Fixed an issue where it was not possible to hide rows and merge cells at the same time.
  [#6224](https://github.com/handsontable/handsontable/issues/6224)
- Fixed the wrong data in merge cells after the hidden column and additionally an error occurs.
  [#6888](https://github.com/handsontable/handsontable/issues/6888)
- Fixed an issue where it was not possible to change cell type via `setCellMeta`.
  [#4793](https://github.com/handsontable/handsontable/issues/4793)
- Fixed an issue where cell editor did not dynamically changed while changing the cell type.
  [#4360](https://github.com/handsontable/handsontable/issues/4360)
- Fixed an issue where it was not possible to unmerge cells if part of them was hidden.
  [#7095](https://github.com/handsontable/handsontable/issues/7095)
- Fixed an issue where calling `clear` method removed the focus from the table.
  [#7099](https://github.com/handsontable/handsontable/issues/7099)
- Fixed an issue where `clear` method did not work for hidden data.
  [#7097](https://github.com/handsontable/handsontable/issues/7097)
- Fixed an issue where the editor was moved by 1px when the first row / column was hidden.
  [#6982](https://github.com/handsontable/handsontable/issues/6982)
- Fixed an issue where headers were deselected after undoing removal.
  [#6670](https://github.com/handsontable/handsontable/issues/6670)
- Fixed an issue with improper selection after insert column/row when mergeCells was enabled.
  [#4897](https://github.com/handsontable/handsontable/issues/4897)
- Fixed an issue where wrong cell meta was removed when deleting rows.
  [#6051](https://github.com/handsontable/handsontable/issues/6051)
- Fixed wrong types of `beforeRowMove` arguments.
  [#6539](https://github.com/handsontable/handsontable/issues/6539)
- Fixed an issue where selection of a whole row did not happen consequently after selecting a row
  header. [#5906](https://github.com/handsontable/handsontable/issues/5906)
- Fixed an issue where it was not possible to use physical row index instead of visual one.
  [#6309](https://github.com/handsontable/handsontable/issues/6309)
- Fixed an issue where incorrect data was returned after undoing the remove column option.
  [#5000](https://github.com/handsontable/handsontable/issues/5000)
- Fixed - Copy and paste works properly also when selecting hidden columns when: all columns within
  a selected range are hidden and when just some columns within a selected range are hidden.
  [#7043](https://github.com/handsontable/handsontable/issues/7043).
- Fixed an issue where it was impossible to add new row in the `nestedRows`.
  [#5133](https://github.com/handsontable/handsontable/issues/5133)
- Fixed an issue where `afterOnCellMouseDown` returned (0,0) coords after clicking on the topleft
  corner. [#3978](https://github.com/handsontable/handsontable/issues/3978)
- Fixed an issue where persisted `manualColumnMove` was not restored when using `loadData`.
  [#5207](https://github.com/handsontable/handsontable/issues/5207)
- Fixed issues with filtering results in blank rows.
  [#5208](https://github.com/handsontable/handsontable/issues/5208)
- Fixed an issue where changing data on collapsed rows resulted in error.
  [#5328](https://github.com/handsontable/handsontable/issues/5328)
- Fixed an issue where the `manualColumnMove` operation affected the column order of data loaded by
  `loadData`. [#5591](https://github.com/handsontable/handsontable/issues/5591)
- Fixed an issue where `nestedRows` did not allow to keep `rowHeaders` after collapsing.
  [#5874](https://github.com/handsontable/handsontable/issues/5874)
- Fixed performance and CPU issue caused by using some handsontable properties.
  [#6058](https://github.com/handsontable/handsontable/issues/6058)
- Fixed an error with the `ColumnSummary` plugin when trying to create a row.
  [#6300](https://github.com/handsontable/handsontable/issues/6300)
- Fixed an error where \`walkontable.css\` and \`handsontable.css\` stylesheets were out of sync.
  [#6381](https://github.com/handsontable/handsontable/issues/6381)
- Fixed an issue where `colHeaders` order was not updated after manual move with empty object data
  source. [#6413](https://github.com/handsontable/handsontable/issues/6413)
- Fixed "detach from parent" option.
  [#6432](https://github.com/handsontable/handsontable/issues/6432)
- Fixed an issue where `PreventOverflow` feature did not work if `MultiColumnSorting` plugin was
  enabled. [#6514](https://github.com/handsontable/handsontable/issues/6514)
- Fixed an issue where old CSS classes were not removed after `updateSettings`.
  [#6575](https://github.com/handsontable/handsontable/issues/6575)
- Fixed an issue where `columnSummary`, `Filters` and spare rows were causing 'RangeError: Maximum
  call stack size exceeded'. [#6695](https://github.com/handsontable/handsontable/issues/6695)
- Fixed an issue where `afterSelectionEnd` returned incorrect data when clicking on a column when
  all rows were hidden. [#7045](https://github.com/handsontable/handsontable/issues/7045)
- Fixed an issue where wrapping was not applied after setting `trimWhitespace` to `false`.
  [#6232](https://github.com/handsontable/handsontable/issues/6232)
- Fixed an issue with additional selection border in iOS.
  [#7103](https://github.com/handsontable/handsontable/issues/7103)
- Fixed an issue with rendering different borders.
  [#6955](https://github.com/handsontable/handsontable/issues/6955)
- Fixed an issue with `BACKSPACE` not working properly in the filter by value input.
  [#6842](https://github.com/handsontable/handsontable/issues/6842)
- Fixed an issue with Undo/Redo not working with fixing columns.
  [#6869](https://github.com/handsontable/handsontable/issues/6869)
- Added a missing argument in the `deepObjectSize` function.
  [#6821](https://github.com/handsontable/handsontable/pull/6821)
- Fixed an issue where the table threw errors while clicking the cells if the Handsontable was
  initialized with `fixedRowsTop` and `fixedRowsBottom` higher than rows length.
  [#6718](https://github.com/handsontable/handsontable/issues/6718)
- Fixed an issue where it was not possible to change the state of checkbox-type, non-adjacent cells
  using `SPACE`. [#4882](https://github.com/handsontable/handsontable/issues/4882)
- Fixed an issue where resizing made rows shorter than expected and caused row misalignment.
  [#6429](https://github.com/handsontable/handsontable/issues/6429)
- Fixed an issue where Handsontable was missing rows when `preventOverflow` with `updateSettings`
  were used. [#4303](https://github.com/handsontable/handsontable/issues/4303)
- Adding properties which were not defined on initialization or by `updateSettings` to the source
  data is possible only by the usage of `setSourceDataAtCell`.
  [#6664](https://github.com/handsontable/handsontable/issues/6664).

## 7.4.2

Released on February 19, 2020.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-7-4-2-released)
- [Documentation (7.4.2)](https://handsontable.com/docs/7.4.2/)
- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.4.2)

#### Changes

- Fixed an issue where the cell value could not be edited on mobile devices.
  ([#6707](https://github.com/handsontable/handsontable/issues/6707))
- Fixed an issue where white lines appeared at the bottom of cell headers.
  ([#6459](https://github.com/handsontable/handsontable/issues/6459))
- Fixed a bug, where resizing the window (while using Angular) would result in Handsontable not
  stretching properly and throwing an error.
  ([#6710](https://github.com/handsontable/handsontable/issues/6710))

## 7.4.1

Released on February 19, 2020.

Due to technical issues, version 7.4.2 patch needed to be released.

**All the changes from 7.4.1 are included in the 7.4.2 release.**

## 7.4.0

Released on February 12, 2020.

For more information on this release, see:

- [Blog post](https://handsontable.com/blog/handsontable-7-4-0-released)
- [Documentation (7.4.0)](https://handsontable.com/docs/7.4.0/)
- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.4.0)

#### Changes

- Fixed the problem, where the `onCellMouseUp` hook was fired for all mouse buttons except `RMB`,
  which was not consistent with the `onCellMouseDown` hook. To make the changes more consistent with
  the native `dblclick` event (which is triggered only for the `LMB` button), the `onCellDblClick`
  and `onCellCornerDblClick` hooks were modified to also fire only for `LMB`.
  ([#6507](https://github.com/handsontable/handsontable/issues/6507))
- Updated `moment`, `pikaday` and `numbro` to their latest versions.
  ([#6610](https://github.com/handsontable/handsontable/issues/6610))
- Fixed a bug with numbers not being presented properly with the `pt_BR` culture setting.
  ([#5569](https://github.com/handsontable/handsontable/issues/5569))
- Extended the Babel config with the possibility to use private methods, optional chaining and
  nullish coalescing operator. ([#6308](https://github.com/handsontable/handsontable/issues/6308))
- Updated some of the internal configs, updated dev-dependencies, housekeeping etc.
  ([#6560](https://github.com/handsontable/handsontable/issues/6560),
  [#6609](https://github.com/handsontable/handsontable/issues/6609),
  [#6612](https://github.com/handsontable/handsontable/issues/6612),
  [#6629](https://github.com/handsontable/handsontable/issues/6629),
  [#6574](https://github.com/handsontable/handsontable/issues/6574),
  [#6565](https://github.com/handsontable/handsontable/issues/6565))

## Older versions

The changelogs from older versions of Handsontable are
[available on GitHub](https://github.com/handsontable/handsontable/releases).

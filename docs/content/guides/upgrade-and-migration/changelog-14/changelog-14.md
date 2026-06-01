---
type: reference
id: 5wvnjbho
title: Changelog 14.0
metaTitle: Changelog 14.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 14.0 in each minor and patch release.
permalink: /changelog-14
canonicalUrl: /changelog-14
react:
  id: dhkjk1de
  metaTitle: Changelog 14.0 - React Data Grid | Handsontable
angular:
  id: d5haqby0
  metaTitle: Changelog 14.0 - Angular Data Grid | Handsontable
vue:
  id: st0v0t8a
  metaTitle: Changelog 14.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 14.x.

## 14.6.2

Released on February 10, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Documentation (14.6)](https://handsontable.com/docs/14.6)

</div>

#### Fixed
- Fixed the copy/paste feature not working correctly in Chrome 133. [#11428](https://github.com/handsontable/handsontable/pull/11428)

## 14.6.1

Released on October 17, 2024

For more information about this release see:

<div class="boxes-list gray">

- [Documentation (14.6)](https://handsontable.com/docs/14.6)

</div>

#### Removed
- Removed `aria-hidden` from the TextEditor and PasswordEditor's `TEXTAREA` elements.  [#11218](https://github.com/handsontable/handsontable/pull/11218)

## 14.6.0

Released on October 1, 2024

For more information about this release see:

<div class="boxes-list gray">

- [Blog post (14.6.0)](https://handsontable.com/blog/handsontable-14-6-0-easier-styling-and-enhanced-undo-redo)
- [Documentation (14.6)](https://handsontable.com/docs/14.6)

</div>

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

<div class="boxes-list gray">

- [Blog post (14.5.0)](https://handsontable.com/blog/handsontable-14.5.0-improved-performance-and-flexible-column-header-class)
- [Documentation (14.5)](https://handsontable.com/docs/14.5)

</div>

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

<div class="boxes-list gray">

- [Blog post (14.4.0)](https://handsontable.com/blog/handsontable-14.4.0-improved-stability)
- [Documentation (14.4)](https://handsontable.com/docs/14.4)

</div>

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

<div class="boxes-list gray">

- [Blog post (14.3.0)](https://handsontable.com/blog/handsontable-14.3.0-enhanced-navigation-and-bug-fixes)
- [Documentation (14.3)](https://handsontable.com/docs/14.3)

</div>

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

<div class="boxes-list gray">

- [Blog post (14.2.0)](https://handsontable.com/blog/handsontable-14-2-0-improved-react-rendering-new-hooks)
- [Documentation (14.2)](https://handsontable.com/docs/14.2)

</div>

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

<div class="boxes-list gray">

- [Blog post (14.1.0)](https://handsontable.com/blog/handsontable-14-1-0-typescript-ssr-improvements)
- [Documentation (14.1)](https://handsontable.com/docs/14.1)

</div>

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
- Improved TypeScript definitions for the [`CustomBorders`](@/api/customBorders.md) plugin. [#10659](https://github.com/handsontable/handsontable/pull/10659)
- React: Improved support for SSR frameworks. [#10575](https://github.com/handsontable/handsontable/pull/10575)

#### Fixed

- Fixed an issue where double-clicking a cell resulted in highlighting the cell's contents. [#10595](https://github.com/handsontable/handsontable/pull/10595)
- Fixed an issue where pressing the <kbd>**Tab**</kbd> key when editing a cell in the last column caused an error. [#10632](https://github.com/handsontable/handsontable/pull/10632)
- Fixed an issue where pressing the <kbd>**Tab**</kbd> key with [`tabNavigation`](@/api/options.md#tabnavigation) set to `false` caused the grid to scroll. [#10634](https://github.com/handsontable/handsontable/pull/10634)
- Fixed an issue where the [`Filters`](@/api/filters.md) plugin threw a `TypeError` in specific setup cases. [#10637](https://github.com/handsontable/handsontable/pull/10637)
- Fixed an issue where changing Handsontable's configuration or data broke the focus position. [#10642](https://github.com/handsontable/handsontable/pull/10642)
- Fixed an issue where Handsontable didn't go into the "unlisten" state after clicking an element outside of the table. [#10648](https://github.com/handsontable/handsontable/pull/10648)
- Fixed an issue where recovering removed cells by using undo/redo didn't restore the cells' configuration options. [#10649](https://github.com/handsontable/handsontable/pull/10649)
- Fixed an issue where the [`ManualRowResize`](@/api/manualRowResize.md) and [`ManualColumnResize`](@/api/manualColumnResize.md) plugins threw an error when a cell renderer used the HTML `<table>` element. [#10650](https://github.com/handsontable/handsontable/pull/10650)
- Fixed an issue where, in some situations, the table didn't scroll after navigating it with the keyboard. [#10655](https://github.com/handsontable/handsontable/pull/10655)
- Fixed an issue where the drag-to-scroll functionality was not working for window-scrolled instances. [#10655](https://github.com/handsontable/handsontable/pull/10655)
- Fixed an issue where some configurations of the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin caused an uncaught `TypeError`. [#10693](https://github.com/handsontable/handsontable/pull/10693)
- Fixed an issue where pressing the <kbd>**Backspace**</kbd> key in a date cell deleted the entire contents of the cell instead of a single character. [#10696](https://github.com/handsontable/handsontable/pull/10696)
- Fixed several issues related to the `roundFloat` option of the [`ColumnSummary`](@/api/columnSummary.md) plugin. [#10701](https://github.com/handsontable/handsontable/pull/10701)
- Fixed a missing TypeScript definition in the [`Formulas`](@/api/formulas.md) plugin.  [#10186](https://github.com/handsontable/handsontable/pull/10186)
- Added `pikaday` to `handsontable`s `dependencies`, to ensure backward compatibility of Handsontable 14.1.0. [#10715](https://github.com/handsontable/handsontable/pull/10715)
- React: Fixed a missing TypeScript definition for the `settings` prop. [#10661](https://github.com/handsontable/handsontable/pull/10661)
- Vue: Fixed an issue where passing `hyperformulaInstance` to `hotSettings` resulted in `TypeError: Converting circular structure to JSON`. [#8728](https://github.com/handsontable/handsontable/pull/8728)
- Vue: Updated the peer dependencies of the Vue 3 wrapper with the latest version of Vue. [#10571](https://github.com/handsontable/handsontable/pull/10571)

## 14.0.0

Released on November 30, 2023

For more information on this release, see:

<div class="boxes-list gray">

- [Blog post (14.0.0)](https://handsontable.com/blog/whats-new-in-handsontable-14-improvements-to-accessibility)
- [Documentation (14.0)](https://handsontable.com/docs/14.0)
- [Migration guide (13.1.0 → 14.0)](@/guides/upgrade-and-migration/migrating-from-13.1-to-14.0/migrating-from-13.1-to-14.0.md)

</div>

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

## Related

- [Migrating from 13.1 to 14.0](@/guides/upgrade-and-migration/migrating-from-13.1-to-14.0/migrating-from-13.1-to-14.0.md)

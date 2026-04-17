---
type: reference
id: e195f568
title: Changelog 13.0
metaTitle: Changelog 13.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 13.0 in each minor and patch release.
permalink: /changelog-13
canonicalUrl: /changelog-13
react:
  id: 6j5r5hmi
  metaTitle: Changelog 13.0 - React Data Grid | Handsontable
angular:
  id: yf3kyziz
  metaTitle: Changelog 13.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 13.x.

## 13.1.0

Released on August 31, 2023.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post (13.1.0)](https://handsontable.com/blog/handsontable-13-1-0-reduced-bundle-size-and-bug-fixes)
- [Documentation (13.1)](https://handsontable.com/docs/13.1)

</div>

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


<div class="boxes-list gray">

- [Blog post (13.0.0)](https://handsontable.com/blog/handsontable-13-0-0-support-for-angular-16-and-new-frameworks-support-policy)
- [Documentation (13.0)](https://handsontable.com/docs/13.0)
- [Migration guide (12.4 → 13.0)](@/guides/upgrade-and-migration/migrating-from-12.4-to-13.0/migrating-from-12.4-to-13.0.md)

</div>

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

## Related

- [Migrating from 12.4 to 13.0](@/guides/upgrade-and-migration/migrating-from-12.4-to-13.0/migrating-from-12.4-to-13.0.md)

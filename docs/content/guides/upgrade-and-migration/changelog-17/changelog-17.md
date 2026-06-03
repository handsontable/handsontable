---
type: reference
id: l59xqo44
title: Changelog 17.0
metaTitle: Changelog 17.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 17.0 in each minor and patch release.
permalink: /changelog-17
canonicalUrl: /changelog-17
react:
  id: tgfvndey
  metaTitle: Changelog 17.0 - React Data Grid | Handsontable
angular:
  id: wyn633o3
  metaTitle: Changelog 17.0 - Angular Data Grid | Handsontable
vue:
  id: ubusl9gr
  metaTitle: Changelog 17.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 17.x.

## 17.1.0

Released on May 19th, 2026

For more information about this release, see:

<div class="boxes-list gray">

- [Blog post (17.1.0)](https://handsontable.com/blog/handsontable-17.1.0-export-to-excel-server-side-row-model-and-built-in-toasts)
- [Documentation (17.1)](https://handsontable.com/docs/17.1)

</div>

#### Added
- Added a hit area for dropdown menu and collapsible buttons [#12070](https://github.com/handsontable/handsontable/pull/12070)
- Added `rowspan` support to the NestedHeaders plugin, allowing column headers to span multiple header rows. [#191](https://github.com/handsontable/handsontable/issues/191)
- Added the DataProvider plugin and `dataProvider` table option for server-side row loading and mutations. [#12147](https://github.com/handsontable/handsontable/pull/12147)
- Added XLSX export support to the ExportFile plugin [#12166](https://github.com/handsontable/handsontable/pull/12166)
- Added build weight comparison tables to the Modules guide, showing the minified and gzip size added by each optional module when imported on top of `handsontable/base`. [#12262](https://github.com/handsontable/handsontable/issues/12262)
- Added Notification plugin for non-blocking toast notifications. [#12299](https://github.com/handsontable/handsontable/issues/12299)
- Added long-press gesture detection on touch devices to open the context menu. [#12306](https://github.com/handsontable/handsontable/issues/12306)
- Added dedicated `paginationButton*` theme tokens so pagination navigation button colors can be customized independently via the theme builder. [#12317](https://github.com/handsontable/handsontable/issues/12317)
- Added dedicated `paginationButton*` theme tokens so pagination navigation button colors can be customized independently for default, hover, focus, and disabled states via the theme builder. [#12404](https://github.com/handsontable/handsontable/issues/12404)
- Added `rowspan` support to the NestedHeaders plugin, allowing column headers to span multiple header rows. [#191](https://github.com/handsontable/handsontable/issues/191)

#### Changed
- Added a frame-based e2e test wait helper and replaced selected hook test sleeps. [#12161](https://github.com/handsontable/handsontable/pull/12161)
- Improve the rendering performance [#12189](https://github.com/handsontable/handsontable/pull/12189)
- Change the columnHeaders property name to colHeaders in the exportFile plugin [#12224](https://github.com/handsontable/handsontable/issues/12224)
- Improve rendering performance for fast scrollbar movements [#12235](https://github.com/handsontable/handsontable/pull/12235)
- Angular: Modernized the Angular wrapper to align with Angular 17–19, simplify setup, reduce dependencies, and clean up tooling. [#12451](https://github.com/handsontable/handsontable/issues/12451)

#### Fixed
- Fixed an issue where the Nested Rows plugin was disabled after calling updateSettings with an empty data array. [#10556](https://github.com/handsontable/handsontable/issues/10556)
- Fixed `setSourceDataAtCell()` updating parent rows instead of nested child rows when `nestedRows` is enabled. [#10657](https://github.com/handsontable/handsontable/issues/10657)
- Fixed an issue where the stretchH: 'last' option would ignore the defined column width when the viewport was too narrow, causing the last column to shrink to 0px. [#11761](https://github.com/handsontable/handsontable/issues/11761)
- Fixed a stack overflow error when pasting large datasets (50,000+ rows) by optimizing array operations in the HTML table parser. [#11784](https://github.com/handsontable/handsontable/issues/11784)
- Fixed incorrect JSDoc type annotations for the `modifyAutofillRange` hook parameters. The parameters `entireArea` and `startArea` are now correctly documented as `number[]` (a flat 4-element array) instead of the generic `Array` type, and the `@returns` type annotation has been added. [#11862](https://github.com/handsontable/handsontable/issues/11862)
- Fixed filter by value input performance degradation when searchMode: apply option is enabled. [#12104](https://github.com/handsontable/handsontable/issues/12104)
- Fixed `getCellMetaAtRow()` to always return cell metadata in physical column order. [#12109](https://github.com/handsontable/handsontable/pull/12109)
- Fixed the `modifyAutofillRange` hook type signature to match runtime tuple arguments and return value [#12113](https://github.com/handsontable/handsontable/issues/12113)
- Fixed incorrect parsing of comma-grouped values in numeric cells [#12114](https://github.com/handsontable/handsontable/issues/12114)
- Fixed comment editor positioning for merged cells [#12115](https://github.com/handsontable/handsontable/pull/12115)
- Fixed the Filters plugin incorrectly applying filter conditions after columns were moved with the ManualColumnMove plugin. [#11832](https://github.com/handsontable/handsontable/issues/11832)
- Fixed column resizing being misaligned and calculating incorrect widths when the grid container has a CSS `transform: scale()` applied. [#11838](https://github.com/handsontable/handsontable/issues/11838)
- Fixed the `stretchH: 'last'` option ignoring the defined column width and shrinking the last column to 0px when the viewport was too narrow. [#11761](https://github.com/handsontable/handsontable/issues/11761)
- Fixed HyperFormula errors when MultiSelect cells store array values. [#12135](https://github.com/handsontable/handsontable/pull/12135)
- Fixed `setSourceDataAtCell()` updating a parent row instead of the intended nested child row when the `nestedRows` option was enabled. [#10657](https://github.com/handsontable/handsontable/issues/10657)
- Fixed `setDataAtRowProp()` incorrectly canceling an active editor session when the programmatic update targeted a different cell in the same row. [#4305](https://github.com/handsontable/handsontable/issues/4305)
- Fix ThemeBuilder false unknown token warning on initialization [#12146](https://github.com/handsontable/handsontable/pull/12146)
- Prevent after scroll hooks from firing when axis position is unchanged [#12151](https://github.com/handsontable/handsontable/issues/12151)
- Fixed six regressions related to rowspans in nested column headers. [#12152](https://github.com/handsontable/handsontable/pull/12152)
- Fixed undo restore for mixed checkbox multi-selection delete. [#12153](https://github.com/handsontable/handsontable/issues/12153)
- Fixed Ctrl+A selecting the entire grid instead of the comment text when the comment textarea was focused. [#12193](https://github.com/handsontable/handsontable/issues/12193)
- Fixed `columnHeaderHeight` overriding the actual content height, causing overlay THEAD misalignment when header text wraps. [#12198](https://github.com/handsontable/handsontable/issues/12198)
- Fixed selected fixed-column header alignment with data cells for fixedColumnsStart [#12202](https://github.com/handsontable/handsontable/issues/12202)
- Fixed autofill over hidden columns when Formulas is enabled and hiddenColumns.copyPasteEnabled is false [#12203](https://github.com/handsontable/handsontable/issues/12203)
- Fixed a one-pixel horizontal misalignment of the left pagination caret in the Pagination plugin. [#2791](https://github.com/handsontable/handsontable/pull/2791)
- Fixed nested headers crash when sorting with disabled current highlight. [#12211](https://github.com/handsontable/handsontable/issues/12211)
- Improved server-side data documentation structure and fixed disjunctionWithExtraCondition guard fallback in server filter utility examples. [#12241](https://github.com/handsontable/handsontable/issues/12241)
- Fixed framework wrappers crashing when init-only settings (renderAllRows, renderAllColumns, layoutDirection, ariaTags) changed after initialization. [#12242](https://github.com/handsontable/handsontable/issues/12242)
- Fixed an issue where `currentRowClassName` and `currentColClassName` could not be changed dynamically using `updateSettings`. [#12247](https://github.com/handsontable/handsontable/issues/12247)
- Fixed column menu dropdown button styling when a filtered column header is also active [#12253](https://github.com/handsontable/handsontable/issues/12253)
- Fixed an issue where rows with dataSchema default values (e.g., false for checkbox columns) were not recognized as empty by isEmptyRow and isEmptyCol, causing minSpareRows and minSpareCols to add infinite rows. [#12254](https://github.com/handsontable/handsontable/issues/12254)
- Fixed autocomplete editor with strict mode and allowInvalid discarding typed value on click-away instead of saving it. [#12285](https://github.com/handsontable/handsontable/issues/12285)
- Fixed incorrect JSDoc type annotations for the `modifyAutofillRange` hook's `entireArea` and `startArea` parameters, and added the missing `@returns` annotation. [#11862](https://github.com/handsontable/handsontable/issues/11862)
- Fixed filter-by-value search by trimming leading and trailing spaces and treating whitespace-only input as an empty query. [#12290](https://github.com/handsontable/handsontable/issues/12290)
- Fixed portal-based popups (e.g., date picker) closing immediately on touch devices (Android) due to outside-click detection not accounting for rootPortalElement. [#12298](https://github.com/handsontable/handsontable/pull/12298)
- Fixed `setDataAtRowProp` ignoring the `source` parameter in array-form calls, causing `beforeChange` and `afterChange` hooks to always receive `'edit'` instead of the provided source string. [#12300](https://github.com/handsontable/handsontable/issues/12300)
- Fixed multiple Handsontable tables with shared HyperFormula engine and auto-sizing becoming unresponsive due to cross-table formula update interference. [#12305](https://github.com/handsontable/handsontable/issues/12305)
- Fixed `disableVisualSelection` treating `undefined` as `true` instead of falling back to the default (`false`). [#12307](https://github.com/handsontable/handsontable/issues/12307)
- Fixed incorrect return types for in some hooks [#12309](https://github.com/handsontable/handsontable/pull/12309)
- Fixed multiselect overflow indicator not responding to chip padding token changes [#12316](https://github.com/handsontable/handsontable/pull/12316)
- Fixed the `headerRowBackgroundColor` theme token having no visual effect on row headers. The `rowHeaderOddBackgroundColor` and `rowHeaderEvenBackgroundColor` tokens now derive from `headerRowBackgroundColor` by default, so customizing it properly cascades to all row headers. [#12322](https://github.com/handsontable/handsontable/issues/12322)
- Fixed an exception when showing the loading indicator from the `afterChange` hook during editor close. [#12348](https://github.com/handsontable/handsontable/issues/12348)
- Fixed TypeScript type for the `dateFormat` option to accept `Intl.DateTimeFormatOptions` objects required by the `intl-date` cell type. [#12395](https://github.com/handsontable/handsontable/issues/12395)
- Fixed an issue where minSpareRows and minSpareCols kept adding rows/columns when dataSchema defined non-null default values (e.g. false for checkbox columns). [#2409](https://github.com/handsontable/handsontable/issues/2409)
- Fixed one-pixel horizontal alignment for the left pagination caret [#2791](https://github.com/handsontable/handsontable/pull/2791)
- Fixed setDataAtRowProp interrupting edits in progress [#4305](https://github.com/handsontable/handsontable/issues/4305)
- React: Fixed the React wrapper skipping settings updates when `dataSchema` or `columns` contains non-plain objects such as `Date`, `Set`, or `Map`. [#12207](https://github.com/handsontable/handsontable/pull/12207)
- Fixed the loading overlay resetting the grid scroll position to the top when no cell was selected before showing the overlay. [#12514](https://github.com/handsontable/handsontable/issues/12514)
- Fixed a memory leak caused by ThemeManager not unsubscribing from the shared theme object on destroy. [#12570](https://github.com/handsontable/handsontable/issues/12570)
- Fixed viewport scroll jump when Ctrl+clicking a selected cell to deselect it. [#12574](https://github.com/handsontable/handsontable/issues/12574)
- Fixed a memory leak where IntersectionObserver instances were not properly disconnected when `document.body` had zero height. [#12578](https://github.com/handsontable/handsontable/issues/12578)

#### Security
- Patched critical and high dependency vulnerabilities across the monorepo and aligned Angular wrapper tooling for compatibility. [#12237](https://github.com/handsontable/handsontable/issues/12237)

## 17.0.1

Released on March 25th, 2026

For more information about this release, see:

<div class="boxes-list gray">

- [Documentation (17.0)](https://handsontable.com/docs/17.0)

</div>

#### Fixed
- Fix UndoRedo crash when nullified changes [#12000](https://github.com/handsontable/handsontable/pull/12000)
- Fix UndoRedo beforeChange order [#12001](https://github.com/handsontable/handsontable/pull/12001)
- Fixed a bug where the editor does not receive the user inputs [#12042](https://github.com/handsontable/handsontable/pull/12042)
- Fixed scrollbar width calcualtion on Safari >=26. [#12047](https://github.com/handsontable/handsontable/pull/12047)
- Added missing typings for Core [#12048](https://github.com/handsontable/handsontable/pull/12048)
- Fixed rounded corners that may be applied in incorrect use cases [#12052](https://github.com/handsontable/handsontable/pull/12052)
- Fixed undo/redo stack desync with formulas engine [#12056](https://github.com/handsontable/handsontable/pull/12056)
- Fixed column width calculation for collapsed columns [#12059](https://github.com/handsontable/handsontable/pull/12059)
- Fixed and issue with table backround overflow [#12063](https://github.com/handsontable/handsontable/pull/12063)
- Fixed column header misalignment when nestedRow is enabled [#12081](https://github.com/handsontable/handsontable/pull/12081)
- Fixed an issue with mobile select handles styles [#12083](https://github.com/handsontable/handsontable/pull/12083)
- Improved clipboard processing after paste [#12084](https://github.com/handsontable/handsontable/pull/12084)
- Fixed an issue with scrolling issue that occurs when preventOverflow is enabled [#12086](https://github.com/handsontable/handsontable/pull/12086)
- Fixed date picker positioning near viewport edges [#12087](https://github.com/handsontable/handsontable/pull/12087)
- Fixed an issue with main theme hover on menu icon background color [#12159](https://github.com/handsontable/handsontable/pull/12159)

## 17.0.0

Released on March 9th, 2026

For more information about this release, see:

<div class="boxes-list gray">

- [Blog post (17.0.0)](https://handsontable.com/blog/handsontable-17.0.0-multiselect-cell-type-simpler-custom-cells-and-a-new-themes-api)
- [Documentation (17.0)](https://handsontable.com/docs/17.0)
- [Migration guide (16.2 → 17.0)](@/guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0.md)

</div>

#### Added
- **Breaking change**: Added the Theme API. [#11950](https://github.com/handsontable/handsontable/pull/11950)
- Introduced a simple way to define custom editors using the new `BaseEditor.factory` method. [#11899](https://github.com/handsontable/handsontable/pull/11899)
- Implemented a new MultiSelect cell type with a dedicated editor, renderer, and validator. [#11981](https://github.com/handsontable/handsontable/pull/11981)
- Added support for `Intl.NumberFormat` options. [#11997](https://github.com/handsontable/handsontable/pull/11997)
- Added support for `Intl.DateTimeFormat` options. [#11999](https://github.com/handsontable/handsontable/pull/11999)
- Added a copy-as-Markdown button to the documentation pages. [#12009](https://github.com/handsontable/handsontable/pull/12009)
- Added a new `sanitizer` table option. [#12016](https://github.com/handsontable/handsontable/pull/12016)
- React: Introduced a simple way to define custom editors using the new `ComponentEditor`. [#11978](https://github.com/handsontable/handsontable/pull/11978)

#### Changed
- Improved differentiation between Handsontable errors and other errors. [#11780](https://github.com/handsontable/handsontable/pull/11780)
- Reverted the editors' `updateChoicesList` method type change. [#11943](https://github.com/handsontable/handsontable/pull/11943)
- Added a hit area to the fill handle. [#11952](https://github.com/handsontable/handsontable/pull/11952)
- Added a new `parsePastedValue` option to fix issues with pasting object-based values. [#12020](https://github.com/handsontable/handsontable/pull/12020)
- Introduced a new publishing flow for versions 17.0.0 and above. [#12028](https://github.com/handsontable/handsontable/pull/12028)

#### Deprecated
- Deprecated **numbro.js** for numeric formatting. Copy it to your project or replace it with the `Intl.NumberFormat` API. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_3-migrate-from-numbro-format-to-intl-numberformat)
- Deprecated **Pikaday** for date picking. Switch to native date input. [Migration guide](https://handsontable.com/docs/javascript-data-grid/recipes/cell-types/pikaday)
- Deprecated **moment.js** for date parsing and display. Replace it with the `Intl.DateTimeFormat` API. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_4-migrate-from-moment-js-format-to-intl-datetimeformat)
- Deprecated **DOMPurify** as a built-in XSS sanitizer. Use the new `sanitizer` option or convert content to plain text. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_5-migrate-from-built-in-dompurify-to-the-sanitizer-option)
- Deprecated **core-js** polyfills for ECMAScript features. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_6-core-js-dependency-removed)
- Deprecated bundling **HyperFormula** as a Handsontable dependency. Starting from version 18.0, install and import it separately, then pass it to the Formulas plugin with `licenseKey: 'internal-use-in-handsontable'`. [Formula calculation](https://handsontable.com/docs/javascript-data-grid/formula-calculation)

#### Removed
- **Breaking change**: Removed deprecated wrapper packages for Angular, React, and Vue, the `PersistentState` plugin, and the legacy undo/redo methods. [#12015](https://github.com/handsontable/handsontable/pull/12015)
- **Breaking change**: Removed `core-js` from dependencies. [#12017](https://github.com/handsontable/handsontable/pull/12017)
- **Breaking change**: Removed the legacy CSS stylesheets (e.g. `handsontable.full.min.css`), which were the default styling prior to version 16. [#11950](https://github.com/handsontable/handsontable/pull/11950)
- Removed the `languages` folder from git + updated the `17.0+` release workflow. [#12049](https://github.com/handsontable/handsontable/pull/12049)

#### Fixed
- Fixed errors triggered by certain keyboard shortcuts. [#11951](https://github.com/handsontable/handsontable/pull/11951)
- Fixed unwanted layout shifts caused by the editor. [#11955](https://github.com/handsontable/handsontable/pull/11955)
- Fixed an issue with scrolling in Firefox. [#11962](https://github.com/handsontable/handsontable/pull/11962)
- Fixed an issue with viewport scroll after calling `loadData()`/`updateData()`. [#11985](https://github.com/handsontable/handsontable/pull/11985)
- Fixed a bug where the pasted value could not be changed. [#11989](https://github.com/handsontable/handsontable/pull/11989)
- Fixed misalignment issues when using `CSS transform: scale()`. [#11990](https://github.com/handsontable/handsontable/pull/11990)
- Fixed a bug that made it impossible to delete values from key/value-based autocomplete and dropdown cells. [#12010](https://github.com/handsontable/handsontable/pull/12010)
- Fixed a Data Factory issue in filters that could return zero results even when matches exist. [#12031](https://github.com/handsontable/handsontable/pull/12031)
- Changed the element type for focus catchers. [#12032](https://github.com/handsontable/handsontable/pull/12032)
- Fixed incorrect scrollbar width calculation for scaled environments. [#12035](https://github.com/handsontable/handsontable/pull/12035)
- Fixed and issue with column headers styles [#12058](https://github.com/handsontable/handsontable/pull/12058)
- Angular: Fixed a problem with the Angular wrapper that broke builds done with a disabled `skipLibCheck`. [#12091](https://github.com/handsontable/handsontable/pull/12091)

## Related

- [Migrating from 16.2 to 17.0](@/guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0.md)

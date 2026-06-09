---
type: reference
title: Changelog 15.0
metaTitle: Changelog 15.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 15.0 in each minor and patch release.
permalink: /changelog-15
canonicalUrl: /changelog-15
react:
  metaTitle: Changelog 15.0 - React Data Grid | Handsontable
angular:
  metaTitle: Changelog 15.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Changelog 15.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 15.x.

## 15.3.0

Released on April 29, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Blog post (15.3.0)](https://handsontable.com/blog/handsontable-15.3.0-csv-sanitization-accessibility-updates-and-30-fixes)
- [Documentation (15.3)](https://handsontable.com/docs/15.3)

</div>

#### Added
- Added a missing boolean type to the editor in the React wrapper. [#11514](https://github.com/handsontable/handsontable/pull/11514)
- Fixed the Comments plugin for IME editing and added a new `beforeCompositionstart` hook. [#11521](https://github.com/handsontable/handsontable/pull/11521)
- Added horizontal scroll to the Filter's "by value" component. [#11561](https://github.com/handsontable/handsontable/pull/11561)
- Added optional formula sanitization for CSV export to prevent CSV Injection attacks. [#11592](https://github.com/handsontable/handsontable/pull/11592)

#### Changed
- Improved the initialization time of Handsontable with Formulas enabled. [#11474](https://github.com/handsontable/handsontable/pull/11474)
- Changed the size of the Manual Row Resize and Manual Column Resize guide lines. [#11507](https://github.com/handsontable/handsontable/pull/11507)
- Improved the viewport scrolling behavior. [#11577](https://github.com/handsontable/handsontable/pull/11577)

#### Fixed
- Fixed an issue with the NestedRows plugin duplicating rows when moving child rows. [#11362](https://github.com/handsontable/handsontable/pull/11362)
- Fixed an issue with row resize line alignment and resize handle flickering. [#11500](https://github.com/handsontable/handsontable/pull/11500)
- Fixed an issue with the Autocomplete caret position after using scroll on a list of choices and a problem with the dropdown width. [#11503](https://github.com/handsontable/handsontable/pull/11503)
- Fixed the submenu positioning for all themes. [#11505](https://github.com/handsontable/handsontable/pull/11505)
- Fixed a problem where re-enabling the Hidden Columns configuration caused an error to be thrown if a selection was a part of the hidden range. [#11508](https://github.com/handsontable/handsontable/pull/11508)
- Fixed an issue with an empty `parentNode` in the table's `getCords` method. [#11509](https://github.com/handsontable/handsontable/pull/11509)
- Improved the Undo/Redo actions for removing rows and columns. [#11515](https://github.com/handsontable/handsontable/pull/11515)
- Fixed rows' height calculations for merged cells on Safari. [#11517](https://github.com/handsontable/handsontable/pull/11517)
- Fixed the missing (incorrect) render call after dataset change. [#11529](https://github.com/handsontable/handsontable/pull/11529)
- Fixed an issue with the mobile keyboard closing after clicking the filter search input on Android devices.  [#11532](https://github.com/handsontable/handsontable/pull/11532)
- Fixed a problem with multiple row header levels being rendered in reverse order. [#11533](https://github.com/handsontable/handsontable/pull/11533)
- Fixed a `TypeError` error for the `AutoRowSize` plugin. [#11537](https://github.com/handsontable/handsontable/pull/11537)
- Allow changing the selection after a filter was applied. [#11538](https://github.com/handsontable/handsontable/pull/11538)
- Fixed a problem with the Autocomplete editor rendering very slowly when provided with a long list of choices. [#11552](https://github.com/handsontable/handsontable/pull/11552)
- Fixed an issue with the focus catcher accessibility. [#11553](https://github.com/handsontable/handsontable/pull/11553)
- Fixed a `TypeError` error being thrown after removing rows on the bottom overlay. [#11555](https://github.com/handsontable/handsontable/pull/11555)
- Fixed calculating the first row height. [#11557](https://github.com/handsontable/handsontable/pull/11557)
- Fixed an issue with highlighting a cell after calling `updateData`. [#11558](https://github.com/handsontable/handsontable/pull/11558)
- Fixed the "unmerge cells" action triggered form keyboard shortcut. [#11559](https://github.com/handsontable/handsontable/pull/11559)
- Fixed the left/right-arrow shortcuts for menus when the table was configured with `layoutDirection: rtl`. [#11562](https://github.com/handsontable/handsontable/pull/11562)
- Fixed an issue with duplicate boolean values in the filters. [#11563](https://github.com/handsontable/handsontable/pull/11563)
- Fixed an issue with data sources with non-string values under the `name` property. [#11565](https://github.com/handsontable/handsontable/pull/11565)
- Fixed the settings object not being updated after adding new hooks. [#11566](https://github.com/handsontable/handsontable/pull/11566)
- Fixed a problem with the table rendering all rows when it's configured to have `0px` height. [#11567](https://github.com/handsontable/handsontable/pull/11567)
- Fixed the copy/paste/cut functionalities for web components. [#11572](https://github.com/handsontable/handsontable/pull/11572)
- Fixed the `allowInvalid` option (both `true` and `false`) for the Dropdown Editor.  [#11587](https://github.com/handsontable/handsontable/pull/11587)
- Fixed a problem with a deprecation warnings being thrown when using Context Menu's Undo and Redo items. [#11588](https://github.com/handsontable/handsontable/pull/11588)
- Fixed an error being thrown when editing Autocomplete-typed cells with a long list of choices rendered in a small container. [#11589](https://github.com/handsontable/handsontable/pull/11589)
- Ensured that there's a single `@charset` entry in the classic theme's CSS files and that it's placed at the beginning of those files. [#11591](https://github.com/handsontable/handsontable/pull/11591)

## 15.2.0

Released on March 19, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Blog post (15.2.0)](https://handsontable.com/blog/handsontable-15.2.0-stability-improvements)
- [Documentation (15.2)](https://handsontable.com/docs/15.2)

</div>

#### Added
- Added the Farsi translation. [#11388](https://github.com/handsontable/handsontable/pull/11388)
- Added support for class names passed as an array for the numeric cell renderer. [#11420](https://github.com/handsontable/handsontable/pull/11420)
- Updated the Italian translation for the new Context Menu labels. [#11436](https://github.com/handsontable/handsontable/pull/11436)
- Updated the Serbian translation for the new Context Menu labels. [#11437](https://github.com/handsontable/handsontable/pull/11437)
- Added the mobile cell handle CSS variables to the themes. [#11479](https://github.com/handsontable/handsontable/pull/11479)
- Improved the execution flow of the Filters plugin and added two new methods (`importConditions` and `exportConditions`). [#11488](https://github.com/handsontable/handsontable/pull/11488)

#### Changed
- Sped up the rendering performance for themes. [#11443](https://github.com/handsontable/handsontable/pull/11443)
- Improved the table UI behavior after removing all rows and/or columns. [#11477](https://github.com/handsontable/handsontable/pull/11477)
- Reverted the removal of `actionType` class field for UndoRedo actions. [#11495](https://github.com/handsontable/handsontable/pull/11495)

#### Removed
- Removed the broken, unsupported and undocumented `rendererTemplate` Text Renderer option. [#11424](https://github.com/handsontable/handsontable/pull/11424)

#### Fixed
- Fixed the default (fallback) date format for the Date editor. [#11419](https://github.com/handsontable/handsontable/pull/11419)
- Fixed the Context Menu's items' state rendering. [#11422](https://github.com/handsontable/handsontable/pull/11422)
- Corrected the checkbox visibility in the no-theme variant. [#11427](https://github.com/handsontable/handsontable/pull/11427)
- Fixed problems with the cell content reading with `imeFastEdit` enabled. [#11442](https://github.com/handsontable/handsontable/pull/11442)
- Fixed `hasVerticalScroll` and `hasHorizontalScroll` methods. [#11455](https://github.com/handsontable/handsontable/pull/11455)
- Fixed the editor border radius on mobile devices. [#11457](https://github.com/handsontable/handsontable/pull/11457)
- Fixed the wrong height of the first row. [#11458](https://github.com/handsontable/handsontable/pull/11458)
- Fixed the single cell selection inside iframes. [#11460](https://github.com/handsontable/handsontable/pull/11460)
- Fixed an issue with row header misalignment. [#11465](https://github.com/handsontable/handsontable/pull/11465)
- Improved the Autocomplete/Dropdown Editor list behavior. [#11469](https://github.com/handsontable/handsontable/pull/11469)
- Fixed a problem with horizontal scrollbar in the Autocomplete dropdown. [#11473](https://github.com/handsontable/handsontable/pull/11473)
- Fixed the merged cells height for custom row heights. [#11478](https://github.com/handsontable/handsontable/pull/11478)
- Fixed a problem with the Comments editor not flipping direction when overlapping the window's scrollbars. [#11481](https://github.com/handsontable/handsontable/pull/11481)
- Fixed a problem with the focus trap during `Shift` + `Tab` navigation. [#11483](https://github.com/handsontable/handsontable/pull/11483)
- Fixed an issue with the Context Menu opening on Classic theme. [#11486](https://github.com/handsontable/handsontable/pull/11486)
- Fixed a problem with `rowHeights` when the provided value was lower than the default/minimal row height. [#11487](https://github.com/handsontable/handsontable/pull/11487)
- Fixed an issue with the data source modification for row values passed as strings. [#11491](https://github.com/handsontable/handsontable/pull/11491)
- Fixed the conflicts between ColumnSorting and MultiColumnSorting plugins. [#11492](https://github.com/handsontable/handsontable/pull/11492)
- Fixed copy, cut an paste actions on tables with a selection reaching outside of the rendered viewport. [#11504](https://github.com/handsontable/handsontable/pull/11504)

## 15.1.0

Released on February 20, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Blog post (15.1.0)](https://handsontable.com/blog/handsontable-15.1.0-performance-and-stability-improvements)
- [Documentation (15.1)](https://handsontable.com/docs/15.1)

</div>

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

<div class="boxes-list gray">

- [Blog post (15.0.0)](https://handsontable.com/blog/handsontable-15.0.0-introducing-themes-and-functional-react-wrapper)
- [Documentation (15.0)](https://handsontable.com/docs/15.0)
- [Migration guide (14.6 → 15.0)](@/guides/upgrade-and-migration/migrating-from-14.6-to-15.0/migrating-from-14.6-to-15.0.md)

</div>

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

## Related

- [Migrating from 14.6 to 15.0](@/guides/upgrade-and-migration/migrating-from-14.6-to-15.0/migrating-from-14.6-to-15.0.md)

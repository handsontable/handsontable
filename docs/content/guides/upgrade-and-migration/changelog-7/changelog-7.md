---
type: reference
id: 5t9ao5jq
title: Older versions
metaTitle: Older versions - JavaScript Data Grid | Handsontable
description: See the full history of changes made to older versions of Handsontable.
permalink: /changelog-older
canonicalUrl: /changelog-older
react:
  id: dhzkd73r
  metaTitle: Older versions - React Data Grid | Handsontable
angular:
  id: fqniwvjh
  metaTitle: Older versions - Angular Data Grid | Handsontable
vue:
  id: v80zhxm8
  metaTitle: Older versions - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 7.x.

## 7.4.2

Released on February 19, 2020.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-7-4-2-released)
- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.4.2)

</div>

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


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-7-4-0-released)
- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.4.0)

</div>

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

## 7.3.0

Released on December 12, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.3.0)

</div>

#### New features

- Added a new `uiContainer` option to the Context Menu plugin. It lets you declare a DOM container for all Context Menu elements - useful when using Handsontable inside an `iframe` or another content-trimming context. ([#6283](https://github.com/handsontable/handsontable/issues/6283), [#6417](https://github.com/handsontable/handsontable/issues/6417))
- Added a `uiContainer` option to the Copy/Paste plugin. ([#6343](https://github.com/handsontable/handsontable/issues/6343))

#### Changes

- Fixed a problem with table resizing on every scroll event on Firefox when no table height was defined. ([#6344](https://github.com/handsontable/handsontable/issues/6344))
- Updated the `puppeteer` package in `devDependencies` to address an `npm audit` security error. ([#6393](https://github.com/handsontable/handsontable/issues/6393))
- Removed the unneeded `CNAME_` file from the repo. ([#6389](https://github.com/handsontable/handsontable/issues/6389))
- Fixed a problem where pasting data from Excel caused Handsontable to throw an error. ([#6217](https://github.com/handsontable/handsontable/issues/6217))
- Fixed a bug where data pasted from Excel got improperly formatted in Handsontable. ([#6258](https://github.com/handsontable/handsontable/issues/6258))
- Fixed a bug where the `&`, `<`, `>`, `'`, `"` characters in the pasted data were automatically changed to their equivalent HTML entities. ([#1535](https://github.com/handsontable/handsontable/issues/1535))
- Fixed a bug where opening the system's context menu, hitting Escape and moving the cursor outside the container scrolled the table. ([#5846](https://github.com/handsontable/handsontable/issues/5846))
- Fixed a problem where right-clicking on a disabled entry in Handsontable's context menu opened the system's context menu.
- Fixed a bug where right-clicking on an active entry in Handsontable's context menu opened another context menu.
- Fixed a test case for Context Menu's scrolling. ([#6449](https://github.com/handsontable/handsontable/issues/6449))
- Modified the container size in the tests' DOM helper file. ([#6446](https://github.com/handsontable/handsontable/issues/6446))

## 7.2.2

Released on October 23, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.2.2)

</div>

#### Changes

- Rolled back backward-incompatible changes in the TypeScript definition file introduced in `7.2.0`. ([#6351](https://github.com/handsontable/handsontable/issues/6351))
- Fixed a problem where `Handsontable.helper.htmlToGridSettings` threw an error on IE11 when the target table was part of an `iframe`. ([#6350](https://github.com/handsontable/handsontable/issues/6350))

## 7.2.1

Released on October 16, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.2.1)

</div>

#### Changes

- Fixed a problem caused by [#6269](https://github.com/handsontable/handsontable/issues/6269) which made the move/resize handles hidden under the headers. ([#6341](https://github.com/handsontable/handsontable/issues/6341))

## 7.2.0

Released on October 15, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.2.0)

</div>

#### Changes

- Added `cellProperties` to the arguments of search's `queryMethod` so it is possible to identify what kind of data is being queried. ([#4944](https://github.com/handsontable/handsontable/issues/4944))
- Fixed a bug with a disappearing column header when the `height` option was set to `auto`. ([#6302](https://github.com/handsontable/handsontable/issues/6302))
- Fixed a problem with an error thrown when clearing a column with the first cell set to `readOnly`. ([#6246](https://github.com/handsontable/handsontable/issues/6246))
- Fixed a bug where it was impossible to set data for a `readOnly`-typed cell when any cell was selected. ([#6214](https://github.com/handsontable/handsontable/issues/6214))
- Fixed a problem with an error thrown when pasting data to `readOnly`-typed cells. ([#6209](https://github.com/handsontable/handsontable/issues/6209))
- Fixed a problem with the `Undo` feature not working for columns defined as functions. ([#6147](https://github.com/handsontable/handsontable/issues/6147))
- Fixed a bug where `this.TD` was `undefined` in the editor's `prepare` method when `fixedColumnsLeft` and `viewportColumnRenderingOffset` were both set. ([#6043](https://github.com/handsontable/handsontable/issues/6043))
- Fixed a bug where the cell selection frame overlapped the bottom fixed rows. ([#5947](https://github.com/handsontable/handsontable/issues/5947))
- Fixed a problem with an error thrown after initializing an empty table or removing all data from the table and clicking the corner header. ([#5126](https://github.com/handsontable/handsontable/issues/5126))
- Fixed a problem with reloading data with a new set in the Nested Rows plugin. ([#6339](https://github.com/handsontable/handsontable/issues/6339))
- Rewrote some of the Walkontable methods to return correct information about the table. ([#6191](https://github.com/handsontable/handsontable/issues/6191))
- Made improvements to the TypeScript definition file. ([#6168](https://github.com/handsontable/handsontable/issues/6168), [#6107](https://github.com/handsontable/handsontable/issues/6107), [#6102](https://github.com/handsontable/handsontable/issues/6102), [#6239](https://github.com/handsontable/handsontable/issues/6239), [#6266](https://github.com/handsontable/handsontable/issues/6266))
- Improved the documentation and definition files for the `after-` hooks for creating and removing rows/columns. ([#6296](https://github.com/handsontable/handsontable/issues/6296))
- Improved the documentation for the `totalColumn` option. ([#6281](https://github.com/handsontable/handsontable/issues/6281))
- Added a `lint:fix` script to fix lint errors from the CLI. ([#6260](https://github.com/handsontable/handsontable/issues/6260))
- Fixed all tests for Windows and added the `walkontable.watch` run script. ([#6187](https://github.com/handsontable/handsontable/issues/6187))
- Removed the unused `check-es3-syntax-cli` package to fix a GitHub security alert. ([#6319](https://github.com/handsontable/handsontable/issues/6319))
- Updated dependencies to fix errors thrown by `npm audit`. ([#6318](https://github.com/handsontable/handsontable/issues/6318))

## 7.1.1

Released on August 12, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.1.1)

</div>

#### Changes

- Refactored the Walkontable table renderers. ([#6089](https://github.com/handsontable/handsontable/issues/6089))
- Changed the underlying format for empty cells. From now on, all empty cells are stored internally as `null`. The only exceptions are empty cells that have been edited and saved as an empty string, and empty cells that have been copied and pasted - in both of these cases they are stored as an empty string (`''`). ([#4106](https://github.com/handsontable/handsontable/issues/4106))
- Removed the `yarn.lock` file from the repository and updated the Node version in the Travis configuration file. ([#6161](https://github.com/handsontable/handsontable/issues/6161))
- Added a missing `rootInstanceSymbol` property to Handsontable to allow using `new Handsontable.Core` properly. ([#6040](https://github.com/handsontable/handsontable/issues/6040))
- Fixed a bug where copying, pasting or deleting data for `autocomplete`-typed cells caused an error to be thrown. ([#6033](https://github.com/handsontable/handsontable/issues/6033))
- Refactored the Custom Borders plugin to resolve performance problems. ([#6052](https://github.com/handsontable/handsontable/issues/6052))
- Optimized the use of arrays for the V8 engine in the `parseTable` module. ([#6060](https://github.com/handsontable/handsontable/issues/6060))
- Fixed a problem where scrolling the dropdown menu scrolled the entire table. ([#5913](https://github.com/handsontable/handsontable/issues/5913))
- Fixed a bug where removing a change in the `beforeChange` hook callback broke the table. ([#5893](https://github.com/handsontable/handsontable/issues/5893))
- Fixed a problem where cutting the value from a `checkbox`-typed cell made it switch to `#bad-value#`.
- Fixed a bug where the `getCell` method returned `undefined` when it was not supposed to. ([#6079](https://github.com/handsontable/handsontable/issues/6079))
- Updated Jasmine and made changes to the tests and tests configuration so they pass in the browser and prevent memory leaks. ([#6077](https://github.com/handsontable/handsontable/issues/6077), [#6096](https://github.com/handsontable/handsontable/issues/6096))
- Changed the way the `afterColumnMove` hook works - it does not fire if the `beforeColumnMove` hook callback canceled the action. ([#5958](https://github.com/handsontable/handsontable/issues/5958))
- Fixed a problem with the `Undo` feature reverting editing actions that did not make any changes to the data. ([#4072](https://github.com/handsontable/handsontable/issues/4072))
- Fixed a bug where the dropdown editor did not work properly when there were multiple Handsontable instances implemented on the page. ([#6122](https://github.com/handsontable/handsontable/issues/6122))
- Fixed the tests for Windows. ([#5878](https://github.com/handsontable/handsontable/issues/5878))
- Fixed the npm audit security errors. ([#6130](https://github.com/handsontable/handsontable/issues/6130))
- Fixed a problem with scrolling not working properly when hovering over the Handsontable container. ([#5212](https://github.com/handsontable/handsontable/issues/5212))
- Refactored the `toMatchHTML` Jasmine matcher to make tests pass on Firefox. ([#6148](https://github.com/handsontable/handsontable/issues/6148))
- Fixed the `getCell` method for fixed bottom rows, which caused the selection not to work properly. ([#6084](https://github.com/handsontable/handsontable/issues/6084))
- Fixed a bug where the table height increased every time the window had been resized. ([#3433](https://github.com/handsontable/handsontable/issues/3433))
- Corrected minor mistakes in the JSDocs and TypeScript definitions. ([#6123](https://github.com/handsontable/handsontable/issues/6123), [#6125](https://github.com/handsontable/handsontable/issues/6125), [#6142](https://github.com/handsontable/handsontable/issues/6142), [#6152](https://github.com/handsontable/handsontable/issues/6152), [#6158](https://github.com/handsontable/handsontable/issues/6158), [#6160](https://github.com/handsontable/handsontable/issues/6160), [#6129](https://github.com/handsontable/handsontable/issues/6129))

## 7.1.0

Released on June 11, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.1.0)

</div>

#### New features

- Added a feature that allows parsing HTML tables into Handsontable settings and Handsontable instances into plain HTML tables. New API methods: `Handsontable.helper.instanceToHTML`, `Handsontable.helper.htmlToGridSettings`, `hotInstance.toTableElement`, and `hotInstance.toHTML`. ([#5684](https://github.com/handsontable/handsontable/issues/5684))

#### Changes

- Fixed a bug where it was not possible to block `Undo/Redo` plugin keyboard shortcuts. ([#6028](https://github.com/handsontable/handsontable/issues/6028))
- Corrected the `ManualColumnMove` type definitions. ([#6011](https://github.com/handsontable/handsontable/issues/6011))
- Fixed a problem with pasting multi-line data from Excel and Google Sheets. ([#5970](https://github.com/handsontable/handsontable/issues/5970), [#5622](https://github.com/handsontable/handsontable/issues/5622))
- Fixed a bug where it was impossible to paste merged cells from Excel. ([#5940](https://github.com/handsontable/handsontable/issues/5940))
- Fixed a problem with copying cells with longer contents from Excel or Google Sheets. ([#5925](https://github.com/handsontable/handsontable/issues/5925))
- Fixed a problem with Handsontable not adding the carriage return character to the pasted data. ([#5826](https://github.com/handsontable/handsontable/issues/5826), [#5647](https://github.com/handsontable/handsontable/issues/5647))
- Fixed some `NestedRows` performance issues on large datasets. ([#5711](https://github.com/handsontable/handsontable/issues/5711))
- Fixed a bug where placing SVG in a cell caused a `ManualColumnMove` error. ([#4120](https://github.com/handsontable/handsontable/issues/4120))
- Fixed a bug where using the `Undo` functionality the selection was not reverted to its original position. ([#6017](https://github.com/handsontable/handsontable/issues/6017))
- Fixed a bug where the `getCell` method, when used with the `topmost` argument set to `true`, did not return the correct cell elements from the bottom overlay. ([#5896](https://github.com/handsontable/handsontable/issues/5896))
- Added the possibility to return `false` from the `beforeCreateCol` hook to stop column creation. ([#5691](https://github.com/handsontable/handsontable/issues/5691))

## 7.0.3

Released on May 13, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.0.3)

</div>

#### Changes

- Fixed the `skipRowOnPaste` option to work similarly to `skipColumnOnPaste` and added it to the documentation. ([#5845](https://github.com/handsontable/handsontable/issues/5845))
- Fixed the font inconsistency in the dropdown menu. ([#5948](https://github.com/handsontable/handsontable/issues/5948))
- Fixed a problem with the `manualColumnResize` option not working properly alongside `fixedColumnsLeft`. ([#5959](https://github.com/handsontable/handsontable/issues/5959))
- Fixed a problem with the `TextEditor` not resizing the input field properly when placed on the edge of the table and containing multi-line text. ([#5969](https://github.com/handsontable/handsontable/issues/5969))
- Updated some dependencies to remove security vulnerabilities reported by `npm audit`. ([#5995](https://github.com/handsontable/handsontable/issues/5995))
- Removed `eval()` from the `formula-parser` module to fulfill the Content-Security-Policy. ([#5990](https://github.com/handsontable/handsontable/issues/5990))

## 7.0.2

Released on April 9, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.0.2)

</div>

#### Changes

- Fixed a bug from `7.0.1` which made scrolling on overlays (fixed rows/columns, headers) work improperly. ([#5938](https://github.com/handsontable/handsontable/issues/5938))

## 7.0.1

Released on April 8, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.0.1)

</div>

#### Changes

- Fixed the `LICENSE.txt` file link in `README.md`. ([#5914](https://github.com/handsontable/handsontable/issues/5914))
- Replaced `fixed` positioning of the row/column resize handles with `absolute` to prevent misalignment issues in implementations based on CSS `transform`. ([#5050](https://github.com/handsontable/handsontable/issues/5050))
- Updated `webpack` to version 4. ([#5912](https://github.com/handsontable/handsontable/issues/5912))
- Fixed a problem with Handsontable throwing errors on scroll by adding support for `EventListenerOption` in the `EventManager`. ([#5904](https://github.com/handsontable/handsontable/issues/5904), [#4526](https://github.com/handsontable/handsontable/issues/4526))
- Added `core-js` to Handsontable's dependencies. ([#5888](https://github.com/handsontable/handsontable/issues/5888))
- Added a `ghost-table` attribute to all cell elements generated with Ghost Table. ([#5927](https://github.com/handsontable/handsontable/issues/5927))
- Fixed a bug where the editor was visible despite not being open when the table was positioned using CSS `transform`. ([#5886](https://github.com/handsontable/handsontable/issues/5886))
- Fixed a bug where the table scrolled up after clicking a cell when Handsontable was implemented inside an `iframe`. ([#5910](https://github.com/handsontable/handsontable/issues/5910))

## 7.0.0

Released on March 6, 2019.

For more information on this release, see:

<div class="boxes-list gray">

- [GitHub release tag](https://github.com/handsontable/handsontable/releases/tag/7.0.0)

</div>

#### Breaking changes

- Starting with version 7.0.0, there is only one Handsontable, as Handsontable Pro has been merged with Handsontable Community Edition.
- Handsontable is now source-available instead of open source. The MIT license has been replaced with a custom, free for non-commercial license.
- Added the `beforeTrimRows` and `beforeUntrimRows` hooks and modified the argument list for the existing ones in the Trim Rows plugin. ([#5662](https://github.com/handsontable/handsontable/issues/5662))
- Removed the deprecated `selectCellByProp` method. ([#5174](https://github.com/handsontable/handsontable/issues/5174))
- Added hooks for the Hidden Rows and Hidden Columns plugins and added validation of the provided rows. Before this change, passing an invalid set of indexes (for example, `[-1, 0, 1]`) still hid the valid elements from the set. After this change, an invalid set of indexes passed to the plugin results in the termination of the performed action. ([#5651](https://github.com/handsontable/handsontable/issues/5651), [#5522](https://github.com/handsontable/handsontable/issues/5522))
- Removed Bower support. To install Handsontable, use npm or CDN instead.

#### Changes

- Refactored the following classes to ES6: `BaseEditor`, `AutocompleteEditor`, `HandsontableEditor`, `SelectEditor`, `TextEditor`, `Walkontable Event`, `EditorManager`, `MultiMap` (removed), `TableView`, `DataMap`. ([#5403](https://github.com/handsontable/handsontable/issues/5403))
- Fixed a problem where inserting a new row did not update the Trim Rows plugin properly. ([#5761](https://github.com/handsontable/handsontable/issues/5761))
- Fixed a problem where removing a row did not update the Trim Rows plugin properly. ([#5738](https://github.com/handsontable/handsontable/issues/5738))
- Added the possibility to declare the table's width and height using relative values (`%`, `vh`, `vw`, `rem`, `em`). ([#5749](https://github.com/handsontable/handsontable/issues/5749))
- Added support for creating a Handsontable instance inside an `iframe` when the instance is initialized outside of it. ([#5686](https://github.com/handsontable/handsontable/issues/5686), [#5744](https://github.com/handsontable/handsontable/issues/5744))
- Extended the Hidden Rows plugin's hooks argument list. ([#5671](https://github.com/handsontable/handsontable/issues/5671))
- Updated the `hot-formula-parser` package in `package.json`. ([#5665](https://github.com/handsontable/handsontable/issues/5665))
- Fixed a bug where the `getCell` method returned `undefined` in some specific cases. ([#5608](https://github.com/handsontable/handsontable/issues/5608))
- Fixed a bug where an asynchronous validator threw an exception when run after the table had been destroyed. ([#5567](https://github.com/handsontable/handsontable/issues/5567))
- Fixed a bug where an input defined in the headers lost focus right after clicking on it. ([#5541](https://github.com/handsontable/handsontable/issues/5541))
- Fixed a bug where using `preventOverflow` caused the editor offset to be incorrect when scrolling vertically. ([#5453](https://github.com/handsontable/handsontable/issues/5453))
- Fixed a bug where selecting a mixed merged/non-merged section caused improper results. ([#4912](https://github.com/handsontable/handsontable/issues/4912))
- Fixed a problem where the `Handsontable` class export differed between UMD and other environments. ([#4605](https://github.com/handsontable/handsontable/issues/4605))
- Fixed a bug where disabling `colHeaders` using `updateSettings` did not work properly. ([#4136](https://github.com/handsontable/handsontable/issues/4136))
- Fixed a bug where the changes cancelled using the `beforeChange` hook were still validated. ([#3381](https://github.com/handsontable/handsontable/issues/3381))
- Updated the documentation for the `setSortConfig` method of the Column Sorting plugin.
- Fixed a problem where passing an `Array` as a cell value caused the `populateFromArray` method to fail. ([#5675](https://github.com/handsontable/handsontable/issues/5675))
- Rewrote the TypeScript definition file so it matches the actual structure of the library more precisely. ([#5767](https://github.com/handsontable/handsontable/issues/5767))
- Fixed a problem where resizing the table did not trigger the rendering process. ([#5730](https://github.com/handsontable/handsontable/issues/5730), [#2766](https://github.com/handsontable/handsontable/issues/2766))
- Fixed a memory leak in the Context Menu plugin. ([#5759](https://github.com/handsontable/handsontable/issues/5759))
- Fixed a problem where it was impossible to add cell comments due to the editor closing too early. ([#5614](https://github.com/handsontable/handsontable/issues/5614))
- Fixed a bug where the Trim Rows plugin passed an unwanted value from the `beforeCreateRow` hook callback. ([#5585](https://github.com/handsontable/handsontable/issues/5585))
- Fixed a problem with the context menu displaying an empty box when no available menu items were provided. ([#3865](https://github.com/handsontable/handsontable/issues/3865))

## Older versions

The changelogs from older versions of Handsontable are
[available on GitHub](https://github.com/handsontable/handsontable/releases).

## Related

- [Migrating from 7.4 to 8.0](@/guides/upgrade-and-migration/migrating-from-7.4-to-8.0/migrating-from-7.4-to-8.0.md)

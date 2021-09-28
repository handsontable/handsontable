# Handsontable changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- This file should generally be updated automatically using our changelog script. See `.changelogs/README.md` for more information. -->

<!-- UNVERSIONED -->

## [10.0.0] - 2021-09-29

### Changed
- Unified the naming and description of the fourth argument, `controller`, for selection manipulation in the `beforeOnCellMouseDown` and `beforeOnCellMouseOver` hooks. [#4996](https://github.com/handsontable/handsontable/issues/4996) (**Breaking change**)
- Changed what the `beforeRender` and `afterRender` hooks are, and when they are triggered. Added two new hooks: `beforeViewRender` and `afterViewRender`. [#6303](https://github.com/handsontable/handsontable/issues/6303) (**Breaking change**)
- Changed the optional HyperFormula dependency from 0.6.2 to ^1.1.0, which introduces breaking changes for the `Formulas` plugin users. [#8502](https://github.com/handsontable/handsontable/issues/8502) (**Breaking change**)
- Changed the default values for the `rowsLimit` and `columnsLimit` options of the `CopyPaste` plugin. [#8660](https://github.com/handsontable/handsontable/issues/8660) (**Breaking change**)
- Added a default font family, size, weight and color. [#8661](https://github.com/handsontable/handsontable/issues/8661) (**Breaking change**)
- Changed the `autoWrapRow` and `autoWrapCol` options\` default values from `true` to `false`. [#8662](https://github.com/handsontable/handsontable/issues/8662) (**Breaking change**)
- Improved the performance of the `getCellMeta()` method. [#6303](https://github.com/handsontable/handsontable/issues/6303)
- Improved the documentation and TypeScript definition of the `selectOptions` option. [#8488](https://github.com/handsontable/handsontable/issues/8488)
- Improved the arguments forwarding in the hooks [#8668](https://github.com/handsontable/handsontable/issues/8668)
- Added a Github Actions workflow covering the testing of Handsontable and all of the wrappers. [#8652](https://github.com/handsontable/handsontable/issues/8652)

### Fixed
- Fixed an issue of not resetting the date picker's configuration. [#6636](https://github.com/handsontable/handsontable/issues/6636)
- An error won't be thrown while inserting a new row for nested rows in a specific case. [#7137](https://github.com/handsontable/handsontable/issues/7137)
- Fixed a few problems with the `NestedRows` plugin, occurring with the `Formulas` plugin enabled. [#8048](https://github.com/handsontable/handsontable/issues/8048)
- Fixed errors being thrown in the `Formulas` plugin if a provided sheet name contained a dash character. [#8057](https://github.com/handsontable/handsontable/issues/8057)
- Fixed multiple bugs related to undo/redo actions while using the `Formulas` plugin. [#8078](https://github.com/handsontable/handsontable/issues/8078)
- Fixed an issue where autofill was not able to be blocked/changed with the `beforeChange` hook when the `Formulas` plugin was enabled [#8107](https://github.com/handsontable/handsontable/issues/8107)
- Data stored by the `NestedRows` plugin won't be corrupted by some actions. [#8180](https://github.com/handsontable/handsontable/issues/8180)
- Collapsed parents won't be expanded after inserting rows. [#8181](https://github.com/handsontable/handsontable/issues/8181)
- Fixed the cooperation of the dropdown menu and column sorting (menu closing on click). [#8232](https://github.com/handsontable/handsontable/issues/8232)
- Data won't be corrupted anymore when some alterations are performed. [#8614](https://github.com/handsontable/handsontable/issues/8614)
- Adjusted directories and files related to `dataMap`, to prevent potential circular references. [#8704](https://github.com/handsontable/handsontable/issues/8704)
- Improved the performance of the regular expression used to detect numeric values, and fixed major code smells. [#8752](https://github.com/handsontable/handsontable/issues/8752)

## [9.0.2] - 2021-07-28

### Fixed
- Fixed an issue with an error being thrown when lazy loading columns on a setup with Nested Headers + Hidden Columns. [#7160](https://github.com/handsontable/handsontable/issues/7160)
- Fixed column header sizes not being updated on `updateSettings` calls containing `columns`. [#7689](https://github.com/handsontable/handsontable/issues/7689)
- Fixed functional keys' behavior, to prevent unexpected editing. [#7838](https://github.com/handsontable/handsontable/issues/7838)
- Fixed missing collapsible indicator on IE. [#8028](https://github.com/handsontable/handsontable/issues/8028)
- Fixed support for row and column headers in the `parseTable` utility. [#8041](https://github.com/handsontable/handsontable/issues/8041)
- Fixed a bug where not providing a data object with the `nestedRows` plugin enabled crashed the table. [#8171](https://github.com/handsontable/handsontable/issues/8171)
- *Vue:* Fixed an issue where adding rows to a Handsontable instance wrapped for Vue resulted in additional rows being inserted at the end of the table. [#8148](https://github.com/handsontable/handsontable/issues/8148)
- *Vue:* Fixed a problem in the Vue wrapper, where destroying the underlying Handsontable instance caused it to throw errors and crash. [#8311](https://github.com/handsontable/handsontable/issues/8311)
- *React:* Fixed a problem in the React wrapper, where destroying the underlying Handsontable instance caused it to throw errors and crash. [#8311](https://github.com/handsontable/handsontable/issues/8311)
- *Angular:* Fixed a problem in the Angular wrapper, where destroying the underlying Handsontable instance caused it to throw errors and crash. [#8311](https://github.com/handsontable/handsontable/issues/8311)

### Added
- Added new documentation engine [#7624](https://github.com/handsontable/handsontable/issues/7624)

## [9.0.1] - 2021-06-17

### Fixed
- Fixed an issue where the validator function was called twice when the Formulas plugin was enabled. [#8138](https://github.com/handsontable/handsontable/issues/8138)
- Introduced a new CSS style for cells of the `checkbox` type to restore previous behaviour. [#8196](https://github.com/handsontable/handsontable/issues/8196)

### Removed
- Removed the redundant internal `jsonpatch` library from the source code. [#8140](https://github.com/handsontable/handsontable/issues/8140)

## [9.0.0] - 2021-06-01

### Changed
- **Breaking change** New Formulas plugin, with an entirely different API. See the migration guide for a full list of changes. Removed the required `hot-formula-parser` dependency for the sake of an optional one, `hyperformula`. [#6466](https://github.com/handsontable/handsontable/issues/6466)
- **Breaking change** Changed the `afterAutofill` and `beforeAutofill` hooks' signatures. [#7987](https://github.com/handsontable/handsontable/issues/7987)
- Upgraded `eslint` and eslint-related modules. [#7531](https://github.com/handsontable/handsontable/issues/7531)
- Added `fit` & `fdescribe` to restricted globals in test files. [#8088](https://github.com/handsontable/handsontable/issues/8088)

### Fixed
- Fixed a problem with the column indicator of the Collapsible Columns plugin not being displayed properly on styled headers. [#7970](https://github.com/handsontable/handsontable/issues/7970)
- Fixed a problem with duplicated `afterCreateCol` hooks being triggered after undoing a removal of a column. [#8076](https://github.com/handsontable/handsontable/issues/8076)

### Removed
- **Breaking change** Removed the deprecated plugins - Header Tooltips and Observe Changes. [#8083](https://github.com/handsontable/handsontable/issues/8083)

### Deprecated
- Deprecated the `beforeAutofillInsidePopulate` hook. It will be removed in the next major release. [#8095](https://github.com/handsontable/handsontable/issues/8095)

## [8.4.0] - 2021-05-11

### Added
- Introduced a `separated` attribute for the label options (the `label` DOM element may wrap `input` or be placed next to it). [#3172](https://github.com/handsontable/handsontable/issues/3172)
- Introduced the `modifyAutoColumnSizeSeed` hook to let developers overwrite the default behaviour of the AutoColumnSize sampling. [#3339](https://github.com/handsontable/handsontable/issues/3339)
- Added support for hiding columns for the _NestedHeaders_ plugin. [#6879](https://github.com/handsontable/handsontable/issues/6879)
- Added ability to skip stacking actions by the `UndoRedo` plugin and introduced new hooks. [#6948](https://github.com/handsontable/handsontable/issues/6948)

### Fixed
- Fixed a problem with sorting the `checkbox`-typed cells and an issue with empty cells not being displayed properly. [#4047](https://github.com/handsontable/handsontable/issues/4047)
- Fixed a problem where undoing the removal of row with `readOnly` cells was not performed properly. [#4754](https://github.com/handsontable/handsontable/issues/4754)
- Fixed state-change resolving for externally added checkboxes. [#5934](https://github.com/handsontable/handsontable/issues/5934)
- Fixed a problem with the native selection being removed with the `fragmentSelection` option enabled. [#6083](https://github.com/handsontable/handsontable/issues/6083)
- Fixed a bug where number of columns rendered in the viewport was not correct. [#6115](https://github.com/handsontable/handsontable/issues/6115)
- Fixed a bug with the Dropdown Menu not opening on Android devices. [#6212](https://github.com/handsontable/handsontable/issues/6212)
- Fixed the double-tap issue on iOS. [#6961](https://github.com/handsontable/handsontable/issues/6961)
- Fixed a problem with the Comments editor being destroyed after destroying another Handsontable instance. [#7091](https://github.com/handsontable/handsontable/issues/7091)
- Fixed incorrect `numericFormat`'s type definition. [#7420](https://github.com/handsontable/handsontable/issues/7420)
- Fixed the `trimWhitespace` tests on Firefox. [#7593](https://github.com/handsontable/handsontable/issues/7593)
- Fixed the [NPM Audit] Github Action job to report found vulnerabilities. [#7621](https://github.com/handsontable/handsontable/issues/7621)
- Fixed some minor iOS problems. [#7659](https://github.com/handsontable/handsontable/issues/7659)
- Fixed the TypeScript definition for the suspended rendering feature. [#7666](https://github.com/handsontable/handsontable/issues/7666)
- Fixed the `postbuild` and `examples:install` scripts on Windows. [#7680](https://github.com/handsontable/handsontable/issues/7680)
- Fixed the contents of the production `package.json`. [#7723](https://github.com/handsontable/handsontable/issues/7723)
- Fixed an issue, where the callbacks for the UndoRedo plugin were called twice. [#7825](https://github.com/handsontable/handsontable/issues/7825)
- *Vue:* Fixed a problem with displaying and removing rows in the Nested Rows plugin. [#7548](https://github.com/handsontable/handsontable/issues/7548)
- *React:* Fixed an incompatibility in the property type definitions for the HotColumn component. [#7612](https://github.com/handsontable/handsontable/issues/7612)

### Changed
- Enhanced the ESLint config file by adding a rule that checks if there are new lines missing before some keywords or statements. [#7691](https://github.com/handsontable/handsontable/issues/7691)

## [8.3.2] - 2021-03-16

### Fixed
- Fixed a bug where it was impossible to enable `disableVisualSelection` for cells/columns. [#5082](https://github.com/handsontable/handsontable/issues/5082)
- Fixed wrong paddings for multi-level headers. [#5086](https://github.com/handsontable/handsontable/issues/5086)
- Fixed problems with the `current` option of the `disableVisualSelection` setting. [#5869](https://github.com/handsontable/handsontable/issues/5869)
- Fixed problems with the `header` option of the `disableVisualSelection` setting. [#6025](https://github.com/handsontable/handsontable/issues/6025)
- Fixed a bug where the "double-tap-to-zoom" gesture prevented the editor from opening properly on some mobile devices. [#7142](https://github.com/handsontable/handsontable/issues/7142)
- Fixed a bug where calling the `updateSettings` method in the body of some callbacks would break the table. [#7231](https://github.com/handsontable/handsontable/issues/7231)
- Fixed an issue where the `maxRows` and `maxCols` options interfered with hidden index calculations. [#7350](https://github.com/handsontable/handsontable/issues/7350)
- Fixed problems with doubled borders being displayed when `window` was a scrollable container. [#7356](https://github.com/handsontable/handsontable/issues/7356)
- Fixed a bug where value population from an edited cell would result in a console error. [#7382](https://github.com/handsontable/handsontable/issues/7382)
- Fixed a bug where the dropdown cell type would not work on Safari 14+. [#7413](https://github.com/handsontable/handsontable/issues/7413)
- Fixed a bug where the `AutoRowSize` plugin would break the table when placed in an iframe. [#7424](https://github.com/handsontable/handsontable/issues/7424)
- Fixed bugs in navigation by `HOME` and `END` keys with hidden rows/columns enabled. [#7454](https://github.com/handsontable/handsontable/issues/7454)
- Fixed a bug with the `trimWhitespace` option not working properly. [#7458](https://github.com/handsontable/handsontable/issues/7458)
- Fixed an issue with inconsistent documentation and TypeScript definitions for `colWidths` and `rowHeights` options. [#7507](https://github.com/handsontable/handsontable/issues/7507)
- Fixed the incorrect `cellTypes` module paths in the `exports` entry of the `package.json` file. [#7597](https://github.com/handsontable/handsontable/issues/7597)
- *Vue:* Fixed Remote Code Execution vulnerability in the dev dependencies. [#7620](https://github.com/handsontable/handsontable/issues/7620)

### Added
- Introduced the monorepo to this repository. From now on, `handsontable`, `@handsontable/angular`, `@handsontable/react`, and `@handsontable/vue` will all be developed in the same repo - `handsontable`. [#7380](https://github.com/handsontable/handsontable/issues/7380)
- Added a custom ESLint rule which allows restricting specified modules from loading by `import` or re-exporting. [#7473](https://github.com/handsontable/handsontable/issues/7473)

## [8.3.1] - 2021-02-10

### Fixed
- Fixed an issue where the CSS files could be eliminated during tree-shaking [#7516](https://github.com/handsontable/handsontable/issues/7516)

## [8.3.0] - 2021-01-28

### Added
- Introduced a new feature that allows postponing the table render and internal data cache update. The table rendering time can be reduced several-fold times by batching (using the `batch` method), multi-line API calls, or manually suspending rendering using the `suspendRender` and `resumeRender` methods. [#7274](https://github.com/handsontable/handsontable/issues/7274)
- Introduced a possibility to import:
  - plugins
  - cell types
  - editors
  - renderers
  - validators

  as separate modules, along with the Handsontable _base_. This change allows utilizing only the parts of Handsontable the end application is actually using, without the overhead of the full bundle. [#7403](https://github.com/handsontable/handsontable/issues/7403)
- Added a new workflow for managing and generating changelogs. [#7405](https://github.com/handsontable/handsontable/issues/7405)

### Fixed
- Fixed a bug with auto-execution of the first item in the ContextMenu plugin. [#7364](https://github.com/handsontable/handsontable/issues/7364)
- Fixed a bug where column sorting with multi column sorting crashed the table. [#7415](https://github.com/handsontable/handsontable/issues/7415)
- Added a missing entry for the `skipRowOnPaste` option in the TypeScript definition file. [#7394](https://github.com/handsontable/handsontable/issues/7394)
- Added missing tests to prevent issue #7377 from resurfacing. [#7396](https://github.com/handsontable/handsontable/issues/7396)
- Fixed an issue where altering columns did not update filters attached to columns. [#6830](https://github.com/handsontable/handsontable/issues/6830)
- Fixed typos and wrong return types in the TypeScript definition file. [#7399](https://github.com/handsontable/handsontable/issues/7399), [#7400](https://github.com/handsontable/handsontable/issues/7400)
- Updated the dependencies causing potential security issues, as well as Babel configuration needed after the update. [#7463](https://github.com/handsontable/handsontable/issues/7463)

### Changed
- Corrected a typo in a helper method from the Column Sorting plugin. [#7375](https://github.com/handsontable/handsontable/issues/7375)
- Optimized the performance of rendering the table with numerous spare rows (for `minSpareRows`, `minSpareCols`, `minRows`, and `minCols` options). [#7439](https://github.com/handsontable/handsontable/issues/7439)

## [8.2.0] - 2020-11-12

### Added
- Added new type of Index Map named `LinkedPhysicalIndexToValueMap` [#7276](https://github.com/handsontable/handsontable/pull/7276)
- Added an external dependency, `DOMPurify`, to add HTML sanitization what should minimize the risk of inserting insecure code using Handsontable built-in functionalities. [#7292](https://github.com/handsontable/handsontable/issues/7292)

### Fixed
- Fixed an issue the container not being updated after trimming rows. [#7241](https://github.com/handsontable/handsontable/issues/7241)
- Fixed an issue with a `htmlToGridSettings` helper if passed `<table>` had no rows. [#7311](https://github.com/handsontable/handsontable/issues/7311)
- Fixed an issue where sorting indicator moved incorrectly when column was added. [#6397](https://github.com/handsontable/handsontable/issues/6397)
- Fixed a bug, where untrimming previously trimmed rows would sometimes result in the table instance not refreshing its height, leaving the row headers not properly rendered. [#6276](https://github.com/handsontable/handsontable/issues/6276)
- Fixes a bug, where tables' viewport was scrolled if a user opened editor when some columns on the left side of that cell were hidden. [#7322](https://github.com/handsontable/handsontable/issues/7322)
- Fix a problem when `event.target`'s parent in the `mouseover` event was not defined, the table threw an error when hovering over row/column headers. [#6926](https://github.com/handsontable/handsontable/issues/6926)
- Fixed an issue, where calling the validation-triggering methods on a `hiddenColumns`-enabled Handsontable instance rendered the validated cells improperly. [#7301](https://github.com/handsontable/handsontable/issues/7301)
- Fixed an issue, where adding 0 rows to the table ended with doubled entries in indexMappers' collections. [#7326](https://github.com/handsontable/handsontable/issues/7326)
- Fix a problem with the inconsistent behavior of the Context Menu's "Clear column" disabled status. [#7003](https://github.com/handsontable/handsontable/issues/7003)
- Fix a bug with parsing multiline cells on pasting `text/html` mime-type. [#7369](https://github.com/handsontable/handsontable/issues/7369)

## [8.1.0] - 2020-10-01

### Added
- Added support for resizing non-contiguous selected rows [#7162](https://github.com/handsontable/handsontable/pull/7162) along with refactor and bug fix introduced within #6871 PR [#7220](https://github.com/handsontable/handsontable/pull/7220)
- Added e2e tests and reorganized already existing ones [#6491](https://github.com/handsontable/handsontable/issues/6491)

### Fixed
- Fixed an issue where if the first part of the merged area was hidden the value did not show [#6871](https://github.com/handsontable/handsontable/issues/6871)
- Fixed an issue where after selecting the top-left element the row range resizing was not possible [#7162](https://github.com/handsontable/handsontable/pull/7162) along with refactor and bug fix introduced within #6871 PR [#7220](https://github.com/handsontable/handsontable/pull/7220)
- Fixed an issue where the column headers were cut off after hiding and then showing columns using the Hidden Columns plugin. [#6395](https://github.com/handsontable/handsontable/issues/6395)
- Fixed an issue where redundant row has been added during copy/paste operations in some case [#5961](https://github.com/handsontable/handsontable/issues/5961)
- Fixed an issue where too many values have been pasted when column was hidden [#6743](https://github.com/handsontable/handsontable/issues/6743)
- Fixed a bug, where trying to move collapsed parent rows with the Nested Rows plugin enabled threw an error. [#7132](https://github.com/handsontable/handsontable/issues/7132)
- Fixed an issue where after column or row alteration, Handsontable threw an error if ColumnSummary was enabled without defined rows ranges [#7174](https://github.com/handsontable/handsontable/pull/7174)
- Fixed an issue where using updateSettings() has been breaking column sorting in specific cases [#7228](https://github.com/handsontable/handsontable/issues/7228)
- Fixed an issue where the rows were missing their left border after disabling the row headers using `updateSettings`, while there were `fixedColumnsLeft` defined. [#5735](https://github.com/handsontable/handsontable/issues/5735)
- Fixed an issue where the Handsontable could fall into an infinite loop during vertical scrolling. It only happened when the scrollable element was the `window` object. [#7260](https://github.com/handsontable/handsontable/issues/7260);
- Fixed an issue with moving rows to the last row of the table, when the Nested Rows plugin was enabled along with some other minor moving-related bugs. [#6067](https://github.com/handsontable/handsontable/issues/6067)
- Fixed an issue with adding unnecessary extra empty line in cells on Safari. [#7262](https://github.com/handsontable/handsontable/issues/7262)
- Fixed an issue with clipped column headers if they were changed before or within usage `updateSettings`. [#6004](https://github.com/handsontable/handsontable/issues/6004)

### Changed
- Updated dependencies to meet security requirements [#7222](https://github.com/handsontable/handsontable/pull/7222)
- Improved performance for TrimRows, HiddenRows and HiddenColumns plugins for big datasets with lots trimmed/hidden indexes [#7223](https://github.com/handsontable/handsontable/pull/7223)

## [8.0.0] - 2020-08-05

### Added
- Added `modifySourceData` hook and `setSourceDataAtCell` method. [#6664](https://github.com/handsontable/handsontable/issues/6664)
- Added new argument to `scrollViewportTo` method: optional `considerHiddenIndexes` which is a `boolean`. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Added additional information available in the cell meta object - the language. [#6254](https://github.com/handsontable/handsontable/pull/6254).
- Added a possibility to allow cancelling of `autofill` in the `beforeAutofill` hook. [#4441](https://github.com/handsontable/handsontable/issues/4441)
- Added support for newer versions of moment, numbro and pikaday. [#5159](https://github.com/handsontable/handsontable/issues/5159)
- Added `afterAutoFill` hook. [#6135](https://github.com/handsontable/handsontable/issues/6135)
- Added deprecated warning messages mechanism for plugin hooks. [#6613](https://github.com/handsontable/handsontable/pull/6613)
- Added missing types for `instance.undoRedo`. [#6346](https://github.com/handsontable/handsontable/issues/6346)
- Added `countRenderableColumns` method to the `TableView`. [#6177](https://github.com/handsontable/handsontable/issues/6177)
- Added missing "hide" property in `CustomBorders` typings. [#6788](https://github.com/handsontable/handsontable/issues/6788)
- Added `beforeSetCellMeta` hook with an ability to cancel the changes. [#5388](https://github.com/handsontable/handsontable/issues/5388)
- Added additional test for autofill plugin. [#6756](https://github.com/handsontable/handsontable/issues/6756)

### Changed
- Changed how `manualRowMove` and `manualColumnMove` plugins work [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Click on a row header will select all cells (also hidden). [#2391](https://github.com/handsontable/handsontable/issues/2391)
- Extracted Cell-Meta logic from Core to separate module. [#6254](https://github.com/handsontable/handsontable/pull/6254)
- The `CellMeta` manager was refactored for future features and improvements. [#6233](https://github.com/handsontable/handsontable/issues/6233)
- Rows can be resized to less than `rowHeights`. [#6149](https://github.com/handsontable/handsontable/issues/6149)
- Left mouse button (LMB) click on the corner will now select all cells. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- The right mouse button (`RMB`) click on the corner, column and row headers will show just some options, defined by newly created specification [#7082](https://github.com/handsontable/handsontable/pull/7082)
- Hidden indexes will no longer be rendered, as a consequence `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` will be executable only on visible (meaning, rendered) rows and columns. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- The `getColWidth` for hidden index will return 0 - it used to return 0.1 [#6547](https://github.com/handsontable/handsontable/pull/6547)
- The `modifyColWidth` hook isn't called internally. However, it will be executed when the user will call the `getColWidth`. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Hidden rows/columns won't rendered anymore. As a consequence hooks `beforeValueRender`, `beforeRenderer`, `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` etc. will be executed just for some of the columns (just the renderable ones). [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Selection behavior changed when hiding cells from the `ContextMenu`, now it is selecting a column on the right when there is space on right to the last selected column, selecting a column on the left otherwise. [#6547](https://github.com/handsontable/handsontable#6547)
- Developed a unified way to identify HOT "input" elements. All input elements owned by HOT got an attribute "data-hot-input" which are identified by that key. [#6383](https://github.com/handsontable/handsontable/issues/6383)
- `NestedHeaders` plugin was rewritten, from now on, only a tree-like structure will be allowed, meaning, there will be no possibility to place nested headers in-between layers. [#6716](https://github.com/handsontable/handsontable/pull/6716)
- `CustomBorders` plugin was adapted to work with `HiddenColumns` properly, from now on hiding cells at the start or at the end of a range will also hide their borders. Also, hiding a single cell with borders will hide all of its borders. [#7083](https://github.com/handsontable/handsontable/pull/7083)
- `CollapsibleColumns` will no longer use `HiddenColumns` plugin to work. [#6204](https://github.com/handsontable/handsontable/issue/6204)
- Modifying the table's data by reference and calling `render()` will not work properly anymore. From this point onward, all the data-related operations need to be performed using the API methods, such as `populateFromArray` or `setDataAtCell`. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Removed dependencies between plugins: the `manualColumnFreeze` plugin doesn't use the `manualColumnMove`, the `collapsibleColumns` plugin doesn't use the `hiddenColumns` plugin, `nestedRows` plugin doesn't use the `trimRows` plugin, `filters` plugin doesn't use the `trimRows` plugin anymore. [#5945](https://github.com/handsontable/handsontable/pull/5945) along with other adjustments [#6547](https://github.com/handsontable/handsontable/pull/6547):
- The `minSpareRows` and `minRows` options will ensure that the number of visible rows corresponds to the value provided to them (for example, the `trimRows` plugin won't have an impact on the number of displayed rows). [#5945](https://github.com/handsontable/handsontable/pull/5945)
- `toPhysicalRow` and `toVisualColumn` now return `null` for non-existant rows/columns. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `afterLoadData` hook receives a different set of arguments. It used to be just the initialLoad flag, now the first argument is `sourceData`, followed by `initialLoad`. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `manualColumnFreeze` plugin unfreezes the column just after the "line of freeze". [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `RecordTranslator` object and the `t` property available in the plugins were removed. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- After-prefixed hooks (`afterLoadData`, `afterFilter`, etc.) are now called just before the `render` call. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Newly created rows and columns are now placed in the source data in the place calculated from its position in the visual context (they "stick" to their adjacent rows/columns). It also applies to moved rows and columns. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- When the `nestedRows` plugin is `enabled`, moving rows will be possible only using the UI or by calling the `dragRows` method of the `manualRowMove` plugin. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `beforeRowResize`, `afterRowResize`, `beforeColumnResize`, `afterColumnResize` hooks have the order of their arguments rearranged for the sake of consistency with other hooks. [#3328](https://github.com/handsontable/handsontable/issues/3328)
- Changed the argument structure in `collapsibleColumns`' `toggleCollapsibleSection` method. [#6193](https://github.com/handsontable/handsontable/issues/6193)
- Updated the `moment`, `numbro` and `pikaday` dependencies to their latest versions. [#6610](https://github.com/handsontable/handsontable/issues/6610)
- Standardize the `z-index` properties between the overlays. [#6269](https://github.com/handsontable/handsontable/pull/6269)

### Deprecated
- `HeaderTooltips` plugin becomes deprecated and will be removed in the next major version. [#7023](https://github.com/handsontable/handsontable/issues/7023)
- IE support is depreacated and will removed by the end of the year. [#7026](https://github.com/handsontable/handsontable/issues/7026)

### Removed
- Removed `firstVisibleColumn` CSS class as no longer needed. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed helpers that covered IE8 support or are not needed anymore. [#6525](https://github.com/handsontable/handsontable/issues/6525)
- Removed old unnecessary warning about `beforeChange` callback. [#6792](https://github.com/handsontable/handsontable/issues/6792)
- Removed `debug` key (key, css, docs). [#6672](https://github.com/handsontable/handsontable/issues/6672)
- Removed `hiddenRow` and `hiddenColumn` hooks. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed optional argument `modifyDocumentFocus` from the `listen` function. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed `rowOffset` and `colOffset` public API methods since they aliased the methods from Walkontable. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed the experimental `GanttChart` plugin. [#7022](https://github.com/handsontable/handsontable/issues/7022)
- Removed post-install warning from package.json file [#6608](https://github.com/handsontable/handsontable/pull/6608)
- The `modifyRow`, `modifyCol`, `unmodifyRow`, `unmodifyCol` and `skipLengthCache` hooks are no longer needed and were removed. [#5945](https://github.com/handsontable/handsontable/pull/5945)


### Fixed
- Fixed a problem with data not being added to the table properly with the `columnSorting` option enabled. [#2685](https://github.com/handsontable/handsontable/issues/2685)
- Fixed a problem with `loadData` not resetting the row order changed by the `manualRowMove` plugin. [#3568](https://github.com/handsontable/handsontable/issues/3568)
- Fixed a bug, where using `alter`'s `insert_row` after using the `loadData` method and sorting the data would add unintentional additional rows to the table. [#3809](https://github.com/handsontable/handsontable/issues/3809)
- Fixed a bug, where blank rows appeared in the middle of the table after using `loadData` along with the `minSpareRows` option. [#3937](https://github.com/handsontable/handsontable/issues/3937)
- Fixed a problem with the `columnSummary` plugin not working properly after adding new rows using the Context Menu and sorting the data. [#3924](https://github.com/handsontable/handsontable/issues/3924)
- Fixed a bug, where calling `loadData` with an object-based data source would not work properly. [#4204](https://github.com/handsontable/handsontable/issues/4204)
- Fixed a problem with the Hidden Columns settings being reset after calling `updateSettings`. [#4121](https://github.com/handsontable/handsontable/issues/4121)
- Fixed a bug with the `filters` plugin using incorrect indexes after moving and/or sorting the table. [#4442](https://github.com/handsontable/handsontable/issues/4442)
- Fixed a bug that caused a column to contain improper data after moving it to index `0`. [#4470](https://github.com/handsontable/handsontable/issues/4470)
- Fixed a bug with the `afterRowMove` hook receiving an improper `target` argument. [#4501](https://github.com/handsontable/handsontable/issues/4501)
- Fixed a problem with the `manualColumnFreeze` plugin enabling `manualColumnMove`, even if it was declared as `false`. [#4553](https://github.com/handsontable/handsontable/issues/4553)
- Fixed a problem with plugins using `arrayMappers` not working properly after updating the dataset. [#4567](https://github.com/handsontable/handsontable/issues/4567)
- Fixed a bug, where calling `loadData` with `minSpareRows` and `manualRowMove` enabled caused the table to improperly load the data. [#4576](https://github.com/handsontable/handsontable/issues/4576)
- Fixed a bug, where enabling `columnSorting` caused the `manualColumnFreeze` to be unusable. [#4601](https://github.com/handsontable/handsontable/issues/4601)
- Fixed a problem, where the columns were assigned improper widths after inserting additional columns or removing any of them. [#4666](https://github.com/handsontable/handsontable/issues/4666)
- Fixed a bug, where moving rows was impossible while `persistentState` was enabled. [#4713](https://github.com/handsontable/handsontable/issues/4713)
- Fixed a bug, where `manualColumnMove` didn't work if the dataset was empty. [#4926](https://github.com/handsontable/handsontable/issues/4926)
- Fixed a bug with the `collapseAll` method from the `collapsibleColumns` plugin did not work properly if `columnSorting` was enabled. [#4999](https://github.com/handsontable/handsontable/issues/4999)
- Fixed a bug, where calling `loadData` with `minSpareRows` enabled would cause unwanted blank rows to appear. [#5707](https://github.com/handsontable/handsontable/issues/5707)
- Fixed a bug with the `afterColumnMove` hook receiving an improper `target` argument. [#5173](https://github.com/handsontable/handsontable/issues/5173)
- Fixed a problem, where filtering data after moving rows would not work properly. [#5178](https://github.com/handsontable/handsontable/issues/5178)
- Fixed a bug, where calling `loadData` made `NaN` appear in the column headers. [#5369](https://github.com/handsontable/handsontable/issues/5369)
- Fixed a bug with the `skipColumnOnPaste` option not working properly when using `columnSorting` and `hiddenColumns`. [#5824](https://github.com/handsontable/handsontable/issues/5824)
- Fixed a bug with the `trimRows` plugin did not work properly after moving rows. [#5860](https://github.com/handsontable/handsontable/issues/5860)
- Fixed a problem with `minSpareRows` not working properly with the `trimRows` plugin being used. [#5862](https://github.com/handsontable/handsontable/issues/5862)
- Fixed a problem, where it was impossible to filter the data declared in the `nestedRows` plugin. [#5889](https://github.com/handsontable/handsontable/issues/5889)
- Fixed a bug, where filtering and sorting data would cause the `toVisualRow` method to return the wrong results. [#5890](https://github.com/handsontable/handsontable/issues/5890)
- Fixed a bug with the `filters` and `trimRows` plugins not working properly alongside each other. [#5915](https://github.com/handsontable/handsontable/issues/5915)
- Fixed a bug, where `manualColumnMove` would not work properly when the data object properties count would be lower than the table column count. [#5931](https://github.com/handsontable/handsontable/issues/5931)
- Fixed a bug with the `trimRows` plugin did not work properly with the `startRows` option. [#5953](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a problem, where using `loadData` after sorting would not work as expected. [#5956](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a problem with the `beforeColumnMove` and `afterColumnMove` hooks not containing information about their destination indexes. [#6005](https://github.com/handsontable/handsontable/issues/6005)
- Fixed a problem where using `filters` and `minSpareRows` would make the table add an empty row at the beginning of the table. [#6278](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a bug with the `manualRowMove` plugin would duplicate data in the moved rows, when used with a row index greater than the table row count. [#6088](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a bug, where the `toVisualRow` method returned `null` when using the `trimRows` and `columnSorting` plugins together. [#6310](https://github.com/handsontable/handsontable/issues/6310)
- Fixed a problem, where calling `updateSettings` in the `afterColumnMove` hook callback would have no effect. [#4480](https://github.com/handsontable/handsontable/issues/4480)
- Fixed a bug, where calling `loadData` would make the `filters` plugin to not behave as expected. [#5244](https://github.com/handsontable/handsontable/issues/5244)
- Fixed a bug, where detaching a child from a parent in the `nestedRows` plugin would cause a `+/-` button misalignment. [#5900](https://github.com/handsontable/handsontable/issues/5900)
- Fixed a problem with the `columnSummary` plugin creating a doubled summary row. [#5794](https://github.com/handsontable/handsontable/issues/5794)
- Fixed a bug, where moving children between parents using the `nestedRows` plugin would throw an error. [#6066](https://github.com/handsontable/handsontable/issues/6066)
- Fixed a bug, where adding rows by modifying the data by reference while using the `nestedRows` plugin would throw an error. [#3914](https://github.com/handsontable/handsontable/issues/3914)
- Fixed a bug, where merging cells would conflict with the `columnSorting` plugin. [#6086](https://github.com/handsontable/handsontable/issues/6086)
- Fixed a bug, where the row headers would stay visible after removing all the table columns. [#6412](https://github.com/handsontable/handsontable/issues/6412)
- Fixed an issue where Hidden columns become visible when the user ran `updateSettings`. [#4121](https://github.com/handsontable/handsontable/issues/4121)
- Fixed an issue where using `hiddenColumns` and `stretchH` showed a redundant horizontal scrollbar. [#4181](https://github.com/handsontable/handsontable/issues/4181)
- Fixed an issue in which if the last column was a hidden column and `stretchH` was enabled, the last column was displayed. [#4370](https://github.com/handsontable/handsontable/issues/4370)
- Fixed an issue where `updateSettings` performance was very low because of `hiddenColumns` being rendered. [#4381](https://github.com/handsontable/handsontable/issues/4381)
- Fixed an issue where collapse was not working correctly with custom cell renderers. [#4716](https://github.com/handsontable/handsontable/issues/4716)
- Fixed an incorrect header name when user defined more columns in the `nestedHeaders` plugin. [#4716](https://github.com/handsontable/handsontable/issues/4716)
- Fixed an issue where `hiddenColumns` did not work properly with `columnSorting`. [#5571](https://github.com/handsontable/handsontable/issues/5571)
- Fixed an issue where `manualColumnMove` should work with `hiddenColumns`. [#5598](https://github.com/handsontable/handsontable/issues/5598)
- Fixed an issue where `hiddenColumns` option interfered with the keyboard movement. [#5704](https://github.com/handsontable/handsontable/issues/5704)
- Fixed an issue where after hiding the first two rows, the row headers became de-synchronized by 1px. [#5817](https://github.com/handsontable/handsontable/issues/5817)
- Fixed an issue where hiding columns affected selection of hidden columns. [#5871](https://github.com/handsontable/handsontable/issues/5871)
- Fixed an issue where if `collapsibleColumns` were set to `true` it was impossible to exit selection mode. [#5875](https://github.com/handsontable/handsontable/issues/5875)
- Fixed an issue where `hiddenColumns` did not work properly with `autoWrapRow/autoWrapCol`. [#5877](https://github.com/handsontable/handsontable/issues/5877)
- Fixed an issue on IE where hiding the first column caused a display of double border for top left corner. [#5881](https://github.com/handsontable/handsontable/issues/5881)
- Fixed an issue where `nestedHeaders` duplicated a header name if more columns are added. [#5882](https://github.com/handsontable/handsontable/issues/5882)
- Fixed an issue where `hiddenColumns` plugin unset cell's `renderer`. [#5883](https://github.com/handsontable/handsontable/issues/5883)
- Fixed an issue where `hiddenColumns` had stored visual indexes and should have used physical indexes. [#5909](https://github.com/handsontable/handsontable/issues/5909)
- Fixed an issue where hidden columns should be unrecoverable. [#6113](https://github.com/handsontable/handsontable/issues/6113)
- Fixed an issue where row selection ignored columns that are hidden at the end. [#6181](https://github.com/handsontable/handsontable/issues/6181)
- Fixed an issue where defining data with more data than used in `columns` caused an issue with showing column once it was hidden. [#6426](https://github.com/handsontable/handsontable/issues/6426)
- Fixed an issue where hiding rows, while there was a merged area, involved caused data shifting and unexpected merged area coordinates. [#6376](https://github.com/handsontable/handsontable/issues/6376)
- Fixed an issue where `colHeader` was truncated after moving `hiddenColumn`. [#6463](https://github.com/handsontable/handsontable/issues/6463)
- Fixed an issue where the last hidden column was visible upon column resizing. [#6557](https://github.com/handsontable/handsontable/issues/6557)
- Fixed an issue where with hiding columns after moved them manually. [#6668](https://github.com/handsontable/handsontable/issues/6668)
- Fixed an issue where expanding a collapsed column caused expanding of a child columns except for the first one. [#5792](https://github.com/handsontable/handsontable/issues/5792)
- Fixed an issue where setting `columnSorting` to `true` (on initialization or via `updateSettings`) made headers non-collapsible programmatically via `collapseAll` method. [#4999](https://github.com/handsontable/handsontable/issues/4999)
- Fixed an issue where `customBorders` plugin was missing in the definition file. [#6477](https://github.com/handsontable/handsontable/issues/6477)
- Fixed incorrect size of `wtHider`and `wtHolder` in overlays. [#3873](https://github.com/handsontable/handsontable/issues/3873)
- Fixed an issue where `updateSettings` could not update `tableClassName`. [#6295](https://github.com/handsontable/handsontable/issues/6295)
- Fixed an issue where JSON data with empty value was losing some double quotes when pasted into a cell. [#6167](https://github.com/handsontable/handsontable/issues/6167)
- Fixed an issue where some classes for the table were missing if one of them was empty. [#6371](https://github.com/handsontable/handsontable/issues/6371)
- Fixed an issue where clicking in a contextmenu's border opened the native context menu. [#6218](https://github.com/handsontable/handsontable/issues/6218)
- Fixed the error that ocurred during loading of E2E test runner in Edge and IE. [#6713](https://github.com/handsontable/handsontable/issues/6713)
- Fixed the inconsistency and problems with adding rows from the corner when all rows are trimmed. [#7061](https://github.com/handsontable/handsontable/issues/7061)
- Fixed an issue where using read-only and alignment from the context menu was disabled when all columns were selected. [#7114](https://github.com/handsontable/handsontable/issues/7114)
- Fixed an issue where setting focus to a column to open context menu after applying a filter was impossible. [#7005](https://github.com/handsontable/handsontable/issues/7005)
- Fixed an issue where `minSpareCols` with `undo` added too many columns. [#6363](https://github.com/handsontable/handsontable/issues/6363)
- Fixed the inconsistency in selection when using the right mouse button for first row/column. [#6334](https://github.com/handsontable/handsontable/issues/6334)
- Fixed an issue where undoing column removal caused column headers to lack a header. [#6992](https://github.com/handsontable/handsontable/issues/6992)
- Fixed an issue where `readOnly` for column was erased (did not apply) if filters were used. [#6559](https://github.com/handsontable/handsontable/issues/6559)
- Fixed an issue where readonly property was lost after declining confirmation in `beforeRemoveCol` or `beforeRemoverow`. [#6332](https://github.com/handsontable/handsontable/issues/6332)
- Fixed an issue where `readOnly` state for some cells was lost when rows with `trimRows` turned on were removed. [#6990](https://github.com/handsontable/handsontable/issues/6990)
- Fixed incorrect column header highlight when merged cells were unmerged and `hiddenColumns` were used. [#6978](https://github.com/handsontable/handsontable/issues/6978)
- Fixed an issue where after hiding the first row, the second row top border disappeared. [#6977](https://github.com/handsontable/handsontable/issues/6977)
- Fixed an issue with incorrect selection after hiding the first row. [#6831](https://github.com/handsontable/handsontable/issues/6831)
- Fixed an issue where hiding the first row caused blue highlight in column headers selection to disappear. [#6976](https://github.com/handsontable/handsontable/issues/6976)
- Fixed wrong selection area after sorting with hidden rows. [#6386](https://github.com/handsontable/handsontable/issues/6386)
- Fixed an issue where it was not possible to use `selectAll` when the first row was hidden. [#6975](https://github.com/handsontable/handsontable/issues/6975)
- Fixed an issue where it was possible to select hidden row or column. [#6974](https://github.com/handsontable/handsontable/issues/6974)
- Fixed an issue where row indexes changed if the first row was hiding after moving row from bottom to top. [#6965](https://github.com/handsontable/handsontable/issues/6965)
- Fixed an issue where selection skipped the highest parent. [#6770](https://github.com/handsontable/handsontable/issues/6770)
- Fixed an iisue where `nestedRows` blocked table from loading if data was not provided. [#6928](https://github.com/handsontable/handsontable/issues/6928)
- Fixed an isse where it was impossible to go back to the original cell after dragging down. [#4233](https://github.com/handsontable/handsontable/issues/4233)
- Fixed an issue where keyboard navigation did not work on merged cells with hidden rows/columns. [#6973](https://github.com/handsontable/handsontable/issues/6973)
- Fixed an issue where `trimRows` and `hiddenRows` with specific settings broke borders. [#6904](https://github.com/handsontable/handsontable/issues/6904)
- Fixed wrong union type for `startPosition`. [#6840](https://github.com/handsontable/handsontable/issues/6840)
- Fixed type mismatch for `Handsontable.plugins.ContextMenu`. [#6347](https://github.com/handsontable/handsontable/issues/6347)
- Fixed an issue where `manualColumnMove` did not modify the `columns` in `updateSettings`. [#5200](https://github.com/handsontable/handsontable/issues/5200)
- Fixed rendering issue on column udpate with `updateSettings`. [#3770](https://github.com/handsontable/handsontable/issues/3770)
- Fixed an issue where expanding a collapsed column was also expanding  'child' collapsed columns, except the first child. [#5792](https://github.com/handsontable/handsontable/issues/5792)
- Fixed an issue with inproper selection for headers when the first column was hidden. [#5999](https://github.com/handsontable/handsontable/issues/5999)
- Fixed an issue where it was not possible to align cells if the selection was made upward. [#6600](https://github.com/handsontable/handsontable/issues/6600)
- Fixed an issue where `currentColClassName` did not work properly with `nestedHeaders`. [#5861](https://github.com/handsontable/handsontable/issues/5861)
- Fixed an issue with scrollbar and dimension calculation in Firefox for toggling column visibility with fixed columns and `stretchH`. [#6186](https://github.com/handsontable/handsontable/issues/6186)
- Fixed an issue with undoing the nested row removal. [#6433](https://github.com/handsontable/handsontable/issues/6433)
- Fixed an isse where `getSourceData` functions returned wrong data for nested rows. [#5771](https://github.com/handsontable/handsontable/issues/5771)
- Fixed na issue where formulas plugin did not work with `nestedRows`. [#4154](https://github.com/handsontable/handsontable/issues/4154)
- Fixed an issue where nested headers and hidden columns highlighted ad additional column when used together. [#6881](https://github.com/handsontable/handsontable/issues/6881)
- Fixed an issue where `getByRange` for sourceData did not work properly with nested object data. [#6548](https://github.com/handsontable/handsontable/issues/6548)
- Fixed an issue where `window.frameElement` threw errors in MSEdge, IE and Safari. [#6478](https://github.com/handsontable/handsontable/issues/6478)
- Fixed an issue where `DataSource.countColumns` returned invalid number of columns for nested objects. [#3958](https://github.com/handsontable/handsontable/issues/3958)
- Fixed an issue where `mergedCells` with hidden cells caused problems with rendering. [#7020](https://github.com/handsontable/handsontable/issues/7020)
- Fixed an issue where it was not possible to move column when all columns were selected by `ctrl + a`. [#6355](https://github.com/handsontable/handsontable/issues/6355)
- Fixed an issue where double click on the column resize handle did not adjust size correctly. [#6755](https://github.com/handsontable/handsontable/issues/6755)
- Fixed an issue where the cell meta was retrieved using the wrong coordinates. [#6703](https://github.com/handsontable/handsontable/issues/6703)
- Fixed nested rows incorrect state after changing data. [#5753](https://github.com/handsontable/handsontable/issues/5753)
- Fixed an issue in EDGE where the dropdown menu `onMouseOut` event caused critical errors when hovering over vertical scrollbar. [#6699](https://github.com/handsontable/handsontable/issues/6699)
- Fixed an issue with too many layers of highlight with noncontinuous selection on merged cells. [#7028](https://github.com/handsontable/handsontable/issues/7028)
- Fixed an issue where `NestedHeaders` did not allow to define header level as an empty array. [#7035](https://github.com/handsontable/handsontable/issues/7035)
- Fixed an issue where passing `nestedHeaders` as a single empty array stoped the table from rendering. [#7036](https://github.com/handsontable/handsontable/issues/7036)
- Fixed an issue where opening a context menu for a column when its hidden data was selected did not block adding of rows by the menu. [#7050](https://github.com/handsontable/handsontable/issues/7050)
- Fixed an issue where it was not possible to navigate past hidden column using keyboard if` hot.updateSettings` was called in `afterSelection`. [#3726](https://github.com/handsontable/handsontable/issues/3726)
- Fixed an issue where headers did not export with `exportToFile` in the specific case. [#4176](https://github.com/handsontable/handsontable/issues/4176)
- Fixed an issue with types mismatch. [#6035](https://github.com/handsontable/handsontable/issues/6035)
- Fixed an issue where manual row resize handler threw an error when bottom rows overlay was enabled. [#6435](https://github.com/handsontable/handsontable/issues/6435)
- Fixed an issue where the `afterRowResize` hook shared incorrect results in the second parameter. [#6430](https://github.com/handsontable/handsontable/issues/6430)
- Fixed an issue where the row/column resize hooks should not have returned `null`. [#7074](https://github.com/handsontable/handsontable/issues/7074)
- Fixed the loss of selection after merging from headers. [#7076](https://github.com/handsontable/handsontable/issues/7076)
- Fixed an issue where calling `updateSettings` changed the index of frozen columns via `freezeColumn` method. [#6843](https://github.com/handsontable/handsontable/issues/6843)
- Fixed an issue where deleting the last column via `updateSettings` which was part of the selection caused scroll to the bottom. [#5849](https://github.com/handsontable/handsontable/issues/5849)
- Fixed an issue where it was not possible to hide rows and merge cells at the same time. [#6224](https://github.com/handsontable/handsontable/issues/6224)
- Fixed the wrong data in merge cells after the hidden column and additionally an error occurs. [#6888](https://github.com/handsontable/handsontable/issues/6888)
- Fixed an issue where it was not possible to change cell type via `setCellMeta`. [#4793](https://github.com/handsontable/handsontable/issues/4793)
- Fixed an issue where cell editor did not dynamically changed while changing the cell type. [#4360](https://github.com/handsontable/handsontable/issues/4360)
- Fixed an issue where it was not possible to unmerge cells if part of them was hidden. [#7095](https://github.com/handsontable/handsontable/issues/7095)
- Fixed an issue where calling `clear` method removed the focus from the table. [#7099](https://github.com/handsontable/handsontable/issues/7099)
- Fixed an issue where `clear` method did not work for hidden data. [#7097](https://github.com/handsontable/handsontable/issues/7097)
- Fixed an issue where the editor was moved by 1px when the first row / column was hidden. [#6982](https://github.com/handsontable/handsontable/issues/6982)
- Fixed an issue where headers were deselected after undoing removal. [#6670](https://github.com/handsontable/handsontable/issues/6670)
- Fixed an issue with improper selection after insert column/row when mergeCells was enabled. [#4897](https://github.com/handsontable/handsontable/issues/4897)
- Fixed an issue where wrong cell meta was removed when deleting rows. [#6051](https://github.com/handsontable/handsontable/issues/6051)
- Fixed wrong types of `beforeRowMove` arguments. [#6539](https://github.com/handsontable/handsontable/issues/6539)
- Fixed an issue where selection of a whole row did not happen consequently after selecting a row header. [#5906](https://github.com/handsontable/handsontable/issues/5906)
- Fixed an issue where it was not possible to use physical row index instead of visual one. [#6309](https://github.com/handsontable/handsontable/issues/6309)
- Fixed an issue where incorrect data was returned after undoing the remove column option. [#5000](https://github.com/handsontable/handsontable/issues/5000)
- Fixed - Copy and paste works properly also when selecting hidden columns when: all columns within a selected range are hidden and when just some columns within a selected range are hidden. [#7043](https://github.com/handsontable/handsontable/issues/7043).
- Fixed an issue where it was impossible to add new row in the `nestedRows`. [#5133](https://github.com/handsontable/handsontable/issues/5133)
- Fixed an issue where `afterOnCellMouseDown` returned (0,0) coords after clicking on the topleft corner. [#3978](https://github.com/handsontable/handsontable/issues/3978)
- Fixed an issue where persisted `manualColumnMove` was not restored when using `loadData`. [#5207](https://github.com/handsontable/handsontable/issues/5207)
- Fixed issues with filtering results in blank rows. [#5208](https://github.com/handsontable/handsontable/issues/5208)
- Fixed an issue where changing data on collapsed rows resulted in error. [#5328](https://github.com/handsontable/handsontable/issues/5328)
- Fixed an issue where the `manualColumnMove` operation affected the column order of data loaded by `loadData`. [#5591](https://github.com/handsontable/handsontable/issues/5591)
- Fixed an issue where `nestedRows` did not allow to keep `rowHeaders` after collapsing. [#5874](https://github.com/handsontable/handsontable/issues/5874)
- Fixed performance and CPU issue caused by using some handsontable properties. [#6058](https://github.com/handsontable/handsontable/issues/6058)
- Fixed an error with columnSummary plugin when trying to create a row. [#6300](https://github.com/handsontable/handsontable/issues/6300)
- Fixed an error where `walkontable.css` and `handsontable.css` stylesheets were out of sync. [#6381](https://github.com/handsontable/handsontable/issues/6381)
- Fixed an issue where `colHeaders` order was not updated after manual move with empty object data source. [#6413](https://github.com/handsontable/handsontable/issues/6413)
- Fixed "detach from parent" option. [#6432](https://github.com/handsontable/handsontable/issues/6432)
- Fixed an issue where `PreventOverflow` feature did not work if `multiColumnSorting` plugin was enabled. [#6514](https://github.com/handsontable/handsontable/issues/6514)
- Fixed an issue where old CSS classes were not removed after `updateSettings`. [#6575](https://github.com/handsontable/handsontable/issues/6575)
- Fixed an issue where `columnSummary`, `Filters` and spare rows were causing 'RangeError: Maximum call stack size exceeded'. [#6695](https://github.com/handsontable/handsontable/issues/6695)
- Fixed an issue where `afterSelectionEnd` returned incorrect data when clicking on a column when all rows were hidden. [#7045](https://github.com/handsontable/handsontable/issues/7045)
- Fixed an issue where wrapping was not applied after setting `trimWhitespace` to `false`. [#6232](https://github.com/handsontable/handsontable/issues/6232)
- Fixed an issue with additional selection border in iOS. [#7103](https://github.com/handsontable/handsontable/issues/7103)
- Fixed an issue with rendering different borders. [#6955](https://github.com/handsontable/handsontable/issues/6955)
- Fixed an issue with `BACKSPACE` not working properly in the filter by value input. [#6842](https://github.com/handsontable/handsontable/issues/6842)
- Fixed an issue with Undo/Redo not working with fixing columns. [#6869](https://github.com/handsontable/handsontable/issues/6869)
- Added a missing argument in the `deepObjectSize` function. [#6821](https://github.com/handsontable/handsontable/pull/6821)

## Prior [8.0.0]

The changes for previous versions are described at https://github.com/handsontable/handsontable/releases.

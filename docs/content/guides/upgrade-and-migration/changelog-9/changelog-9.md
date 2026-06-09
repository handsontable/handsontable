---
type: reference
title: Changelog 9.0
metaTitle: Changelog 9.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 9.0 in each minor and patch release.
permalink: /changelog-9
canonicalUrl: /changelog-9
react:
  metaTitle: Changelog 9.0 - React Data Grid | Handsontable
angular:
  metaTitle: Changelog 9.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Changelog 9.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 9.x.

## 9.0.2

Released on July 28, 2021.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/whats-new-in-handsontable-9.0.2)
- [Documentation (9.0)](https://handsontable.com/docs/9.0/)

</div>

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


<div class="boxes-list gray">

- [Documentation (9.0)](https://handsontable.com/docs/9.0/)

</div>

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


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-9.0.0-new-formula-plugin)
- [Documentation (9.0)](https://handsontable.com/docs/9.0/)
- [Migration guide (8.4 → 9.0)](@/guides/upgrade-and-migration/migrating-from-8.4-to-9.0/migrating-from-8.4-to-9.0.md)

</div>

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

## Related

- [Migrating from 8.4 to 9.0](@/guides/upgrade-and-migration/migrating-from-8.4-to-9.0/migrating-from-8.4-to-9.0.md)

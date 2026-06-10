---
type: reference
title: Changelog 10.0
metaTitle: Changelog 10.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 10.0 in each minor and patch release.
permalink: /changelog-10
canonicalUrl: /changelog-10
react:
  metaTitle: Changelog 10.0 - React Data Grid | Handsontable
angular:
  metaTitle: Changelog 10.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Changelog 10.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 10.x.

## 10.0.0

Released on September 29, 2021.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-10.0.0-improved-performance-and-consistency)
- [Documentation (10.0)](https://handsontable.com/docs/10.0/)
- [Migration guide (9.0 → 10.0)](@/guides/upgrade-and-migration/migrating-from-9.0-to-10.0/migrating-from-9.0-to-10.0.md)

</div>

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

## Related

- [Migrating from 9.0 to 10.0](@/guides/upgrade-and-migration/migrating-from-9.0-to-10.0/migrating-from-9.0-to-10.0.md)

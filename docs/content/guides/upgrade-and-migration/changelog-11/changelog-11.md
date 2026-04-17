---
type: reference
id: kk7fprli
title: Changelog 11.0
metaTitle: Changelog 11.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 11.0 in each minor and patch release.
permalink: /changelog-11
canonicalUrl: /changelog-11
react:
  id: ny8fq2bb
  metaTitle: Changelog 11.0 - React Data Grid | Handsontable
angular:
  id: 9fzgv1of
  metaTitle: Changelog 11.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 11.x.

## 11.1.0

Released on January 13, 2022

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-11.1.0-vue-3-support-and-updatedata)
- [Documentation (11.1)](https://handsontable.com/docs/11.1/)

</div>

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


<div class="boxes-list gray">

- [Documentation (11.0)](https://handsontable.com/docs/11.0/)

</div>

#### Fixed

- Fixed the UMD build of `@handsontable/angular`, which was not working properly in `11.0.0`.
  [#8946](https://github.com/handsontable/handsontable/pull/8946)

## 11.0.0

Released on November 17, 2021.

For more information on this release, see:


<div class="boxes-list gray">

- [Blog post](https://handsontable.com/blog/handsontable-11.0.0-modularization-for-react-angular-and-vue)
- [Documentation (11.0)](https://handsontable.com/docs/11.0/)
- [Migration guide (10.0 → 11.0)](@/guides/upgrade-and-migration/migrating-from-10.0-to-11.0/migrating-from-10.0-to-11.0.md)

</div>

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

## Related

- [Migrating from 10.0 to 11.0](@/guides/upgrade-and-migration/migrating-from-10.0-to-11.0/migrating-from-10.0-to-11.0.md)

---
type: reference
id: znsspzmg
title: Changelog 16.0
metaTitle: Changelog 16.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 16.0 in each minor and patch release.
permalink: /changelog-16
canonicalUrl: /changelog-16
react:
  id: jdezk1ny
  metaTitle: Changelog 16.0 - React Data Grid | Handsontable
angular:
  id: hjp86je4
  metaTitle: Changelog 16.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 16.x.

## 16.2.0

Released on November 25th, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Blog post (16.2.0)](https://handsontable.com/blog/handsontable-16.2.0-simplified-theming-and-advanced-user-notifications)
- [Documentation (16.2)](https://handsontable.com/docs/16.2)

</div>

#### Added
- Improved focus management by introducing a focus scopes mechanism. [#11804](https://github.com/handsontable/handsontable/pull/11804)
- Introduced an "auto" option for the `roundFloat` setting in the Column Summary plugin and ensured proper recalculation of endpoints after data updates. [#11833](https://github.com/handsontable/handsontable/pull/11833)
- Added an Enter key handler and a new `searchMode` option to the Filters plugin. [#11871](https://github.com/handsontable/handsontable/pull/11871)
- Implemented a `style` option for the Custom Borders plugin, enabling style customization. [#11876](https://github.com/handsontable/handsontable/pull/11876)
- Introduced a new "dotted" border style to the Custom Borders plugin. [#11877](https://github.com/handsontable/handsontable/pull/11877)
- Added the EmptyDataState plugin to improve UX when no data is available. [#11879](https://github.com/handsontable/handsontable/pull/11879)
- Added a `settings` entry to the Handsontable exports. [#11883](https://github.com/handsontable/handsontable/pull/11883)
- Added new global button CSS class names. [#11896](https://github.com/handsontable/handsontable/pull/11896)
- Introduced `minRowHeights` as an alias for `rowHeights` for API consistency. [#11898](https://github.com/handsontable/handsontable/pull/11898)
- Added a new `template` option to the Dialog plugin. [#11902](https://github.com/handsontable/handsontable/pull/11902)
- Added new theme variables and implemented `no-icons` and `icons-only` style variants. [#11913](https://github.com/handsontable/handsontable/pull/11913)

#### Changed
- Refined dropdown behavior when the input is empty - focus now remains on the input field. [#11863](https://github.com/handsontable/handsontable/pull/11863)
- Improved how the Autocomplete and Dropdown editors respond to clicks outside the open editor. [#11873](https://github.com/handsontable/handsontable/pull/11873)
- Reverted the editors' `updateChoicesList` method type change. [#11943](https://github.com/handsontable/handsontable/pull/11943)

#### Fixed
- Fixed the datepicker icon size issue on iPad. [#11860](https://github.com/handsontable/handsontable/pull/11860)
- Corrected header size rendering on iPad. [#11861](https://github.com/handsontable/handsontable/pull/11861)
- Fixed an issue with header text size with `collapsibleColumns` enabled. [#11864](https://github.com/handsontable/handsontable/pull/11864)
- Fixed an issue with an unwanted empty space on the right side of the table when using the modern themes. [#11868](https://github.com/handsontable/handsontable/pull/11868)
- Fixed row misalignment for multi-line cell content. [#11872](https://github.com/handsontable/handsontable/pull/11872)
- Improved column width calculations for checkbox-typed cells. [#11891](https://github.com/handsontable/handsontable/pull/11891)
- Fixed a problem, where using `minSpareRows` would crash the table when configured alongside the Column Summary plugin. [#11911](https://github.com/handsontable/handsontable/pull/11911)
- Fixed an issue preventing re-adding a previously removed hook callback. [#11914](https://github.com/handsontable/handsontable/pull/11914)
- Stabilized the height of the first row when it's empty. [#11918](https://github.com/handsontable/handsontable/pull/11918)
- Fixed a problem where resizing the window vertically did not resize the table. [#11919](https://github.com/handsontable/handsontable/pull/11919)
- Fixed an issue where the dialog overlay could make the table unresponsive after rapid show/hide calls. [#11925](https://github.com/handsontable/handsontable/pull/11925)
- Fixed an issue with TouchEvent on Firefox. [#11928](https://github.com/handsontable/handsontable/pull/11928)
- React: Fixed an issue with Collapsible Columns being reset in React wrapper. [#11923](https://github.com/handsontable/handsontable/pull/11923)

### Security
- Updated dev dependencies to address high-severity vulnerabilities. [#11895](https://github.com/handsontable/handsontable/pull/11895)

## 16.1.1

Released on September 23, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Documentation (16.1)](https://handsontable.com/docs/16.1)

</div>

#### Fixed
- Fixed row misalignment when setting `manualRowResize` on an instance with `autoRowSize` enabled. [#11849](https://github.com/handsontable/handsontable/pull/11849)
- Reverted the color variables change for the "main" theme. [#11852](https://github.com/handsontable/handsontable/pull/11852)
- Fixed an error thrown when using autocomplete-typed cells with key/value sources alongside formulas. [#11853](https://github.com/handsontable/handsontable/pull/11853)

## 16.1.0

Released on September 15, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Blog post (16.1.0)](https://handsontable.com/blog/handsontable-16.1-row-pagination-loading-plugin-and-long-term-support-policy)
- [Documentation (16.1)](https://handsontable.com/docs/16.1)
- [Migration guide (16.0 → 16.1)](@/guides/upgrade-and-migration/migrating-from-16.0-to-16.1/migrating-from-16.0-to-16.1.md)

</div>

#### Added
- Introduced row pagination functionality. [#11612](https://github.com/handsontable/handsontable/pull/11612)
- Introduced a Dialog plugin. [#11754](https://github.com/handsontable/handsontable/pull/11754)
- Added support for object-based (`key`/`value`) source in Autocomplete and Dropdown editors, along with new `valueGetter` and `valueSetter` options. [#11773](https://github.com/handsontable/handsontable/pull/11773)
- Added a new `initialState` configuration option. [#11777](https://github.com/handsontable/handsontable/pull/11777)
- Introduced the Loading plugin. [#11792](https://github.com/handsontable/handsontable/pull/11792)
- Added a new "classic" theme. [#11790](https://github.com/handsontable/handsontable/pull/11790)
- Added a [Deprecation policy](https://handsontable.com/docs/deprecation-policy/) page to the documentation.
- Added a [Long Term Support (LTS)](https://handsontable.com/docs/long-term-support/) page to the documentation.

#### Changed
- Enabled focus navigation between multiple selection layers. [#11756](https://github.com/handsontable/handsontable/pull/11756)
- Renamed the input element used as the internal focus catcher. [#11770](https://github.com/handsontable/handsontable/pull/11770)
- Added a background color to the `wtHolder` element. [#11797](https://github.com/handsontable/handsontable/pull/11797)
- Updated the CSS variables for the Pagination styles. [#11820](https://github.com/handsontable/handsontable/pull/11820)

#### Fixed
- Fixed undo/redo functionality for cell types other than `text`. [#11656](https://github.com/handsontable/handsontable/pull/11656)
- Fixed incorrect resizing behavior when auto-sizing rows or columns by double-clicking separators. [#11671](https://github.com/handsontable/handsontable/pull/11671)
- Fixed mouse wheel zooming issues on Windows. [#11680](https://github.com/handsontable/handsontable/pull/11680)
- Fixed autocomplete sorting and option highlighting issues. [#11708](https://github.com/handsontable/handsontable/pull/11708)
- Fixed a missing `touchend` handler that prevented editors from opening on mobile devices. [#11729](https://github.com/handsontable/handsontable/pull/11729)
- Fixed misalignment between rows and row headers when using `autoRowSize`. [#11736](https://github.com/handsontable/handsontable/pull/11736)
- Fixed layout inconsistencies caused by browser zoom and scaling. [#11739](https://github.com/handsontable/handsontable/pull/11739)
- Fixed an issue with the root-wrapper height calculation. [#11769](https://github.com/handsontable/handsontable/pull/11769)
- Fixed a `TypeError` being thrown after undoing operations on nested row structures. [#11793](https://github.com/handsontable/handsontable/pull/11793)
- Fixed `rowHeights` handling for merged cells. [#11795](https://github.com/handsontable/handsontable/pull/11795)
- Fixed visual issues across themes. [#11805](https://github.com/handsontable/handsontable/pull/11805)
- Fixed table misalignment after loading new data. [#11809](https://github.com/handsontable/handsontable/pull/11809)
- Angular: Fixed the tree-shaking mechanism for the Angular wrapper (`@handsontable/angular-wrapper`). [#11738](https://github.com/handsontable/handsontable/pull/11738)
- Fixed an issue with the deprecation warning being shown too often. [#11819](https://github.com/handsontable/handsontable/pull/11819)
- Fixed an issue with the classic (legacy) theme deprecation warning being displayed for non-root instances. [#11821](https://github.com/handsontable/handsontable/pull/11821)
- Fixed an issue with the table not rendering correctly when scrolling into extremely tall rows. [#11825](https://github.com/handsontable/handsontable/pull/11825)

#### Security
- Resolved critical vulnerabilities reported by `pnpm audit`. [#11798](https://github.com/handsontable/handsontable/pull/11798)

#### Deprecated
- Deprecated the legacy style (to be removed in version `17.0.0`). [#11790](https://github.com/handsontable/handsontable/pull/11790)
- Deprecated the PersistentState plugin (to be removed in version `17.0.0`). [#11835](https://github.com/handsontable/handsontable/pull/11835)

## 16.0.1

Released on July 10, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Documentation (16.0)](https://handsontable.com/docs/16.0)

</div>

#### Fixed
- Fixed a missing `touchend` handler that prevented the editor from opening on mobile devices. [#11729](https://github.com/handsontable/handsontable/pull/11729)

## 16.0.0

Released on July 9, 2025

For more information about this release see:

<div class="boxes-list gray">

- [Blog post (16.0.0)](https://handsontable.com/blog/handsontable-16-new-angular-wrapper-and-core-improvements)
- [Documentation (16.0)](https://handsontable.com/docs/16.0)
- [Migration guide (15.3 → 16.0)](@/guides/upgrade-and-migration/migrating-from-15.3-to-16.0/migrating-from-15.3-to-16.0.md)

</div>

#### Added
- **Breaking change**: Added a focus outline to the context and dropdown menus. [#11669](https://github.com/handsontable/handsontable/pull/11669)
- Improved Handsontable editor positioning. [#11593](https://github.com/handsontable/handsontable/pull/11593)
- Added a second-click cell deselection feature. [#11602](https://github.com/handsontable/handsontable/pull/11602)
- Added a new `textEllipsis` option. [#11609](https://github.com/handsontable/handsontable/pull/11609)
- Added backward compatibility for the renamed CSS variables. [#11676](https://github.com/handsontable/handsontable/pull/11676)
- Angular: Introduced a new Angular wrapper - `@handsontable/angular-wrapper`. [#11511](https://github.com/handsontable/handsontable/pull/11511)

#### Changed
- **Breaking change**: Updated the CSS theme variables and added `--ht-radio-*` variables. [#11470](https://github.com/handsontable/handsontable/pull/11470)
- **Breaking change**: Changed the `modifyData` hook to use visual indexes for both rows and columns. [#11501](https://github.com/handsontable/handsontable/pull/11501)

#### Fixed
- **Breaking change**: Fixed an issue with custom border overlapping row headers. [#11551](https://github.com/handsontable/handsontable/pull/11551)
- **Breaking change**: Fixed accessibility issues and introduced a new DOM structure with a wrapper and a portal. [#11579](https://github.com/handsontable/handsontable/pull/11579)
- Fixed a problem with the dropdown editor having a horizontal scrollbar on Windows with fractional scaling applied. [#11613](https://github.com/handsontable/handsontable/pull/11613)
- Fixed an issue with scrollbar styles on the Safari browser. [#11614](https://github.com/handsontable/handsontable/pull/11614)
- Fixed the column filter behavior when adding new columns. [#11616](https://github.com/handsontable/handsontable/pull/11616)
- Fixed an issue with the dropdown elements' colors. [#11661](https://github.com/handsontable/handsontable/pull/11661)
- Angular: Fixed an error of `this.hotInstance.getSettings(...).columns?.filter is not a function` in `angular-wrapper`. [#11695](https://github.com/handsontable/handsontable/pull/11695)

## Related

- [Migrating from 15.3 to 16.0](@/guides/upgrade-and-migration/migrating-from-15.3-to-16.0/migrating-from-15.3-to-16.0.md)

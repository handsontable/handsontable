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

## Older versions

The changelogs from older versions of Handsontable are
[available on GitHub](https://github.com/handsontable/handsontable/releases).

## Related

- [Migrating from 7.4 to 8.0](@/guides/upgrade-and-migration/migrating-from-7.4-to-8.0/migrating-from-7.4-to-8.0.md)

---
type: how-to
title: Migrating from 18.2 to 19.0
metaTitle: Migrating from 18.2 to 19.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.2 to Handsontable 19.0.
permalink: /migration-from-18.2-to-19.0
canonicalUrl: /migration-from-18.2-to-19.0
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.2 to 19.0 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.2 to 19.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.2 to 19.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 18.2 to Handsontable 19.0.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

Section 1 concerns the `autocomplete`, `dropdown`, and `handsontable` cell types, and applies only if you use one of them.

## 1. List cells keep their value on one line

This applies only to the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), and [`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) cell types, which render a dropdown arrow.

In a narrow column, the value in one of these cells used to wrap onto several lines and tangle with the dropdown arrow. The value now stays on a single line and truncates with an ellipsis, and the arrow's width is reserved so the content never reaches it.

### `wordWrap` and `textEllipsis` no longer apply to these cell types

The single-line-with-ellipsis behavior is fixed for these three cell types, so [`wordWrap`](@/api/options.md#wordwrap) (default `true`) and [`textEllipsis`](@/api/options.md#textellipsis) (default `false`) have no effect on them. Every other cell type still honors both options.

### Who is affected

You are affected only if you use the `autocomplete`, `dropdown`, or `handsontable` cell type **and** relied on its value wrapping onto multiple lines within the cell.

### How to migrate

Nothing to change in most cases, because a single-line value with the arrow clear of the text is what these cells were meant to show.

If you need a column whose cells wrap their content over several lines, use a cell type that has no dropdown arrow (for example [`text`](@/guides/cell-types/text-cell-type/text-cell-type.md)), or widen the column so the value fits.

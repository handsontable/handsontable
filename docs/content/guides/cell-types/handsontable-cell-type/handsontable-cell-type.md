---
id: kdie9yhz
title: Handsontable cell type
metaTitle: Handsontable cell type - JavaScript Data Grid | Handsontable
description: Add a spreadsheet editor in a popup, by using the Handsontable cell type.
permalink: /handsontable-cell-type
canonicalUrl: /handsontable-cell-type
react:
  id: fcxtj167
  metaTitle: Handsontable cell type - React Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Handsontable cell type

Add a spreadsheet editor in a popup, by using the Handsontable cell type.

[[toc]]

## Usage

**HOT-in-HOT opens by any of the following:**

- <kbd>**F2**</kbd> or <kbd>**Enter**</kbd> key is pressed while the cell is selected
- The triangle icon is clicked
- The cell content is double clicked

While HOT-in-HOT is opened, the text field above the HOT-in-HOT remains focused at all times.

**Keyboard bindings while the HOT-in-HOT is opened:**

- <kbd>**Escape**</kbd> - close editor and cancel change.
- <kbd>**Enter**</kbd> - close editor and apply change\*, move the selection in the main HOT downwards or according to the [`enterMoves`](@/api/options.md#enterMoves) setting.
- <kbd>**Tab**</kbd> - behaves as the <kbd>**Enter**</kbd> key, but move the selection in the main HOT to the right or to the left (depending on your [`layoutDirection`](@/api/options.md#layoutdirection) setting) or according to the [`tabMoves`](@/api/options.md#tabmoves)setting.
- <kbd>**Arrow Down**</kbd> - move the selection in HOT-in-HOT downwards. If the last row was selected, this has no effect.
- <kbd>**Arrow Up**</kbd> - move the selection in HOT-in-HOT upwards. If the first row was selected, deselect. If HOT-in-HOT was deselected, behave as the <kbd>**Enter**</kbd> key but move the selection in the main HOT upwards.
- <kbd>**Arrow Right**</kbd> - move the text cursor in the text field to the left. If the text cursor was at the start position, behave as the <kbd>**Enter**</kbd> key but move the selection in the main HOT to the left.
- <kbd>**Arrow Left**</kbd> - move the text cursor in the text field to the right. If the text cursor was at the end position, behave as the <kbd>**Tab**</kbd> key.

## Basic example

::: only-for javascript

::: example #example1 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/handsontable-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/handsontable-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/handsontable-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/handsontable-cell-type/react/example1.tsx)

:::

:::

## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

### Related API reference

- Configuration options:
  - [`type`](@/api/options.md#type)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getDataType()`](@/api/core.md#getdatatype)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta)

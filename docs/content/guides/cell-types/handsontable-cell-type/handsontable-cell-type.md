---
type: how-to
id: kdie9yhz
title: Handsontable cell type
metaTitle: Handsontable cell type - JavaScript Data Grid | Handsontable
description: Add a spreadsheet editor in a popup, by using the Handsontable cell type.
permalink: /handsontable-cell-type
canonicalUrl: /handsontable-cell-type
react:
  id: fcxtj167
  metaTitle: Handsontable cell type - React Data Grid | Handsontable
angular:
  id: cewiknc8
  metaTitle: Handsontable cell type - Angular Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---
Add a spreadsheet editor in a popup, by using the Handsontable cell type.

The Handsontable cell type embeds a second grid instance as a cell editor (HOT-in-HOT). Use it when users need to search and select from a large dataset.

[[toc]]

## Usage

HOT-in-HOT opens by any of the following:

- <kbd>**F2**</kbd> or <kbd>**Enter**</kbd> key is pressed while the cell is selected
- The triangle icon is clicked
- The cell content is double clicked

While HOT-in-HOT is opened, the text field above the HOT-in-HOT remains focused at all times.

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

::: only-for angular

::: example #example1 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/handsontable-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/handsontable-cell-type/angular/example1.html)

:::

:::

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| <kbd>**Escape**</kbd> | Close editor and cancel change |
| <kbd>**Enter**</kbd> | Close editor and apply change; move selection in the main HOT downwards or according to the [`enterMoves`](@/api/options.md#enterMoves) setting |
| <kbd>**Tab**</kbd> | Same as <kbd>**Enter**</kbd>, but move selection to the right or left according to the [`tabMoves`](@/api/options.md#tabmoves) setting |
| <kbd>**Arrow Down**</kbd> | Move selection in HOT-in-HOT downwards. No effect if last row is selected |
| <kbd>**Arrow Up**</kbd> | Move selection in HOT-in-HOT upwards. If the first row was selected, deselect. If HOT-in-HOT was deselected, behave as <kbd>**Enter**</kbd> but move main HOT selection upwards |
| <kbd>**Arrow Right**</kbd> | Move text cursor in the text field to the left. If cursor was at start, behave as <kbd>**Enter**</kbd> but move main HOT selection to the left |
| <kbd>**Arrow Left**</kbd> | Move text cursor in the text field to the right. If cursor was at end, behave as <kbd>**Tab**</kbd> |

## Result

After configuring the Handsontable cell type, cells display a text input with a trigger icon. Activating the cell opens a second embedded grid that users can navigate and select from. The selected row value is written back to the parent cell.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

**Configuration options**

<div class="boxes-list">

- [type](@/api/options.md#type)

</div>

**Core methods**

<div class="boxes-list">

- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [getDataType()](@/api/core.md#getdatatype)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [afterSetCellMeta](@/api/hooks.md#aftersetcellmeta)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeSetCellMeta](@/api/hooks.md#beforesetcellmeta)

</div>

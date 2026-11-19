---
type: how-to
title: Handsontable cell type
metaTitle: Handsontable cell type | Handsontable DataGrid for JavaScript
description: Add a spreadsheet editor in a popup, by using the Handsontable cell type.
permalink: /handsontable-cell-type
canonicalUrl: /handsontable-cell-type
react:
  metaTitle: Handsontable cell type | Handsontable DataGrid for React
angular:
  metaTitle: Handsontable cell type | Handsontable DataGrid for Angular
vue:
  metaTitle: Handsontable cell type | Handsontable DataGrid for Vue
searchCategory: Guides
category: Cell types
menuTag: updated
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

The editor's text field is a single-line `<input type="text">`, so it holds one line of text. A stored value with a line break opens without it. If you confirm such a value without typing, the cell keeps it, line break included. If you edit the text, the saved value has no line break. Keep the `source` labels on one line, and use the [`text`](@/guides/cell-types/text-cell-type/text-cell-type.md) cell type for values that need line breaks. Before 19.0 the field was a `<textarea>`; see the [migration guide](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#the-list-editors-edit-in-a-single-line-input).

With [`ariaTags`](@/api/options.md#ariatags) on, the text field is a combobox and HOT-in-HOT is its grid popup: a screen reader hears the field's name, such as "A, row 1", and that the field controls a grid with the same name. As you move through HOT-in-HOT, the screen reader announces the selected cell, while the focus stays in the text field. HOT-in-HOT follows the main grid's `ariaTags` setting. To build it without ARIA roles, set `ariaTags: false` inside the `handsontable` option.

The nested grid is not the main grid, so the options that drive main-grid UI have no effect when you set them inside the `handsontable` option: [`dialog`](@/api/options.md#dialog), [`notification`](@/api/options.md#notification), [`emptyDataState`](@/api/options.md#emptydatastate), [`pagination`](@/api/options.md#pagination), and [`loading`](@/api/options.md#loading). Set them on the main grid instead. The same applies to the nested grid that the [autocomplete](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) and [dropdown](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell types open.

## Basic example

The **Product** column uses the handsontable cell type for a searchable product list. The **Category** and **Warehouse** columns use the [dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) for compact selection from a short list.

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

::: only-for vue

::: example #example1 .docs-height-small :vue3

@[code](@/content/guides/cell-types/handsontable-cell-type/vue/example1.vue)

:::

:::

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| <kbd>**Escape**</kbd> | Close editor and cancel change |
| <kbd>**Enter**</kbd> | Close editor and apply change; move selection in the main HOT downwards or according to the [`enterMoves`](@/api/options.md#enterMoves) setting |
| <kbd>**Tab**</kbd> | Same as <kbd>**Enter**</kbd>, but move selection to the right or left according to the [`tabMoves`](@/api/options.md#tabmoves) setting |
| <kbd>**Arrow Down**</kbd> | Move selection in HOT-in-HOT downwards, in the same column. No effect if last row is selected |
| <kbd>**Arrow Up**</kbd> | Move selection in HOT-in-HOT upwards, in the same column. If the first row was selected, deselect. If HOT-in-HOT was deselected, behave as <kbd>**Enter**</kbd> but move main HOT selection upwards |
| <kbd>**Arrow Right**</kbd> | With a row selected in a HOT-in-HOT of more than one column, move the selection to the next column (the previous column in RTL), stopping at the last column. Otherwise, move the text cursor in the text field to the right |
| <kbd>**Arrow Left**</kbd> | With a row selected in a HOT-in-HOT of more than one column, move the selection to the previous column (the next column in RTL), stopping at the first column. Otherwise, move the text cursor in the text field to the left |

<kbd>**Enter**</kbd> and <kbd>**Tab**</kbd> write the value of the selected HOT-in-HOT cell, as a click on that cell does. Before 19.0, <kbd>**Arrow Left**</kbd> and <kbd>**Arrow Right**</kbd> always moved the text cursor; see the [migration guide](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#left-and-right-arrow-keys-move-across-the-columns-of-the-handsontable-editor-list).

For the full list of default keyboard shortcuts, see [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#handsontable-editor-keyboard-shortcuts).

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

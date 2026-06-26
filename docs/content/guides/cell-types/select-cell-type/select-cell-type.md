---
type: how-to
title: Select cell type
metaTitle: Select cell type - JavaScript Data Grid | Handsontable
description: Use the select cell type to collect user input with an HTML <select> element that creates a multi-item dropdown list.
permalink: /select-cell-type
canonicalUrl: /select-cell-type
react:
  metaTitle: Select cell type - React Data Grid | Handsontable
angular:
  metaTitle: Select cell type - Angular Data Grid | Handsontable
vue:
  metaTitle: Select cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
menuTag: updated
---
Use the select cell type to collect user input with an HTML `<select>` element that creates a multi-item dropdown list.

The select cell type renders a native HTML `<select>` element. Consider using the dropdown cell type instead for autocomplete and search capabilities.

[[toc]]

## Overview

The select cell type is a simpler form of the [dropdown](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell type.

## Usage

> **Note:** The select editor is intended as a reference implementation for writing custom editors rather than as a fully-featured editor. It is a much simpler form of the [Dropdown editor](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md). Use the dropdown cell type in your projects for a better user experience.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-types/select-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/select-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/select-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/select-cell-type/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/select-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/select-cell-type/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-types/select-cell-type/vue/example1.vue)

:::

:::

## Result

After configuring the select cell type, cells render a native HTML `<select>` element when the user activates them. The user picks a value from the list and the selected value is written to the data source.

## Keyboard navigation

Open the editor by pressing <kbd>**Enter**</kbd> or <kbd>**F2**</kbd>, or by double-clicking the cell. While the editor is open, use these keys to navigate the options:

- <kbd>**↑**</kbd> selects the previous option, and <kbd>**↓**</kbd> selects the next option. See the [select editor keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#select-editor-keyboard-shortcuts).
- <kbd>**Enter**</kbd> confirms the selected option and closes the editor. <kbd>**Escape**</kbd> cancels the change and closes the editor.

The cell uses a native HTML `<select>` element, so you can also type a character to jump to the next option that starts with that character. This typeahead comes from the browser, and its exact behavior varies between browsers.

## Related articles

**Related guides**

<div class="boxes-list">

- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)

</div>

**Configuration options**

<div class="boxes-list">

- [selectOptions](@/api/options.md#selectoptions)
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

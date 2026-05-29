---
type: how-to
id: pqe1xozj
title: Select cell type
metaTitle: Select cell type - JavaScript Data Grid | Handsontable
description: Use the select cell type to collect user input with an HTML <select> element that creates a multi-item dropdown list.
permalink: /select-cell-type
canonicalUrl: /select-cell-type
react:
  id: xmdreeu3
  metaTitle: Select cell type - React Data Grid | Handsontable
angular:
  id: dtzqxytv
  metaTitle: Select cell type - Angular Data Grid | Handsontable
vue:
  id: phqvirxa
  metaTitle: Select cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
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

## Result

After configuring the select cell type, cells render a native HTML `<select>` element when the user activates them. The user picks a value from the list and the selected value is written to the data source.

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

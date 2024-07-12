---
id: pqe1xozj
title: Select cell type
metaTitle: Select cell type - JavaScript Data Grid | Handsontable
description: Use the select cell type to collect user input with an HTML <select> element that creates a multi-item dropdown list.
permalink: /select-cell-type
canonicalUrl: /select-cell-type
react:
  id: xmdreeu3
  metaTitle: Select cell type - React Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Select cell type

Use the select cell type to collect user input with an HTML `<select>` element that creates a multi-item dropdown list.

[[toc]]

## Overview

The select cell type is a simpler form of the [dropdown](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell type.

## Usage

The select editor should be considered an example of how to write editors rather than used as a fully-featured editor. It is a much simpler form of the [Dropdown editor](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md). We recommend that you use the latter in your projects.

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

## Related articles

### Related guides

<div class="boxes-list gray">

- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)

</div>

### Related API reference

- Configuration options:
  - [`selectOptions`](@/api/options.md#selectoptions)
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

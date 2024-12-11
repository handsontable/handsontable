---
id: oi78d8nv
title: Dropdown cell type
metaTitle: Dropdown cell type - JavaScript Data Grid | Handsontable
description: Collect user input with a searchable list of choices, by using the dropdown cell type.
permalink: /dropdown-cell-type
canonicalUrl: /dropdown-cell-type
react:
  id: 5i86kjqu
  metaTitle: Dropdown cell type - React Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Dropdown cell type

Collect user input with a searchable list of choices, by using the dropdown cell type.

[[toc]]

## Overview

The dropdown cell type is based on an autocomplete cell type and can also be searchable.

## Usage

This example shows the usage of the dropdown feature. Dropdown is based on [Autocomplete](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cell type. All options used by `autocomplete` cell type apply to `dropdown` as well.

::: only-for javascript

Internally, cell `{type: 'dropdown'}` is equivalent to cell `{type: 'autocomplete', strict: true, filter: false}`. Therefore you can think of `dropdown` as a searchable `<select>`.

:::

::: only-for react

Internally, cell `type="dropdown"` is equivalent to cell `type="autocomplete" strict={true} filter={false}`. Therefore you can think of `dropdown` as a searchable `<select>`.

:::

::: only-for javascript

::: example #example1 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/dropdown-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/dropdown-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/dropdown-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/dropdown-cell-type/react/example1.tsx)

:::

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Select cell type](@/guides/cell-types/select-cell-type/select-cell-type.md)

</div>

### Related API reference

- Configuration options:
  - [`allowHtml`](@/api/options.md#allowhtml)
  - [`source`](@/api/options.md#source)
  - [`trimDropdown`](@/api/options.md#trimdropdown)
  - [`type`](@/api/options.md#type)
  - [`visibleRows`](@/api/options.md#visiblerows)
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

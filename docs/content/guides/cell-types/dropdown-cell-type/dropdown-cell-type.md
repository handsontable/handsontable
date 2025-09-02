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
angular:
  id: yatyane1
  metaTitle: Dropdown cell type - Angular Data Grid | Handsontable
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

::: only-for angular

Internally, cell `{ type: 'dropdown' }` is equivalent to cell `{ type:'autocomplete', strict: true, filter: false }`. Therefore you can think of `dropdown` as a searchable `<select>`.

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

::: only-for angular

::: example #example1 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/dropdown-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/dropdown-cell-type/angular/example1.html)

:::

:::

## The `source` option

The `source` option can be provided in two formats:

### Array of values

You can provide the `source` option as an array of values that will be used as the dropdown options.

::: only-for javascript

::: example #example2 .docs-height-small --js 1 --ts 2


@[code](@/content/guides/cell-types/dropdown-cell-type/javascript/example2.js)

@[code](@/content/guides/cell-types/dropdown-cell-type/javascript/example2.ts)


:::

:::


::: only-for react

::: example #example2 .docs-height-small :react --js 1 --ts 2


@[code](@/content/guides/cell-types/dropdown-cell-type/react/example2.jsx)

@[code](@/content/guides/cell-types/dropdown-cell-type/react/example2.tsx)


:::

:::


::: only-for angular

::: example #example2 .docs-height-small :angular --ts 1 --html 2


@[code](@/content/guides/cell-types/dropdown-cell-type/angular/example2.ts)

@[code](@/content/guides/cell-types/dropdown-cell-type/angular/example2.html)


:::

:::

### Array of objects

You can provide the `source` option as an array of objects with `key` and `value` properties. The `value` property will be used as the dropdown option, while the entire object will be used as the value of the cell.

::: only-for javascript

::: example #example3 .docs-height-small --js 1 --ts 2


@[code](@/content/guides/cell-types/dropdown-cell-type/javascript/example3.js)

@[code](@/content/guides/cell-types/dropdown-cell-type/javascript/example3.ts)


:::

:::


::: only-for react

::: example #example3 .docs-height-small :react --js 1 --ts 2


@[code](@/content/guides/cell-types/dropdown-cell-type/react/example3.jsx)

@[code](@/content/guides/cell-types/dropdown-cell-type/react/example3.tsx)


:::

:::


::: only-for angular

::: example #example3 .docs-height-small :angular --ts 1 --html 2


@[code](@/content/guides/cell-types/dropdown-cell-type/angular/example3.ts)

@[code](@/content/guides/cell-types/dropdown-cell-type/angular/example3.html)


:::

:::


#### API methods

When working with object-based dropdown data, you can use methods like [`getSourceData()`](@/api/core.md#getsourcedata), [`getSourceDataAtCell()`](@/api/core.md#getsourcedataatcell), [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow) etc., to get the data in its original object format with both `key` and `value` properties. The [`getData()`](@/api/core.md#getdata) method will return only the `value` property's value.


::: tip

**Note:** When the `source` option is declared as an array of `key` + `value` objects, the data in the edited cell should also be an object with `key` + `value` properties.

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
  - [`valueGetter`](@/api/options.md#valuegetter)
  - [`valueSetter`](@/api/options.md#valueSetter)
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

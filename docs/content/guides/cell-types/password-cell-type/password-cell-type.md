---
id: a7a5mkrw
title: Password cell type
metaTitle: Password cell type - JavaScript Data Grid | Handsontable
description: Use the password cell type to mask confidential values by rendering entered characters as symbols.
permalink: /password-cell-type
canonicalUrl: /password-cell-type
react:
  id: gydne13d
  metaTitle: Password cell type - React Data Grid | Handsontable
angular:
  id: 2x5025ww
  metaTitle: Password cell type - Angular Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Password cell type

Use the password cell type to mask confidential values by rendering entered characters as symbols.

[[toc]]

## Overview

The password cell type behaves like a text cell, the only difference being that it masks its value using asterisks in the cell renderer. An `<input type="password">` field is used for the cell editor. Data is stored in the data source as plain text.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/password-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/password-cell-type/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/password-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/password-cell-type/angular/example1.html)

:::

:::

## Fixed hash length

By default, every hash has a length equal to the length of its corresponding value. Use option `hashLength` to set a fixed hash length.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/javascript/example2.js)
@[code](@/content/guides/cell-types/password-cell-type/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/react/example2.jsx)
@[code](@/content/guides/cell-types/password-cell-type/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/password-cell-type/angular/example2.ts)
@[code](@/content/guides/cell-types/password-cell-type/angular/example2.html)

:::

:::

## Custom hash symbol

By default, every hash consists of asterisks `*`. Use the option `hashSymbol` to set a custom hash symbol. You can use any character, entity, or even HTML. Note that you can't change the symbol used by the input field due to browser limitations.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/javascript/example3.js)
@[code](@/content/guides/cell-types/password-cell-type/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/react/example3.jsx)
@[code](@/content/guides/cell-types/password-cell-type/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/password-cell-type/angular/example3.ts)
@[code](@/content/guides/cell-types/password-cell-type/angular/example3.html)

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

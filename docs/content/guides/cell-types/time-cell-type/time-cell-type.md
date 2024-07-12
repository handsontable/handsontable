---
id: q63yhvq5
title: Time cell type
metaTitle: Time cell type - JavaScript Data Grid | Handsontable
description: Use the time cell type to display, format, and validate values as times. The time cell type uses Moment.js as a time formatter.
permalink: /time-cell-type
canonicalUrl: /time-cell-type
react:
  id: 34n5nwja
  metaTitle: Time cell type - React Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Time cell type

Use the time cell type to display, format, and validate values as times. The time cell type uses Moment.js as a time formatter.

[[toc]]

## Usage
To use the time cell type, set the `type: 'time'` option in the [`columns`](@/api/options.md#columns) array or the [`cells`](@/api/options.md#cells) function.
The time cell uses [Moment.js](https://github.com/moment/moment) as the time formatter, therefore you must add the following required dependency:

```html
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
```

All data entered into the time-typed cells is eventually validated against the default time format - `h:mm:ss a`, which translates to, for example, `9:30:00 am` unless another format is provided as the `timeFormat`.
If you enable the [`correctFormat`](@/api/options.md#correctformat) configuration option, the values will be automatically formatted to match the desired time format.

::: tip

By default, the values entered into the time-type column are not validated, so if you want them to display in the proper format, remember to call [`hot.validateCells()`](@/api/core.md#validatecells) after the table initialization.

:::

## Basic example

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-types/time-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/time-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/time-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/time-cell-type/react/example1.tsx)

:::

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

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

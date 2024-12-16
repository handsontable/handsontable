---
id: p25m5sco
title: Date cell type
metaTitle: Date cell type - JavaScript Data Grid | Handsontable
description: Use the date cell type to display, format, and validate date values. Pick a date using an interactive pop-up editor.
permalink: /date-cell-type
canonicalUrl: /date-cell-type
react:
  id: u7t2rn0n
  metaTitle: Date cell type - React Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Date cell type

Use the date cell type to display, format, and validate date values. Pick a date using an interactive pop-up editor.

[[toc]]

## Usage

To set the date cell type, use the option `type: 'date'` in the [`columns`](@/api/options.md#columns) array or [`cells`](@/api/options.md#cells) function. The date cell uses [Pikaday datepicker](https://github.com/dbushell/Pikaday) as the UI control. Pikaday uses [Moment.js](https://github.com/moment/moment) as a date formatter.

Note that date cell requires additional modules :

```html
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@handsontable/pikaday@1.0.0/pikaday.min.js"></script>
```

## Date format

`date` cells accept strings that are formatted in line with the [`dateFormat`](@/api/options.md#dateformat) setting.

The default date format is `'DD/MM/YYYY'`.

Handsontable doesn't support JavaScript's `Date` object.

### Change the date format

To change the date format accepted by `date` cells, set the [`dateFormat`](@/api/options.md#dateformat) configuration option to a string with your preferred format. For example:

::: only-for javascript

```js
dateFormat: 'YYYY-MM-DD',
```

:::

::: only-for react

```jsx
dateFormat={'YYYY-MM-DD'}
```

:::

### Autocorrect invalid dates

By default, when the user enters a date in a format that doesn't match the [`dateFormat`](@/api/options.md#dateformat) setting, the date is treated as invalid.

You can let Handsontable correct such dates automatically, so they match the required format. To do this, set the [`correctFormat`](@/api/options.md#correctformat) option to `true`. For example:

::: only-for javascript

```js
dateFormat: 'YYYY-MM-DD',

// default behavior
// date entered as `30/12/2022` will be invalid
correctFormat: false,

// date entered as `30/12/2022` will be corrected to `2022/12/30`
correctFormat: true,
```

:::

::: only-for react

```jsx
dateFormat={'YYYY-MM-DD'}

// default behavior
// date entered as `30/12/2022` will be invalid
correctFormat={false}

// date entered as `30/12/2022` will be corrected to `2022/12/30`
correctFormat={true}
```

:::

## Basic example

Click on one of the ▼ icons to open an interactive date editor.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-types/date-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/date-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/date-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/date-cell-type/react/example1.tsx)

:::

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

### Related API reference

- Configuration options:
  - [`correctFormat`](@/api/options.md#correctformat)
  - [`dateFormat`](@/api/options.md#dateformat)
  - [`datePickerConfig`](@/api/options.md#datepickerconfig)
  - [`defaultDate`](@/api/options.md#defaultdate)
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

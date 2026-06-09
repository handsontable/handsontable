---
type: how-to
title: Date cell type
metaTitle: Date cell type - JavaScript Data Grid | Handsontable
description: Display, format, sort, and filter dates correctly by using the date cell type.
permalink: /date-cell-type
canonicalUrl: /date-cell-type
react:
  metaTitle: Date cell type - React Data Grid | Handsontable
angular:
  metaTitle: Date cell type - Angular Data Grid | Handsontable
vue:
  metaTitle: Date cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---
Display, format, sort, and filter dates correctly by using the date cell type.

The date cell type provides a date picker for selecting and displaying dates. It validates input against a configurable date format.

[[toc]]

## Overview

The date cell type lets you treat cell values as dates: format how they are displayed, validate input, and use an interactive date picker in the editor. Use the `intl-date` or `date` cell type with the native [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) API and ISO 8601 date strings.

## Date cell type demo

In the following demo, multiple columns use the date cell type with different formatting styles:
- **Product date**: Date with short style formatting
- **Payment date**: Customized date formatting
- **Registration date**: Customized date formatting with weekday, month, day, year

::: only-for javascript
::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-types/date-cell-type/javascript/example1.html)
@[code collapse={12-43,48-79}](@/content/guides/cell-types/date-cell-type/javascript/example1.js)
@[code collapse={12-43,48-79}](@/content/guides/cell-types/date-cell-type/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react --js 1 --ts 2

@[code collapse={8-30,67-98,138-167}](@/content/guides/cell-types/date-cell-type/react/example1.jsx)
@[code collapse={9-31,68-99,139-168}](@/content/guides/cell-types/date-cell-type/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code collapse={54-109,114-149}](@/content/guides/cell-types/date-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/date-cell-type/angular/example1.html)

:::
:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-types/date-cell-type/vue/example1.vue)

:::

:::

## Use the date cell type

Use the **object-style** configuration by setting the [`type`](@/api/options.md#type) option to `'intl-date'` or `'date'` and [`dateFormat`](@/api/options.md#dateformat) to an object. The locale is controlled via the [`locale`](@/api/options.md#locale) option.

::: only-for javascript

```js
// set the date cell type for the entire grid
type: 'intl-date',
locale: 'en-US',
dateFormat: {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
},

// set the date cell type for a single column
columns: [
  {
    type: 'intl-date',
    locale: 'en-US',
    dateFormat: {
      dateStyle: 'short'
    }
  }
],

// set the date cell type for a single cell
cell: [
  {
    row: 0,
    col: 2,
    type: 'intl-date',
    locale: 'en-US',
    dateFormat: { dateStyle: 'medium' }
  }
],
```

:::

::: only-for react

```jsx
// set the date cell type for the entire grid
type="intl-date"
locale="en-US"
dateFormat={{
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}}

// set the date cell type for a single column
columns={[{
  type: 'intl-date',
  locale: 'en-US',
  dateFormat: { dateStyle: 'short' }
}]}

// set the date cell type for a single cell
cell={[{
  row: 0,
  col: 2,
  type: 'intl-date',
  locale: 'en-US',
  dateFormat: { dateStyle: 'medium' }
}]}
```

:::

::: only-for angular

```ts
// set the date cell type for the entire grid
settings1 = {
  type: 'intl-date',
  locale: 'en-US',
  dateFormat: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
};

// set the date cell type for a single column
settings2 = {
  columns: [
    {
      type: 'intl-date',
      locale: 'en-US',
      dateFormat: { dateStyle: 'short' }
    }
  ]
};

// set the date cell type for a single cell
settings3 = {
  cell: [
    {
      row: 0,
      col: 2,
      type: 'intl-date',
      locale: 'en-US',
      dateFormat: { dateStyle: 'medium' }
    }
  ]
};
```

:::

::: only-for vue

```js
// set the date cell type for the entire grid (Intl, recommended)
const hotSettings = ref({
  type: 'intl-date',
  locale: 'en-US',
  dateFormat: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
});

// set the date cell type for a single column
const hotSettings = ref({
  columns: [
    {
      type: 'intl-date',
      locale: 'en-US',
      dateFormat: { dateStyle: 'short' }
    }
  ]
});

// set the date cell type for a single cell
const hotSettings = ref({
  cell: [
    {
      row: 0,
      col: 2,
      type: 'intl-date',
      locale: 'en-US',
      dateFormat: { dateStyle: 'medium' }
    }
  ]
});
```

:::

For `intl-date` and `date` cells, source data **must** be in **ISO 8601 date format** (`YYYY-MM-DD`) for dates to work correctly. The `dateFormat` object only affects how dates are displayed; sorting and filtering rely on the underlying ISO value.

## Format dates

To control how dates are displayed in [cell renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md), use the [`dateFormat`](@/api/options.md#dateformat) option.

Since Handsontable 18.0, the **object form** of `dateFormat` with the `intl-date` and `date` cell types is required. It uses the native [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) API. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

### Using Intl.DateTimeFormat

The `dateFormat` option accepts all properties of [`Intl.DateTimeFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat). Use it with `type: 'intl-date'` or `type: 'date'`.

::: only-for javascript

```js
columns: [
  {
    type: 'intl-date',
    locale: 'en-US',
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  },
  {
    type: 'intl-date',
    locale: 'de-DE',
    dateFormat: {
      dateStyle: 'long'
    }
  }
]
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    type: 'intl-date',
    locale: 'en-US',
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  }, {
    type: 'intl-date',
    locale: 'de-DE',
    dateFormat: { dateStyle: 'long' }
  }]}
/>
```

:::

::: only-for angular

```ts
settings = {
  columns: [
    {
      type: 'intl-date',
      locale: 'en-US',
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    },
    {
      type: 'intl-date',
      locale: 'de-DE',
      dateFormat: { dateStyle: 'long' }
    }
  ]
};
```

:::

::: only-for vue

```js
const hotSettings = ref({
  columns: [
    {
      type: 'intl-date',
      locale: 'en-US',
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    },
    {
      type: 'intl-date',
      locale: 'de-DE',
      dateFormat: { dateStyle: 'long' }
    }
  ]
});
```

:::

**Date-specific options**

**Style shortcuts:**

| Property     | Possible values                                    | Description                                                                 |
| ------------ | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `dateStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`          | Date formatting style (weekday, day, month, year, era)                       |
| `timeStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`          | Time part style (hour, minute, second, timeZoneName); use for date+time      |

**Date-time component options:**

| Property                 | Possible values                                                                 | Description                |
| ------------------------ | ------------------------------------------------------------------------------- | -------------------------- |
| `weekday`                | `'long'`, `'short'`, `'narrow'`                                                 | Weekday representation     |
| `era`                    | `'long'`, `'short'`, `'narrow'`                                                 | Era representation         |
| `year`                   | `'numeric'`, `'2-digit'`                                                        | Year representation        |
| `month`                  | `'numeric'`, `'2-digit'`, `'long'`, `'short'`, `'narrow'`                       | Month representation       |
| `day`                    | `'numeric'`, `'2-digit'`                                                        | Day representation         |
| `dayPeriod`              | `'narrow'`, `'short'`, `'long'`                                                 | Day period (e.g. "am")     |
| `hour`                   | `'numeric'`, `'2-digit'`                                                        | Hour (if time included)    |
| `minute`                 | `'numeric'`, `'2-digit'`                                                        | Minute                     |
| `second`                 | `'numeric'`, `'2-digit'`                                                        | Second                     |
| `fractionalSecondDigits` | `1`, `2`, `3`                                                                   | Fraction-of-second digits  |
| `timeZoneName`           | `'long'`, `'short'`, `'shortOffset'`, `'longOffset'`, `'shortGeneric'`, `'longGeneric'` | Time zone display    |

**Locale and other options:**

| Property          | Possible values                                           | Description                    |
| ----------------- | --------------------------------------------------------- | ------------------------------ |
| `localeMatcher`   | `'best fit'` (default), `'lookup'`                        | Locale matching algorithm      |
| `calendar`       | `'chinese'`, `'gregory'`, `'persian'`, etc.               | Calendar to use                |
| `numberingSystem` | `'latn'`, `'arab'`, `'hans'`, etc.                        | Numbering system               |
| `timeZone`        | IANA time zone (e.g. `'UTC'`, `'America/New_York'`)       | Time zone for formatting       |
| `hour12`          | `true`, `false`                                           | 12-hour vs 24-hour time        |
| `hourCycle`       | `'h11'`, `'h12'`, `'h23'`, `'h24'`                        | Hour cycle                     |
| `formatMatcher`   | `'basic'`, `'best fit'` (default)                         | Format matching algorithm      |

For a complete reference, see the [`dateFormat` API documentation](@/api/options.md#dateformat) or [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).

### Editor behavior

The [`dateFormat`](@/api/options.md#dateformat) option controls how dates are displayed in the cell. The editor (date picker or text input) may show the value in a normalized form; for `intl-date` and `date`, the underlying value remains in ISO 8601 format.

## Result

After configuring the date cell type, cells display dates formatted according to your `dateFormat` configuration. Clicking an `intl-date` or `date` cell opens a native date picker. Source data is stored in ISO 8601 format (`YYYY-MM-DD`) regardless of the display format.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

**Configuration options**

<div class="boxes-list">

- [dateFormat](@/api/options.md#dateformat)
- [locale](@/api/options.md#locale)
- [type](@/api/options.md#type)
- [defaultDate](@/api/options.md#defaultdate)
- [valueFormatter](@/api/options.md#valueformatter)
- [valueParser](@/api/options.md#valueparser)
- [valueSetter](@/api/options.md#valuesetter)
- [valueGetter](@/api/options.md#valuegetter)

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

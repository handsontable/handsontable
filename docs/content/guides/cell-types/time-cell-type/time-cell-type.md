---
type: how-to
id: q63yhvq5
title: Time cell type
metaTitle: Time cell type - JavaScript Data Grid | Handsontable
description: Display, format, sort, and filter time values correctly by using the time cell type.
permalink: /time-cell-type
canonicalUrl: /time-cell-type
react:
  id: 34n5nwja
  metaTitle: Time cell type - React Data Grid | Handsontable
angular:
  id: fu9fqphw
  metaTitle: Time cell type - Angular Data Grid | Handsontable
vue:
  id: bxoffcid
  metaTitle: Time cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---
Display, format, sort, and filter time values correctly by using the time cell type. Edit times via the cell editor.

The time cell type formats time values using a configurable format string. Use it for scheduling, logging, or any time-based data.

[[toc]]

## Overview

The time cell type lets you treat cell values as times: format how they are displayed and validate input. Use the `intl-time` or `time` cell type with the native [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) API and 24-hour time strings.

## Time cell type demo

In the following demo, the **Start**, **Break start**, and **End** columns use the time cell type with different formats: short style, custom format with hours, minutes, and seconds, and format with day period. Use the locale selector to see how each format varies by locale.

::: only-for javascript
::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-types/time-cell-type/javascript/example1.html)
@[code collapse={12-18,23-53}](@/content/guides/cell-types/time-cell-type/javascript/example1.js)
@[code collapse={12-18,23-53}](@/content/guides/cell-types/time-cell-type/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react --js 1 --ts 2

@[code collapse={8-30,67-73,113-143}](@/content/guides/cell-types/time-cell-type/react/example1.jsx)
@[code collapse={9-31,68-74,114-144}](@/content/guides/cell-types/time-cell-type/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code collapse={54-84,89-126}](@/content/guides/cell-types/time-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/time-cell-type/angular/example1.html)

:::
:::

## Use the time cell type

Use the **object-style** configuration by setting the [`type`](@/api/options.md#type) option to `'intl-time'` or `'time'` and [`timeFormat`](@/api/options.md#timeformat) to an object. The locale is controlled via the [`locale`](@/api/options.md#locale) option.

::: only-for javascript

```js
// set the time cell type for the entire grid
type: 'intl-time',
locale: 'en-US',
timeFormat: {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
},

// set the time cell type for a single column
columns: [
  {
    type: 'intl-time',
    locale: 'en-US',
    timeFormat: {
      timeStyle: 'medium'
    }
  }
],

// set the time cell type for a single cell
cell: [
  {
    row: 0,
    col: 2,
    type: 'intl-time',
    locale: 'en-US',
    timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true }
  }
],
```

:::

::: only-for react

```jsx
// set the time cell type for the entire grid
type="intl-time"
locale="en-US"
timeFormat={{
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
}}

// set the time cell type for a single column
columns={[{
  type: 'intl-time',
  locale: 'en-US',
  timeFormat: { timeStyle: 'medium' }
}]}

// set the time cell type for a single cell
cell={[{
  row: 0,
  col: 2,
  type: 'intl-time',
  locale: 'en-US',
  timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true }
}]}
```

:::

::: only-for angular

```ts
// set the time cell type for the entire grid
settings1 = {
  type: 'intl-time',
  locale: 'en-US',
  timeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }
};

// set the time cell type for a single column
settings2 = {
  columns: [
    {
      type: 'intl-time',
      locale: 'en-US',
      timeFormat: { timeStyle: 'medium' }
    }
  ]
};

// set the time cell type for a single cell
settings3 = {
  cell: [
    {
      row: 0,
      col: 2,
      type: 'intl-time',
      locale: 'en-US',
      timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true }
    }
  ]
};
```

:::

For `intl-time` and `time` cells, source data **must** be in **24-hour time format** (`HH:mm`, `HH:mm:ss`, or `HH:mm:ss.SSS`) for times to work correctly. The `timeFormat` object only affects how times are displayed; sorting and filtering rely on the underlying value.

## Format times

To control how times are displayed in [cell renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md), use the [`timeFormat`](@/api/options.md#timeformat) option.

Since Handsontable 18.0, the **object form** of `timeFormat` with the `intl-time` and `time` cell types is required. It uses the native [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) API. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

### Using Intl.DateTimeFormat

The `timeFormat` option accepts properties of [`Intl.DateTimeFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat) relevant to time. Use it with `type: 'intl-time'` or `type: 'time'`.

::: only-for javascript

```js
columns: [
  {
    type: 'intl-time',
    locale: 'en-US',
    timeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }
  },
  {
    type: 'intl-time',
    locale: 'de-DE',
    timeFormat: {
      timeStyle: 'medium'
    }
  }
]
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    type: 'intl-time',
    locale: 'en-US',
    timeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }
  }, {
    type: 'intl-time',
    locale: 'de-DE',
    timeFormat: { timeStyle: 'medium' }
  }]}
/>
```

:::

::: only-for angular

```ts
settings = {
  columns: [
    {
      type: 'intl-time',
      locale: 'en-US',
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }
    },
    {
      type: 'intl-time',
      locale: 'de-DE',
      timeFormat: { timeStyle: 'medium' }
    }
  ]
};
```

:::

**Time-specific options**

**Style shortcuts:**

| Property     | Possible values                                    | Description                                                                 |
| ------------ | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `timeStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`          | Time formatting style (hour, minute, second, timeZoneName)                   |

**Time component options:**

| Property                 | Possible values                                                                 | Description                |
| ------------------------ | ------------------------------------------------------------------------------- | -------------------------- |
| `hour`                   | `'numeric'`, `'2-digit'`                                                        | Hour representation        |
| `minute`                 | `'numeric'`, `'2-digit'`                                                        | Minute representation      |
| `second`                 | `'numeric'`, `'2-digit'`                                                        | Second representation       |
| `fractionalSecondDigits` | `1`, `2`, `3`                                                                   | Fraction-of-second digits   |
| `dayPeriod`              | `'narrow'`, `'short'`, `'long'`                                                 | Day period (e.g. "am")     |
| `timeZoneName`           | `'long'`, `'short'`, `'shortOffset'`, `'longOffset'`, `'shortGeneric'`, `'longGeneric'` | Time zone display    |

**Locale and other options:**

| Property          | Possible values                                           | Description                    |
| ----------------- | --------------------------------------------------------- | ------------------------------ |
| `localeMatcher`   | `'best fit'` (default), `'lookup'`                        | Locale matching algorithm      |
| `timeZone`        | IANA time zone (e.g. `'UTC'`, `'America/New_York'`)      | Time zone for formatting       |
| `hour12`          | `true`, `false`                                           | 12-hour vs 24-hour time        |
| `hourCycle`       | `'h11'`, `'h12'`, `'h23'`, `'h24'`                        | Hour cycle                     |
| `formatMatcher`   | `'basic'`, `'best fit'` (default)                         | Format matching algorithm      |

For a complete reference, see the [`timeFormat` API documentation](@/api/options.md#timeformat) or [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).

### Editor behavior

The [`timeFormat`](@/api/options.md#timeformat) option controls how times are displayed in the cell. The editor may show the value in a normalized form; for `intl-time` and `time`, the underlying value remains in 24-hour format (`HH:mm`, `HH:mm:ss`, or `HH:mm:ss.SSS`).

## Result

After configuring the time cell type, cells display time values formatted according to your `timeFormat` configuration. Clicking an `intl-time` or `time` cell opens a native time picker. Source data is stored in 24-hour format (`HH:mm`, `HH:mm:ss`, or `HH:mm:ss.SSS`) regardless of the display format.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

**Configuration options**

<div class="boxes-list">

- [timeFormat](@/api/options.md#timeformat)
- [locale](@/api/options.md#locale)
- [type](@/api/options.md#type)
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

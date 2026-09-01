---
type: how-to
title: Date-time cell type
metaTitle: Date-time cell type - JavaScript Data Grid | Handsontable
description: Display, format, sort, and filter combined date and time values by using the datetime cell type.
permalink: /datetime-cell-type
canonicalUrl: /datetime-cell-type
react:
  metaTitle: Date-time cell type - React Data Grid | Handsontable
angular:
  metaTitle: Date-time cell type - Angular Data Grid | Handsontable
vue:
  metaTitle: Date-time cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
menuTag: new
---
Display, format, sort, and filter combined date and time values by using the datetime cell type. Edit values via a native date-time picker.

The datetime cell type formats an ISO 8601 date-time value using a configurable Intl format. Use it for deadlines, timestamps, or any data that carries both a date and a time.

[[toc]]

## Overview

The datetime cell type lets you treat cell values as combined dates and times: format how they are displayed, edit them with a native picker, and validate input. Use the `intl-datetime` cell type with the native [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) API and ISO 8601 date-time strings.

## Date-time cell type demo

In the following demo, the **Deadline** and **Created** columns use the datetime cell type with different formats: a `dateStyle`/`timeStyle` shortcut, and a custom format with a 24-hour clock. Sorting and filtering operate on the underlying ISO values, so they stay correct regardless of the display format.

::: only-for javascript
::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-types/datetime-cell-type/javascript/example1.html)
@[code](@/content/guides/cell-types/datetime-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/datetime-cell-type/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/datetime-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/datetime-cell-type/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/datetime-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/datetime-cell-type/angular/example1.html)

:::
:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-types/datetime-cell-type/vue/example1.vue)

:::

:::

## Use the datetime cell type

Set the [`type`](@/api/options.md#type) option to `'intl-datetime'` and [`dateTimeFormat`](@/api/options.md#datetimeformat) to an object. The locale is controlled via the [`locale`](@/api/options.md#locale) option.

::: only-for javascript

```js
// set the datetime cell type for the entire grid
type: 'intl-datetime',
locale: 'en-US',
dateTimeFormat: {
  dateStyle: 'medium',
  timeStyle: 'short'
},

// set the datetime cell type for a single column
columns: [
  {
    type: 'intl-datetime',
    locale: 'en-US',
    dateTimeFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  }
],

// set the datetime cell type for a single cell
cell: [
  {
    row: 0,
    col: 1,
    type: 'intl-datetime',
    locale: 'en-US',
    dateTimeFormat: { dateStyle: 'short', timeStyle: 'short' }
  }
],
```

:::

::: only-for react

```jsx
// set the datetime cell type for the entire grid
type="intl-datetime"
locale="en-US"
dateTimeFormat={{
  dateStyle: 'medium',
  timeStyle: 'short'
}}

// set the datetime cell type for a single column
columns={[{
  type: 'intl-datetime',
  locale: 'en-US',
  dateTimeFormat: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }
}]}

// set the datetime cell type for a single cell
cell={[{
  row: 0,
  col: 1,
  type: 'intl-datetime',
  locale: 'en-US',
  dateTimeFormat: { dateStyle: 'short', timeStyle: 'short' }
}]}
```

:::

::: only-for angular

```ts
// set the datetime cell type for the entire grid
settings1 = {
  type: 'intl-datetime',
  locale: 'en-US',
  dateTimeFormat: {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
};

// set the datetime cell type for a single column
settings2 = {
  columns: [
    {
      type: 'intl-datetime',
      locale: 'en-US',
      dateTimeFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    }
  ]
};

// set the datetime cell type for a single cell
settings3 = {
  cell: [
    {
      row: 0,
      col: 1,
      type: 'intl-datetime',
      locale: 'en-US',
      dateTimeFormat: { dateStyle: 'short', timeStyle: 'short' }
    }
  ]
};
```

:::

::: only-for vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

// set the datetime cell type for a single column
const hotSettings = ref<GridSettings>({
  columns: [
    {
      type: 'intl-datetime',
      locale: 'en-US',
      dateTimeFormat: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    }
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <HotTable :settings="hotSettings" />
</template>
```

:::

For `intl-datetime` cells, source data **must** be in **ISO 8601 date-time format** (`YYYY-MM-DDTHH:mm:ss`) for values to work correctly. A date-only value (`YYYY-MM-DD`) is treated as midnight. The `dateTimeFormat` object only affects how values are displayed; sorting and filtering rely on the underlying ISO value.

## Format date-time values

To control how values are displayed in [cell renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md), use the [`dateTimeFormat`](@/api/options.md#datetimeformat) option. It uses the native [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) API. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

### Using Intl.DateTimeFormat

The `dateTimeFormat` option accepts properties of [`Intl.DateTimeFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat). Use it with `type: 'intl-datetime'`.

**Style shortcuts:**

| Property     | Possible values                             | Description                                                |
| ------------ | ------------------------------------------- | ---------------------------------------------------------- |
| `dateStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`   | Date formatting style (weekday, day, month, year, era)     |
| `timeStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`   | Time formatting style (hour, minute, second, timeZoneName) |

**Date-time component options:**

| Property                 | Possible values                                            | Description               |
| ------------------------ | ---------------------------------------------------------- | ------------------------- |
| `weekday`                | `'long'`, `'short'`, `'narrow'`                            | Weekday representation    |
| `year`                   | `'numeric'`, `'2-digit'`                                   | Year representation       |
| `month`                  | `'numeric'`, `'2-digit'`, `'long'`, `'short'`, `'narrow'`  | Month representation      |
| `day`                    | `'numeric'`, `'2-digit'`                                   | Day representation        |
| `hour`                   | `'numeric'`, `'2-digit'`                                   | Hour representation       |
| `minute`                 | `'numeric'`, `'2-digit'`                                   | Minute representation     |
| `second`                 | `'numeric'`, `'2-digit'`                                   | Second representation     |
| `fractionalSecondDigits` | `1`, `2`, `3`                                              | Fraction-of-second digits |
| `timeZoneName`           | `'long'`, `'short'`, `'shortOffset'`, `'longOffset'`       | Time zone display         |

**Locale and other options:**

| Property          | Possible values                                     | Description                    |
| ----------------- | --------------------------------------------------- | ------------------------------ |
| `localeMatcher`   | `'best fit'` (default), `'lookup'`                  | Locale matching algorithm      |
| `timeZone`        | IANA time zone (e.g. `'UTC'`, `'America/New_York'`) | Time zone for formatting       |
| `hour12`          | `true`, `false`                                     | 12-hour vs 24-hour time        |
| `hourCycle`       | `'h11'`, `'h12'`, `'h23'`, `'h24'`                  | Hour cycle                     |

For a complete reference, see the [`dateTimeFormat` API documentation](@/api/options.md#datetimeformat) or [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).

### Editor behavior

Clicking an `intl-datetime` cell opens the browser's native [`datetime-local`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local) picker. The editor shows the value in the `YYYY-MM-DDTHH:mm:ss` form the native input expects; on commit, the value is stored back in that ISO form. The `dateTimeFormat` option only affects the rendered display, not the stored value.

## Result

After configuring the datetime cell type, cells display date-time values formatted according to your `dateTimeFormat` configuration. Clicking a cell opens a native date-time picker. Source data is stored in ISO 8601 format (`YYYY-MM-DDTHH:mm:ss`) regardless of the display format.

## Keyboard shortcuts

The `intl-datetime` cell editor opens the browser's native date-time picker. Keyboard navigation inside the picker comes from the browser, so it varies between browsers and operating systems. Outside the picker, the standard [edition keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#edition-keyboard-shortcuts) apply.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [Time cell type](@/guides/cell-types/time-cell-type/time-cell-type.md)

</div>

**Configuration options**

<div class="boxes-list">

- [dateTimeFormat](@/api/options.md#datetimeformat)
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

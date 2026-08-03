---
type: how-to
title: Date-time cell type
metaTitle: Date-time cell type - JavaScript Data Grid | Handsontable
description: Display, format, sort, and filter date and time values together by using the datetime cell type.
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

# Date-time cell type

[[toc]]

## Overview

The `datetime` and `intl-datetime` cell types let you treat cell values as combined dates and times. They use a native [`<input type="datetime-local">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local) editor with zero dependencies, format the display with [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) through the [`dateTimeFormat`](@/api/options.md#datetimeformat) option, and validate ISO 8601 source data.

## Source data format

Source data must be in ISO 8601 date-time format (`YYYY-MM-DDTHH:mm:ss`). A date-only value (`YYYY-MM-DD`) is treated as midnight. The `dateTimeFormat` object affects only how values are displayed; the stored value stays ISO, so sorting, filtering, and export stay correct.

## Basic example

```js
const container = document.querySelector('#example1');

new Handsontable(container, {
  data: [
    ['2024-03-15'],
    ['2024-03-16 09:00:00'],
    ['2024-03-17T23:59:59'],
    ['2024-12-25T14:30:00'],
  ],
  columns: [{
    type: 'intl-datetime',
    dateTimeFormat: {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    },
  }],
  licenseKey: 'non-commercial-and-evaluation',
});
```

## Related options

- [`dateTimeFormat`](@/api/options.md#datetimeformat) -- display format.
- [`locale`](@/api/options.md#locale) -- formatting locale.

## Related guides

- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [Time cell type](@/guides/cell-types/time-cell-type/time-cell-type.md)

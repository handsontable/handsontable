---
title: Layout direction
metaTitle: Layout direction - Guide - Handsontable Documentation
permalink: /next/layout-direction
canonicalUrl: /layout-direction
tags:
  - rtl
  - right-to-left
  - arabic
  - hebrew
  - persian
  - farsi
  - internationalization
  - localization
  - L10n
  - i18n
---

# Layout direction

Configure Handsontable's layout direction, to properly handle right-to-left (RTL) [languages](@/guides/internationalization/language.md).

[[toc]]

## About layout direction

To properly display Handosntable's data and UI in RTL [languages](@/guides/internationalization/language.md) (such as Hebrew or Arabic), 
you need to configure your grid's layout direction.

Handsontable lets you do this with a dedicated [configuration option](@/guides/getting-started/setting-options.md), called [`layoutDirection`](@/api/options.md#layoutdirection).

You can set the [`layoutDirection`](@/api/options.md#layoutdirection) option to one of the following strings:

| Setting             | Description                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inherit` (default) | Set Handsontable's layout direction automatically,<br>based on the value of your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute  |
| `rtl`               | Render Handsontable from the right to the left,<br>even when your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute is set to `ltr` |
| `ltr`               | Render Handsontable from the left to the right,<br>even when your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute is set to `rtl` |

### RTL demo

To try out Handsontable's RTL support, check out the demo below:

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
  ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
  ['2019', 10, 11, 12, 13],
  ['2020', 20, 11, 14, 13],
  ['2021', 30, 15, 12, 13]
  ],
  colHeaders: true,
  rowHeaders: true,
  // render Handsontable from the right to the left
  layoutDirection: 'rtl',
});
```
:::

### List of layout direction elements

Setting a different layout direction affects the behavior of the following areas of Handsontable:

::: details List of layout direction elements

| Area of Handsontable                                                 | Affected elements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Cell types](@/guides/cell-types/cell-type.md)                       | [`autocomplete`](@/guides/cell-types/autocomplete-cell-type.md)<br>[`checkbox`](@/guides/cell-types/checkbox-cell-type.md)<br>[`date`](@/guides/cell-types/date-cell-type.md)<br>[`dropdown`](@/guides/cell-types/dropdown-cell-type.md)<br>[`handsontable`](@/guides/cell-types/handsontable-cell-type.md)<br>[`numeric`](@/guides/cell-types/numeric-cell-type.md)<br>[`time`](@/guides/cell-types/time-cell-type.md)                                                                                                                                                       |
| [Configuration options](@/guides/getting-started/setting-options.md) | [`colHeaders`](@/api/options.md#colheaders)<br>[`fixedColumnsLeft`](@/api/options.md#fixedcolumnsleft)<br>[`fixedRowsBottom`](@/api/options.md#fixedrowsbottom)<br>[`rowHeaders`](@/api/options.md#rowheaders)<br>[`selectionMode`](@/api/options.md#selectionmode)<br>                                                                                                                                                                                                                                                                                                       |
| [Plugins](@/api/plugins.md)                                          | [`Autofill`](@/api/autofill.md)<br>[`CollapsibleColumns`](@/api/collapsiblecolumns.md)<br>[`ColumnSorting`](@/api/columnsorting.md)<br>[`Comments`](@/api/comments.md)<br>[`ContextMenu`](@/api/contextmenu.md)<br>[`CustomBorders`](@/api/customborders.md)<br>[`DropdownMenu`](@/api/dropdownmenu.md)<br>[`Filters`](@/api/filters.md)<br>[`HiddenColumns`](@/api/hiddencolumns.md)<br>[`HiddenRows`](@/api/hiddenrows.md)<br>[`ManualColumnMove`](@/api/manualcolumnmove.md)<br>[`ManualColumnResize`](@/api/manualcolumnresize.md)<br>[`NestedRows`](@/api/nestedrows.md) |
| Other                                                                | Horizontal scroll<br>[Selection](@/guides/cell-features/selection.md)<br>Vertical scroll                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
:::

## Setting the layout direction

To set your grid's layout direction, set the [`layoutDirection`](@/api/options.md#layoutdirection) [configuration option](@/guides/getting-started/setting-options.md) at Handsontable's [initialization](@/guides/getting-started/installation.md#initialize-the-grid):

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
  ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
  ['2019', 10, 11, 12, 13],
  ['2020', 20, 11, 14, 13],
  ['2021', 30, 15, 12, 13]
  ],
  colHeaders: true,
  rowHeaders: true,
  // render Handsontable from the right to the left
  layoutDirection: 'rtl',
});
```
:::

::: tip
You can't change the layout direction at Handsontable's runtime (e.g. using the [`updateSettings()`](@/api/core.md#updatesettings) method).

```js
// this won't work
hot.updateSettings({
  layoutDirection: 'rtl',
});
```
:::

### Inheriting the HTML layout direction

### Setting the RTL layout direction

### Setting the LTR layout direction
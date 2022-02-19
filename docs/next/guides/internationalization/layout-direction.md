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

[[toc]]

Configure Handsontable's layout direction, to properly handle right-to-left (RTL) and left-to-right (LTR) [languages](@/guides/internationalization/language.md).

## About layout direction

To properly display Handsontable's UI and data in LTR languages (such as English or German) and RTL languages (such as Hebrew or Arabic), 
you can configure your grid's layout direction.

By default, Handsontable's layout direction is set automatically, based on on the value of your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute.

You can:
- [Set the layout direction automatically](#setting-the-layout-direction-automatically)
- [Set the layout direction to RTL](#setting-the-layout-direction-to-rtl)
- [Set the layout direction to LTR](#setting-the-layout-direction-to-ltr)

### RTL demo

To try out Handsontable's RTL support, check out the demo below:

::: example #example1 :hot-lang
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
  // load a RTL language
  language: 'ar-AR',
  // enable some options that exemplify the layout direction
  dropdownMenu: true,
  filters: true,
  contextMenu: true
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
| Other                                                                | Horizontal scroll<br>[Keyboard navigation](@/guides/accessories-and-menus/keyboard-navigation.md) (<kbd>Tab</kbd>)<br>[Selection](@/guides/cell-features/selection.md)<br>[UI indicators](@/guides/columns/column-hiding.md#step-2-show-ui-indicators)<br>Vertical scroll                                                                                                                                                                                                                                                                                                     |
:::

## Setting the layout direction

You can set the layout direction only at Handsontable's [initialization](@/guides/getting-started/installation.md#initialize-the-grid).

You can't change the layout direction at Handsontable's runtime (e.g. using the [`updateSettings()`](@/api/core.md#updatesettings) method).
```js
// this won't work
hot.updateSettings({
  layoutDirection: 'rtl',
});
```

### Setting the layout direction automatically

You can set Handsontable's layout direction automatically, 
based on on the value of your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute.
This is the default setting.

At Handsontable's [initialization](@/guides/getting-started/installation.md#initialize-the-grid),
add [`layoutDirection`](@/api/options.md#layoutdirection) as a [top-level grid option](@/guides/getting-started/setting-options.md#setting-grid-options),
and set it to `'inherit'` or skip defining `layoutDirection` altogether, because it is the default setting. 

In the below example, an RTL layout direction is inherited from a `dir` attribute up in the DOM tree:

::: example #example2 --html 1 --js 2
```html
<section dir="rtl">
  <div id="example2"></div>
</section>
```

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
  // inherit Handsontable's layout direction
  // from the value of your HTML document's `dir` attribute
  layoutDirection: 'inherit',
});
```
:::

### Setting the layout direction to RTL

You can render Handsontable from the right to the left, regardless of your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute.

At Handsontable's [initialization](@/guides/getting-started/installation.md#initialize-the-grid),
add [`layoutDirection`](@/api/options.md#layoutdirection) as a [top-level grid option](@/guides/getting-started/setting-options.md#setting-grid-options),
and set it to `'rtl'`:

::: example #example3
```js
const container = document.querySelector('#example3');

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
  // regardless of your HTML document's `dir`
  layoutDirection: 'rtl',
});
```
:::

### Setting the layout direction to LTR

You can render Handsontable from the left to the right, regardless of your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute.

At Handsontable's [initialization](@/guides/getting-started/installation.md#initialize-the-grid),
add [`layoutDirection`](@/api/options.md#layoutdirection) as a [top-level grid option](@/guides/getting-started/setting-options.md#setting-grid-options),
and set it to `'ltr'`:

::: example #example4
```js
const container = document.querySelector('#example4');

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
  // render Handsontable from the left to the right
  // regardless of your HTML document's `dir`
  layoutDirection: 'ltr',
});
```
:::
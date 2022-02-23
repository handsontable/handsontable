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

### Elements affected by layout direction

Setting a different layout direction affects the behavior of the following areas of Handsontable:

| Element                                                                                           | Behavior in the LTR layout direction                                                                                                                             | Behavior in the RTL layout direction
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------
| The order of columns on the screen                                                                | The cell rendering flows from the left-hand side of the screen to the right-hand side. Thus, the cell at coordinates (0, 0) is rendered in the top-left corner.  | The cell rendering flows from the right-hand side of the screen to the left-hand side. Thus, the cell at coordinates (0, 0) is rendered in the top-right corner.
| The text direction in the cells                                                                   | All cells inherit the LTR direction from the container element.                                                                                                  | All cells inherit the RTL direction from the container element.
| The position of the row headers                                                                   | The row headers are rendered on the left-hand edge of the grid.                                                                                                  | The row headers are rendered on the right-hand edge of the grid.
| The position of the [frozen columns](@/guides/columns/column-freezing.md)                         | The columns are frozen at the right-hand edge of the grid.                                                                                                       | The columns are frozen at the right-hand edge of the grid.
| The [keyboard navigation](@/guides/accessories-and-menus/keyboard-navigation.md)                  | <kbd>Tab</kbd> moves to the right, and <kbd>Shift</kbd> + <kbd>Tab</kbd> moves to the left.                                                                      | <kbd>Tab</kbd> moves to the left, and <kbd>Shift</kbd> + <kbd>Tab</kbd> moves to the right.
| The position of the [selection](@/guides/cell-features/selection.md) handles                      | The circular selection handles on mobile devices appear in the top-left and bottom-right corners of the selection border.                                        | The circular selection handles on mobile devices appear in the top-right and bottom-left corners of the selection border.
| The [context menu](@/guides/context-menu.md) and the [column menus](@/guides/column-menu.md)      | The layout of these elements is left-to-right, and the submenus expand to the right-hand side.                                                                    | The layout of these elements is right-to-left, and the submenus expand to the left-hand side.

The above list is not exhaustive. There might be other areas of Handsontable affected by the layout direction in a suitable way.

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

## Setting the text alignment in cells

For the cell content, it is possible to overwrite the horizontal alignment that comes out of the layout direction by using the [text alignment](@/guides/cell-features/text-alignment.md) setting.

In the below example, some columns are explicitly aligned to the left, center, or right:

::: example #example5
```js
const container = document.querySelector('#example5');

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
  columns: [
    {},
    {className: 'htRight'},
    {className: 'htCenter'},
    {className: 'htLeft'},
    {},
  ]
});
```
:::

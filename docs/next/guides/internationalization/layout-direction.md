---
title: Layout direction
metaTitle: Layout direction - Guide - Handsontable Documentation
permalink: /next/layout-direction
canonicalUrl: /layout-direction
tags:
  - rtl
  - rtl support
  - right-to-left mode
  - arabic
  - hebrew
  - persian
  - farsi
---

# Layout direction

You can set Handsontable's layout direction as right-to-left, to easily support RTL languages.

[[toc]]

## About layout direction

For smooth RTL support, Handsontable offers a dedicated [configuration option](@/guides/getting-started/setting-options.md): [`layoutDirection`](@/api/options.md#layoutdirection). 

You can set the [`layoutDirection`](@/api/options.md#layoutdirection) option to one of the following:

| Setting             | Description                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rtl`               | Set Handsontable's layout direction as right-to-left (RTL)                                                                                                                |
| `ltr`               | Set Handsontable's layout direction as left-to-right (LTR)                                                                                                                |
| `inherit` (default) | Set Handsontable's layout direction based on the value of your HTML document's [`dir` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) |

### RTL demo

To try out Handsontable's RTL support, check out the demo below:

PLACEHOLDER

### List of layout direction elements

Setting a different layout direction affects the following aspects of Handsontable:

PLACEHOLDER

## Setting the layout direction

You can set Handsontable's layout direction only at Handsontable's [initialization](@/guides/getting-started/installation.md#initialize-the-grid).

You can't change the layout direction using the [`updateSettings()`](@/api/core.md#updatesettings) method.
To change the layout direction at Handsontable's runtime, you need to initialize Handsontable once again.

To set Handsontable's layout direction, use the [`layoutDirection`](@/api/options.md#layoutdirection) [configuration option](@/guides/getting-started/setting-options.md):

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
  // set Handsontable's layout direction as right-to-left
  layoutDirection: `rtl`,
});
```
:::
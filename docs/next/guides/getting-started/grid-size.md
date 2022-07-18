---
title: Grid size
metaTitle: Grid size - Guide - Handsontable Documentation
permalink: /next/grid-size
canonicalUrl: /grid-size
tags:
  - grid sizing
  - width
  - height
  - dimensions
---

# Grid size

[[toc]]

## Overview

Grid size is used to define the initial size of the grid by setting the width, height and dimensions.

## Setting the size

You need to define the grid's container as a starting point to initialize it. Usually, the `div` element becomes this container. This container should have defined dimensions as well as the rest of your layout. Handsontable supports relative units such as `%`, `rem`, `em`, `vh`, `vw`, and `px`.

### Define the size in CSS styles

Both `width` and `height` could be defined as inline styles or as a CSS class property. In this case, it's important to define what should be an `overflow` parent properly. Handsontable looks for the closest element with `overflow: auto` or `overflow: hidden` to use it as a scrollable container. If no such element is found, a window will be used.

::: tip
Handsontable doesn't observe CSS changes for containers out of the box.
If you'd like to observe it, you can define the dimensions in the configuration object or create your own observer.
:::

### Pass the size in the configuration object

```js
{
    width: '100px',
    width: '75%',
    width: 100 // For a better compatibility we convert number into pixels
}
...
{
    height: '100px',
    height: '75%',
    height: 100 // For a better compatibility we convert number into pixels
}
```

These dimensions will be set as inline styles in a container element, and `overflow: hidden` will be added automatically.

If container is a block element, then its parent has to have defined `height`. By default block element is `0px` height, so `100%` from `0px` is still `0px`.

Changes called in [`updateSettings()`](@/api/core.md#updatesettings) will re-render the grid with the new properties.

## What if the size is not set

If you don't define any dimensions, Handsontable generates as many rows and columns as needed to fill the available space. 

If the grid's content doesn't fit inside the viewport, the browser's native scrollbars are used for scrolling. For this to work properly, Handsontable's [layout direction](@/guides/internationalization/layout-direction.md) (e.g., [`layoutDirection: 'rtl'`](@/api/options.md#layoutdirection)) must be the same as your HTML document's layout direction (`<html dir='rtl'>`). Otherwise, horizontal scrolling doesn't work.

## Autoresizing

Handsontable observes window resizing. If the window's dimensions have changed, then we check if Handsontable should resize itself too. Due to the performance issue, we use the debounce method to respond on window resize.

You can easily overwrite this behaviour by returning `false` in the [`beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions) hook.

```js
{
  beforeRefreshDimensions() { return false; }
}
```

## Manual resizing

The Handsontable instance exposes the [`refreshDimensions()`](@/api/core.md#refreshdimensions) method, which helps you to resize grid elements properly.

```js
const hot = new Handsontable(...);

hot.refreshDimensions();
```

You can listen for two hooks, [`beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions) and [`afterRefreshDimensions`](@/api/hooks.md#afterrefreshdimensions).


::: example #example --html 1 --css 2 --js 3
```html
<div id="exampleParent"><!-- element with dynamically added styles -->
  <div id="example"></div>
</div>

<div class="controls">
  <button id="triggerBtn" class="button button--primary">Expand container</button>
</div>
```
```css
#exampleParent {
  height: 150px;
}
```
```js
const triggerBtn = document.querySelector('#triggerBtn');
const example = document.querySelector('#example');
const exampleParent = document.querySelector('#exampleParent');

const hot = new Handsontable(example, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
  rowHeaders: true,
  colHeaders: true,
  width: '100%',
  height: '100%',
  rowHeights: 23,
  colWidths: 100,
  licenseKey: 'non-commercial-and-evaluation'
});

triggerBtn.addEventListener('click', () => {
  if (triggerBtn.textContent === 'Collapse container') {
    exampleParent.style.height = ''; // reset to initial 150px;
    hot.refreshDimensions();
    triggerBtn.textContent = 'Expand container';
  } else {
    exampleParent.style.height = '400px';
    hot.refreshDimensions();
    triggerBtn.textContent = 'Collapse container';
  }
});
```
:::

## Related API reference

- Configuration options:
  - [`height`](@/api/options.md#height)
  - [`layoutDirection`](@/api/options.md#layoutdirection)
  - [`preventOverflow`](@/api/options.md#preventoverflow)
  - [`width`](@/api/options.md#width)
- Core methods:
  - [`refreshDimensions()`](@/api/core.md#refreshdimensions)
  - [`updateSettings()`](@/api/core.md#updatesettings)
- Hooks:
  - [`afterCellMetaReset`](@/api/hooks.md#aftercellmetareset)
  - [`afterRefreshDimensions`](@/api/hooks.md#afterrefreshdimensions)
  - [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings)
  - [`beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions)

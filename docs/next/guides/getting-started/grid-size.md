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

Changes called in `updateSettings` will re-render the grid with the new properties.

## What if the size is not set

If you don't define the dimensions, Handsontable will generate as many rows and columns as possible to fill available space.

## Autoresizing

Handsontable observes window resizing. If the window's dimensions have changed, then we check if Handsontable should resize itself too. Due to the performance issue, we use the debounce method to respond on window resize.

You can easily overwrite this behaviour by returning `false` in the `beforeRefreshDimensions` hook.

```js
{
  beforeRefreshDimensions() { return false; }
}
```

## Manual resizing

The Handsontable instance exposes the `refreshDimensions()` method, which helps you to resize grid elements properly.

```js
const hot = new Handsontable(...);

hot.refreshDimensions();
```

You can listen for two hooks, `beforeRefreshDimensions` and `afterRefreshDimensions`.

::: example #example --html 1 --js 2
```html
<div><!-- slice element with dynamically added styles -->
  <div id="example"></div>
</div>

<div class="controls">
  <button id="expander" class="button button--primary">Expand container</button>
</div>
```
```js
const triggerBtn = document.querySelector('#expander');
const example = document.querySelector('#example');
const sliceElem = example.parentElement;

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

sliceElem.style = 'transition: height 0.5s; height: 150px;'
hot.refreshDimensions();

triggerBtn.addEventListener('click', () => {
  if (triggerBtn.textContent === 'Collapse') {
    triggerBtn.textContent = 'Expand';
    sliceElem.style.height = '150px';
  } else {
    triggerBtn.textContent = 'Collapse';
    sliceElem.style.height = '400px';
  }
});

sliceElem.addEventListener('transitionend', e => {
  if (e.propertyName === 'height') {
    hot.refreshDimensions();
  }
});
```
:::

---
id: svu0391b
title: Grid size
metaTitle: Grid size - JavaScript Data Grid | Handsontable
description: Set the width and height of the grid, using either absolute values or values relative to the parent container.
permalink: /grid-size
canonicalUrl: /grid-size
tags:
  - grid sizing
  - width
  - height
  - dimensions
react:
  id: cifepxzs
  metaTitle: Grid size - React Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---

# Grid size

Set the width and height of the grid, using either absolute values or values relative to the parent container.

[[toc]]

## Set your grid's size

You need to define the grid's container as a starting point to initialize it. Usually, the `div` element becomes this container. This container should have defined dimensions as well as the rest of your layout. Handsontable supports relative units such as `%`, `rem`, `em`, `vh`, `vw`, and `px`.

### Define the size in your CSS

Both `width` and `height` could be defined as inline styles or as a CSS class property. In this case, it's important to define what should be an `overflow` parent properly. Handsontable looks for the closest element with `overflow: auto` or `overflow: hidden` to use it as a scrollable container. If no such element is found, a window will be used.

::: tip

Handsontable doesn't observe CSS changes for containers out of the box.
If you'd like to observe it, you can define the dimensions in the configuration object or create your own observer.

:::

### Pass the size in the configuration

You can pass width and height values to Handsontable as numbers or possible CSS values for the "width"/"height" properties:

::: only-for javascript

```js
{
  width: '100px',
  height: '100px',
}
```

or

```js
{
  width: '75%',
  height: '75%',
}
```
or
```js
{
  width: 100,
  height: 100,
}
```

:::

::: only-for react

```jsx
  <HotTable height={100} width={100} />
```
or
```jsx
  <HotTable height="75%" width="75%" />
```
or
```jsx
  <HotTable height="100px" width="100px" />
```

:::

These dimensions will be set as inline styles in a container element, and `overflow: hidden` will be added automatically.

If container is a block element, then its parent has to have defined `height`. By default block element is `0px` height, so `100%` from `0px` is still `0px`.

Changes called in [`updateSettings()`](@/api/core.md#updatesettings) will re-render the grid with the new properties.

## What if the size is not set

If you don't define any dimensions, Handsontable generates as many rows and columns as needed to fill the available space.

If your grid's contents don't fit in the viewport, the browser's native scrollbars are used for scrolling. For this to work properly, Handsontable's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) (e.g., [`layoutDirection: 'rtl'`](@/api/options.md#layoutdirection)) must be the same as your HTML document's layout direction (`<html dir='rtl'>`). Otherwise, horizontal scrolling doesn't work.

## Autoresizing

Handsontable observes window resizing. If the window's dimensions have changed, then we check if Handsontable should resize itself too. Due to the performance issue, we use the debounce method to respond on window resize.

You can easily overwrite this behaviour by returning `false` in the [`beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions) hook.

::: only-for javascript

```js
{
  beforeRefreshDimensions() { return false; }
}
```

:::

::: only-for react

```jsx
  <HotTable beforeRefreshDimensions={() => false} />
```

:::

## Manual resizing

The Handsontable instance exposes the [`refreshDimensions()`](@/api/core.md#refreshdimensions) method, which helps you to resize grid elements properly.

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

```js
hot.refreshDimensions();
```

You can listen for two hooks, [`beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions) and [`afterRefreshDimensions`](@/api/hooks.md#afterrefreshdimensions).

::: only-for javascript

::: example #example --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/getting-started/grid-size/javascript/example.html)
@[code](@/content/guides/getting-started/grid-size/javascript/example.css)
@[code](@/content/guides/getting-started/grid-size/javascript/example.js)
@[code](@/content/guides/getting-started/grid-size/javascript/example.ts)

:::

:::

::: only-for react

::: example #example :react --css 1 --js 2 --ts 3

@[code](@/content/guides/getting-started/grid-size/react/example.css)
@[code](@/content/guides/getting-started/grid-size/react/example.jsx)
@[code](@/content/guides/getting-started/grid-size/react/example.tsx)

:::

:::

## Related articles

<div class="boxes-list gray">

- [Column widths](@/guides/columns/column-width/column-width.md)
- [Row heights](@/guides/rows/row-height/row-height.md)

</div>

**Related API reference**

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

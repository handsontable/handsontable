---
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
  metaTitle: Grid size - React Data Grid | Handsontable
searchCategory: Guides
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

If the grid's content doesn't fit inside the viewport, the browser's native scrollbars are used for scrolling. For this to work properly, Handsontable's [layout direction](@/guides/internationalization/layout-direction.md) (e.g., [`layoutDirection: 'rtl'`](@/api/options.md#layoutdirection)) must be the same as your HTML document's layout direction (`<html dir='rtl'>`). Otherwise, horizontal scrolling doesn't work.

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

For more information, see the [`Instance Methods`](@/guides/getting-started/react-methods.md) page.
:::
:::

```js
hot.refreshDimensions();
```

You can listen for two hooks, [`beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions) and [`afterRefreshDimensions`](@/api/hooks.md#afterrefreshdimensions).

::: only-for javascript
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
  height: 157px;
}
```
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const triggerBtn = document.querySelector('#triggerBtn');
const example = document.querySelector('#example');
const exampleParent = document.querySelector('#exampleParent');

// generate an array of arrays with dummy data
const data = new Array(100) // number of rows
  .fill()
  .map((_, row) => new Array(50) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

const hot = new Handsontable(example, {
  data,
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
    exampleParent.style.height = '410px';
    hot.refreshDimensions();
    triggerBtn.textContent = 'Collapse container';
  }
});
```
:::
:::

::: only-for react
::: example #example :react --css 1 --js 2
```css
#exampleParent {
  height: 157px;
}
```
```jsx
import { useRef, useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

// generate an array of arrays with dummy data
const data = new Array(100) // number of rows
  .fill()
  .map((_, row) => new Array(50) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

export const ExampleComponent = () => {
  const [isContainerExpanded, setIsContainerExpanded] = useState(false);
  const hotRef = useRef(null);

  const triggerBtnClickCallback = () => {
    setIsContainerExpanded(!isContainerExpanded);
  };

  useEffect(() => {
    // simulate layout change outside of React lifecycle
    document.getElementById('exampleParent').style.height = isContainerExpanded ? '410px' : '157px';
    hotRef.current.hotInstance.refreshDimensions();
  });

  return (
    <>
      <div id="exampleParent" className="exampleParent">
        <HotTable
          data={data}
          rowHeaders={true}
          colHeaders={true}
          width="100%"
          height="100%"
          rowHeights={23}
          colWidths={100}
          licenseKey="non-commercial-and-evaluation"
          ref={hotRef}
        />
      </div>

      <div className="controls">
        <button
          id="triggerBtn"
          className="button button--primary"
          onClick={(...args) => triggerBtnClickCallback(...args)}
        >
          {isContainerExpanded ? 'Collapse container' : 'Expand container'}
        </button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example'));
/* end:skip-in-preview */
```
:::
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

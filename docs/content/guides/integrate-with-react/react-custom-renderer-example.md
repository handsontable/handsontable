---
title: 'Custom renderer in React'
metaTitle: 'Custom renderer in React - Guide - Handsontable Documentation'
permalink: /react-custom-renderer-example
canonicalUrl: /react-custom-renderer-example
---

# Custom renderer in React

[[toc]]

::: tip Using React components
This page shows how to integrate a plain JavaScript custom renderer with the React component. Information how to [declare a custom renderer using React components](@/guides/integrate-with-react/react-hot-column.md#declaring-a-custom-renderer-as-a-component) is presented on another page.
:::

## Overview

You can declare a custom renderer for the `HotTable` component by declaring it as a function in the Handsontable options or creating a rendering component.

## Example

The following example implements `@handsontable/react` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

::: example #example1 :react
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const hotSettings = {
  data:
    [
      ['A1', 'https://handsontable.com/docs/12.1/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
      ['A2', 'https://handsontable.com/docs/12.1/img/examples/javascript-the-good-parts.jpg']
    ],
  columns: [
    {},
    {
      renderer(instance, td, row, col, prop, value, cellProperties) {
        const escaped = `${value}`;

        if (escaped.indexOf('http') === 0) {
          const img = document.createElement('IMG');
          img.src = value;

          img.addEventListener('mousedown', event => {
            event.preventDefault();
          });

          td.innerText = '';
          td.appendChild(img);

        } else {
          textRenderer.apply(this, arguments);
        }

        return td;
      }
    }
  ],
  colHeaders: true,
  rowHeights: 55,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
};

const App = () => {
  return (
    <div>
      <HotTable
        id="hot"
        settings={hotSettings}
      />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('example1'));
```
:::

## Related articles

### Related guides

- [Cell renderer](@/guides/cell-functions/cell-renderer.md)

### Related API reference

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Configuration options:
  - [`renderer`](@/api/options.md#renderer)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getCellRenderer()`](@/api/core.md#getcellrenderer)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)
  - [`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers)
  - [`afterRenderer`](@/api/hooks.md#afterrenderer)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeRenderer`](@/api/hooks.md#beforerenderer)

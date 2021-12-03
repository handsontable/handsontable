---
title: 'Custom renderer with React'
metaTitle: 'Custom renderer with React - Guide - Handsontable Documentation'
permalink: /next/react-custom-renderer-example
canonicalUrl: /react-custom-renderer-example
---

# Custom renderer with React

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
      ['A1', 'https://handsontable.com/docs/next/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
      ['A2', 'https://handsontable.com/docs/next/img/examples/javascript-the-good-parts.jpg']
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

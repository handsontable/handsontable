---
title: Custom renderer example
metaTitle: Custom renderer example - Guide - Handsontable Documentation
permalink: /10.0/react-custom-renderer-example
canonicalUrl: /react-custom-renderer-example
---

# Custom renderer example

## Overview

You can declare a custom renderer for the `HotTable` component by declaring it as a function in the Handsontable options or creating a rendering component.

## Example

The following example implements `@handsontable/react` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

::: example #example1 :react
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

const hotSettings = {
  data:
    [
      ['A1', 'https://handsontable.com/docs/10.0/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
      ['A2', 'https://handsontable.com/docs/10.0/img/examples/javascript-the-good-parts.jpg']
    ],
  columns: [
    {},
    {
      renderer(instance, td, row, col, prop, value, cellProperties) {
        const escaped = Handsontable.helper.stringify(value);

        if (escaped.indexOf('http') === 0) {
          const img = document.createElement('IMG');
          img.src = value;

          Handsontable.dom.addEvent(img, 'mousedown', event => {
            event.preventDefault();
          });

          Handsontable.dom.empty(td);
          td.appendChild(img);

        } else {
          Handsontable.renderers.TextRenderer.apply(this, arguments);
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

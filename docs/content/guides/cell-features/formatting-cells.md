---
title: Formatting cells
metaTitle: Formatting cells - Guide - Handsontable Documentation
permalink: /formatting-cells
canonicalUrl: /formatting-cells
---

# Formatting cells

[[toc]]

## Overview

Handsontable utilizes the HTML `table` structure so customization is based either on referencing to the already existing elements, such as `TR`/`TD`, or by applying your own CSS classes to HTML elements.

A cell can be formatted either using a `CSS` class or with a style applied directly to the DOM element.

## Apply custom CSS class styles

In this example, we add a custom class `custom-cell` to the cell in the top left corner and add a `custom-table` CSS class that highlights the table headers.

::: only-for javascript
::: example #example1 --css 1 --js 2
```css
td.custom-cell {
  color: #fff;
  background-color: #37bc6c;
}
.custom-table thead th:nth-child(even),
.custom-table tbody tr:nth-child(odd) th {
  background-color: #d7f1e1;
}
```
```javascript
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  className: 'custom-table',
  cell: [
    {
      row: 0,
      col: 0,
      className: 'custom-cell',
    },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```
:::
:::

::: only-for react
::: example #example1 --css 1 --js 2 :react
```css
td.custom-cell {
  color: #fff;
  background-color: #37bc6c;
}
.custom-table thead th:nth-child(even),
.custom-table tbody tr:nth-child(odd) th {
  background-color: #d7f1e1;
}
```
```jsx
import React, { Fragment, useEffect } from 'react';
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotSettings = {
    data: Handsontable.helper.createSpreadsheetData(5, 5),
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    className: 'custom-table',
    cell: [{
      row: 0,
      col: 0,
      className: 'custom-cell',
    }, ],
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
  };

  return (
    <Fragment>
        <HotTable settings={hotSettings}>
        </HotTable>
    </Fragment>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


## Apply inline styles

You can apply inline styles directly to the DOM element using its `style` attribute. You can use the [`renderer`](@/api/options.md#renderer) option to do that.

::: only-for javascript
::: example #example2
```javascript
const container = document.querySelector('#example2');

Handsontable
  .renderers
  .registerRenderer('customStylesRenderer', (hotInstance, TD, ...rest) => {
    Handsontable.renderers.getRenderer('text')(hotInstance, TD, ...rest);

    TD.style.fontWeight = 'bold';
    TD.style.color = 'green';
    TD.style.background = '#d7f1e1';
  });

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  cell: [
    {
      row: 0,
      col: 0,
      renderer: 'customStylesRenderer',
    },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
:::

::: only-for react
::: example #example2 :react
```jsx
import React, { Fragment, useEffect } from 'react';
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  Handsontable
          .renderers
          .registerRenderer('customStylesRenderer', (hotInstance, TD, ...rest) => {
            Handsontable.renderers.getRenderer('text')(hotInstance, TD, ...rest);

            TD.style.fontWeight = 'bold';
            TD.style.color = 'green';
            TD.style.background = '#d7f1e1';
          });
  const hotSettings = {
    data: Handsontable.helper.createSpreadsheetData(5, 5),
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    cell: [{
      row: 0,
      col: 0,
      renderer: 'customStylesRenderer',
    }, ],
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
  };

  return (
    <Fragment>
        <HotTable settings={hotSettings}>
        </HotTable>
    </Fragment>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
```
:::
:::


## Custom cell borders

To enable the custom borders feature, set the [`customBorders`](@/api/options.md#customborders) option. This can either be set as `true` or initialized as an array with a pre-defined setup. For the list of available settings and methods, visit the [API reference](@/api/customBorders.md).

In the names of the API properties, the words `start` and `end` refer to the starting and ending edges of the [layout direction](@/guides/internationalization/layout-direction.md).

::: warning
The `start` and `end` properties used to be called `left` and `right` before Handsontable 12.0.0. The old names `left` and `right` work in the LTR layout direction but throw an error when the layout direction is set to RTL.
:::

::: only-for javascript
::: example #example3
```js
const container = document.getElementById('example3');

const hot = Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 6),
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  customBorders: [
    {
      range: {
        from: {
          row: 1,
          col: 1
        },
        to: {
          row: 3,
          col: 4
        }
      },
      top: {
        width: 2,
        color: '#5292F7'
      },
      bottom: {
        width: 2,
        color: 'red'
      },
      start: {
        width: 2,
        color: 'orange'
      },
      end: {
        width: 2,
        color: 'magenta'
      }
    },
    {
      row: 2,
      col: 2,
      start: {
        width: 2,
        color: 'red'
      },
      end: {
        width: 1,
        color: 'green'
      }
    }
  ]
});
```
:::
:::

::: only-for react
::: example #example3 :react
```jsx
import React, { Fragment, useEffect } from 'react';
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotSettings = {
    data: Handsontable.helper.createSpreadsheetData(5, 6),
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    customBorders: [{
      range: {
        from: {
          row: 1,
          col: 1
        },
        to: {
          row: 3,
          col: 4
        }
      },
      top: {
        width: 2,
        color: '#5292F7'
      },
      bottom: {
        width: 2,
        color: 'red'
      },
      start: {
        width: 2,
        color: 'orange'
      },
      end: {
        width: 2,
        color: 'magenta'
      }
    },
      {
        row: 2,
        col: 2,
        start: {
          width: 2,
          color: 'red'
        },
        end: {
          width: 1,
          color: 'green'
        }
      }
    ]
  };

  return (
    <Fragment>
        <HotTable settings={hotSettings}>
        </HotTable>
    </Fragment>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
```
:::
:::


## Related articles

### Related guides

- [Conditional formatting](@/guides/cell-features/conditional-formatting.md)

### Related API reference

- Configuration options:
  - [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
  - [`className`](@/api/options.md#classname)
  - [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
  - [`currentColClassName`](@/api/options.md#currentcolclassname)
  - [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
  - [`currentRowClassName`](@/api/options.md#currentrowclassname)
  - [`customBorders`](@/api/options.md#customborders)
  - [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
  - [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
  - [`placeholder`](@/api/options.md#placeholder)
  - [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)
  - [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
  - [`tableClassName`](@/api/options.md#tableclassname)
- Plugins:
  - [`CustomBorders`](@/api/customBorders.md)

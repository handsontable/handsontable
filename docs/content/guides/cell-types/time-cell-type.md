---
title: Time cell type
metaTitle: Time cell type - JavaScript Data Grid | Handsontable
description: Use the time cell type to display, format, and validate values as times. The time cell type uses Moment.js as a time formatter.
permalink: /time-cell-type
canonicalUrl: /time-cell-type
react:
  metaTitle: Time cell type - React Data Grid | Handsontable
searchCategory: Guides
---

# Time cell type

Use the time cell type to display, format, and validate values as times. The time cell type uses Moment.js as a time formatter.

[[toc]]

## Usage
To use the time cell type, set the `type: 'time'` option in the [`columns`](@/api/options.md#columns) array or the [`cells`](@/api/options.md#cells) function.
The time cell uses [Moment.js](https://github.com/moment/moment) as the time formatter, therefore you **must** add the following required dependency:

```html
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
```

All data entered into the time-typed cells is eventually validated against the default time format - `h:mm:ss a`, which translates to, for example, `9:30:00 am` unless another format is provided as the `timeFormat`.
If you enable the [`correctFormat`](@/api/options.md#correctformat) configuration option, the values will be automatically formatted to match the desired time format.

::: tip
By default, the values entered into the time-type column are **not** validated, so if you want them to display in the proper format, remember to call [`hot.validateCells()`](@/api/core.md#validatecells) after the table initialization.
:::

## Basic example

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['Mercedes', 'A 160', 1332284400000, 6999.95],
    ['Citroen', 'C4 Coupe', '10 30', 8330],
    ['Audi', 'A4 Avant', '8:00 PM', 33900],
    ['Opel', 'Astra', 1332284400000, 7000],
    ['BMW', '320i Coupe', 1332284400000, 30500]
  ],
  colHeaders: ['Car', 'Model', 'Registration time', 'Price'],
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      type: 'text',
    },
    {
      // 2nd cell is simple text, no special options here
    },
    {
      type: 'time',
      timeFormat: 'h:mm:ss a',
      correctFormat: true
    },
    {
      type: 'numeric',
      numericFormat: {
        pattern: '$ 0,0.00'
      }
    }
  ]
});

hot.validateCells();
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    hot.validateCells();
  });

  return (
    <HotTable
      ref={hotRef}
      data={[
        ['Mercedes', 'A 160', 1332284400000, 6999.95],
        ['Citroen', 'C4 Coupe', '10 30', 8330],
        ['Audi', 'A4 Avant', '8:00 PM', 33900],
        ['Opel', 'Astra', 1332284400000, 7000],
        ['BMW', '320i Coupe', 1332284400000, 30500]
      ]}
      colHeaders={['Car', 'Model', 'Registration time', 'Price']}
      columnSorting={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
      columns={[{
          type: 'text',
        },
        {
          // 2nd cell is simple text, no special options here
        },
        {
          type: 'time',
          timeFormat: 'h:mm:ss a',
          correctFormat: true
        },
        {
          type: 'numeric',
          numericFormat: {
            pattern: '$ 0,0.00'
          }
        }
      ]}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
:::


## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type.md)

### Related API reference

- Configuration options:
  - [`type`](@/api/options.md#type)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getDataType()`](@/api/core.md#getdatatype)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta)

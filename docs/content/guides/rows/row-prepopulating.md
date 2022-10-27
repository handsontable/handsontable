---
title: Row pre-populating
metaTitle: Row pre-populating - JavaScript Data Grid | Handsontable
description: Populate newly-added rows with predefined template values, using cell renderers.
permalink: /row-prepopulating
canonicalUrl: /row-prepopulating
tags:
  - spare rows
  - extra rows
  - bottom rows
  - placeholder
react:
  metaTitle: Row pre-populating - React Data Grid | Handsontable
searchCategory: Guides
---

# Row pre-populating

Populate newly-added rows with predefined template values, using cell renderers.

[[toc]]

## Example

The example below shows how cell renderers can be used to populate the template values in empty rows. When a cell in the empty row is edited, the [`beforeChange`](@/api/hooks.md#beforechange) callback fills the row with the template values.

::: only-for javascript
::: example #example1
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example1');
const templateValues = ['one', 'two', 'three'];
const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13]
];

function isEmptyRow(instance, row) {
  var rowData = instance.countRows();

  for (var i = 0, ilen = rowData.length; i < ilen; i++) {
    if (rowData[i] !== null) {
      return false;
    }
  }

  return true;
}

function defaultValueRenderer(instance, td, row, col, prop, value, cellProperties) {
  const args = arguments;

  if (args[5] === null && isEmptyRow(instance, row)) {
    args[5] = templateValues[col];
    td.style.color = '#999';

  } else {
    td.style.color = '';
  }

  textRenderer.apply(this, args);
}

const hot = new Handsontable(container, {
  startRows: 8,
  startCols: 5,
  minSpareRows: 1,
  contextMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  cells(row, col, prop) {
    const cellProperties = {};

    cellProperties.renderer = defaultValueRenderer;

    return cellProperties;
  },
  beforeChange(changes) {
    const instance = hot;
    const columns = instance.countCols();
    const rowColumnSeen = {};
    const rowsToFill = {};

    for (let i = 0; i < changes.length; i++) {
      // if oldVal is empty
      if (changes[i][2] === null && changes[i][3] !== null) {
        if (isEmptyRow(instance, changes[i][0])) {
          // add this row/col combination to the cache so it will not be overwritten by the template
          rowColumnSeen[changes[i][0] + '/' + changes[i][1]] = true;
          rowsToFill[changes[i][0]] = true;
        }
      }
    }

    for (var r in rowsToFill) {
      if (rowsToFill.hasOwnProperty(r)) {
        for (let c = 0; c < columns; c++) {
          // if it is not provided by user in this change set, take the value from the template
          if (!rowColumnSeen[r + '/' + c]) {
            changes.push([r, c, null, templateValues[c]]);
          }
        }
      }
    }
  }
});

// or, use `updateData()` to replace `data` without resetting states
hot.loadData(data);
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const hotRef = useRef(null);

  const templateValues = ['one', 'two', 'three'];
  const data = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13]
  ];
  let hot = null;

  function isEmptyRow(instance, row) {
    var rowData = instance.countRows();

    for (var i = 0, ilen = rowData.length; i < ilen; i++) {
      if (rowData[i] !== null) {
        return false;
      }
    }

    return true;
  }

  function defaultValueRenderer(instance, td, row, col, prop, value, cellProperties) {
    const args = arguments;

    if (args[5] === null && isEmptyRow(instance, row)) {
      args[5] = templateValues[col];
      td.style.color = '#999';

    } else {
      td.style.color = '';
    }

    textRenderer.apply(this, args);
  }

  useEffect(() => {
    hot = hotRef.current.hotInstance;
  });

  return (
    <>
      <HotTable
        ref={hotRef}
        data={data}
        startRows={8}
        startCols={5}
        minSpareRows={1}
        contextMenu={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        cells={function(row, col, prop) {
          const cellProperties = {};

          cellProperties.renderer = defaultValueRenderer;

          return cellProperties;
        }}
        beforeChange={function(changes) {
          const instance = hot;
          const columns = instance.countCols();
          const rowColumnSeen = {};
          const rowsToFill = {};

          for (let i = 0; i < changes.length; i++) {
            // if oldVal is empty
            if (changes[i][2] === null && changes[i][3] !== null) {
              if (isEmptyRow(instance, changes[i][0])) {
                // add this row/col combination to the cache so it will not be overwritten by the template
                rowColumnSeen[changes[i][0] + '/' + changes[i][1]] = true;
                rowsToFill[changes[i][0]] = true;
              }
            }
          }

          for (var r in rowsToFill) {
            if (rowsToFill.hasOwnProperty(r)) {
              for (let c = 0; c < columns; c++) {
                // if it is not provided by user in this change set, take the value from the template
                if (!rowColumnSeen[r + '/' + c]) {
                changes.push([r, c, null, templateValues[c]]);
              }
            }
          }
        }
        }}
      />
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
:::


## Related API reference

- Hooks:
  - [`beforeChange`](@/api/hooks.md#beforechange)

---
title: Disabled cells
metaTitle: Disabled cells - JavaScript Data Grid | Handsontable
description: Make a specific cell or a range of cells read-only to protect them from unwanted changes but still allow navigation and copying of data.
permalink: /disabled-cells
canonicalUrl: /disabled-cells
tags:
  - read-only
  - readonly
  - non-editable
  - noneditable
  - locked
react:
  metaTitle: Disabled cells - React Data Grid | Handsontable
---

# Disabled cells

[[toc]]

## Overview

Disabling a cell makes the cell read-only or non-editable. Both have similar outcomes, with the following differences:

| Read-only cell<br>`readOnly: true`                                           | Non-editable cell<br>`editor: false`                                       |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Has an additional CSS class (`htDimmed`)                                     | Has no additional CSS class                                                |
| Copy-paste doesn't work                                                      | Copy-paste works                                                           |
| Drag-to-fill doesn't work                                                    | Drag-to-fill works                                                         |
| Can't be changed by [`populateFromArray()`](@/api/core.md#populatefromarray) | Can be changed by [`populateFromArray()`](@/api/core.md#populatefromarray) |

## Read-only columns

In many use cases, you will need to configure a certain column to be read-only. This column will be available for keyboard navigation and copying data (<kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**C**</kbd>). Editing and pasting data will be disabled.

To make a column read-only, declare it in the [`columns`](@/api/options.md#columns) configuration option. You can also define a special renderer function that will dim the read-only values, providing a visual cue for the user that the cells are read-only.

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    {car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black'},
    {car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue'},
    {car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black'},
    {car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray'}
  ],
  height: 'auto',
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car',
      readOnly: true
    },
    {
      data: 'year'
    },
    {
      data: 'chassis'
    },
    {
      data: 'bumper'
    }
  ]
});
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
        { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
        { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
        { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
      ]}
      height="auto"
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      licenseKey="non-commercial-and-evaluation"
      columns={[
        {
          data: 'car',
          readOnly: true
        },
        {
          data: 'year'
        },
        {
          data: 'chassis'
        },
        {
          data: 'bumper'
        }
      ]}
    />
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


## Read-only specific cells

This example makes cells that contain the word "Nissan" read-only. It forces all cells to be processed by the [`cells`](@/api/options.md#cells) function which will decide whether a cell's metadata should have the [`readOnly`](@/api/options.md#readonly) property set.

::: only-for javascript
::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

hot.updateSettings({
  cells(row, col) {
    const cellProperties = {};

    if (hot.getData()[row][col] === 'Nissan') {
      cellProperties.readOnly = true;
    }

    return cellProperties;
  }
});
```
:::
:::

::: only-for react
::: example #example2 :react
```jsx
import { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    hot.updateSettings({
      cells(row, col) {
        const cellProperties = {};

        if (hot.getData()[row][col] === 'Nissan') {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      }
    });
  });

  return (
    <HotTable
      ref={hotRef}
      data={[
        { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
        { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
        { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
        { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
      ]}
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
```
:::
:::


Non-editable cells behave like any other cells apart from preventing you from manually changing their values.

## Non-editable columns

In many cases, you will need to configure a certain column to be non-editable. Doing this does not change its basic behaviour, apart from editing. This means that you can still use the keyboard navigation <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**C**</kbd>, and <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**V**</kbd> functionalities, and drag-to-fill, etc.

To make a column non-editable, declare it in the [`columns`](@/api/options.md#columns) configuration option. You can also define a special renderer function that will dim the `editor` value. This will provide the user with a visual cue that the cell is non-editable.

::: only-for javascript
::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    {car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black'},
    {car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue'},
    {car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black'},
    {car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray'}
  ],
  height: 'auto',
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car',
      editor: false
    },
    {
      data: 'year',
      editor: 'numeric'
    },
    {
      data: 'chassis',
      editor: 'text'
    },
    {
      data: 'bumper',
      editor: 'text'
    }
  ]
});
```
:::
:::

::: only-for react
::: example #example3 :react
```jsx
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
        { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
        { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
        { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
      ]}
      height="auto"
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      licenseKey="non-commercial-and-evaluation"
      columns={[
        {
          data: 'car',
          editor: false
        },
        {
          data: 'year',
          editor: 'numeric'
        },
        {
          data: 'chassis',
          editor: 'text'
        },
        {
          data: 'bumper',
          editor: 'text'
        }
      ]}
    />
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
```
:::
:::


## Non-editable specific cells

The following example shows the table with non-editable cells containing the word "Nissan". This cell property is optional and can be easily set in the Handsontable configuration.

::: only-for javascript
::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

hot.updateSettings({
  cells(row, col, prop) {
    const cellProperties = {};

    if (hot.getDataAtRowProp(row, prop) === 'Nissan') {
      cellProperties.editor = false;

    } else {
      cellProperties.editor = 'text';
    }

    return cellProperties;
  }
});
```
:::
:::

::: only-for react
::: example #example4 :react
```jsx
import { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    hot.updateSettings({
      cells(row, col, prop) {
        const cellProperties = {};

        if (hot.getDataAtRowProp(row, prop) === 'Nissan') {
          cellProperties.editor = false;

        } else {
          cellProperties.editor = 'text';
        }

        return cellProperties;
      }
    });
  });

  return (
    <HotTable
      ref={hotRef}
      data={[
        { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
        { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
        { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
        { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
      ]}
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example4'));
```
:::
:::


## Related API reference

- Configuration options:
  - [`readOnly`](@/api/options.md#readonly)
  - [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)

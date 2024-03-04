---
id: k41dcpud
title: Disabled cells
metaTitle: Disabled cells - JavaScript Data Grid | Handsontable
description: Make specified cells read-only to protect them from unwanted changes but still allow navigation and copying of data.
permalink: /disabled-cells
canonicalUrl: /disabled-cells
tags:
  - read-only
  - readonly
  - non-editable
  - noneditable
  - locked
react:
  id: zhv7fs29
  metaTitle: Disabled cells - React Data Grid | Handsontable
searchCategory: Guides
---

# Disabled cells

Make specified cells read-only to protect them from unwanted changes but still allow navigation and copying of data.

[[toc]]

## Overview

Disabling a cell makes the cell read-only or non-editable. Both have similar outcomes, with the following differences:

| Read-only cell<br>`readOnly: true`                                           | Non-editable cell<br>`editor: false`                                       |
|------------------------------------------------------------------------------| -------------------------------------------------------------------------- |
| Has an additional CSS class (`htDimmed`)                                     | Has no additional CSS class                                                |
| Copy works, paste doesn't work                                               | Copy-paste works                                                           |
| Drag-to-fill doesn't work                                                    | Drag-to-fill works                                                         |
| Can't be changed by [`populateFromArray()`](@/api/core.md#populatefromarray) | Can be changed by [`populateFromArray()`](@/api/core.md#populatefromarray) |

## Read-only grid

You can make the entire grid read-only by setting [`readOnly`](@/api/options.md#readonly) to `true` as a [top-level grid option](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).

::: only-for javascript

::: example #exampleReadOnlyGrid

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleReadOnlyGrid');
const hot = new Handsontable(container, {
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
  ],
  height: 'auto',
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation',
  // make the entire grid read-only
  readOnly: true,
  autoWrapRow: true,
  autoWrapCol: true
});
```

:::

:::

::: only-for react

::: example #exampleReadOnlyGrid :react

@[code](@/content/guides/cell-features/disabled-cells/exampleReadOnlyGrid.jsx)

:::

:::

## Read-only columns

In many use cases, you will need to configure a certain column to be read-only. This column will be available for keyboard navigation and copying data (<kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>). Editing and pasting data will be disabled.

To make a column read-only, declare it in the [`columns`](@/api/options.md#columns) configuration option. You can also define a special renderer function that will dim the read-only values, providing a visual cue for the user that the cells are read-only.

::: only-for javascript

::: example #example1

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
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
  ],
  autoWrapRow: true,
  autoWrapCol: true
});
```

:::

:::

::: only-for react

::: example #example1 :react

@[code](@/content/guides/cell-features/disabled-cells/example1.jsx)

:::

:::

## Read-only specific cells

This example makes cells that contain the word "Nissan" read-only. It forces all cells to be processed by the [`cells`](@/api/options.md#cells) function which will decide whether a cell's metadata should have the [`readOnly`](@/api/options.md#readonly) property set.

::: only-for javascript

::: example #example2

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

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
  autoWrapRow: true,
  autoWrapCol: true,
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

@[code](@/content/guides/cell-features/disabled-cells/example2.jsx)

:::

:::

Non-editable cells behave like any other cells apart from preventing you from manually changing their values.

## Non-editable columns

In many cases, you will need to configure a certain column to be non-editable. Doing this does not change its basic behaviour, apart from editing. This means that you can still use the keyboard navigation <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, and <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**V**</kbd> functionalities, and drag-to-fill, etc.

To make a column non-editable, declare it in the [`columns`](@/api/options.md#columns) configuration option. You can also define a special renderer function that will dim the `editor` value. This will provide the user with a visual cue that the cell is non-editable.

::: only-for javascript

::: example #example3

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3');
const hot = new Handsontable(container, {
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
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
  ],
  autoWrapRow: true,
  autoWrapCol: true
});
```

:::

:::

::: only-for react

::: example #example3 :react

@[code](@/content/guides/cell-features/disabled-cells/example3.jsx)

:::

:::

## Non-editable specific cells

The following example shows the table with non-editable cells containing the word "Nissan". This cell property is optional and you can easily set it in the Handsontable configuration.

::: only-for javascript

::: example #example4

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

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
  autoWrapRow: true,
  autoWrapCol: true,
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

@[code](@/content/guides/cell-features/disabled-cells/example4.jsx)

:::

:::

## Related API reference

- Configuration options:
  - [`readOnly`](@/api/options.md#readonly)
  - [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)

---
title: Column hiding
metaTitle: Column hiding - JavaScript Data Grid | Handsontable
description: Hide individual columns to avoid rendering them as DOM elements. It helps you reduce screen clutter and improve the grid's performance.
permalink: /column-hiding
canonicalUrl: /column-hiding
react:
  metaTitle: Column hiding - React Data Grid | Handsontable
searchCategory: Guides
---

# Column hiding

Hide individual columns to avoid rendering them as DOM elements. It helps you reduce screen clutter and improve the grid's performance.

[[toc]]

## Overview

"Hiding a column" means that the hidden column doesn't get rendered as a DOM element.

When you're hiding a column:
- The source data doesn't get modified.
- The [`HiddenColumns`](@/api/hiddenColumns.md) plugin doesn't participate in data transformation<br>(the shape of the data returned by the [`getData*()` methods](@/api/core.md#getdata) stays intact).

## Enable column hiding

To simply enable column hiding (without further configuration), set the [`hiddenColumns`](@/api/options.md#hiddencolumns) configuration option to `true`:

::: only-for javascript
::: example #example1
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenColumns` plugin
  hiddenColumns: true,
});
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
      ]}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      // enable the `HiddenColumns` plugin
      hiddenColumns={true}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
:::


## Set up column hiding

To set up your column hiding configuration, follow the steps below.

### Step 1: Specify columns hidden by default

To both enable column hiding and specify columns hidden by default, set the [`hiddenColumns`](@/api/options.md#hiddencolumns) configuration option to an object.

In the object, add a [`columns`](@/api/options.md#columns) configuration option, and set it to an array of column indexes.

Now, those columns are hidden by default:

::: only-for javascript
::: example #example2
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example2');
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenColumns` plugin
  hiddenColumns: {
    // specify columns hidden by default
    columns: [3, 5, 9]
  }
});
```
:::
:::

::: only-for react
::: example #example2 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
      ]}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      // enable the `HiddenColumns` plugin
      hiddenColumns={{
        // specify columns hidden by default
        columns: [3, 5, 9]
      }}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
/* end:skip-in-preview */
```
:::
:::


### Step 2: Show UI indicators

To easily see which columns are currently hidden, display UI indicators.

To enable the UI indicators, in the [`hiddenColumns`](@/api/options.md#hiddencolumns) object, set the [`indicators`](@/api/hiddenColumns.md) property to `true`:

::: tip
If you use both the [`NestedHeaders`](@/api/nestedHeaders.md) plugin and the [`HiddenColumns`](@/api/hiddenColumns.md) plugin, you also need to set the [`colHeaders`](@/api/options.md#colheaders) property to `true`. Otherwise, [`indicators`](@/api/hiddenColumns.md) won't work.
:::

::: only-for javascript
::: example #example3
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example3');
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  hiddenColumns: {
    columns: [3, 5, 9],
    // show UI indicators to mark hidden columns
    indicators: true
  }
});
```
:::
:::

::: only-for react
::: example #example3 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
      ]}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      hiddenColumns={{
        columns: [3, 5, 9],
        // show UI indicators to mark hidden columns
        indicators: true
      }}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```
:::
:::


### Step 3: Set up context menu items

To easily hide and unhide columns, add column hiding items to Handsontable's [context menu](@/guides/accessories-and-menus/context-menu.md).

Enable both the [`ContextMenu`](@/api/contextMenu.md) plugin and the [`HiddenColumns`](@/api/hiddenColumns.md) plugin. Now, the context menu automatically displays additional items for hiding and unhiding columns.

::: only-for javascript
::: example #example4
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example4');
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  // enable the context menu
  contextMenu: true,
  // enable the `HiddenColumns` plugin
  // automatically adds the context menu's column hiding items
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true
  }
});
```
:::
:::

::: only-for react
::: example #example4 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
      ]}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      // enable the context menu
      contextMenu={true}
      // enable the `HiddenColumns` plugin
      // automatically adds the context menu's column hiding items
      hiddenColumns={{
        columns: [3, 5, 9],
        indicators: true
      }}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example4'));
/* end:skip-in-preview */
```
:::
:::


You can also add the column hiding menu items individually, by adding the [`hidden_columns_show`](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) and [`hidden_columns_hide`](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) strings to the[ `contextMenu`](@/api/contextMenu.md) parameter:

::: only-for javascript
::: example #example5
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example5');
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  // individually add column hiding context menu items
  contextMenu: [`hidden_columns_show`, `hidden_columns_hide`],
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true
  }
});
```
:::
:::

::: only-for react
::: example #example5 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
      ]}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      contextMenu={['hidden_columns_show', 'hidden_columns_hide']}
      hiddenColumns={{
        columns: [3, 5, 9],
        indicators: true
      }}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example5'));
/* end:skip-in-preview */
```
:::
:::


### Step 4: Set up copy and paste behavior

By default, hidden columns are included in copying and pasting.

To exclude hidden columns from copying and pasting, in the [`hiddenColumns`](@/api/hiddenColumns.md) object, set the [`copyPasteEnabled`](@/api/hiddenColumns.md) property to `false`:

::: only-for javascript
::: example #example6
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example6');
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  contextMenu: ['hidden_columns_show', 'hidden_columns_hide'],
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true,
    // exclude hidden columns from copying and pasting
    copyPasteEnabled: false
  }
});
```
:::
:::

::: only-for react
::: example #example6 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
      ]}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      contextMenu={['hidden_columns_show', 'hidden_columns_hide']}
      hiddenColumns={{
        columns: [3, 5, 9],
        indicators: true,
        // exclude hidden columns from copying and pasting
        copyPasteEnabled: false
      }}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example6'));
/* end:skip-in-preview */
```
:::
:::


## Column hiding API methods

For the most popular column hiding tasks, use the API methods below.

::: only-for react
::: tip
To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [`Instance Methods`](@/guides/getting-started/react-methods.md) page.
:::
:::

To see your changes, re-render your Handsontable instance with the [`render()`](@/api/core.md#render) method.

### Access the [`HiddenColumns`](@/api/hiddenColumns.md) plugin instance

To access the [`HiddenColumns`](@/api/hiddenColumns.md) plugin instance, use the [`getPlugin()`](@/api/core.md#getplugin) method:

```js
const plugin = hot.getPlugin('hiddenColumns');
```

### Hide a single column

To hide a single column, use the [`hideColumn()`](@/api/hiddenColumns.md#hidecolumn) method:

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.hideColumn(4);

// re-render your Handsontable instance
hot.render()
```

### Hide multiple columns

To hide multiple columns:
- Either pass column indexes as arguments to the [`hideColumn()`](@/api/hiddenColumns.md#hidecolumn) method
- Or pass an array of column indexes to the [`hideColumns()`](@/api/hiddenColumns.md#hidecolumn) method

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.hideColumn(0, 4, 6);
// or
plugin.hideColumns([0, 4, 6]);

// re-render your Handsontable instance
hot.render()
```

### Unhide a single column

To unhide a single column, use the [`showColumn()`](@/api/hiddenColumns.md#showcolumn) method:

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.showColumn(4);

// re-render your Handsontable instance
hot.render()
```

### Unhide multiple columns

To unhide multiple columns:
- Either pass column indexes as arguments to the [`showColumn()`](@/api/hiddenColumns.md#showcolumn) method
- Or pass an array of column indexes to the [`showColumns()`](@/api/hiddenColumns.md#showcolumns) method

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.showColumn(0, 4, 6);
// or
plugin.showColumns([0, 4, 6]);

// re-render your Handsontable instance
hot.render()
```

## Related API reference

- Configuration options:
  - [`hiddenColumns`](@/api/options.md#hiddencolumns)
- Hooks:
  - [`afterHideColumns`](@/api/hooks.md#afterhidecolumns)
  - [`afterUnhideColumns`](@/api/hooks.md#afterunhidecolumns)
  - [`beforeHideColumns`](@/api/hooks.md#beforehidecolumns)
  - [`beforeUnhideColumns`](@/api/hooks.md#beforeunhidecolumns)
- Plugins:
  - [`HiddenColumns`](@/api/hiddenColumns.md)

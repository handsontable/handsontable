---
id: 66g0jo36
title: Binding to data
metaTitle: Binding to data - JavaScript Data Grid | Handsontable
description: Use Handsontable's configuration options or API methods to fill your data grid with various data structures, including an array of arrays or an array of objects.
permalink: /binding-to-data
canonicalUrl: /binding-to-data
tags:
  - data binding
  - data connect
  - data sources
react:
  id: umdq9b9j
  metaTitle: Binding to data - React Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---

# Binding to data

Fill your data grid with various data structures, including an array of arrays or an array of objects.

[[toc]]

## Compatible data types

### Array of arrays

Array of arrays is a good choice for the more grid-like scenarios where you need to provide the end user with permission to manipulate the grid, e.g., insert columns, delete rows, decorate cells, etc.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example1.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example1.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example1.tsx)

:::

:::

### Array of arrays with a selective display of columns

The following example shows how you would use the array of arrays with a selective display of columns. This scenario uses the same data source as in the previous example, this time omitting the `Tesla` column from the grid.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example2.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example2.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example2.tsx)

:::

:::

### Array of objects

An array of objects can be used as a data source as follows:

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example3.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example3.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example3.tsx)

:::

:::

### Array of objects with column as a function

You can set the [`columns`](@/api/options.md#columns) configuration option to a function. This is good practice when you want to bind data more dynamically.

::: only-for javascript

::: example #example4 .custom-class --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example4.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 .custom-class :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example4.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example4.tsx)

:::

:::

### Array of objects with column mapping

In a scenario where you have nested objects, you can use them as the data source by mapping the columns using the [`columns`](@/api/options.md#columns) option.

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example5.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example5.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example5.tsx)

:::

:::

### Array of objects with custom data schema

When using object data binding, Handsontable needs to know what data structure to create when adding a new row. If your data source contains at least one row, Handsontable will figure out the data structure based on the first row.

In a scenario where you start with an empty data source, you will need to provide the [`dataSchema`](@/api/options.md#dataschema) option containing the data structure for any new row added to the grid. The example below shows a custom data schema with an empty data source:

::: only-for javascript

::: example #example6 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example6.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example6.ts)

:::

:::

::: only-for react

::: example #example6 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example6.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example6.tsx)

:::

:::

### Function data source and schema

If your [`dataSchema`](@/api/options.md#dataschema) is a constructor of an object that doesn't directly expose its members, you can specify functions for the [`data`](@/api/options.md#data) member of each [`columns`](@/api/options.md#columns) item.

The example below shows how to use such objects:

::: only-for javascript

::: example #example7 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example7.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example7.ts)

:::

:::

::: only-for react

::: example #example7 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example7.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example7.tsx)

:::

:::

### No data

By default, if you don't provide any data, Handsontable renders as an empty 5x5 grid.

::: only-for javascript

::: example #example9 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example9.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example9.ts)

:::

:::

::: only-for react

::: example #example9 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example9.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example9.tsx)

:::

:::

To change the number of rows or columns rendered by default, use the [`startRows`](@/api/options.md#startrows) and [`startCols`](@/api/options.md#startcols) options.

## Data-manipulating API methods

### Understand binding as a reference

Handsontable binds to your data source by reference, not by values. We don't copy the input dataset, and we rely on
JavaScript to handle the objects. Any data entered into the grid will alter the original data source.

::: tip

Handsontable initializes the source data for the table using a reference, but you shouldn't rely on it. For
example, you shouldn't change values in the source data using the reference to the input dataset. Some mechanisms for
handling data aren't prepared for external changes that are made in this way.

:::

To avoid this scenario, copy the data before you pass it to the grid. To change the data from outside Handsontable, you
can use our API methods. For example, a change being made will be displayed immediately on the screen after calling
the [`setDataAtCell()`](@/api/core.md#setdataatcell) method.

::: only-for javascript

::: example #example10 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example10.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example10.ts)

:::

:::

::: only-for react

::: example #example10 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example10.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example10.tsx)

:::

:::

There are multiple ways you can insert your data into Handsontable. Let's go through the most useful ones:

### The [`data`](@/api/options.md#data) configuration option

::: only-for javascript

You will probably want to initialize the table with some data (if you don't, the table will render an empty 5x5 grid for you). The easiest way to do it is passing your data array as [`data`](@/api/options.md#data) option in the initial config object:
```js
const hot = new Handsontable(container, {
  data: newDataset,
  // ... other config options
});
```

:::

::: only-for react

You will probably want to initialize the table with some data (if you don't, the table will render an empty 5x5 grid for
you). The easiest way to do it is by passing your data array as the value of `HotTable`'s [`data`](@/api/options.md#data) prop:
```jsx
<HotTable data={newDataset} />
```

:::

### The data-loading API methods

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference
to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.
:::

:::

To replace the entire data in an already-initialized Handsontable instance, you can use one of the data-loading API methods:
- [`loadData()`](@/api/core.md#loaddata)<br>
  Replaces the data used in Handsontable with the dataset provided as the method argument. <br> **Note:** Since version `12.0.0` this method causes the table to reset its configuration options and index mapper information, so some of the work done on the table since its initialization might be lost.
  ```js
  hot.loadData(newDataset);
  ```
- [`updateData()`](@/api/core.md#updatedata)<br>
  Replaces the data used in Handsontable with the dataset provided as the method argument. Unlike [`loadData()`](@/api/core.md#loaddata), [`updateData()`](@/api/core.md#updatedata) does NOT reset the configuration options and/or index mapper information, so it can be safely used to replace just the data, leaving the rest of the table intact.
  ```js
  hot.updateData(newDataset);
  ```
- [`updateSettings()`](@/api/core.md#updatesettings)<br>
  Updates the configuration of the table, [`updateSettings()`](@/api/core.md#updatesettings) can be also used to replace the data being used. Since version `12.0.0`, under the hood it utilizes the [`updateData()`](@/api/core.md#updatedata) method to perform the data replacement (apart from the one automatic call done during the initialization, where it uses [`loadData()`](@/api/core.md#loaddata)).
  ```js
  hot.updateSettings({
    data: newDataset,
    // ... other config options
  });
  ```

### The data-modifying API methods

To modify just a subset of data passed to Handsontable, these are the methods you might want to check out:

- [`setDataAtCell()`](@/api/core.md#setdataatcell)<br>
  Replaces data in a single cell or to perform a series of single-cell data replacements:
  ```js
  // Replaces the cell contents at the (0, 2) visual coordinates (0 being the visual row index, 2 - the visual column index) with the supplied value.
  hot.setDataAtCell(0, 2, 'New Value');

  // Replaces the cells at `(0,2)`, `(1,2)` and `(2,2)` with the provided values.
  const changes = [
    [0, 2, 'New Value'],
    [1, 2, 'Different Value'],
    [2, 2, 'Third Replaced Value'],
  ];
  hot.setDataAtCell(changes);
  ```

- [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop)<br>
  Replaces data in a single cell or to perform a series of single-cell data replacements, analogously to `setDataAtCell()`, but allows targeting the cells by the visual row index and data row *property*. Useful for the [Array of objects data type](#array-of-objects).
  ```js
  // Replaces the cell contents at the (0, 'title') coordinates (0 being the visual row index, 'title' - the data row object property) with the supplied value.
  hot.setDataAtRowProp(0, 'title', 'New Value');

  // Replaces the cells with the props of 'id', 'firstName' and 'lastName' in the first row with the provided values.
  const changes = [
    [0, 'id', '22'],
    [0, 'firstName', 'John'],
    [0, 'lastName', 'Doe'],
  ];
  hot.setDataAtRowProp(changes);
  ```

- [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell)<br>
  As the displayed data coordinates can differ from the way it's stored internally, sometimes you might need to target the cells more directly - that's when [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell) comes in handy. The `row` and `columns`/`prop` arguments represent the *physical* indexes.
  ```js
  // Replaces the cell contents at the (0, 2) coordinates (0 being the physical row index, 2 - the physical column index) with the supplied value.
  hot.setSourceDataAtCell(0, 2, 'New Value');

  // Replaces the cell contents at the (0, 'title') coordinates (0 being the physical row index, 'title' - the data row property) with the supplied value.
  hot.setSourceDataAtCell(0, 'title', 'New Value');

  // Replaces the cells with the props of 'id', 'firstName' and 'lastName' in the first physical row with the provided values.
  const changes = [
    [0, 'id', '22'],
    [0, 'firstName', 'John'],
    [0, 'lastName', 'Doe'],
  ];
  hot.setSourceDataAtCell(changes);
  ```
- [`populateFromArray()`](@/api/core.md#populatefromarray)<br>
  Replaces a chunk of the dataset by provided the start (and optionally end) coordinates and a two-dimensional data array of new values.

  ::: tip

  The [`populateFromArray()`](@/api/core.md#populatefromarray) method can't change [read-only](@/guides/cell-features/disabled-cells/disabled-cells.md) cells.

  :::

  ```js
  const newValues = [
    ['A', 'B', 'C'],
    ['D', 'E', 'F']
  ];

  // Replaces the values from (1, 1) to (2, 3) visual cell coordinates with the values from the `newValues` array.
  hot.populateFromArray(1, 1, newValues);

  // Replaces the values from (1, 1) to (2, 2) visual cell coordinates with the values from the `newValues` array, ommiting the values that would fall outside of the defined range.
  hot.populateFromArray(1, 1, newValues, 2, 2);
  ```

## Working with a copy of data

When working with a copy of data for Handsontable, it is best practice is to clone the data source before loading it into Handsontable. This can be done with `JSON.parse(JSON.stringify(data))` or another deep-cloning function.

::: only-for javascript

::: example #example11 --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/javascript/example11.js)
@[code](@/content/guides/getting-started/binding-to-data/javascript/example11.ts)

:::

:::

::: only-for react
::: example #example11 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/binding-to-data/react/example11.jsx)
@[code](@/content/guides/getting-started/binding-to-data/react/example11.tsx)

:::

:::


## Related API reference

- Configuration options:
  - [`data`](@/api/options.md#data)
  - [`dataSchema`](@/api/options.md#dataschema)
- Core methods:
  - [`alter()`](@/api/core.md#alter)
  - [`clear()`](@/api/core.md#clear)
  - [`getData()`](@/api/core.md#getdata)
  - [`getDataAtCell()`](@/api/core.md#getdataatcell)
  - [`getDataAtCol()`](@/api/core.md#getdataatcol)
  - [`getDataAtProp()`](@/api/core.md#getdataatprop)
  - [`getDataAtRow()`](@/api/core.md#getdataatrow)
  - [`getDataAtRowProp()`](@/api/core.md#getdataatrowprop)
  - [`getSchema()`](@/api/core.md#getschema)
  - [`getSourceData()`](@/api/core.md#getsourcedata)
  - [`getSourceDataArray()`](@/api/core.md#getsourcedataarray)
  - [`getSourceDataAtCell()`](@/api/core.md#getsourcedataatcell)
  - [`getSourceDataAtCol()`](@/api/core.md#getsourcedataatcol)
  - [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow)
  - [`loadData()`](@/api/core.md#loaddata)
  - [`populateFromArray()`](@/api/core.md#populatefromarray)
  - [`setDataAtCell()`](@/api/core.md#setdataatcell)
  - [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop)
  - [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell)
  - [`updateData()`](@/api/core.md#updatedata)
  - [`updateSettings()`](@/api/core.md#updatesettings)
- Hooks:
  - [`afterCellMetaReset`](@/api/hooks.md#aftercellmetareset)
  - [`afterChange`](@/api/hooks.md#afterchange)
  - [`afterLoadData`](@/api/hooks.md#afterloaddata)
  - [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell)
  - [`afterSetDataAtRowProp`](@/api/hooks.md#aftersetdataatrowprop)
  - [`afterSetSourceDataAtCell`](@/api/hooks.md#aftersetsourcedataatcell)
  - [`afterUpdateData`](@/api/hooks.md#afterupdatedata)
  - [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings)
  - [`beforeLoadData`](@/api/hooks.md#beforeloaddata)
  - [`beforeUpdateData`](@/api/hooks.md#beforeupdatedata)
  - [`modifyData`](@/api/hooks.md#modifydata)
  - [`modifyRowData`](@/api/hooks.md#modifyrowdata)
  - [`modifySourceData`](@/api/hooks.md#modifysourcedata)

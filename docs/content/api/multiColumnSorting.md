---
title: MultiColumnSorting
metaTitle: MultiColumnSorting - Plugin - Handsontable Documentation
permalink: /api/multi-column-sorting
canonicalUrl: /api/multi-column-sorting
hotPlugin: true
editLink: false
---

# MultiColumnSorting

[[toc]]

## Description

This plugin sorts the view by columns (but does not sort the data source!). To enable the plugin, set the
[Options#multiColumnSorting](@/api/options.md#multicolumnsorting) property to the correct value (see the examples below).

**Example**
```js
// as boolean
multiColumnSorting: true

// as an object with initial sort config (sort ascending for column at index 1 and then sort descending for column at index 0)
multiColumnSorting: {
  initialConfig: [{
    column: 1,
    sortOrder: 'asc'
  }, {
    column: 0,
    sortOrder: 'desc'
  }]
}

// as an object which define specific sorting options for all columns
multiColumnSorting: {
  sortEmptyCells: true, // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table (by default)
  indicator: true, // true = shows indicator for all columns (by default), false = don't show indicator for columns
  headerAction: true, // true = allow to click on the headers to sort (by default), false = turn off possibility to click on the headers to sort
  compareFunctionFactory: function(sortOrder, columnMeta) {
    return function(value, nextValue) {
      // Some value comparisons which will return -1, 0 or 1...
    }
  }
}

// as an object passed to the `column` property, allows specifying a custom options for the desired column.
// please take a look at documentation of `column` property: [Options#columns](@/api/options.md#columns)
columns: [{
  multiColumnSorting: {
    indicator: false, // disable indicator for the first column,
    sortEmptyCells: true,
    headerAction: false, // clicks on the first column won't sort
    compareFunctionFactory: function(sortOrder, columnMeta) {
      return function(value, nextValue) {
        return 0; // Custom compare function for the first column (don't sort)
      }
    }
  }
}]
```

## Options

### multiColumnSorting

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/dataMap/metaManager/metaSchema.js#L3060

:::

_multiColumnSorting.multiColumnSorting : boolean | object_

The `multiColumnSorting` option configures the [`MultiColumnSorting`](@/api/columnSorting.md) plugin.

You can set the `multiColumnSorting` option to one of the following:

| Setting    | Description                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`     | Enable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin with the default configuration                                                       |
| `false`    | Disable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin                                                                                     |
| An object  | - Enable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin<br>- Modify the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin options |

If you set the `multiColumnSorting` option to an object,
you can set the following [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin options:

| Option                   | Possible settings                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indicator`              | `true`: Display an arrow icon in the column header, to indicate a sortable column<br>`false`: Don't display the arrow icon in the column header  |
| `headerAction`           | `true`: Enable clicking on the column header to sort the column<br>`false`: Disable clicking on the column header to sort the column             |
| `sortEmptyCells`         | `true`: Sort empty cells as well<br>`false`: Place empty cells at the end                                                                        |
| `compareFunctionFactory` | A [custom compare function](@/guides/rows/row-sorting.md#custom-compare-functions)                                                                |

If you set the `multiColumnSorting` option to an object,
you can also sort individual columns at Handsontable's initialization.
In the `multiColumnSorting` object, add an object named `initialConfig`,
with the following properties:

| Option      | Possible settings   | Description                                                      |
| ----------- | ------------------- | ---------------------------------------------------------------- |
| `column`    | A number            | The index of the column that you want to sort at initialization  |
| `sortOrder` | `'asc'` \| `'desc'` | The sorting order:<br>`'asc'`: ascending<br>`'desc'`: descending |

Read more:
- [Row sorting](@/guides/rows/row-sorting.md)
- [`columnSorting`](#columnsorting)

**Default**: <code>undefined</code>
**Example**
```js
// enable the `MultiColumnSorting` plugin
multiColumnSorting: true

// enable the `MultiColumnSorting` plugin with custom configuration
multiColumnSorting: {
  // sort empty cells as well
  sortEmptyCells: true,
  // display an arrow icon in the column header
  indicator: true,
  // disable clicking on the column header to sort the column
  headerAction: false,
  // add a custom compare function
  compareFunctionFactory(sortOrder, columnMeta) {
    return function(value, nextValue) {
      // some value comparisons which will return -1, 0 or 1...
    }
  }
}

// enable the `MultiColumnSorting` plugin
multiColumnSorting: {
  // at initialization, sort column 1 in ascending order
  initialConfig: {
    column: 1,
    sortOrder: 'asc'
  },
  // at initialization, sort column 2 in descending order
  initialConfig: {
    column: 2,
    sortOrder: 'desc'
  }
}
```

## Methods

### clearSort

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/multiColumnSorting/multiColumnSorting.js#L150

:::

_multiColumnSorting.clearSort()_

Clear the sort performed on the table.



### disablePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/multiColumnSorting/multiColumnSorting.js#L114

:::

_multiColumnSorting.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/multiColumnSorting/multiColumnSorting.js#L103

:::

_multiColumnSorting.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getSortConfig

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/multiColumnSorting/multiColumnSorting.js#L171

:::

_multiColumnSorting.getSortConfig([column]) ⇒ undefined | object | Array_

Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` Visual column index. |



### isEnabled

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/multiColumnSorting/multiColumnSorting.js#L96

:::

_multiColumnSorting.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [MultiColumnSorting#enablePlugin](@/api/multiColumnSorting.md#enableplugin) method is called.



### isSorted

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/multiColumnSorting/multiColumnSorting.js#L159

:::

_multiColumnSorting.isSorted() ⇒ boolean_

Checks if the table is sorted (any column have to be sorted).



### setSortConfig

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/multiColumnSorting/multiColumnSorting.js#L199

:::

_multiColumnSorting.setSortConfig(sortConfig)_

Warn: Useful mainly for providing server side sort implementation (see in the example below). It doesn't sort the data set. It just sets sort configuration for all sorted columns.
Note: Please keep in mind that this method doesn't re-render the table.

**Example**
```js
beforeColumnSort: function(currentSortConfig, destinationSortConfigs) {
  const columnSortPlugin = this.getPlugin('multiColumnSorting');

  columnSortPlugin.setSortConfig(destinationSortConfigs);

  // const newData = ... // Calculated data set, ie. from an AJAX call.

  this.loadData(newData); // Load new data set and re-render the table.

  return false; // The blockade for the default sort action.
}
```

| Param | Type | Description |
| --- | --- | --- |
| sortConfig | `undefined` <br/> `object` <br/> `Array` | Single column sort configuration or full sort configuration (for all sorted columns). The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending). |



### sort

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/multiColumnSorting/multiColumnSorting.js#L143

:::

_multiColumnSorting.sort(sortConfig)_

Sorts the table by chosen columns and orders.

**Emits**: [`Hooks#event:beforeColumnSort`](@/api/hooks.md#beforecolumnsort), [`Hooks#event:afterColumnSort`](@/api/hooks.md#aftercolumnsort)
**Example**
```js
// sort ascending first visual column
hot.getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

// sort first two visual column in the defined sequence
hot.getPlugin('multiColumnSorting').sort([{
  column: 1, sortOrder: 'asc'
}, {
  column: 0, sortOrder: 'desc'
}]);
```

| Param | Type | Description |
| --- | --- | --- |
| sortConfig | `undefined` <br/> `object` <br/> `Array` | Single column sort configuration or full sort configuration (for all sorted columns). The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending). **Note**: Please keep in mind that every call of `sort` function set an entirely new sort order. Previous sort configs aren't preserved. |

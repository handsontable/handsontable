---
title: ColumnSorting
metaTitle: ColumnSorting - Plugin - Handsontable Documentation
permalink: /11.0/api/column-sorting
canonicalUrl: /api/column-sorting
hotPlugin: true
editLink: false
---

# ColumnSorting

[[toc]]

## Description

This plugin sorts the view by columns (but does not sort the data source!). To enable the plugin, set the
[Options#columnSorting](@/api/options.md#columnsorting) property to the correct value (see the examples below).

**Example**  
```js
// as boolean
columnSorting: true

// as an object with initial sort config (sort ascending for column at index 1)
columnSorting: {
  initialConfig: {
    column: 1,
    sortOrder: 'asc'
  }
}

// as an object which define specific sorting options for all columns
columnSorting: {
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
// please take a look at documentation of `column` property: https://handsontable.com/docs/api/options/#columns
columns: [{
  columnSorting: {
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

### columnSorting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/dataMap/metaManager/metaSchema.js#L2513

:::

_columnSorting.columnSorting : boolean | object_

The `columnSorting` option configures the [`ColumnSorting`](@/api/columnSorting.md) plugin.

You can set the `columnSorting` option to one of the following:

| Setting    | Description                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `true`     | Enable the [`ColumnSorting`](@/api/columnSorting.md) plugin with the default configuration                                             |
| `false`    | Disable the [`ColumnSorting`](@/api/columnSorting.md) plugin                                                                           |
| An object  | - Enable the [`ColumnSorting`](@/api/columnSorting.md) plugin<br>- Modify the [`ColumnSorting`](@/api/columnSorting.md) plugin options |

If you set the `columnSorting` option to an object,
you can set the following [`ColumnSorting`](@/api/columnSorting.md) plugin options:

| Option                   | Possible settings                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indicator`              | `true`: Display an arrow icon in the column header, to indicate a sortable column<br>`false`: Don't display the arrow icon in the column header  |
| `headerAction`           | `true`: Enable clicking on the column header to sort the column<br>`false`: Disable clicking on the column header to sort the column             |
| `sortEmptyCells`         | `true`: Sort empty cells as well<br>`false`: Place empty cells at the end                                                                        |
| `compareFunctionFactory` | A [custom compare function](@/guides/rows/row-sorting.md#custom-compare-functions)                                                                |

If you set the `columnSorting` option to an object,
you can also sort individual columns at Handsontable's initialization.
In the `columnSorting` object, add an object named `initialConfig`,
with the following properties:

| Option      | Possible settings   | Description                                                      |
| ----------- | ------------------- | ---------------------------------------------------------------- |
| `column`    | A number            | The index of the column that you want to sort at initialization  |
| `sortOrder` | `'asc'` \| `'desc'` | The sorting order:<br>`'asc'`: ascending<br>`'desc'`: descending |

Read more:
- [Row sorting &#8594;](@/guides/rows/row-sorting.md)
- [Row sorting: Custom compare functions &#8594;](@/guides/rows/row-sorting.md#custom-compare-functions)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ColumnSorting` plugin
columnSorting: true

// enable the `ColumnSorting` plugin with custom configuration
columnSorting: {
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

// enable the `ColumnSorting` plugin
columnSorting: {
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L263

:::

_columnSorting.clearSort()_

Clear the sort performed on the table.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L797

:::

_columnSorting.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L174

:::

_columnSorting.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L139

:::

_columnSorting.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getSortConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L284

:::

_columnSorting.getSortConfig([column]) ⇒ undefined | object | Array_

Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` Visual column index. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L132

:::

_columnSorting.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [ColumnSorting#enablePlugin](@/api/columnSorting.md#enableplugin) method is called.



### isSorted
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L272

:::

_columnSorting.isSorted() ⇒ boolean_

Checks if the table is sorted (any column have to be sorted).



### setSortConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L316

:::

_columnSorting.setSortConfig(sortConfig)_

Warn: Useful mainly for providing server side sort implementation (see in the example below). It doesn't sort the data set. It just sets sort configuration for all sorted columns.
Note: Please keep in mind that this method doesn't re-render the table.

**Example**  
```js
beforeColumnSort: function(currentSortConfig, destinationSortConfigs) {
  const columnSortPlugin = this.getPlugin('columnSorting');

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/columnSorting/columnSorting.js#L224

:::

_columnSorting.sort(sortConfig)_

Sorts the table by chosen columns and orders.

**Emits**: [`Hooks#event:beforeColumnSort`](@/api/hooks.md#beforecolumnsort), [`Hooks#event:afterColumnSort`](@/api/hooks.md#aftercolumnsort)  
**Example**  
```js
// sort ascending first visual column
hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
```

| Param | Type | Description |
| --- | --- | --- |
| sortConfig | `undefined` <br/> `object` | Single column sort configuration. The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending). **Note**: Please keep in mind that every call of `sort` function set an entirely new sort order. Previous sort configs aren't preserved. |



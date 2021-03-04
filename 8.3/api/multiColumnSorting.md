---
title: MultiColumnSorting
permalink: /8.3/api/multi-column-sorting
canonicalUrl: /api/multi-column-sorting
---

# {{ $frontmatter.title }}

[[toc]]

## Description


This plugin sorts the view by columns (but does not sort the data source!). To enable the plugin, set the
[Options#multiColumnSorting](./Options/#multiColumnSorting) property to the correct value (see the examples below).


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
// please take a look at documentation of `column` property: https://handsontable.com/docs/Options.html#columns
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
}]```
## Functions:

### isEnabled
`multiColumnSorting.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the Handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#MultiColumnSorting+enablePlugin) method is called.



### enablePlugin
`multiColumnSorting.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`multiColumnSorting.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### sort
`multiColumnSorting.sort(sortConfig)`

Sorts the table by chosen columns and orders.

**Emits**: <code>Hooks#event:beforeColumnSort</code>, <code>Hooks#event:afterColumnSort</code>  

| Param | Type | Description |
| --- | --- | --- |
| sortConfig | <code>undefined</code> \| <code>object</code> \| <code>Array</code> | Single column sort configuration or full sort configuration (for all sorted columns). The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending). **Note**: Please keep in mind that every call of `sort` function set an entirely new sort order. Previous sort configs aren't preserved. |


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

### clearSort
`multiColumnSorting.clearSort()`

Clear the sort performed on the table.



### isSorted
`multiColumnSorting.isSorted() ⇒ boolean`

Checks if the table is sorted (any column have to be sorted).



### getSortConfig
`multiColumnSorting.getSortConfig([column]) ⇒ undefined | object | Array`

Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.


| Param | Type | Description |
| --- | --- | --- |
| [column] | <code>number</code> | `optional` Visual column index. |



### setSortConfig
`multiColumnSorting.setSortConfig(sortConfig)`

Warn: Useful mainly for providing server side sort implementation (see in the example below). It doesn't sort the data set. It just sets sort configuration for all sorted columns.
Note: Please keep in mind that this method doesn't re-render the table.


| Param | Type | Description |
| --- | --- | --- |
| sortConfig | <code>undefined</code> \| <code>object</code> \| <code>Array</code> | Single column sort configuration or full sort configuration (for all sorted columns). The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending). |


**Example**  
```js
beforeColumnSort: function(currentSortConfig, destinationSortConfigs) {
  const columnSortPlugin = this.getPlugin('multiColumnSorting');

  columnSortPlugin.setSortConfig(destinationSortConfigs);

  // const newData = ... // Calculated data set, ie. from an AJAX call.

  this.loadData(newData); // Load new data set and re-render the table.

  return false; // The blockade for the default sort action.
}```

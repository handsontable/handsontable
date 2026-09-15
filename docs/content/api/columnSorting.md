---
title: ColumnSorting
metaTitle: ColumnSorting - JavaScript Data Grid | Handsontable
permalink: /api/column-sorting
canonicalUrl: /api/column-sorting
searchCategory: API Reference
hotPlugin: false
editLink: false
id: zbhmqzsv
description: Use the ColumnSorting plugin with its API options and methods to sort the view (not the source data) by column.
react:
  id: lpx62nle
  metaTitle: ColumnSorting - React Data Grid | Handsontable
angular:
  id: i3b8k4ij
  metaTitle: ColumnSorting - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### columnSorting

::: ask-about-api columnSorting|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1005

:::

_columnSorting.columnSorting : boolean | object_

The `columnSorting` option configures the `ColumnSorting` plugin.

You can set the `columnSorting` option to one of the following:

| Setting    | Description                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `true`     | Enable the `ColumnSorting` plugin with the default configuration                                             |
| `false`    | Disable the `ColumnSorting` plugin                                                                           |
| An object  | - Enable the `ColumnSorting` plugin<br>- Modify the `ColumnSorting` plugin options |

If you set the `columnSorting` option to an object,
you can set the following `ColumnSorting` plugin options:

| Option                   | Possible settings                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indicator`              | `true`: Display the arrow icon in the column header, to indicate a sortable column<br>`false`: Don't display the arrow icon in the column header  |
| `headerAction`           | `true`: Enable clicking on the column header to sort the column<br>`false`: Disable clicking on the column header to sort the column             |
| `sortEmptyCells`         | `true`: Sort empty cells as well<br>`false`: Place empty cells at the end                                                                        |
| `compareFunctionFactory` | A [custom compare function](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)                                                                |

If you set the `columnSorting` option to an object,
you can also sort individual columns at Handsontable's initialization.
In the `columnSorting` object, add an object named `initialConfig`,
with the following properties:

| Option      | Possible settings   | Description                                                      |
| ----------- | ------------------- | ---------------------------------------------------------------- |
| `column`    | A number            | The index of the column that you want to sort at initialization  |
| `sortOrder` | `'asc'` \| `'desc'` | The sorting order:<br>`'asc'`: ascending<br>`'desc'`: descending |

Read more:
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Rows sorting: Custom compare functions](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)
- [`multiColumnSorting`](@/api/options.md#multicolumnsorting)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ColumnSorting` plugin
columnSorting: true

// enable the `ColumnSorting` plugin with custom configuration
columnSorting: {
  // sort empty cells as well
  sortEmptyCells: true,
  // display the arrow icon in the column header
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

// enable the `ColumnSorting` plugin with an initial sort order:
// sort column 1 in ascending order at initialization
columnSorting: {
  initialConfig: {
    column: 1,
    sortOrder: 'asc'
  }
}
```

## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L155

:::

_ColumnSorting.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L160

:::

_ColumnSorting.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### clearSort

::: ask-about-api clearSort|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L325

:::

_columnSorting.clearSort()_

Clear the sort performed on the table.



### destroy

::: ask-about-api destroy|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L693

:::

_columnSorting.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L216

:::

_columnSorting.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L173

:::

_columnSorting.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getSortConfig

::: ask-about-api getSortConfig|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L342

:::

_columnSorting.getSortConfig([column]) ⇒ undefined | object | Array_

Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` Visual column index. |



### isEnabled

::: ask-about-api isEnabled|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L168

:::

_columnSorting.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ColumnSorting#enablePlugin](@/api/columnSorting.md#enableplugin) method is called.



### isSorted

::: ask-about-api isSorted|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L332

:::

_columnSorting.isSorted() ⇒ boolean_

Checks if the table is sorted (any column have to be sorted).



### setSortConfig

::: ask-about-api setSortConfig|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L371

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

  this.updateData(newData); // Update data set and re-render the table.

  return false; // The blockade for the default sort action.
}
```

| Param | Type | Description |
| --- | --- | --- |
| sortConfig | `undefined` <br/> `object` <br/> `Array` | Single column sort configuration or full sort configuration (for all sorted columns). The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending). |



### sort

::: ask-about-api sort|ColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSorting/columnSorting.ts#L301

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



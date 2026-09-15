---
title: MultiColumnSorting
metaTitle: MultiColumnSorting - JavaScript Data Grid | Handsontable
permalink: /api/multi-column-sorting
canonicalUrl: /api/multi-column-sorting
searchCategory: API Reference
hotPlugin: false
editLink: false
id: ypo7x8k9
description: Use the MultiColumnSorting plugin with its API methods to sort the view (not the data source) across multiple columns.
react:
  id: 8gqtvsrl
  metaTitle: MultiColumnSorting - React Data Grid | Handsontable
angular:
  id: b2u7d5uv
  metaTitle: MultiColumnSorting - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### multiColumnSorting

::: ask-about-api multiColumnSorting|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4328

:::

_multiColumnSorting.multiColumnSorting : boolean | object_

The `multiColumnSorting` option configures the `MultiColumnSorting` plugin.

You can set the `multiColumnSorting` option to one of the following:

| Setting    | Description                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`     | Enable the `MultiColumnSorting` plugin with the default configuration                                                       |
| `false`    | Disable the `MultiColumnSorting` plugin                                                                                     |
| An object  | - Enable the `MultiColumnSorting` plugin<br>- Modify the `MultiColumnSorting` plugin options |

If you set the `multiColumnSorting` option to an object,
you can set the following `MultiColumnSorting` plugin options:

| Option                   | Possible settings                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indicator`              | `true`: Display the arrow icon in the column header, to indicate a sortable column<br>`false`: Don't display the arrow icon in the column header |
| `headerAction`           | `true`: Enable clicking on the column header to sort the column<br>`false`: Disable clicking on the column header to sort the column             |
| `sortEmptyCells`         | `true`: Sort empty cells as well<br>`false`: Place empty cells at the end                                                                        |
| `compareFunctionFactory` | A [custom compare function](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)                                                               |

If you set the `multiColumnSorting` option to an object,
you can also sort individual columns at Handsontable's initialization.
In the `multiColumnSorting` object, add an object named `initialConfig`,
with the following properties:

| Option      | Possible settings   | Description                                                      |
| ----------- | ------------------- | ---------------------------------------------------------------- |
| `column`    | A number            | The index of the column that you want to sort at initialization  |
| `sortOrder` | `'asc'` \| `'desc'` | The sorting order:<br>`'asc'`: ascending<br>`'desc'`: descending |

Read more:
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [`columnSorting`](@/api/options.md#columnsorting)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `MultiColumnSorting` plugin
multiColumnSorting: true

// enable the `MultiColumnSorting` plugin with custom configuration
multiColumnSorting: {
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

// enable the `MultiColumnSorting` plugin with a multi-column initial sort order:
// sort column 1 ascending first, then column 2 descending
multiColumnSorting: {
  initialConfig: [
    { column: 1, sortOrder: 'asc' },
    { column: 2, sortOrder: 'desc' }
  ]
}
```

## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L35

:::

_MultiColumnSorting.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L40

:::

_MultiColumnSorting.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L45

:::

_MultiColumnSorting.SETTING\_KEYS_

Returns the list of settings keys observed by the plugin for configuration changes.


## Methods

### clearSort

::: ask-about-api clearSort|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L143

:::

_multiColumnSorting.clearSort()_

Clear the sort performed on the table.



### disablePlugin

::: ask-about-api disablePlugin|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L69

:::

_multiColumnSorting.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L61

:::

_multiColumnSorting.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getSortConfig

::: ask-about-api getSortConfig|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L160

:::

_multiColumnSorting.getSortConfig([column]) ⇒ undefined | object | Array_

Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` Visual column index. |



### isEnabled

::: ask-about-api isEnabled|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L56

:::

_multiColumnSorting.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [MultiColumnSorting#enablePlugin](@/api/multiColumnSorting.md#enableplugin) method is called.
When [[Options#dataProvider]] is a complete server-backed configuration, the DataProvider plugin blocks this plugin from enabling.



### isSorted

::: ask-about-api isSorted|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L150

:::

_multiColumnSorting.isSorted() ⇒ boolean_

Checks if the table is sorted (any column have to be sorted).



### setSortConfig

::: ask-about-api setSortConfig|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L186

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

  this.updateData(newData); // Update data set and re-render the table.

  return false; // The blockade for the default sort action.
}
```

| Param | Type | Description |
| --- | --- | --- |
| sortConfig | `undefined` <br/> `object` <br/> `Array` | Single column sort configuration or full sort configuration (for all sorted columns). The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending). |



### sort

::: ask-about-api sort|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L138

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



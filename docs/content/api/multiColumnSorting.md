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
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L36

:::

_MultiColumnSorting.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L41

:::

_MultiColumnSorting.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L46

:::

_MultiColumnSorting.SETTING\_KEYS_

Returns the list of settings keys observed by the plugin for configuration changes.


## Methods

### clearSort

::: ask-about-api clearSort|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L144

:::

_multiColumnSorting.clearSort()_

Clear the sort performed on the table.



### disablePlugin

::: ask-about-api disablePlugin|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L70

:::

_multiColumnSorting.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L62

:::

_multiColumnSorting.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getSortConfig

::: ask-about-api getSortConfig|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L161

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L57

:::

_multiColumnSorting.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [MultiColumnSorting#enablePlugin](@/api/multiColumnSorting.md#enableplugin) method is called.
When [[Options#dataProvider]] is a complete server-backed configuration, the DataProvider plugin blocks this plugin from enabling.



### isSorted

::: ask-about-api isSorted|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L151

:::

_multiColumnSorting.isSorted() ⇒ boolean_

Checks if the table is sorted (any column have to be sorted).



### setSortConfig

::: ask-about-api setSortConfig|MultiColumnSorting

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L187

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multiColumnSorting/multiColumnSorting.ts#L139

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



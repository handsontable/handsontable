---
title: TrimRows
metaTitle: TrimRows - Plugin - Handsontable Documentation
permalink: /api/trim-rows
canonicalUrl: /api/trim-rows
hotPlugin: true
editLink: false
---

# TrimRows

[[toc]]

## Description

The plugin allows to trim certain rows. The trimming is achieved by applying the transformation algorithm to the data
transformation. In this case, when the row is trimmed it is not accessible using `getData*` methods thus the trimmed
data is not visible to other plugins.

**Example**
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  // hide selected rows on table initialization
  trimRows: [1, 2, 5]
});

// access the trimRows plugin instance
const trimRowsPlugin = hot.getPlugin('trimRows');

// hide single row
trimRowsPlugin.trimRow(1);

// hide multiple rows
trimRowsPlugin.trimRow(1, 2, 9);

// or as an array
trimRowsPlugin.trimRows([1, 2, 9]);

// show single row
trimRowsPlugin.untrimRow(1);

// show multiple rows
trimRowsPlugin.untrimRow(1, 2, 9);

// or as an array
trimRowsPlugin.untrimRows([1, 2, 9]);

// rerender table to see the changes
hot.render();
```

## Options

### trimRows

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/dataMap/metaManager/metaSchema.js#L4234

:::

_trimRows.trimRows : boolean | Array&lt;number&gt;_

The `trimRows` option configures the [`TrimRows`](@/api/trimRows.md) plugin.

You can set the `trimRows` option to one of the following:

| Setting  | Description                                                                                   |
| -------- | --------------------------------------------------------------------------------------------- |
| `false`  | Disable the [`TrimRows`](@/api/trimRows.md) plugin                                            |
| `true`   | Enable the [`TrimRows`](@/api/trimRows.md) plugin                                             |
| An array | - Enable the [`TrimRows`](@/api/trimRows.md) plugin<br>- Trim selected rows at initialization |

Read more:
- [Plugins: `TrimRows` &#8594;](@/api/trimRows.md)
- [Row trimming &#8594;](@/guides/rows/row-trimming.md)

**Default**: <code>undefined</code>
**Example**
```js
// enable the `TrimRows` plugin
trimRows: true,

// enable the `TrimRows` plugin
// trim rows 5, 10, and 15 at Handsontable's initialization
trimRows: [5, 10, 15],
```

## Methods

### destroy

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L284

:::

_trimRows.destroy()_

Destroys the plugin instance.



### disablePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L121

:::

_trimRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L85

:::

_trimRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getTrimmedRows

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L132

:::

_trimRows.getTrimmedRows() ⇒ Array_

Get list of trimmed rows.


**Returns**: `Array` - Physical rows.

### isEnabled

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L78

:::

_trimRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [AutoRowSize#enablePlugin](@/api/autoRowSize.md#enableplugin) method is called.



### isTrimmed

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L240

:::

_trimRows.isTrimmed(physicalRow) ⇒ boolean_

Checks if given row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` | Physical row index. |



### isValidConfig

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L257

:::

_trimRows.isValidConfig(trimmedRows) ⇒ boolean_

Get if trim config is valid. Check whether all of the provided row indexes are within source data.


| Param | Type | Description |
| --- | --- | --- |
| trimmedRows | `Array` | List of physical row indexes. |



### trimRow

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L176

:::

_trimRows.trimRow(...row)_

Trims the row provided as physical row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Physical row index. |



### trimRows

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L143

:::

_trimRows.trimRows(rows)_

Trims the rows provided in the array.

**Emits**: [`Hooks#event:beforeTrimRow`](@/api/hooks.md#beforetrimrow), [`Hooks#event:afterTrimRow`](@/api/hooks.md#aftertrimrow)

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of physical row indexes. |



### untrimAll

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L247

:::

_trimRows.untrimAll()_

Untrims all trimmed rows.



### untrimRow

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L230

:::

_trimRows.untrimRow(...row)_

Untrims the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Physical row index. |



### untrimRows

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L187

:::

_trimRows.untrimRows(rows)_

Untrims the rows provided in the array.

**Emits**: [`Hooks#event:beforeUntrimRow`](@/api/hooks.md#beforeuntrimrow), [`Hooks#event:afterUntrimRow`](@/api/hooks.md#afteruntrimrow)

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of physical row indexes. |



### updatePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/trimRows/trimRows.js#L102

:::

_trimRows.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`trimRows`](@/api/options.md#trimrows)

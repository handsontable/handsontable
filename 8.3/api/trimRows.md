---
title: TrimRows
permalink: /8.3/api/trim-rows
canonicalUrl: /api/trim-rows
---

# {{ $frontmatter.title }}

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
## Functions:

### isEnabled
`trimRows.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [AutoRowSize#enablePlugin](./auto-row-size/#enableplugin) method is called.



### enablePlugin
`trimRows.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`trimRows.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



### disablePlugin
`trimRows.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### getTrimmedRows
`trimRows.getTrimmedRows() ⇒ Array`

Get list of trimmed rows.


**Returns**: <code>Array</code> - Physical rows.  

### trimRows
`trimRows.trimRows(rows)`

Trims the rows provided in the array.

**Emits**: <code>Hooks#event:beforeTrimRow</code>, <code>Hooks#event:afterTrimRow</code>  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Array.&lt;number&gt;</code> | Array of physical row indexes. |



### trimRow
`trimRows.trimRow(...row)`

Trims the row provided as physical row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | <code>number</code> | Physical row index. |



### untrimRows
`trimRows.untrimRows(rows)`

Untrims the rows provided in the array.

**Emits**: <code>Hooks#event:beforeUntrimRow</code>, <code>Hooks#event:afterUntrimRow</code>  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Array.&lt;number&gt;</code> | Array of physical row indexes. |



### untrimRow
`trimRows.untrimRow(...row)`

Untrims the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | <code>number</code> | Physical row index. |



### isTrimmed
`trimRows.isTrimmed(physicalRow) ⇒ boolean`

Checks if given row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | <code>number</code> | Physical row index. |



### untrimAll
`trimRows.untrimAll()`

Untrims all trimmed rows.



### isValidConfig
`trimRows.isValidConfig(trimmedRows) ⇒ boolean`

Get if trim config is valid. Check whether all of the provided row indexes are within source data.


| Param | Type | Description |
| --- | --- | --- |
| trimmedRows | <code>Array</code> | List of physical row indexes. |



### destroy
`trimRows.destroy()`

Destroys the plugin instance.



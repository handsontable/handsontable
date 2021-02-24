---
title: HiddenRows
permalink: /next/api/hidden-rows
---

# {{ $frontmatter.title }}

[[toc]]

## Description


Plugin allows to hide certain rows. The hiding is achieved by rendering the rows with height set as 0px.
The plugin not modifies the source data and do not participate in data transformation (the shape of data returned
by `getData*` methods stays intact).

Possible plugin settings:
 * `copyPasteEnabled` as `Boolean` (default `true`)
 * `rows` as `Array`
 * `indicators` as `Boolean` (default `false`).


**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  hiddenRows: {
    copyPasteEnabled: true,
    indicators: true,
    rows: [1, 2, 5]
  }
});

// access to hiddenRows plugin instance
const hiddenRowsPlugin = hot.getPlugin('hiddenRows');

// show single row
hiddenRowsPlugin.showRow(1);

// show multiple rows
hiddenRowsPlugin.showRow(1, 2, 9);

// or as an array
hiddenRowsPlugin.showRows([1, 2, 9]);

// hide single row
hiddenRowsPlugin.hideRow(1);

// hide multiple rows
hiddenRowsPlugin.hideRow(1, 2, 9);

// or as an array
hiddenRowsPlugin.hideRows([1, 2, 9]);

// rerender the table to see all changes
hot.render();
```

## Members
### isEnabled
`hiddenRows.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#HiddenRows+enablePlugin) method is called.



### enablePlugin
`hiddenRows.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`hiddenRows.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### disablePlugin
`hiddenRows.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### showRows
`hiddenRows.showRows(rows)`

Shows the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Array.&lt;number&gt;</code> | Array of visual row indexes. |



### showRow
`hiddenRows.showRow(...row)`

Shows the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | <code>number</code> | Visual row index. |



### hideRows
`hiddenRows.hideRows(rows)`

Hides the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Array.&lt;number&gt;</code> | Array of visual row indexes. |



### hideRow
`hiddenRows.hideRow(...row)`

Hides the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | <code>number</code> | Visual row index. |



### getHiddenRows
`hiddenRows.getHiddenRows() ⇒ Array.<number>`

Returns an array of visual indexes of hidden rows.



### isHidden
`hiddenRows.isHidden(row) ⇒ boolean`

Checks if the provided row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |



### isValidConfig
`hiddenRows.isValidConfig(hiddenRows) ⇒ boolean`

Checks whether all of the provided row indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenRows | <code>Array</code> | List of hidden visual row indexes. |



### destroy
`hiddenRows.destroy()`

Destroys the plugin instance.



